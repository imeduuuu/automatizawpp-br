import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade — AutomatizaWPP',
  description: 'Como a AutomatizaWPP coleta, usa e protege seus dados pessoais.',
  alternates: { canonical: 'https://www.automatizawpp.com/privacidade' },
  openGraph: {
    title: 'Política de Privacidade — AutomatizaWPP',
    description: 'Como a AutomatizaWPP coleta, usa e protege seus dados pessoais.',
    url: 'https://www.automatizawpp.com/privacidade',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function PrivacidadePage() {
  return (
    <>
      <style>{`
        .priv-wrap{max-width:780px;margin:0 auto;padding:120px 24px 80px}
        .priv-wrap h1{font-size:clamp(2rem,5vw,3.2rem);letter-spacing:-.06em;line-height:1;margin-bottom:8px}
        .priv-wrap .meta{color:#666;font-size:.85rem;margin-bottom:48px;padding-bottom:24px;border-bottom:1px solid #1a1a1a}
        .priv-wrap h2{font-size:1.15rem;font-weight:700;color:#fff;margin:36px 0 10px}
        .priv-wrap p,.priv-wrap li{color:#aaa;line-height:1.7;margin-bottom:10px;font-size:.97rem}
        .priv-wrap ul{padding-left:20px}
        .priv-wrap a{color:#25D366;text-decoration:none}
        .priv-wrap a:hover{text-decoration:underline}
        .priv-back{display:inline-flex;align-items:center;gap:6px;color:#25D366;font-size:.85rem;margin-bottom:32px;text-decoration:none}
        .priv-back:hover{text-decoration:underline}
        .highlight-box{background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.2);border-radius:10px;padding:16px 20px;margin:24px 0}
      `}</style>
      <main>
        <div className="priv-wrap">
          <Link href="/" className="priv-back">← Voltar</Link>
          <h1>Política de Privacidade</h1>
          <p className="meta">Última atualização: Maio de 2025 · AutomatizaWPP</p>

          <p>A AutomatizaWPP está comprometida com a proteção da sua privacidade. Esta política explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>

          <h2>1. Dados que coletamos</h2>
          <p>Coletamos as seguintes categorias de dados pessoais:</p>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome completo, e-mail, telefone e empresa.</li>
            <li><strong>Dados de uso:</strong> páginas acessadas, tempo de sessão, cliques e interações com a plataforma.</li>
            <li><strong>Dados de comunicação:</strong> mensagens trocadas via WhatsApp, e-mail ou formulários.</li>
            <li><strong>Dados de pagamento:</strong> processados por parceiros certificados (não armazenamos dados de cartão).</li>
          </ul>

          <h2>2. Como usamos seus dados</h2>
          <ul>
            <li>Prestar os serviços contratados (automação de WhatsApp, CRM, agentes de IA).</li>
            <li>Enviar comunicações relacionadas à sua conta e ao serviço.</li>
            <li>Melhorar a plataforma com base em dados agregados e anônimos.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <h2>3. Base legal para tratamento</h2>
          <p>Tratamos seus dados com base nas seguintes hipóteses previstas na LGPD:</p>
          <ul>
            <li><strong>Execução de contrato</strong> — para prestar os serviços solicitados.</li>
            <li><strong>Consentimento</strong> — para envio de comunicações de marketing.</li>
            <li><strong>Legítimo interesse</strong> — para melhorias de produto e segurança.</li>
          </ul>

          <h2>4. Compartilhamento de dados</h2>
          <p>Não vendemos seus dados. Podemos compartilhá-los apenas com:</p>
          <ul>
            <li>Fornecedores de infraestrutura (servidores, banco de dados) sujeitos a acordos de confidencialidade.</li>
            <li>Plataformas de comunicação integradas (WhatsApp Business API, provedores de e-mail).</li>
            <li>Autoridades competentes, quando exigido por lei.</li>
          </ul>

          <h2>5. Armazenamento e segurança</h2>
          <p>Seus dados são armazenados em servidores no Brasil com criptografia em trânsito (TLS) e em repouso. Aplicamos controles de acesso, autenticação e monitoramento contínuo.</p>

          <h2>6. Retenção de dados</h2>
          <p>Mantemos seus dados pelo tempo necessário para prestação dos serviços ou conforme exigido por lei. Após cancelamento da conta, os dados são excluídos em até 90 dias, exceto quando a retenção for obrigatória por lei.</p>

          <h2>7. Seus direitos (LGPD)</h2>
          <p>Você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de dados.</li>
            <li>Acessar, corrigir ou atualizar seus dados.</li>
            <li>Solicitar a exclusão dos dados tratados com seu consentimento.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Portabilidade dos dados a outro fornecedor.</li>
          </ul>

          <div className="highlight-box">
            <p style={{ margin: 0 }}>Para exercer seus direitos ou esclarecer dúvidas, entre em contato pelo e-mail <a href="mailto:inbox@automatizawpp.com">inbox@automatizawpp.com</a>. Respondemos em até 15 dias úteis.</p>
          </div>

          <h2>8. Cookies</h2>
          <p>Utilizamos cookies estritamente necessários para o funcionamento da plataforma. Não utilizamos cookies de rastreamento de terceiros para fins publicitários.</p>

          <h2>9. Alterações desta política</h2>
          <p>Podemos atualizar esta política periodicamente. Notificaremos sobre alterações relevantes por e-mail ou aviso na plataforma. O uso continuado após a notificação implica aceite das mudanças.</p>

          <h2>10. Contato</h2>
          <p>AutomatizaWPP · <a href="mailto:inbox@automatizawpp.com">inbox@automatizawpp.com</a> · São Paulo, Brasil</p>
        </div>
      </main>
    </>
  );
}
