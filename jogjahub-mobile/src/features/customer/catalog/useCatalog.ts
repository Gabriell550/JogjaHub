import { useEffect, useState } from 'react';
import { customerPhotoUrls, type CustomerPhotoData } from '../../../utils/serviceImage';
import { vendorApi } from '../../../api/vendorApi';

export interface PublicService {
  id: number;
  name: string;
  price: number | string;
  price_type: 'per_session' | 'per_night';
  is_accommodation?: boolean;
  photos?: CustomerPhotoData[];
  description?: string | null;
  reviews_avg_rating?: number | string | null;
  reviews_count?: number;
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
  imageUrls: string[];
  category: string;
  location: string;
  priceFrom: number;
  perNight: boolean;
  rating?: number;
}

export type CatalogSort = 'popular' | 'rating' | 'nearby';
export type CatalogCoordinates = { latitude: number; longitude: number };

interface ServicePage {
  data: PublicService[];
  last_page?: number;
}

interface ServiceListResponse {
  data: PublicService[] | ServicePage;
  meta?: { last_page: number };
}

export function useCatalog(categoryId?: number, query = '', hotelsOnly = false, sort?: CatalogSort, coordinates?: CatalogCoordinates, subcategoryId?: number) {
  const [cards, setCards] = useState<CatalogCard[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { latitude, longitude } = coordinates ?? {};
  const key = JSON.stringify([categoryId, subcategoryId, query.trim(), hotelsOnly, sort, latitude, longitude]);
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
          subcategory_id: subcategoryId,
          q: query.trim() || undefined,
          accommodation: hotelsOnly ? true : undefined,
          page: requestedPage,
          sort,
          latitude,
          longitude,
        });
        if (!active) return;
        const response: ServiceListResponse = data;
        const result = response.data;
        const services = Array.isArray(result) ? result : result.data;
        const next = services.map((service): CatalogCard => ({
          id: String(service.id),
          uuid: service.tenant.uuid,
          name: service.tenant.business_name,
          serviceName: service.name,
          imageUrls: customerPhotoUrls(service.photos, service.tenant.logo_url),
          category: service.subcategory?.name ?? '',
          location: service.tenant.address?.city ?? '',
          priceFrom: Number(service.price),
          perNight: service.price_type === 'per_night',
          rating: service.reviews_avg_rating == null ? undefined : Number(service.reviews_avg_rating),
        }));
        setCards(previous => Array.from(new Map((requestedPage === 1 ? next : [...previous, ...next]).map(card => [card.id, card])).values()));
        setLastPage(response.meta?.last_page ?? (Array.isArray(result) ? undefined : result.last_page) ?? 1);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [attempt, categoryId, hotelsOnly, key, latitude, loadedKey, longitude, page, query, sort, subcategoryId]);

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
