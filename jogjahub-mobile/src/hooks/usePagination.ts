import { useState } from 'react';

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const nextPage = () => setPage((p) => p + 1);
  const resetPage = () => setPage(initialPage);
  return { page, nextPage, resetPage };
}
