import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies — AutomatizaWPP',
  description: 'Política de Cookies da AutomatizaWPP em conformidade com a LGPD (Lei 13.709/2018) e Resolução ANPD nº 4/2024.',
  alternates: { canonical: 'https://www.automatizawpp.com/politica-de-cookies' },
  openGraph: {
    title: 'Política de Cookies — AutomatizaWPP',
    description: 'Política de Cookies da AutomatizaWPP em conformidade com a LGPD.',
    url: 'https://www.automatizawpp.com/politica-de-cookies',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function PoliticaCookiesPage() {
  return (
    <main style={{ padding: '40px 24px', maxWidth: 920, margin: '0 auto' }}>
      <article className="legal-content">
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Política de Cookies</h1>
          <p style={{ color: 'var(--muted, #888)', fontSize: 14, margin: 0 }}>Última atualização: 18 de maio de 2026</p>
        </header>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--neon, #25D366)' }}>1. O que são cookies</h2>
          <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, celular, tablet) quando você visita um site. Eles permitem que o site reconheça o seu navegador e, dependendo do tipo, armazenem informações sobre as suas preferências ou ações anteriores.</p>
          <p>A AutomatizaWPP utiliza cookies em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong> e a <strong>Resolução CD/ANPD nº 4/2024</strong>.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--neon, #25D366)' }}>2. Categorias de cookies que usamos</h2>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>2.1 Cookies necessários (sempre ativos)</h3>
            <p>Essenciais para o funcionamento do site. Sem eles, recursos básicos não funcionam corretamente.</p>
            <ul style={{ marginTop: 8 }}>
              <li><strong>auth.access-token</strong> · sessão autenticada · expira em 15 minutos</li>
              <li><strong>auth.refresh-token</strong> · renovação de sessão · expira em 7 dias</li>
              <li><strong>awpp_ui_language</strong> · preferência de idioma · expira em 1 ano</li>
              <li><strong>awpp_cookie_consent</strong> · registro do seu consentimento · expira em 6 meses</li>
            </ul>
            <p style={{ fontSize: 13, color: 'var(--muted, #888)', marginTop: 8 }}>Base legal LGPD: legítimo interesse (Art. 7º IX) e cumprimento de obrigação legal.</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>2.2 Cookies de análise (opcional)</h3>
            <p>Coletam informações anônimas sobre como os visitantes usam o site (páginas mais visitadas, tempo de permanência, origem do tráfego). Ajudam-nos a melhorar a experiência.</p>
            <ul style={{ marginTop: 8 }}>
              <li><strong>_ga, _ga_*</strong> · Google Analytics 4 · expira em 2 anos</li>
              <li><strong>_gid</strong> · Google Analytics — identificação de sessão · expira em 24 horas</li>
            </ul>
            <p style={{ fontSize: 13, color: 'var(--muted, #888)', marginTop: 8 }}>Base legal LGPD: consentimento (Art. 7º I). Só carregam após você aceitar.</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>2.3 Cookies de marketing (opcional)</h3>
            <p>Usados para mostrar anúncios relevantes e medir a eficácia das nossas campanhas em redes sociais.</p>
            <ul style={{ marginTop: 8 }}>
              <li><strong>_fbp, _fbc</strong> · Meta Pixel (Facebook/Instagram) · expira em 90 dias</li>
              <li><strong>_gcl_au</strong> · Google Ads · expira em 90 dias</li>
            </ul>
            <p style={{ fontSize: 13, color: 'var(--muted, #888)', marginTop: 8 }}>Base legal LGPD: consentimento (Art. 7º I). Só carregam após você aceitar.</p>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--neon, #25D366)' }}>3. Como gerenciar suas preferências</h2>
          <p>Você pode alterar suas preferências de cookies a qualquer momento:</p>
          <ol>
            <li><strong>No banner inicial</strong>: ao acessar o site pela primeira vez, escolha aceitar, rejeitar ou personalizar.</li>
            <li><strong>Limpando o histórico do navegador</strong>: ao limpar cookies, o banner aparecerá novamente.</li>
            <li><strong>Configurações do navegador</strong>: você pode bloquear ou apagar cookies diretamente nas configurações de privacidade do seu navegador.</li>
          </ol>
          <p style={{ marginTop: 12 }}><strong>Importante</strong>: cookies necessários não podem ser desativados (são essenciais para o site funcionar). Cookies de análise e marketing exigem seu consentimento explícito e podem ser revogados a qualquer momento.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--neon, #25D366)' }}>4. Seus direitos sob a LGPD</h2>
          <p>Você tem direito a (Art. 18 LGPD):</p>
          <ul>
            <li>Confirmar a existência de tratamento de dados</li>
            <li>Acessar os seus dados</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Solicitar a portabilidade dos dados</li>
          </ul>
          <p style={{ marginTop: 12 }}>Para exercer estes direitos, contacte-nos em <a href="mailto:inbox@automatizawpp.com" style={{ color: 'var(--neon, #25D366)' }}>inbox@automatizawpp.com</a>. Respondemos em até 15 dias úteis.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--neon, #25D366)' }}>5. Encarregado de Proteção de Dados (DPO)</h2>
          <p>Para questões relacionadas à proteção de dados pessoais:</p>
          <p><strong>E-mail</strong>: <a href="mailto:inbox@automatizawpp.com" style={{ color: 'var(--neon, #25D366)' }}>inbox@automatizawpp.com</a></p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--neon, #25D366)' }}>6. Atualizações desta política</h2>
          <p>Podemos atualizar esta Política de Cookies periodicamente. Quando o fizermos, atualizaremos a data &quot;Última atualização&quot; no topo desta página e, se as mudanças forem materiais, solicitaremos novamente o seu consentimento.</p>
        </section>

        <footer style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 32 }}>
          <p style={{ fontSize: 13, color: 'var(--muted, #888)' }}>
            AutomatizaWPP · <a href="mailto:inbox@automatizawpp.com" style={{ color: 'var(--neon, #25D366)' }}>inbox@automatizawpp.com</a> · São Paulo, Brasil
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted, #888)', marginTop: 8 }}>
            Veja também: <a href="/privacidade" style={{ color: 'var(--neon, #25D366)' }}>Política de Privacidade</a> · <a href="/termos" style={{ color: 'var(--neon, #25D366)' }}>Termos de Uso</a>
          </p>
        </footer>
      </article>

      <style>{`
        .legal-content p { line-height: 1.7; margin-bottom: 12px; }
        .legal-content ul, .legal-content ol { line-height: 1.7; margin-bottom: 12px; padding-left: 24px; }
        .legal-content li { margin-bottom: 6px; }
        .legal-content a { color: var(--neon, #25D366); }
      `}</style>
    </main>
  );
}
