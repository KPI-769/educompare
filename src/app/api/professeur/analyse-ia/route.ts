import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "PROFESSEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { coursId, text, fileName } = await req.json()

    if (!coursId || !text) {
      return NextResponse.json({ error: "Cours et contenu requis" }, { status: 400 })
    }

    const cours = await prisma.cours.findUnique({
      where: { id: coursId },
      include: { syllabus: true },
    })

    if (!cours) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 })
    }

    const userId = (session.user as any)?.id
    if (cours.profId && cours.profId !== userId) {
      return NextResponse.json(
        { error: "Accès refusé : vous ne pouvez analyser que vos propres cours assignés." },
        { status: 403 }
      )
    }

    const syllabusContent = cours.syllabus?.contenu || "Aucun syllabus spécifique défini."

    let scoreIA = 10
    let analyseIA = ""
    let ajustementsIA = ""
    let assistanceIA = ""
    let providerUsed = "Local-Semantic"

    const geminiKey = process.env.GEMINI_API_KEY
    const deepseekKey = process.env.DEEPSEEK_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    let apiSuccess = false

    // 1. PRIORITÉ ABSOLUE : GOOGLE GEMINI (avec assistance personnalisée)
    if (geminiKey && geminiKey.trim().length > 5) {
      try {
        const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
        const prompt = `Tu es un expert pédagogique universitaire et conseiller d'enseignement supérieur.
Compare minutieusement le support de cours déposé par le professeur avec le syllabus officiel du cours.

SYLLABUS OFFICIEL :
${syllabusContent}

SUPPORT DE COURS DÉPOSÉ PAR L'ENSEIGNANT :
${text}

DIRECTIVES :
1. Évalue la conformité globale en attribuant une note sur 10 (score_sur_10 entre 0 et 10, avec décimales possibles ex: 7.5 ou 8.2). Note: le seuil de conformité standard est 7.0/10 (soit 70%).
2. Fournis une analyse critique claire et objective de la couverture du programme.
3. Rédige une ASSISTANCE PERSONNALISÉE pour le professeur : des conseils concrets et bienveillants pour enrichir son cours, dynamiser la transmission des notions et lever les difficultés pédagogiques potentielles.
4. Liste les ajustements indispensables et concepts manquants sous forme de tirets.

Réponds STRICTEMENT au format JSON valide sans fioritures :
{
  "score_sur_10": <nombre entre 0 et 10>,
  "analyse": "<synthèse détaillée de l'adéquation au programme>",
  "assistance_personnalisee": "<conseils personnalisés approfondis pour accompagner le professeur>",
  "ajustements": "<points du syllabus manquants ou à approfondir sous forme de tirets>"
}`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey.trim()}`
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
            },
          }),
        })

        if (res.ok) {
          const geminiData = await res.json()
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawText) {
            const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim()
            const parsed = JSON.parse(cleaned)
            const rawNote = Number(parsed.score_sur_10) || 7.5
            // Note sur 10 garantie
            scoreIA = Number(Math.min(10, Math.max(0, rawNote)).toFixed(1))
            analyseIA = parsed.analyse || ""
            assistanceIA = parsed.assistance_personnalisee || ""
            ajustementsIA = Array.isArray(parsed.ajustements)
              ? parsed.ajustements.join("\n")
              : (parsed.ajustements || "")
            providerUsed = "Google Gemini AI"
            apiSuccess = true
          }
        } else {
          const errData = await res.text()
          console.warn("[Gemini API Warning]", errData)
        }
      } catch (geminiErr) {
        console.warn("[IA] Échec Gemini, tentative de repli :", geminiErr)
        apiSuccess = false
      }
    }

    // 2. REPLI 1 : DEEPSEEK AI
    if (!apiSuccess && deepseekKey && deepseekKey.trim().length > 5) {
      try {
        const client = new OpenAI({
          baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
          apiKey: deepseekKey.trim(),
        })
        const prompt = `Tu es un expert pédagogique. Compare le cours avec le syllabus :
SYLLABUS : ${syllabusContent}
COURS : ${text}
Réponds strictement en JSON :
{
  "score_sur_10": <nombre entre 0 et 10>,
  "analyse": "<synthèse>",
  "assistance_personnalisee": "<conseils personnalisés>",
  "ajustements": "<tirets>"
}`
        const completion = await client.chat.completions.create({
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        })
        const resContent = completion.choices[0]?.message?.content
        if (resContent) {
          const parsed = JSON.parse(resContent)
          scoreIA = Number(Math.min(10, Math.max(0, Number(parsed.score_sur_10) || 7)).toFixed(1))
          analyseIA = parsed.analyse || ""
          assistanceIA = parsed.assistance_personnalisee || ""
          ajustementsIA = parsed.ajustements || ""
          providerUsed = "DeepSeek AI"
          apiSuccess = true
        }
      } catch (deepseekErr) {
        console.warn("[IA] Échec DeepSeek :", deepseekErr)
      }
    }

    // 3. REPLI 2 : OPENAI GPT
    if (!apiSuccess && openaiKey && openaiKey.trim().length > 5) {
      try {
        const client = new OpenAI({ apiKey: openaiKey.trim() })
        const prompt = `Tu es un expert pédagogique. Compare le cours avec le syllabus :
SYLLABUS : ${syllabusContent}
COURS : ${text}
Réponds strictement en JSON avec score_sur_10, analyse, assistance_personnalisee, ajustements.`
        const completion = await client.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        })
        const resContent = completion.choices[0]?.message?.content
        if (resContent) {
          const parsed = JSON.parse(resContent)
          scoreIA = Number(Math.min(10, Math.max(0, Number(parsed.score_sur_10) || 7.5)).toFixed(1))
          analyseIA = parsed.analyse || ""
          assistanceIA = parsed.assistance_personnalisee || ""
          ajustementsIA = parsed.ajustements || ""
          providerUsed = "OpenAI GPT"
          apiSuccess = true
        }
      } catch (openaiErr) {
        console.warn("[IA] Échec OpenAI :", openaiErr)
      }
    }

    // 4. REPLI 3 : ANALYSE SÉMANTIQUE LOCALE (Si aucune connexion externe)
    if (!apiSuccess) {
      providerUsed = "Analyse Sémantique Intégrée"
      const syllabusClean = syllabusContent
        .replace(/[^\w\sàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/gi, " ")
        .toLowerCase()
      const coursClean = text
        .replace(/[^\w\sàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/gi, " ")
        .toLowerCase()

      const syllabusWords = Array.from(new Set(syllabusClean.split(/\s+/).filter((w) => w.length >= 4)))
      const coursWordsSet = new Set(coursClean.split(/\s+/))

      const coveredTerms = syllabusWords.filter((w) => coursWordsSet.has(w))
      const missingTerms = syllabusWords.filter((w) => !coursWordsSet.has(w))

      const coverageRatio = syllabusWords.length > 0 ? (coveredTerms.length / syllabusWords.length) : 0.8
      // Note sur 10
      scoreIA = Number(Math.min(9.8, Math.max(4.5, (coverageRatio * 6 + 3.5))).toFixed(1))

      if (scoreIA >= 7.0) {
        analyseIA = `✅ Conformité satisfaisante (${scoreIA}/10). Le support de cours déposé aborde les notions clés exigées par le syllabus du cours "${cours.titre}" (notamment : ${coveredTerms.slice(0, 4).join(", ") || "fondamentaux"}). Les thématiques obligatoires du programme sont respectées.`
        assistanceIA = `💡 Assistance personnalisée pour l'enseignant :\n- Vos supports sont bien calibrés pour aborder les objectifs principaux.\n- Pour dynamiser l'assimilation des étudiants, prévoyez 15 minutes en début de séance pour des quiz récapitulatifs sur les concepts clés.\n- N'hésitez pas à intégrer des liens vers des ressources documentaires récentes.`
        ajustementsIA = missingTerms.length > 0
          ? `• Approfondir les aspects secondaires suivants mentionnés dans le syllabus : ${missingTerms.slice(0, 5).join(", ")}.\n• Ajouter des fiches d'exercices pratiques pour conforter la validation pédagogique.`
          : `• Le cours couvre l'ensemble des chapitres requis.`
      } else {
        analyseIA = `⚠️ Conformité insuffisante (${scoreIA}/10 < 7.0/10). Le support déposé pour "${cours.titre}" présente un décalage substantiel avec les objectifs pédagogiques du syllabus officiel. Plusieurs chapitres fondamentaux sont absents ou survolés.`
        assistanceIA = `🚨 Recommandations personnalisées d'accompagnement :\n- Nous vous conseillons de vous rapprocher de votre responsable de filière afin de réaligner le calendrier des séances.\n- Structurez votre document en modules reprenant explicitement les intitulés des chapitres officiels pour faciliter le repérage par les délégués et étudiants.`
        ajustementsIA = missingTerms.length > 0
          ? `• Intégrer impérativement les notions manquantes du syllabus : ${missingTerms.slice(0, 6).join(", ")}.\n• Réorganiser les chapitres pour s'aligner sur la chronologie du syllabus officiel.`
          : `• Développer le contenu théorique pour atteindre le volume minimal prescrit.`
      }
    }

    const estConforme = scoreIA >= 7.0

    // Si assistance personnalisée présente, on l'annexe à l'analyse pour persistance complète
    const analyseComplete = assistanceIA
      ? `${analyseIA}\n\n🤖 ASSISTANCE PERSONNALISÉE IA :\n${assistanceIA}`
      : analyseIA

    const upload = await prisma.coursUpload.create({
      data: {
        coursId,
        fichierUrl: `/uploads/${fileName || "cours.pdf"}`,
        fichierNom: fileName || "Document de cours",
        scoreIA, // Stocké sur 10
        analyseIA: analyseComplete,
        ajustementsIA,
        estConforme,
      },
    })

    return NextResponse.json({
      ...upload,
      scoreSur10: scoreIA,
      scorePourcentage: Math.round(scoreIA * 10),
      assistancePersonnalisee: assistanceIA,
      provider: providerUsed,
    })
  } catch (error) {
    console.error("Erreur analyse IA:", error)
    return NextResponse.json({ error: "Erreur lors du traitement de l'analyse" }, { status: 500 })
  }
}

