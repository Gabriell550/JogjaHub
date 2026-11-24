import { useEffect, useState } from 'react';
import { vendorApi } from '../../../api/vendorApi';

export interface PublicService {
  id: number;
  name: string;
  price: number | string;
  price_type: 'per_session' | 'per_night';
  is_accommodation?: boolean;
  photos?: { full_url: string; is_primary: boolean }[];
  subcategory?: { name: string; requires_time_slot: boolean };
  tenant: {
    uuid: string;
    business_name: string;
    logo_url?: string;
    address?: { city?: string };
  };
}

export interface CatalogCard {
  id: string;
  uuid: string;
  name: string;
  serviceName: string;
  imageUrl?: string;
  category: string;
  location: string;
  priceFrom: number;
  perNight: boolean;
}

export function useCatalog(categoryId?: number, query = '', hotelsOnly = false) {
  const [cards, setCards] = useState<CatalogCard[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([categoryId, query.trim(), hotelsOnly]);
  const [loadedKey, setLoadedKey] = useState(key);

  useEffect(() => {
    let active = true;
    const requestedPage = loadedKey === key ? page : 1;
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const { data } = await vendorApi.listServices({
          category_id: categoryId,
          q: query.trim() || undefined,
          accommodation: hotelsOnly ? true : undefined,
          page: requestedPage,
        });
        if (!active) return;
        const next = (data.data as PublicService[]).map((service): CatalogCard => ({
          id: String(service.id),
          uuid: service.tenant.uuid,
          name: service.tenant.business_name,
          serviceName: service.name,
          imageUrl: (service.photos?.find(photo => photo.is_primary) ?? service.photos?.[0])?.full_url || service.tenant.logo_url,
          category: service.subcategory?.name ?? '',
          location: service.tenant.address?.city ?? '',
          priceFrom: Number(service.price),
          perNight: service.price_type === 'per_night',
        }));
        setCards(previous => requestedPage === 1 ? next : [...previous, ...next]);
        setLastPage(data.meta.last_page);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [attempt, categoryId, hotelsOnly, key, loadedKey, page, query]);

  if (loadedKey !== key) {
    setLoadedKey(key);
    setPage(1);
    setLastPage(1);
    setCards([]);
    setLoading(true);
  }

  return {
    cards,
    loading,
    error,
    retry: () => setAttempt(value => value + 1),
    loadMore: !loading && !error && page < lastPage ? () => setPage(page + 1) : undefined,
  };
}
