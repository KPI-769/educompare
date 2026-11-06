"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// prisma/seed.ts
var import_client = require("@prisma/client");
var import_bcryptjs = __toESM(require("bcryptjs"));
var prisma = new import_client.PrismaClient();
async function main() {
  console.log("\u{1F331} D\xE9marrage de l'initialisation des donn\xE9es de test...");
  const superAdminPass = await import_bcryptjs.default.hash("superadmin123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@educompare.com" },
    update: {},
    create: {
      email: "admin@educompare.com",
      name: "Directeur G\xE9n\xE9ral (Super Admin)",
      password: superAdminPass,
      role: "SUPER_ADMIN"
    }
  });
  console.log("\u2705 Super Admin:", superAdmin.email);
  const niveauL1 = await prisma.niveau.upsert({
    where: { id: "niveau-licence-1" },
    update: {},
    create: {
      id: "niveau-licence-1",
      nom: "Licence 1 Sciences & Technologies",
      description: "Premi\xE8re ann\xE9e de tronc commun scientifique"
    }
  });
  const niveauL2 = await prisma.niveau.upsert({
    where: { id: "niveau-licence-2" },
    update: {},
    create: {
      id: "niveau-licence-2",
      nom: "Licence 2 Informatique",
      description: "Deuxi\xE8me ann\xE9e sp\xE9cialis\xE9e en informatique et r\xE9seaux"
    }
  });
  console.log("\u2705 Niveaux cr\xE9\xE9s: L1 & L2");
  const respPass = await import_bcryptjs.default.hash("responsable123", 10);
  const responsable = await prisma.user.upsert({
    where: { email: "responsable@educompare.com" },
    update: { niveauId: niveauL1.id },
    create: {
      email: "responsable@educompare.com",
      name: "Dr. Alexandre Martin",
      password: respPass,
      role: "RESPONSABLE",
      niveauId: niveauL1.id
    }
  });
  console.log("\u2705 Responsable de fili\xE8re:", responsable.email);
  const profPass = await import_bcryptjs.default.hash("prof123", 10);
  const prof1 = await prisma.user.upsert({
    where: { email: "prof@educompare.com" },
    update: {},
    create: {
      email: "prof@educompare.com",
      name: "Prof. Sarah Bernard",
      password: profPass,
      role: "PROFESSEUR",
      niveauId: niveauL1.id,
      createdById: responsable.id
    }
  });
  const prof2 = await prisma.user.upsert({
    where: { email: "prof.informatique@educompare.com" },
    update: {},
    create: {
      email: "prof.informatique@educompare.com",
      name: "Prof. Luc Nguyen",
      password: profPass,
      role: "PROFESSEUR",
      niveauId: niveauL1.id,
      createdById: responsable.id
    }
  });
  console.log("\u2705 Professeurs cr\xE9\xE9s");
  const deleguePass = await import_bcryptjs.default.hash("delegue123", 10);
  const delegue1 = await prisma.user.upsert({
    where: { email: "delegue@educompare.com" },
    update: {},
    create: {
      email: "delegue@educompare.com",
      name: "Thomas D\xE9l\xE9gu\xE9 L1",
      password: deleguePass,
      role: "DELEGUE",
      niveauId: niveauL1.id,
      createdById: responsable.id
    }
  });
  console.log("\u2705 D\xE9l\xE9gu\xE9 cr\xE9\xE9:", delegue1.email);
  const coursMath = await prisma.cours.upsert({
    where: { codeEtudiant: "MATH101" },
    update: {},
    create: {
      titre: "Alg\xE8bre Lin\xE9aire & Analyse 1",
      description: "Espaces vectoriels, matrices, suites et fonctions r\xE9elles",
      heuresPrevues: 50,
      filiere: "Sciences & Technologies",
      semestre: 1,
      codeEtudiant: "MATH101",
      niveauId: niveauL1.id,
      profId: prof1.id,
      delegueId: delegue1.id,
      syllabus: {
        create: {
          contenu: `SYLLABUS OFFICIEL - ALG\xC8BRE LIN\xC9AIRE & ANALYSE 1

CHAPITRE 1 : ESPACES VECTORIELS ET APPLICATIONS LIN\xC9AIRES
- D\xE9finition d'un espace vectoriel sur R
- Sous-espaces vectoriels et familles libres
- Bases, dimension et th\xE9or\xE8me du rang

CHAPITRE 2 : CALCUL MATRICIEL ET SYST\xC8MES LIN\xC9AIRES
- Op\xE9rations matricielles, inverses et d\xE9terminants
- M\xE9thode du pivot de Gauss
- R\xE9solution compl\xE8te des syst\xE8mes lin\xE9aires

CHAPITRE 3 : FONCTIONS R\xC9ELLES ET D\xC9VELOPPEMENTS LIMIT\xC9S
- Continuit\xE9, d\xE9rivabilit\xE9 et formule de Taylor-Young
- D\xE9veloppements limit\xE9s au voisinage de 0
- Applications au calcul des limites et \xE0 l'\xE9tude des fonctions

CHAPITRE 4 : INT\xC9GRATION DE RIEMANN
- Sommes de Riemann et primitives
- Int\xE9gration par parties et changements de variable
- Applications au calcul d'aires et de volumes`
        }
      }
    }
  });
  const coursAlgo = await prisma.cours.upsert({
    where: { codeEtudiant: "INFO101" },
    update: {},
    create: {
      titre: "Algorithmique & Structures de Donn\xE9es",
      description: "Structures de contr\xF4le, tableaux, listes et complexit\xE9 algorithmique",
      heuresPrevues: 45,
      filiere: "Sciences & Technologies",
      semestre: 1,
      codeEtudiant: "INFO101",
      niveauId: niveauL1.id,
      profId: prof2.id,
      delegueId: delegue1.id,
      syllabus: {
        create: {
          contenu: `SYLLABUS OFFICIEL - ALGORITHMIQUE & STRUCTURES DE DONN\xC9ES
CHAPITRE 1 : Variables, types et structures de contr\xF4le conditionnelles
CHAPITRE 2 : Boucles et it\xE9rations (pour, tant que)
CHAPITRE 3 : Tableaux et matrices
CHAPITRE 4 : Fonctions, proc\xE9dures et passage de param\xE8tres
CHAPITRE 5 : Notions de complexit\xE9 algorithmique`
        }
      }
    }
  });
  console.log("\u2705 Cours et Syllabi cr\xE9\xE9s: MATH101 & INFO101");
  const dateDebut1 = /* @__PURE__ */ new Date("2026-10-10T08:00:00Z");
  const dateFin1 = /* @__PURE__ */ new Date("2026-10-10T11:00:00Z");
  const dateDebut2 = /* @__PURE__ */ new Date("2026-10-17T08:00:00Z");
  const dateFin2 = /* @__PURE__ */ new Date("2026-10-17T11:00:00Z");
  const prog1 = await prisma.progressionCours.create({
    data: {
      coursId: coursMath.id,
      delegueId: delegue1.id,
      heureDebut: dateDebut1,
      heureFin: dateFin1,
      heuresEffectives: 3,
      semaine: 1,
      annee: 2026,
      partieAtteinte: "Chapitre 1 termin\xE9 : D\xE9finition des sous-espaces vectoriels et exercices 1 \xE0 4.",
      notifEnvoyee: true,
      validation: {
        create: {
          profId: prof1.id,
          status: "VALIDATED",
          commentaire: "Tr\xE8s bien, cours bien suivi et exercices d'application termin\xE9s."
        }
      }
    }
  });
  const prog2 = await prisma.progressionCours.create({
    data: {
      coursId: coursMath.id,
      delegueId: delegue1.id,
      heureDebut: dateDebut2,
      heureFin: dateFin2,
      heuresEffectives: 3,
      semaine: 2,
      annee: 2026,
      partieAtteinte: "Chapitre 2 : D\xE9but du calcul matriciel, inversion par Gauss d\xE9but\xE9e.",
      notifEnvoyee: true,
      validation: {
        create: {
          profId: prof1.id,
          status: "PENDING"
        }
      }
    }
  });
  console.log("\u2705 S\xE9ances et validations initialis\xE9es !");
  console.log("\n\u{1F389} Initialisation termin\xE9e avec succ\xE8s !");
}
main().catch((e) => {
  console.error("Erreur seed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
