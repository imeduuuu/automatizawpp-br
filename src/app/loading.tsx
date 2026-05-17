// Loading root intencionalmente vacío — cada sección usa su propio loading state
// (public) → src/app/(public)/loading.tsx (spinner verde)
// admin/auth → componentes individuales via ds-spinner en useApi
export default function GlobalLoading() {
  return null;
}
