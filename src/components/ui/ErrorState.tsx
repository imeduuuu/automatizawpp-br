export function ErrorState({
  title = 'Erro ao carregar',
  message = 'Tente novamente mais tarde',
  retry?: () => void
}: {
  title?: string
  message?: string
  retry?: () => void
}) {
  return (
    <div className="error-state">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="text-sm px-3 py-1 rounded border border-current hover:bg-red-500/10"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
