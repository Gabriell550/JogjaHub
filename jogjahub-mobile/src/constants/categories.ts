// Daftar kategori statis fallback (sumber utama tetap dari categoryApi.getCategories()).
export const MAIN_CATEGORIES = ['beauty_and_style', 'hotel', 'gifting'] as const;


export const VENDOR_CATEGORIES = [
  { id: 'salon_mua', label: 'Salon & MUA' },
  { id: 'butik_wisuda', label: 'Butik Busana Wisuda' },
  { id: 'penginapan', label: 'Penginapan' },
  { id: 'selempang_plakat', label: 'Selempang & Plakat' },
  { id: 'akrilik', label: 'Akrilik' },
  { id: 'florist', label: 'Florist' },
] as const;
