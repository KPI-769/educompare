const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("Synchronisation et réinitialisation des mots de passe des comptes principaux...");

  const updates = [
    { email: "admin@educompare.com", pass: "superadmin123" },
    { email: "responsable@educompare.com", pass: "responsable123" },
    { email: "prof@educompare.com", pass: "prof123" },
    { email: "delegue@educompare.com", pass: "delegue123" },
    // On met aussi un mot de passe connu par précaution sur les 2 comptes créés manuellement si besoin
    { email: "jeanmarie@educompare.com", pass: "delegue123" },
    { email: "tekinzang@educompare.com", pass: "prof123" },
  ];

  for (const item of updates) {
    const hash = await bcrypt.hash(item.pass, 10);
    const updated = await prisma.user.updateMany({
      where: { email: item.email },
      data: { password: hash }
    });
    if (updated.count > 0) {
      console.log(`✅ Mot de passe mis à jour pour ${item.email} -> "${item.pass}"`);
    } else {
      console.log(`⚠️ Utilisateur ${item.email} non trouvé.`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);

