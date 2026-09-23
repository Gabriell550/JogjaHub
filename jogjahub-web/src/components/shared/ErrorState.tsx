interface ErrorStateProps {
  title: string;
  message?: string;
}

export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h3 className="text-lg font-semibold text-red-700">{title}</h3>
      {message ? <p className="mt-2 text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
