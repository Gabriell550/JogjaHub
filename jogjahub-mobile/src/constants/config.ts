// Physical devices need the backend computer's LAN IP in the local .env file.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://10.0.2.2:8000/api/v1';
export const MAPS_API_KEY = 'your_google_or_leaflet_maps_key';