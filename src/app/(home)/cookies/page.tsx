import type { Metadata } from 'next';
import LegalShell from '@/components/landing/LegalShell';

export const metadata: Metadata = {
  title: 'Política de Cookies — AutomatizaWPP',
  description: 'Información sobre el uso de cookies en el sitio web de AutomatizaWPP.',
  alternates: { canonical: 'https://www.automatizawpp.com/cookies' },
  robots: 'index, follow',
};

export default function CookiesPage() {
  return (
    <LegalShell title="Política de Cookies" updated="13 de junio de 2026">
      <p className="lp-legal-note">
        Este documento es una base general conforme al RGPD y la LSSI-CE. Revísalo y
        adáptalo con asesoría legal antes de su publicación definitiva.
      </p>

      <h2>1. Qué son las cookies</h2>
      <p>
        Las cookies son pequeños archivos que se almacenan en tu dispositivo al visitar un
        sitio web y permiten recordar información sobre tu navegación.
      </p>

      <h2>2. Tipos de cookies que usamos</h2>
      <ul>
        <li><strong>Técnicas:</strong> necesarias para el funcionamiento del sitio. No requieren consentimiento.</li>
        <li><strong>Analíticas:</strong> nos ayudan a entender cómo se usa el sitio para mejorarlo. Requieren consentimiento.</li>
        <li><strong>De preferencia:</strong> recuerdan tus elecciones (por ejemplo, el idioma).</li>
      </ul>

      <h2>3. Gestión del consentimiento</h2>
      <p>
        Puedes aceptar o rechazar las cookies no esenciales y cambiar tu elección en
        cualquier momento. También puedes configurar tu navegador para bloquear o eliminar cookies.
      </p>

      <h2>4. Cookies de terceros</h2>
      <p>
        Algunos servicios externos (por ejemplo, herramientas de analítica) pueden instalar
        sus propias cookies. Te recomendamos consultar sus respectivas políticas.
      </p>

      <h2>5. Contacto</h2>
      <p>
        Para cualquier duda sobre esta política puedes escribir a{' '}
        <a href="mailto:inbox@automatizawpp.com">inbox@automatizawpp.com</a>.
      </p>
    </LegalShell>
  );
}
