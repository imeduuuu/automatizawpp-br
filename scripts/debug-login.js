const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugLogin() {
  try {
    const email = 'admin@automatizawpp.com';
    const password = 'Admin@2026!';
    const emailLowercase = email.toLowerCase();

    console.log('=== DEBUG LOGIN ===\n');

    // 1. Buscar usuario exactamente como lo hace el código
    console.log('1. Buscando usuario...');
    console.log('   Email a buscar:', emailLowercase);

    const user = await prisma.user.findUnique({
      where: { email: emailLowercase }
    });

    if (!user) {
      console.log('   ✗ Usuario NO encontrado');
      return;
    }

    console.log('   ✓ Usuario encontrado:');
    console.log('     ID:', user.id);
    console.log('     Email:', user.email);
    console.log('     Name:', user.name);
    console.log('     passwordHash type:', typeof user.passwordHash);
    console.log('     passwordHash exists:', !!user.passwordHash);

    if (!user.passwordHash) {
      console.log('   ✗ passwordHash es null');
      return;
    }

    // 2. Verificar contraseña como lo hace el código
    console.log('\n2. Verificando contraseña...');
    console.log('   Password a probar:', password);

    try {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log('   Resultado bcrypt.compare:', isValidPassword);

      if (!isValidPassword) {
        console.log('   ✗ Contraseña NO coincide');

        // Probar con diferentes contraseñas
        console.log('\n3. Probando otras contraseñas...');
        const testPasswords = ['admin', '123456', 'Admin@2026', 'admin@2026!'];
        for (const testPwd of testPasswords) {
          const testResult = await bcrypt.compare(testPwd, user.passwordHash);
          console.log(`   "${testPwd}":`, testResult);
        }
      } else {
        console.log('   ✓ Contraseña CORRECTA');
      }
    } catch (bcryptError) {
      console.log('   ✗ Error en bcrypt.compare:', bcryptError.message);
    }

    // 3. Simular lo que retornaría
    if (user?.passwordHash) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (isValidPassword) {
        console.log('\n✓ El login DEBERÍA funcionar');
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          role: user.role
        };
      }
    }

    console.log('\n✗ El login FALLARÍA');

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
