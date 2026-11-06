import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Démarrage de l'initialisation des données de test...")

  // 1. Super Admin
  const superAdminPass = await bcrypt.hash("superadmin123", 10)
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@educompare.com" },
    update: {},
    create: {
      email: "admin@educompare.com",
      name: "Directeur Général (Super Admin)",
      password: superAdminPass,
      role: "SUPER_ADMIN",
    },
  })
  console.log("✅ Super Admin:", superAdmin.email)

  // 2. Niveaux académiques
  const niveauL1 = await prisma.niveau.upsert({
    where: { id: "niveau-licence-1" },
    update: {},
    create: {
      id: "niveau-licence-1",
      nom: "Licence 1 Sciences & Technologies",
      description: "Première année de tronc commun scientifique",
    },
  })

  const niveauL2 = await prisma.niveau.upsert({
    where: { id: "niveau-licence-2" },
    update: {},
    create: {
      id: "niveau-licence-2",
      nom: "Licence 2 Informatique",
      description: "Deuxième année spécialisée en informatique et réseaux",
    },
  })
  console.log("✅ Niveaux créés: L1 & L2")

  // 3. Responsable de Filière
  const respPass = await bcrypt.hash("responsable123", 10)
  const responsable = await prisma.user.upsert({
    where: { email: "responsable@educompare.com" },
    update: { niveauId: niveauL1.id },
    create: {
      email: "responsable@educompare.com",
      name: "Dr. Alexandre Martin",
      password: respPass,
      role: "RESPONSABLE",
      niveauId: niveauL1.id,
    },
  })
  console.log("✅ Responsable de filière:", responsable.email)

  // 4. Professeurs
  const profPass = await bcrypt.hash("prof123", 10)
  const prof1 = await prisma.user.upsert({
    where: { email: "prof@educompare.com" },
    update: {},
    create: {
      email: "prof@educompare.com",
      name: "Prof. Sarah Bernard",
      password: profPass,
      role: "PROFESSEUR",
      niveauId: niveauL1.id,
      createdById: responsable.id,
    },
  })

  const prof2 = await prisma.user.upsert({
    where: { email: "prof.informatique@educompare.com" },
    update: {},
    create: {
      email: "prof.informatique@educompare.com",
      name: "Prof. Luc Nguyen",
      password: profPass,
      role: "PROFESSEUR",
      niveauId: niveauL1.id,
      createdById: responsable.id,
    },
  })
  console.log("✅ Professeurs créés")

  // 5. Délégués
  const deleguePass = await bcrypt.hash("delegue123", 10)
  const delegue1 = await prisma.user.upsert({
    where: { email: "delegue@educompare.com" },
    update: {},
    create: {
      email: "delegue@educompare.com",
      name: "Thomas Délégué L1",
      password: deleguePass,
      role: "DELEGUE",
      niveauId: niveauL1.id,
      createdById: responsable.id,
    },
  })
  console.log("✅ Délégué créé:", delegue1.email)

  // 6. Cours avec syllabus
  const coursMath = await prisma.cours.upsert({
    where: { codeEtudiant: "MATH101" },
    update: {},
    create: {
      titre: "Algèbre Linéaire & Analyse 1",
      description: "Espaces vectoriels, matrices, suites et fonctions réelles",
      heuresPrevues: 50,
      filiere: "Sciences & Technologies",
      semestre: 1,
      codeEtudiant: "MATH101",
      niveauId: niveauL1.id,
      profId: prof1.id,
      delegueId: delegue1.id,
      syllabus: {
        create: {
          contenu: `SYLLABUS OFFICIEL - ALGÈBRE LINÉAIRE & ANALYSE 1

CHAPITRE 1 : ESPACES VECTORIELS ET APPLICATIONS LINÉAIRES
- Définition d'un espace vectoriel sur R
- Sous-espaces vectoriels et familles libres
- Bases, dimension et théorème du rang

CHAPITRE 2 : CALCUL MATRICIEL ET SYSTÈMES LINÉAIRES
- Opérations matricielles, inverses et déterminants
- Méthode du pivot de Gauss
- Résolution complète des systèmes linéaires

CHAPITRE 3 : FONCTIONS RÉELLES ET DÉVELOPPEMENTS LIMITÉS
- Continuité, dérivabilité et formule de Taylor-Young
- Développements limités au voisinage de 0
- Applications au calcul des limites et à l'étude des fonctions

CHAPITRE 4 : INTÉGRATION DE RIEMANN
- Sommes de Riemann et primitives
- Intégration par parties et changements de variable
- Applications au calcul d'aires et de volumes`,
        },
      },
    },
  })

  const coursAlgo = await prisma.cours.upsert({
    where: { codeEtudiant: "INFO101" },
    update: {},
    create: {
      titre: "Algorithmique & Structures de Données",
      description: "Structures de contrôle, tableaux, listes et complexité algorithmique",
      heuresPrevues: 45,
      filiere: "Sciences & Technologies",
      semestre: 1,
      codeEtudiant: "INFO101",
      niveauId: niveauL1.id,
      profId: prof2.id,
      delegueId: delegue1.id,
      syllabus: {
        create: {
          contenu: `SYLLABUS OFFICIEL - ALGORITHMIQUE & STRUCTURES DE DONNÉES
CHAPITRE 1 : Variables, types et structures de contrôle conditionnelles
CHAPITRE 2 : Boucles et itérations (pour, tant que)
CHAPITRE 3 : Tableaux et matrices
CHAPITRE 4 : Fonctions, procédures et passage de paramètres
CHAPITRE 5 : Notions de complexité algorithmique`,
        },
      },
    },
  })

  console.log("✅ Cours et Syllabi créés: MATH101 & INFO101")

  // 7. Séances / Progressions renseignées
  const dateDebut1 = new Date("2026-10-10T08:00:00Z")
  const dateFin1 = new Date("2026-10-10T11:00:00Z")

  const dateDebut2 = new Date("2026-10-17T08:00:00Z")
  const dateFin2 = new Date("2026-10-17T11:00:00Z")

  const prog1 = await prisma.progressionCours.create({
    data: {
      coursId: coursMath.id,
      delegueId: delegue1.id,
      heureDebut: dateDebut1,
      heureFin: dateFin1,
      heuresEffectives: 3,
      semaine: 1,
      annee: 2026,
      partieAtteinte: "Chapitre 1 terminé : Définition des sous-espaces vectoriels et exercices 1 à 4.",
      notifEnvoyee: true,
      validation: {
        create: {
          profId: prof1.id,
          status: "VALIDATED",
          commentaire: "Très bien, cours bien suivi et exercices d'application terminés.",
        },
      },
    },
  })

  const prog2 = await prisma.progressionCours.create({
    data: {
      coursId: coursMath.id,
      delegueId: delegue1.id,
      heureDebut: dateDebut2,
      heureFin: dateFin2,
      heuresEffectives: 3,
      semaine: 2,
      annee: 2026,
      partieAtteinte: "Chapitre 2 : Début du calcul matriciel, inversion par Gauss débutée.",
      notifEnvoyee: true,
      validation: {
        create: {
          profId: prof1.id,
          status: "PENDING",
        },
      },
    },
  })

  console.log("✅ Séances et validations initialisées !")
  console.log("\n🎉 Initialisation terminée avec succès !")
}

main()
  .catch((e) => {
    console.error("Erreur seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

