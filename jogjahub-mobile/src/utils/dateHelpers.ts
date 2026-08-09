export function formatDateID(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}
