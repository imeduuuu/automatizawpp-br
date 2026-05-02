const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const adminEmail = 'admin@automatizawpp.com';
    const testPassword = 'Admin@2026!';

    // Obtener usuario de la BD
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!user) {
      console.log('✗ Usuario no encontrado');
      return;
    }

    console.log('Usuario encontrado:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  passwordHash:', user.passwordHash?.substring(0, 60) + '...');
    console.log('  passwordHash es null?', user.passwordHash === null);
    console.log('  passwordHash length:', user.passwordHash?.length);

    if (!user.passwordHash) {
      console.log('\n✗ PROBLEMA: passwordHash es null o vacío');
      return;
    }

    // Probar bcrypt.compare
    console.log('\nProbando validación de contraseña:');
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('  Contraseña correcta?', isValid);

    if (!isValid) {
      console.log('\n✗ La contraseña no coincide con el hash');
      console.log('  Hash almacenado comienza con:', user.passwordHash.substring(0, 20));

      // Probar génering un nuevo hash y compararlo
      const newHash = await bcrypt.hash(testPassword, 12);
      const newCompare = await bcrypt.compare(testPassword, newHash);
      console.log('  Nuevo hash genera match?', newCompare);
    } else {
      console.log('✓ La contraseña es VÁLIDA');
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
