const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@automatizawpp.com';
    const adminPassword = 'Admin@2026!';

    // Hash con las mismas 12 rondas que usa la app
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    console.log('Hash generado:', passwordHash);

    // Actualizar contraseña
    const user = await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash },
    });

    console.log('✓ Contraseña actualizada:');
    console.log('  Email:', adminEmail);
    console.log('  Nueva contraseña:', adminPassword);
    console.log('  Hash:', passwordHash.substring(0, 50) + '...');

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
