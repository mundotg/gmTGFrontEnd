import { useState, useEffect } from "react";

export type PaginationData<T> = {
  results: T[];
  page: number;
  total: number;
};

export function usePagination<T>(
  fetchFunction: (page: number) => Promise<PaginationData<T>>,
  itemsPerPage = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [execute, setExecute] = useState(false)

  const totalPages = Math.ceil(total / itemsPerPage);

  useEffect(() => {
    setLoading(true);
    fetchFunction(page)
      .then((res) => {
        setData(res.results);
        setTotal(res.total);
      })
      .catch((err) => {
        console.error("Erro ao carregar página:", err);
      })
      .finally(() => setLoading(false));
  }, [page, execute]);

  const goToNext = () => setPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrev = () => setPage((prev) => Math.max(prev - 1, 1));

  return {
    setData,
    data,
    page,
    totalPages,
    loading,
    goToNext,
    goToPrev,
    setPage,
    setExecute
  };
}


