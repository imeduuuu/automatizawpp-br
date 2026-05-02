const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@automatizawpp.com' }
  });

  if (user) {
    console.log('Usuario encontrado:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Nombre:', user.name);
    console.log('  Role:', user.role);
    console.log('  passwordHash existe:', !!user.passwordHash);
    console.log('  passwordHash length:', user.passwordHash?.length);
    console.log('  passwordHash:', user.passwordHash?.substring(0, 50) + '...');
  } else {
    console.log('Usuario no encontrado');
  }

  await prisma.$disconnect();
}

checkAdmin();
