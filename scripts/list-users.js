const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("=== COMPTES DANS LA BASE ===");
  for (const u of users) {
    console.log(`Email: ${u.email}`);
    console.log(`Nom: ${u.name}`);
    console.log(`Role: ${u.role}`);
    console.log(`NiveauId: ${u.niveauId}`);
    console.log(`Password Hash: ${u.password.substring(0, 20)}...`);
    console.log("----------------------------");
  }
  await prisma.$disconnect();
}

main();

