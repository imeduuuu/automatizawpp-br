export type WebsiteServiceDefinition = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  publicCategory: 'automation' | 'conversion' | 'intelligence' | 'reporting';
  icon: string;
  sortOrder: number;
  deliverySteps: string[];
};

// Source detected from current public website:
// - src/components/Features.tsx
// - src/components/Pricing.tsx
export const WEBSITE_SERVICES: WebsiteServiceDefinition[] = [
  {
    slug: 'respuestas-instantaneas-24-7',
    name: 'Respuestas instantaneas 24/7',
    shortDescription: 'Tu WhatsApp responde en segundos, incluso fuera de horario.',
    longDescription:
      'Automatiza respuestas de primer contacto, FAQs y mensajes recurrentes para no perder oportunidades cuando tu equipo no esta disponible.',
    publicCategory: 'automation',
    icon: '⚡',
    sortOrder: 1,
    deliverySteps: ['Activacion del canal', 'Configuracion de intents base', 'Validacion en entorno real']
  },
  {
    slug: 'confirmacion-automatica-de-citas',
    name: 'Confirmacion automatica de citas',
    shortDescription: 'Confirma, recuerda y gestiona cambios de cita automaticamente.',
    longDescription:
      'Reduce no-shows y llamadas manuales con mensajes de confirmacion, recordatorios y politicas de reprogramacion desde un flujo unificado.',
    publicCategory: 'automation',
    icon: '📅',
    sortOrder: 2,
    deliverySteps: ['Definicion de agenda y reglas', 'Plantillas de confirmacion', 'Test de recordatorios']
  },
  {
    slug: 'seguimiento-de-leads',
    name: 'Seguimiento de leads',
    shortDescription: 'Secuencias automaticas para recuperar interesados que no cerraron.',
    longDescription:
      'Activa secuencias de seguimiento multitoque en 7 dias para recuperar conversaciones enfriadas y mejorar conversion sin perseguir manualmente.',
    publicCategory: 'conversion',
    icon: '🎯',
    sortOrder: 3,
    deliverySteps: ['Segmentacion de leads', 'Activacion de secuencia', 'Revision de conversion por etapa']
  },
  {
    slug: 'recuperacion-de-clientes',
    name: 'Recuperacion de clientes',
    shortDescription: 'Reactivacion automatizada de clientes inactivos con mensajes personalizados.',
    longDescription:
      'Detecta inactividad y lanza campañas de reactivacion con oferta o recordatorio oportuno, manteniendo la conversacion alineada con tu marca.',
    publicCategory: 'conversion',
    icon: '🔄',
    sortOrder: 4,
    deliverySteps: ['Deteccion de inactividad', 'Estrategia de reactivacion', 'Medicion de retorno']
  },
  {
    slug: 'ia-conversacional-avanzada',
    name: 'IA conversacional avanzada',
    shortDescription: 'IA que entiende contexto real y responde de forma natural.',
    longDescription:
      'Motor conversacional con memoria de contexto, tono adaptable y respuestas de precision para manejar casos complejos sin friccion.',
    publicCategory: 'intelligence',
    icon: '🧠',
    sortOrder: 5,
    deliverySteps: ['Ajuste de personalidad', 'Entrenamiento de conocimiento', 'Control de calidad conversacional']
  },
  {
    slug: 'informe-mensual-de-resultados',
    name: 'Informe mensual de resultados',
    shortDescription: 'KPIs de leads, conversion y recuperacion en un resumen accionable.',
    longDescription:
      'Reportes mensuales para entender rendimiento de conversaciones, oportunidades recuperadas y mejora operativa por servicio activo.',
    publicCategory: 'reporting',
    icon: '📊',
    sortOrder: 6,
    deliverySteps: ['Consolidacion de datos', 'Analisis de tendencias', 'Plan de acciones del mes siguiente']
  }
];

export const WEBSITE_PLANS = [
  {
    slug: 'basico',
    name: 'Basico',
    monthlyPrice: 297,
    services: ['respuestas-instantaneas-24-7', 'confirmacion-automatica-de-citas']
  },
  {
    slug: 'profesional',
    name: 'Profesional',
    monthlyPrice: 497,
    services: [
      'respuestas-instantaneas-24-7',
      'confirmacion-automatica-de-citas',
      'seguimiento-de-leads',
      'recuperacion-de-clientes',
      'informe-mensual-de-resultados'
    ]
  },
  {
    slug: 'premium',
    name: 'Premium',
    monthlyPrice: 797,
    services: WEBSITE_SERVICES.map((service) => service.slug)
  }
] as const;

export const WEBSITE_SERVICE_SLUGS = WEBSITE_SERVICES.map((service) => service.slug);

export const SCALE_BUNDLE_SERVICE_SLUGS = [
  'alex-supervisor',
  'email-scrapper',
  'google-reviews',
  'icebreaker'
] as const;

export type ScaleBundleServiceSlug = (typeof SCALE_BUNDLE_SERVICE_SLUGS)[number];

export const SCALE_BUNDLE_SERVICES: WebsiteServiceDefinition[] = [
  {
    slug: 'alex-supervisor',
    name: 'ALEX Supervisor',
    shortDescription: 'IA supervisora del bundle Scale: monitoriza, recomienda y reporta.',
    longDescription:
      'ALEX vigila el rendimiento de Email Scrapper, Google Reviews e Icebreaker, detecta cuellos de botella y entrega un reporte semanal accionable.',
    publicCategory: 'intelligence',
    icon: '🧭',
    sortOrder: 10,
    deliverySteps: ['Conexion al bundle Scale', 'Calibracion de KPIs', 'Reporte semanal automatico']
  },
  {
    slug: 'email-scrapper',
    name: 'Email Scrapper',
    shortDescription: 'Captura y valida correos B2B desde dominios objetivo.',
    longDescription:
      'Procesa dominios y devuelve emails verificados con tasa de validacion y coste por lead, listos para campañas de outreach.',
    publicCategory: 'automation',
    icon: '📨',
    sortOrder: 11,
    deliverySteps: ['Definicion de dominios', 'Scrapping y validacion', 'Entrega de leads cualificados']
  },
  {
    slug: 'google-reviews',
    name: 'Google Reviews',
    shortDescription: 'Sincroniza reseñas de Google y responde con tono de marca.',
    longDescription:
      'Detecta reseñas nuevas, genera respuestas alineadas con tu marca y mide la variacion de rating en el periodo.',
    publicCategory: 'reporting',
    icon: '⭐',
    sortOrder: 12,
    deliverySteps: ['Conexion al perfil Google', 'Plantillas de respuesta', 'Medicion de impacto en rating']
  },
  {
    slug: 'icebreaker',
    name: 'Icebreaker',
    shortDescription: 'Outreach personalizado a prospectos con mensajes generados por IA.',
    longDescription:
      'Genera y lanza mensajes de primer contacto por email o LinkedIn, midiendo respuesta, conversiones e ingresos atribuidos.',
    publicCategory: 'conversion',
    icon: '🧊',
    sortOrder: 13,
    deliverySteps: ['Definicion del ICP', 'Generacion de copy por prospecto', 'Lanzamiento y medicion']
  }
];
