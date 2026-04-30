export default function GlobalLoading() {
  return (
    <div className="ds-auth-wrap">
      <div className="ds-auth-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        <div className="ds-spinner" aria-label="loading" />
      </div>
    </div>
  );
}
