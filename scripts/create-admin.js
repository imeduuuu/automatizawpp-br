const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Email y contraseña para el admin
    const adminEmail = 'admin@automatizawpp.com';
    const adminPassword = 'Admin@2026!';
    const adminName = 'Eduardo Silva';

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Crear workspace primero
    const workspace = await prisma.workspace.create({
      data: {
        name: 'AutomatizaWPP',
        timezone: 'America/Sao_Paulo',
      },
    });

    console.log('✓ Workspace creado:', workspace.id);

    // Intentar actualizar usuario existente si existe
    try {
      const user = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          passwordHash: passwordHash,
          role: 'admin',
          subscriptionStatus: 'ACTIVE',
        },
      });
      console.log('✓ Usuario admin actualizado:');
      console.log('  Email:', adminEmail);
      console.log('  Contraseña:', adminPassword);
      console.log('  ID:', user.id);
    } catch (updateError) {
      // Si no existe, crearlo
      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          role: 'admin',
          passwordHash: passwordHash,
          subscriptionStatus: 'ACTIVE',
          workspaceId: workspace.id,
        },
      });
      console.log('✓ Usuario admin creado:');
      console.log('  Email:', adminEmail);
      console.log('  Contraseña:', adminPassword);
      console.log('  ID:', user.id);
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('  El email ya existe en la base de datos');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
