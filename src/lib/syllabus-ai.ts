import OpenAI from "openai"

export interface GrandTitre {
  id: string
  numero?: string
  titre: string
  description?: string
  heuresEstimees?: number
}

export interface Chapitre {
  id: string
  numero: number
  titre: string
  description?: string
  heuresEstimees: number
  grandsTitres: GrandTitre[]
}

export interface SyllabusStructure {
  titreCours?: string
  totalHeuresEstimees?: number
  objectifs?: string[]
  chapitres: Chapitre[]
}

/**
 * Heuristique locale intelligente pour découper un texte de syllabus
 * en chapitres et grands titres si l'IA n'est pas joignable.
 */
export function parseSyllabusHeuristically(
  text: string,
  plannedHours: number = 40
): SyllabusStructure {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const chapitres: Chapitre[] = []
  let currentChapitre: Chapitre | null = null
  let chapIndex = 1

  const isChapitreHeading = (line: string): boolean => {
    return (
      /^(chapitre|module|partie|axe|thème|section\s+principale)\b/i.test(line) ||
      /^[I|V|X]+\s*[\.\:\-]/i.test(line) ||
      /^chapitre\s*\d+/i.test(line)
    )
  }

  const isGrandTitreHeading = (line: string): boolean => {
    return (
      /^(\d+\.\d+|\d+\-|\-|\*|\•|[a-z]\))\s+/i.test(line) ||
      /^(grand titre|section|sous-partie|titre)\b/i.test(line)
    )
  }

  for (const line of lines) {
    if (isChapitreHeading(line) || (!currentChapitre && lines.indexOf(line) === 0)) {
      if (currentChapitre) {
        chapitres.push(currentChapitre)
      }
      currentChapitre = {
        id: `chap-${chapIndex}`,
        numero: chapIndex,
        titre: line.length > 80 ? line.slice(0, 80) + "..." : line,
        heuresEstimees: 6,
        grandsTitres: [],
      }
      chapIndex++
    } else if (currentChapitre && (isGrandTitreHeading(line) || line.length > 5)) {
      const cleanTitre = line.replace(/^[-*•\d\.\)]+\s*/, "").trim()
      if (cleanTitre.length > 0) {
        const subIndex = currentChapitre.grandsTitres.length + 1
        currentChapitre.grandsTitres.push({
          id: `gt-${currentChapitre.numero}-${subIndex}`,
          numero: `${currentChapitre.numero}.${subIndex}`,
          titre: line.length > 100 ? line.slice(0, 100) + "..." : line,
        })
      }
    }
  }

  if (currentChapitre) {
    chapitres.push(currentChapitre)
  }

  // Si aucun chapitre détecté, créer 3 chapitres par défaut à partir des lignes
  if (chapitres.length === 0) {
    const chunkCount = Math.min(4, Math.max(2, Math.ceil(lines.length / 3)))
    for (let i = 1; i <= chunkCount; i++) {
      chapitres.push({
        id: `chap-${i}`,
        numero: i,
        titre: `Chapitre ${i} : Notions fondamentales (Partie ${i})`,
        heuresEstimees: Math.round(plannedHours / chunkCount),
        grandsTitres: [
          { id: `gt-${i}-1`, numero: `${i}.1`, titre: `${i}.1 Concepts et définitions théoriques` },
          { id: `gt-${i}-2`, numero: `${i}.2`, titre: `${i}.2 Applications et mise en pratique` },
          { id: `gt-${i}-3`, numero: `${i}.3`, titre: `${i}.3 Évaluation et synthèse d'étape` },
        ],
      })
    }
  }

  // Assurer que chaque chapitre a au moins 1 grand titre
  chapitres.forEach((ch, idx) => {
    if (ch.grandsTitres.length === 0) {
      ch.grandsTitres.push(
        { id: `gt-${ch.numero}-1`, numero: `${ch.numero}.1`, titre: `${ch.numero}.1 Fondements et définitions` },
        { id: `gt-${ch.numero}-2`, numero: `${ch.numero}.2`, titre: `${ch.numero}.2 Applications pratiques et exercices` }
      )
    }
    ch.heuresEstimees = Math.max(2, Math.round(plannedHours / chapitres.length))
  })

  return {
    titreCours: "Syllabus structuré",
    totalHeuresEstimees: plannedHours,
    chapitres,
  }
}

/**
 * Structuration par IA (Google Gemini en priorité, puis DeepSeek / OpenAI / Heuristique)
 */
