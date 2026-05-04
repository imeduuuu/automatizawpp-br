/**
 * Script para crear/actualizar un usuario de prueba con contraseña conocida
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creando usuario de prueba...\n');

  const testEmail = 'test@automatizawpp.com';
  const testPassword = 'TestPassword123!';
  const passwordHash = bcrypt.hashSync(testPassword, 10);

  // Buscar workspace existente
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.error('❌ No hay workspaces en la BD. Abortando.');
    process.exit(1);
  }

  console.log(`Workspace encontrado: ${workspace.id}`);
  console.log(`Email: ${testEmail}`);
  console.log(`Contraseña: ${testPassword}`);
  console.log(`Password Hash: ${passwordHash}\n`);

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail }
  });

  let user;

  if (existingUser) {
    console.log(`✓ Usuario ${testEmail} ya existe. Actualizando contraseña...`);
    user = await prisma.user.update({
      where: { email: testEmail },
      data: { passwordHash }
    });
    console.log(`✓ Contraseña actualizada.\n`);
  } else {
    console.log(`✓ Creando nuevo usuario ${testEmail}...`);
    user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'E2E Test User',
        passwordHash,
        workspaceId: workspace.id,
        role: 'owner'
      }
    });
    console.log(`✓ Usuario creado.\n`);
  }

  console.log('CREDENCIALES PARA TEST:');
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${testPassword}`);
  console.log(`\nAhora ejecuta: node __tests__/e2e-auth-flow.js\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
