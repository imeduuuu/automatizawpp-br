import type { Metadata } from 'next';
import LegalShell from '@/components/landing/LegalShell';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — AutomatizaWPP',
  description: 'Condiciones de uso del servicio de automatización de WhatsApp con IA de AutomatizaWPP.',
  alternates: { canonical: 'https://www.automatizawpp.com/terminos' },
  robots: 'index, follow',
};

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y Condiciones" updated="13 de junio de 2026">
      <p className="lp-legal-note">
        Este documento es una base general. Revísalo y adáptalo con asesoría legal antes de su publicación definitiva.
      </p>

      <h2>1. Objeto</h2>
      <p>
        Estas condiciones regulan el acceso y uso de los servicios de AutomatizaWPP, una
        plataforma de automatización de WhatsApp con inteligencia artificial para empresas.
      </p>

      <h2>2. Uso del servicio</h2>
      <ul>
        <li>Te comprometes a usar el servicio conforme a la ley y a estas condiciones.</li>
        <li>Eres responsable de la veracidad de los datos que facilitas y del contenido que envías.</li>
        <li>No está permitido el envío de comunicaciones no solicitadas (spam) ni usos ilícitos.</li>
      </ul>

      <h2>3. WhatsApp Business</h2>
      <p>
        El servicio se apoya en la API oficial de WhatsApp Business. Su uso está sujeto
        también a las políticas de Meta, que el cliente se compromete a cumplir.
      </p>

      <h2>4. Diagnóstico y prueba</h2>
      <p>
        El diagnóstico es gratuito y la prueba tiene una duración limitada (15 días) sin
        necesidad de tarjeta. Las condiciones concretas se detallan en cada propuesta.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        Prestamos el servicio con la máxima diligencia, pero no garantizamos resultados
        comerciales concretos. No respondemos de daños derivados de un uso indebido del servicio.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        La marca, el software y los contenidos de AutomatizaWPP son propiedad de sus
        titulares y no se ceden por el mero uso del servicio.
      </p>

      <h2>7. Legislación y fuero</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para cualquier controversia,
        las partes se someten a los juzgados y tribunales que correspondan conforme a la ley.
      </p>
    </LegalShell>
  );
}
