import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso — AutomatizaWPP',
  description: 'Termos e condições de uso da plataforma AutomatizaWPP.',
  alternates: { canonical: 'https://www.automatizawpp.com/termos' },
  openGraph: {
    title: 'Termos de Uso — AutomatizaWPP',
    description: 'Termos e condições de uso da plataforma AutomatizaWPP.',
    url: 'https://www.automatizawpp.com/termos',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function TermosPage() {
  return (
    <>
      <style>{`
        .termos-wrap{max-width:780px;margin:0 auto;padding:120px 24px 80px}
        .termos-wrap h1{font-size:clamp(2rem,5vw,3.2rem);letter-spacing:-.06em;line-height:1;margin-bottom:8px}
        .termos-wrap .meta{color:#666;font-size:.85rem;margin-bottom:48px;padding-bottom:24px;border-bottom:1px solid #1a1a1a}
        .termos-wrap h2{font-size:1.15rem;font-weight:700;color:#fff;margin:36px 0 10px}
        .termos-wrap p,.termos-wrap li{color:#aaa;line-height:1.7;margin-bottom:10px;font-size:.97rem}
        .termos-wrap ul{padding-left:20px}
        .termos-wrap a{color:#25D366;text-decoration:none}
        .termos-wrap a:hover{text-decoration:underline}
        .termos-back{display:inline-flex;align-items:center;gap:6px;color:#25D366;font-size:.85rem;margin-bottom:32px;text-decoration:none}
        .termos-back:hover{text-decoration:underline}
        .highlight-box{background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.2);border-radius:10px;padding:16px 20px;margin:24px 0}
      `}</style>
      <main>
        <div className="termos-wrap">
          <Link href="/" className="termos-back">← Voltar</Link>
          <h1>Termos de Uso</h1>
          <p className="meta">Última atualização: Maio de 2025 · AutomatizaWPP</p>

          <p>Ao acessar ou utilizar a plataforma AutomatizaWPP, você concorda com estes Termos de Uso. Leia com atenção antes de usar nossos serviços.</p>

          <h2>1. Aceitação dos termos</h2>
          <p>O uso da plataforma AutomatizaWPP implica aceitação integral destes Termos. Caso não concorde com qualquer parte, não utilize os serviços.</p>

          <h2>2. Descrição do serviço</h2>
          <p>A AutomatizaWPP oferece uma plataforma de automação com inteligência artificial para:</p>
          <ul>
            <li>Atendimento automático via WhatsApp Business.</li>
            <li>CRM para gestão de leads e clientes.</li>
            <li>Agentes de IA para vendas, suporte e qualificação.</li>
            <li>Automação de e-mail, follow-ups e sequências.</li>
            <li>Monitoramento e análise de conversas.</li>
          </ul>

          <h2>3. Uso permitido</h2>
          <p>Você pode utilizar a plataforma para:</p>
          <ul>
            <li>Automatizar o atendimento legítimo ao cliente via WhatsApp Business.</li>
            <li>Gerenciar contatos e oportunidades de venda.</li>
            <li>Enviar comunicações para pessoas que consentiram em recebê-las.</li>
          </ul>

          <h2>4. Uso proibido</h2>
          <p>É expressamente proibido:</p>
          <ul>
            <li>Enviar spam ou mensagens não solicitadas em massa.</li>
            <li>Usar a plataforma para atividades ilegais, fraudulentas ou enganosas.</li>
            <li>Violar os Termos de Serviço do WhatsApp Business.</li>
            <li>Coletar dados de terceiros sem consentimento.</li>
            <li>Tentar acessar áreas não autorizadas da plataforma.</li>
            <li>Revender acesso à plataforma sem autorização expressa.</li>
          </ul>

          <h2>5. Conta e acesso</h2>
          <p>Você é responsável por manter a confidencialidade das suas credenciais. Notifique imediatamente a AutomatizaWPP sobre qualquer uso não autorizado da sua conta em <a href="mailto:inbox@automatizawpp.com">inbox@automatizawpp.com</a>.</p>

          <h2>6. Planos e pagamento</h2>
          <ul>
            <li>O período de trial é de 14 dias, sem cobrança de cartão de crédito.</li>
            <li>Após o trial, o plano escolhido é cobrado mensalmente.</li>
            <li>Os preços estão sujeitos a alteração com aviso prévio de 30 dias.</li>
            <li>Não há reembolso por períodos parciais após ativação do plano pago.</li>
          </ul>

          <h2>7. Cancelamento</h2>
          <p>Você pode cancelar sua conta a qualquer momento. O acesso permanece ativo até o fim do período pago. Após o cancelamento, os dados são excluídos conforme nossa <Link href="/privacidade">Política de Privacidade</Link>.</p>

          <h2>8. Propriedade intelectual</h2>
          <p>A plataforma, seus algoritmos, interfaces e conteúdos são propriedade exclusiva da AutomatizaWPP. Os dados gerados por você permanecem de sua propriedade.</p>

          <h2>9. Limitação de responsabilidade</h2>
          <p>A AutomatizaWPP não se responsabiliza por:</p>
          <ul>
            <li>Perdas de receita decorrentes de interrupções de serviço.</li>
            <li>Resultados de vendas obtidos (ou não) com uso da plataforma.</li>
            <li>Bloqueios de conta no WhatsApp Business por uso indevido.</li>
            <li>Danos indiretos, incidentais ou consequenciais.</li>
          </ul>

          <h2>10. Disponibilidade</h2>
          <p>Buscamos manter disponibilidade de 99,5% ao mês. Manutenções programadas serão comunicadas com antecedência. Não garantimos disponibilidade ininterrupta.</p>

          <h2>11. Lei aplicável</h2>
          <p>Estes termos são regidos pelas leis brasileiras, incluindo o Código de Defesa do Consumidor (Lei 8.078/1990) e a LGPD (Lei 13.709/2018). O foro competente é o da Comarca de São Paulo, SP.</p>

          <div className="highlight-box">
            <p style={{ margin: 0 }}>Dúvidas sobre estes termos? Entre em contato pelo e-mail <a href="mailto:inbox@automatizawpp.com">inbox@automatizawpp.com</a>.</p>
          </div>
        </div>
      </main>
    </>
  );
}
