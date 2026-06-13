import type { Metadata } from 'next';
import LegalShell from '@/components/landing/LegalShell';

export const metadata: Metadata = {
  title: 'Política de Privacidad — AutomatizaWPP',
  description: 'Cómo AutomatizaWPP trata y protege tus datos personales conforme al RGPD y la LOPDGDD.',
  alternates: { canonical: 'https://www.automatizawpp.com/privacidad' },
  robots: 'index, follow',
};

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de Privacidad" updated="13 de junio de 2026">
      <p className="lp-legal-note">
        Este documento es una base conforme al Reglamento (UE) 2016/679 (RGPD) y la
        Ley Orgánica 3/2018 (LOPDGDD). Revísalo y adáptalo con asesoría legal antes de su publicación definitiva.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos es AutomatizaWPP. Para cualquier
        cuestión relacionada con la protección de datos puedes escribir a{' '}
        <a href="mailto:inbox@automatizawpp.com">inbox@automatizawpp.com</a>.
      </p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>Datos de contacto que nos facilitas (nombre, email, teléfono, empresa).</li>
        <li>Contenido de las conversaciones gestionadas a través de WhatsApp y otros canales.</li>
        <li>Datos de uso y técnicos (navegación, dispositivo, dirección IP).</li>
      </ul>

      <h2>3. Finalidades y base jurídica</h2>
      <ul>
        <li>Prestar el servicio y atender tus solicitudes (ejecución de un contrato).</li>
        <li>Responder a tu solicitud de diagnóstico o prueba (consentimiento).</li>
        <li>Mejorar el servicio y nuestra seguridad (interés legítimo).</li>
        <li>Cumplir obligaciones legales (obligación legal).</li>
      </ul>

      <h2>4. Conservación</h2>
      <p>
        Conservamos los datos mientras dure la relación y, después, durante los plazos
        legalmente exigibles. Cuando dejan de ser necesarios, los eliminamos o anonimizamos.
      </p>

      <h2>5. Destinatarios</h2>
      <p>
        No vendemos tus datos. Podemos compartirlos con proveedores que nos prestan
        servicios (alojamiento, mensajería, analítica) actuando como encargados del
        tratamiento, con las garantías exigidas por el RGPD.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición,
        limitación y portabilidad escribiendo a{' '}
        <a href="mailto:inbox@automatizawpp.com">inbox@automatizawpp.com</a>. También
        puedes reclamar ante la Agencia Española de Protección de Datos (AEPD).
      </p>

      <h2>7. Cambios</h2>
      <p>
        Podemos actualizar esta política. Publicaremos cualquier cambio en esta misma página
        indicando la fecha de la última actualización.
      </p>
    </LegalShell>
  );
}
