const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users found:', users.length);
  users.forEach(u => {
    console.log(`- Username: "${u.username}", Role: ${u.role}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
