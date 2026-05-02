const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function simulateNextAuthLogin() {
  try {
    console.log('=== Simulando NextAuth Login ===\n');

    const email = 'admin@automatizawpp.com';
    const password = 'Admin@2026!';

    console.log('1. Buscando usuario (como lo hace NextAuth)...');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.log('   ✗ Usuario NO encontrado → AuthError\n');
      console.log('   NextAuth lanzaría: AuthError (User not found)');
      console.log('   Resultado en UI: "Email o contraseña incorretos"');
      return;
    }

    console.log('   ✓ Usuario encontrado:', user.id);
    console.log('   Email:', user.email);
    console.log('   passwordHash exists:', !!user.passwordHash);

    if (!user.passwordHash) {
      console.log('   ✗ Sin passwordHash → AuthError\n');
      console.log('   NextAuth lanzaría: AuthError (No password)');
      console.log('   Resultado en UI: "Email o contraseña incorretos"');
      return;
    }

    console.log('\n2. Verificando contraseña (como lo hace NextAuth)...');
    console.log('   Password a verificar:', password);
    console.log('   Hash almacenado:', user.passwordHash.substring(0, 40) + '...');

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      console.log('   ✗ Contraseña NO coincide → AuthError\n');
      console.log('   NextAuth lanzaría: AuthError (Invalid password)');
      console.log('   Resultado en UI: "Email o contraseña incorretos"');
      return;
    }

    console.log('   ✓ Contraseña VÁLIDA');

    console.log('\n3. Constructores el usuario object (return value de authorize)...');
    const returnUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      workspaceId: user.workspaceId,
      role: user.role
    };

    console.log('   ✓ Usuario retornado:', returnUser);
    console.log('\n✓ NextAuth debería crear sesión JWT y loguear');

  } catch (error) {
    console.error('✗ Error inesperado:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simulateNextAuthLogin();
