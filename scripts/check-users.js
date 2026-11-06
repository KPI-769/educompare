const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, password: true }
  });
  console.log("Total users found:", users.length);
  for (const u of users) {
    console.log(`- ${u.email} (${u.role}) : pass starts with ${u.password.substring(0, 15)}... len=${u.password.length}`);
    
    // Test common passwords
    const tests = ["superadmin123", "responsable123", "prof123", "delegue123", "admin123", "password"];
    for (const t of tests) {
      if (bcrypt.compareSync(t, u.password)) {
        console.log(`  -> Match for password: "${t}"`);
      }
    }
  }
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

