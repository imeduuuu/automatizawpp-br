export default function PublicLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #000)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Skeleton navbar */}
      <header style={{
        height: 64,
        borderBottom: '1px solid rgba(0,255,65,0.15)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
      }}>
        <div style={{
          width: 140,
          height: 20,
          background: 'rgba(0,255,65,0.08)',
          borderRadius: 4,
        }} />
      </header>
      {/* Skeleton content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: '4rem 1.5rem',
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(0,255,65,0.3)',
          borderTopColor: '#00FF41',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    </div>
  );
}
