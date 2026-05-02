import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validatePipeline() {
  try {
    console.log('🔍 Validando Pipeline Completo...\n');

    const workspaceId = 'admin_automatizawpp_ws';
    
    // Get all 5 leads
    const leads = await prisma.lead.findMany({
      where: { workspaceId, source: 'teste-gratis-form' },
      include: {
        emailEvents: true,
        conversations: true,
        scores: true,
        bookings: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📊 ${leads.length} Leads Validados:\n`);

    for (const lead of leads) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 ${lead.fullName}`);
      console.log(`   Email: ${lead.email}`);
      console.log(`   Interesse: ${lead.productInterest}`);
      console.log(`   Status: ${lead.status}`);
      
      // Check score
      if (lead.scores && lead.scores.length > 0) {
        const latestScore = lead.scores[lead.scores.length - 1];
        console.log(`   📊 Score: ${latestScore.totalScore}/100`);
        console.log(`      Qualificado: ${latestScore.isQualified ? 'SIM' : 'NÃO'}`);
      } else {
        console.log(`   📊 Score: Não calculado`);
      }
      
      // Check email events
      if (lead.emailEvents && lead.emailEvents.length > 0) {
        console.log(`   📧 Email Events: ${lead.emailEvents.length}`);
        lead.emailEvents.forEach(evt => {
          console.log(`      - ${evt.type}`);
        });
      } else {
        console.log(`   📧 Email Events: Nenhum`);
      }
      
      // Check bookings
      if (lead.bookings && lead.bookings.length > 0) {
        console.log(`   📅 Bookings: ${lead.bookings.length}`);
        lead.bookings.forEach(booking => {
          console.log(`      - ${booking.channel}: ${booking.status}`);
        });
      } else {
        console.log(`   📅 Bookings: Nenhum`);
      }
      
      // Check conversations
      if (lead.conversations && lead.conversations.length > 0) {
        console.log(`   💬 Conversas: ${lead.conversations.length}`);
      } else {
        console.log(`   💬 Conversas: Nenhuma`);
      }
    }

    console.log(`\n\n📈 RESUMO DA VALIDAÇÃO:\n`);
    console.log(`✅ Leads capturados: ${leads.length}`);
    
    const scoreCount = leads.reduce((sum, l) => sum + (l.scores?.length || 0), 0);
    console.log(`✅ Scoring calculado: ${scoreCount > 0 ? scoreCount : 'Pendente'}`);
    
    const emailEventCount = leads.reduce((sum, l) => sum + (l.emailEvents?.length || 0), 0);
    console.log(`✅ Email triggers: ${emailEventCount > 0 ? emailEventCount : 'Pendente'}`);
    
    const bookingCount = leads.reduce((sum, l) => sum + (l.bookings?.length || 0), 0);
    console.log(`✅ Automações agendadas: ${bookingCount > 0 ? bookingCount : 'Pendente'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validatePipeline();
