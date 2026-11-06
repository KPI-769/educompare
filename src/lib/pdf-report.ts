import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface CourseStat {
  id: string
  titre: string
  filiere: string
  semestre: number
  heuresPrevues: number
  prof?: { name?: string | null } | null
  progressions?: Array<{
    heuresEffectives: number
    validation?: { status?: string | null } | null
  }>
}

interface ExportReportOptions {
  semaine: number
  annee: number
  commentaire?: string
  coursList: CourseStat[]
  responsableName?: string
  etablissement?: string
}

export function generateReportPDF({
  semaine,
  annee,
  commentaire = "",
  coursList = [],
  responsableName = "Direction Pédagogique",
  etablissement = "EduCompare - Système de Gestion Académique",
}: ExportReportOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. En-tête avec bandeau stylé
  doc.setFillColor(30, 58, 138) // Bleu primaire (#1e3a8a)
  doc.rect(0, 0, pageWidth, 28, "F")

  // Logo / Titre Marque
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("EDUCOMPARE", 14, 12)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(219, 234, 254) // Bleu clair
  doc.text("RAPPORT OFFICIEL DE SYNTHÈSE HEBDOMADAIRE", 14, 18)
  doc.text(`Période : Semaine ${semaine} — Année ${annee}`, 14, 23)

  // Badge date à droite
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  doc.setFontSize(8)
  doc.text(`Généré le ${dateStr}`, pageWidth - 14, 12, { align: "right" })
  doc.text(responsableName, pageWidth - 14, 18, { align: "right" })

  let currentY = 36

  // 2. Encadré Métriques Clés
  const totalHeuresPrevues = coursList.reduce((sum, c) => sum + (c.heuresPrevues || 0), 0)
  const totalHeuresRealisees = coursList.reduce((sum, c) => {
    const val = (c.progressions || []).filter((p) => p.validation?.status === "VALIDATED")
    return sum + val.reduce((s, p) => s + (p.heuresEffectives || 0), 0)
  }, 0)
  const tauxGlobal = totalHeuresPrevues > 0 ? Math.min(100, Math.round((totalHeuresRealisees / totalHeuresPrevues) * 100)) : 0

  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, "FD")

  // Box 1 : Nombre de cours
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text("COURS SUIVIS", 20, currentY + 7)
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.setFont("helvetica", "bold")
  doc.text(`${coursList.length} matières`, 20, currentY + 15)

  // Box 2 : Heures Réalisées / Prévues
  const col2X = 75
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont("helvetica", "normal")
  doc.text("VOLUME HORAIRE RÉALISÉ", col2X, currentY + 7)
  doc.setFontSize(12)
  doc.setTextColor(37, 99, 235)
  doc.setFont("helvetica", "bold")
  doc.text(`${totalHeuresRealisees.toFixed(1)}h / ${totalHeuresPrevues}h`, col2X, currentY + 15)

  // Box 3 : Taux Global
  const col3X = 145
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont("helvetica", "normal")
  doc.text("TAUX GLOBAL D'AVANCEMENT", col3X, currentY + 7)
  doc.setFontSize(12)
  doc.setTextColor(tauxGlobal >= 50 ? 22 : 217, tauxGlobal >= 50 ? 101 : 119, tauxGlobal >= 50 ? 52 : 6)
  doc.setFont("helvetica", "bold")
  doc.text(`${tauxGlobal}%`, col3X, currentY + 15)

  currentY += 26

  // 3. Commentaires du responsable (si présents)
  if (commentaire && commentaire.trim().length > 0) {
    doc.setDrawColor(191, 219, 254)
    doc.setFillColor(239, 246, 255)
    
    // Calculer la hauteur du texte
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const splitComment = doc.splitTextToSize(commentaire.trim(), pageWidth - 36)
    const commentBoxHeight = Math.max(16, splitComment.length * 4.5 + 10)

    doc.roundedRect(14, currentY, pageWidth - 28, commentBoxHeight, 2, 2, "FD")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(30, 58, 138)
    doc.text("OBSERVATIONS & APPRÉCIATIONS DE LA DIRECTION PÉDAGOGIQUE :", 18, currentY + 6)

    doc.setFont("helvetica", "italic")
    doc.setFontSize(8.5)
    doc.setTextColor(30, 41, 59)
    doc.text(splitComment, 18, currentY + 12)

    currentY += commentBoxHeight + 6
  }

  // 4. Tableau des cours
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text("Progression détaillée par matière et syllabus", 14, currentY + 2)
  currentY += 5

  const tableRows = coursList.map((c) => {
    const validated = (c.progressions || []).filter((p) => p.validation?.status === "VALIDATED")
    const hValidees = validated.reduce((s, p) => s + (p.heuresEffectives || 0), 0)
    const pct = c.heuresPrevues > 0 ? Math.min(100, Math.round((hValidees / c.heuresPrevues) * 100)) : 0
    const profName = c.prof?.name || "Non assigné"
    const filiereSem = `${c.filiere} (S${c.semestre})`

    return [
      c.titre,
      filiereSem,
      profName,
      `${c.heuresPrevues}h`,
      `${hValidees.toFixed(1)}h`,
      `${pct}%`,
    ]
  })

  autoTable(doc, {
    startY: currentY,
    head: [["Matière / Cours", "Filière & Semestre", "Enseignant", "Prévues", "Réalisées", "Taux"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [15, 23, 42], cellWidth: 55 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", fontStyle: "bold", textColor: [37, 99, 235], cellWidth: 20 },
      5: { halign: "center", fontStyle: "bold", cellWidth: 17 },
    },
    didDrawCell: (data) => {
      // Colorer la cellule du taux selon le pourcentage
      if (data.section === "body" && data.column.index === 5) {
        const val = parseInt(data.cell.raw as string, 10) || 0
        if (val >= 50) {
          doc.setTextColor(22, 101, 52) // Vert
        } else {
          doc.setTextColor(180, 83, 9) // Ambre
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  // 5. Pied de page sur toutes les pages
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)

    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(148, 163, 184)
    doc.text(etablissement, 14, pageHeight - 7)
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: "right" })
  }

  // Téléchargement direct avec nom de fichier propre
  const fileName = `Rapport_Hebdomadaire_S${semaine}_${annee}_EduCompare.pdf`
  doc.save(fileName)
}

