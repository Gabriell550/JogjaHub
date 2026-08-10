// Font family di sini HARUS sama persis dengan nama font yang di-link di project
// (lihat langkah "link font" di penjelasan). Kalau nama beda, RN diam-diam fallback ke font default.
export const typography = {
  headlineXl: {
    fontFamily: 'Lexend-Bold',
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.02 * 32, // -0.02em dikonversi relatif ke fontSize
  },
  headlineLg: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.01 * 24,
  },
  headlineLgMobile: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  titleMd: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.05 * 12,
  },
  button: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
} as const;
