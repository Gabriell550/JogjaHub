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

export type CustomerPhotoData = Omit<ServicePhotoLike, 'url'> & { url?: string };

function customerPhotoUrl(source?: string): string {
  const value = source?.trim();
  if (!value) return '';
  const storage = /^https?:\/\/(\[[^\]]+\]|[^:/]+)(?::\d+)?\/storage\/(.+)$/i.exec(value);
  const localHost = /^(?:localhost|0\.0\.0\.0|\[::1\]|(?:127|10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.[\d.]+|[^.]+\.local)$/i;
  if (storage && localHost.test(storage[1])) return STORAGE_BASE_URL + storage[2];
  if (/^https?:\/\/[^/]+/i.test(value)) return value;
  if (value.includes('://') || value.startsWith('//')) return '';
  return STORAGE_BASE_URL + value.replace(/^\/+/, '').replace(/^storage\//, '');
}

export function customerPhotoUrls(photos: CustomerPhotoData[] = [], logo?: string): string[] {
  const urls = [...photos]
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(photo => customerPhotoUrl(photo.full_url) || customerPhotoUrl(photo.url));
  return [...new Set([...urls, customerPhotoUrl(logo)].filter(Boolean))];
}
