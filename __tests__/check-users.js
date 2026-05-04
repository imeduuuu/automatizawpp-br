/**
 * Script para verificar usuarios en la BD
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando usuarios en la BD...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      workspaceId: true,
      createdAt: true
    },
    take: 20
  });

  console.log(`Total de usuarios encontrados: ${users.length}\n`);

  if (users.length === 0) {
    console.log('⚠️  No hay usuarios en la BD. Necesitas crear uno primero.');
    console.log('\nEjemplo de creación de usuario:');
    console.log(`
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: bcrypt.hashSync('password123', 10),
    workspaceId: workspace.id,
    role: 'owner'
  }
});
    `);
  } else {
    console.table(users);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
