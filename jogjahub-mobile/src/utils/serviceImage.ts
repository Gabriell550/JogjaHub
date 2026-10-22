import { API_BASE_URL } from '../constants/config';

export type ServicePhotoLike = {
  url: string;
  full_url?: string;
  is_primary?: boolean;
  sort_order?: number;
};
export type ServiceWithPhotos = { photos?: ServicePhotoLike[] };

// Dipakai bareng oleh ListingScreen & dashboard (MyServicesSection) — supaya cara bangun
// URL foto layanan tidak ditulis dua kali di dua tempat berbeda.
export const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/storage/';

export function getStoragePath(photo: ServicePhotoLike): string {
  const source = photo.url || photo.full_url || '';
  const storageMarker = '/storage/';
  const storageIndex = source.indexOf(storageMarker);
  const path = storageIndex >= 0
    ? source.slice(storageIndex + storageMarker.length)
    : source.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '');

  return path.split(/[?#]/, 1)[0].replace(/^\/+/, '');
}

export function getPhotoUrl(photo: ServicePhotoLike): string {
  const path = getStoragePath(photo);
  return path ? `${STORAGE_BASE_URL}${path}` : '';
}

export function getPrimaryPhotoUrl(item: ServiceWithPhotos): string | null {
  if (!item.photos || item.photos.length === 0) return null;
  const primary = item.photos.find((photo) => photo.is_primary) ?? item.photos[0];
  return getPhotoUrl(primary) || null;
}
