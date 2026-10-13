import { API_BASE_URL } from '../constants/config';

export type ServicePhotoLike = {
  url: string;
  full_url?: string;
  is_primary: boolean;
  sort_order?: number;
};
export type ServiceWithPhotos = { photos?: ServicePhotoLike[] };

// Dipakai bareng oleh ListingScreen & dashboard (MyServicesSection) — supaya cara bangun
// URL foto layanan tidak ditulis dua kali di dua tempat berbeda.
export const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/storage/';

export function getPrimaryPhotoUrl(item: ServiceWithPhotos): string | null {
  if (!item.photos || item.photos.length === 0) return null;
  const primary = item.photos.find((p) => p.is_primary) ?? item.photos[0];
  const url = primary.full_url ?? primary.url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${STORAGE_BASE_URL}${url.replace(/^\/+/, '')}`;
}
