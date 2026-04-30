export type SentinelReviewType = {
  source: string;
  title: string;
  description: string;
};

export const SENTINEL_REVIEW_TYPES: SentinelReviewType[] = [
  {
    source: 'panel',
    title: 'Panel y autenticacion',
    description: 'Revisa rutas privadas, login admin, recuperacion de contrasena y APIs clave del panel para detectar 404, HTML incorrecto o redirecciones rotas.'
  },
  {
    source: 'n8n',
    title: 'Automatizaciones n8n',
    description: 'Comprueba workflows caidos, ejecuciones fallidas y automatizaciones desactivadas que bloqueen operaciones del producto.'
  },
  {
    source: 'vapi',
    title: 'Llamadas Alex / Vapi',
    description: 'Vigila assistants, llamadas, configuraciones y errores de la capa de voz para detectar fallos en Alex IA.'
  },
  {
    source: 'brevo',
    title: 'Email y comunicacion',
    description: 'Revisa problemas de envio, entregabilidad y estado del canal de correo transaccional y de comunicacion.'
  },
  {
    source: 'stripe',
    title: 'Pagos y suscripciones',
    description: 'Detecta fallos recientes de cobro y eventos de pago fallido que afecten al acceso o continuidad del servicio.'
  },
  {
    source: 'webhook',
    title: 'Webhooks y endpoints internos',
    description: 'Valida endpoints internos y webhooks esenciales para encontrar caidas de rutas, respuestas 5xx o integraciones rotas.'
  }
];