export async function structureSyllabusWithAI(
  rawText: string,
  courseTitle?: string,
  plannedHours?: number
): Promise<{ structure: SyllabusStructure; provider: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const totalHours = plannedHours || 40

  const systemPrompt = `Tu es un expert pédagogique universitaire. Analyse le texte de ce syllabus de cours universitaire et décompose-le en une structure hiérarchique rigoureuse comprenant des CHAPITRES et des GRANDS TITRES (sous-sections claires et identifiables).

IMPORTANT :
- Chaque chapitre doit comporter un numéro, un titre clair, une brève description, et une estimation d'heures (le total des heures des chapitres doit être environ égal à ${totalHours}h).
- Chaque chapitre doit contenir une liste ordonnée de 'grandsTitres' (sections, modules ou thèmes précis).
- Ces grands titres serviront de points d'arrêt concrets pour que le délégué de promotion puisse pointer exactement où la séance de cours s'est arrêtée.
- Sois exhaustif et fidèle aux notions du texte.

Format de sortie STRICTEMENT un objet JSON valide (aucun commentaire ni texte autour) :
{
  "titreCours": "${courseTitle || "Cours"}",
  "totalHeuresEstimees": ${totalHours},
  "objectifs": ["objectif 1", "objectif 2"],
  "chapitres": [
    {
      "id": "chap-1",
      "numero": 1,
      "titre": "Chapitre 1 : ...",
      "description": "...",
      "heuresEstimees": 8,
      "grandsTitres": [
        { "id": "gt-1-1", "numero": "1.1", "titre": "1.1 Titre précis du premier grand point" },
        { "id": "gt-1-2", "numero": "1.2", "titre": "1.2 Titre précis du second grand point" }
      ]
    }
  ]
}`

  // 1. PRIORITÉ GOOGLE GEMINI
  if (geminiKey && geminiKey.trim().length > 5) {
    try {
      const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey.trim()}`

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: `DOCUMENT DE SYLLABUS À STRUCTURER :\n\n${rawText}` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      })

      if (res.ok) {
        const geminiData = await res.json()
        const rawResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawResponse) {
          const cleaned = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim()
          const parsed = JSON.parse(cleaned)
          if (Array.isArray(parsed.chapitres) && parsed.chapitres.length > 0) {
            // Normaliser les identifiants
            normalizeStructure(parsed)
            return { structure: parsed, provider: `Google Gemini (${geminiModel})` }
          }
        }
      }
    } catch (e) {
      console.warn("Échec appel Gemini pour structuration syllabus, tentative alternative...", e)
    }
  }

  // 2. ALTERNATIVE DEEPSEEK
  if (deepseekKey && deepseekKey.trim().length > 5) {
    try {
      const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
      const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-chat"

      const openaiClient = new OpenAI({
        apiKey: deepseekKey.trim(),
        baseURL: deepseekBaseUrl,
      })

      const completion = await openaiClient.chat.completions.create({
        model: deepseekModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `DOCUMENT DE SYLLABUS À STRUCTURER :\n\n${rawText}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      })

      const content = completion.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed.chapitres) && parsed.chapitres.length > 0) {
          normalizeStructure(parsed)
          return { structure: parsed, provider: "DeepSeek AI" }
        }
      }
    } catch (e) {
      console.warn("Échec appel DeepSeek pour structuration syllabus", e)
    }
  }

  // 3. ALTERNATIVE OPENAI
  if (openaiKey && openaiKey.trim().length > 5) {
    try {
      const openaiClient = new OpenAI({ apiKey: openaiKey.trim() })
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `DOCUMENT DE SYLLABUS À STRUCTURER :\n\n${rawText}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      })

      const content = completion.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed.chapitres) && parsed.chapitres.length > 0) {
          normalizeStructure(parsed)
          return { structure: parsed, provider: "OpenAI GPT-4o-mini" }
        }
      }
    } catch (e) {
      console.warn("Échec appel OpenAI pour structuration syllabus", e)
    }
  }

  // 4. PARSER HEURISTIQUE DE RECOURS
  const heuristic = parseSyllabusHeuristically(rawText, totalHours)
  return { structure: heuristic, provider: "Parseur Sémantique Intégré" }
}

function normalizeStructure(structure: SyllabusStructure) {
  if (!structure.chapitres) structure.chapitres = []
  structure.chapitres.forEach((chap, cIdx) => {
    if (!chap.id) chap.id = `chap-${cIdx + 1}`
    if (!chap.numero) chap.numero = cIdx + 1
    if (!chap.grandsTitres) chap.grandsTitres = []
    chap.grandsTitres.forEach((gt, gIdx) => {
      if (!gt.id) gt.id = `gt-${chap.numero}-${gIdx + 1}`
      if (!gt.numero) gt.numero = `${chap.numero}.${gIdx + 1}`
    })
  })
}

