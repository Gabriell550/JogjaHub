export interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  priceFrom: number; // dalam rupiah
  rating: number;
  imageUrl: string;
  isFavorite?: boolean;
}

export const verifiedVendors: Vendor[] = [
  {
    id: '1',
    name: 'GlowUp MUA Jogja',
    category: 'BEAUTY & STYLE',
    location: 'Sleman, DIY',
    priceFrom: 350000,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  },
  {
    id: '2',
    name: 'Grand Aston Hotel',
    category: 'ACCOMMODATION',
    location: 'Depok, Sleman',
    priceFrom: 850000,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
  },
  {
    id: '3',
    name: 'Kado Wisuda Studio',
    category: 'GIFTING',
    location: 'Kotabaru, Jogja',
    priceFrom: 150000,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400',
  },
];
