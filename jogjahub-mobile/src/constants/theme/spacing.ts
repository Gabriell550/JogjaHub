// 1rem dikonversi ke 16px (standar web), dipakai konsisten sebagai basis px di RN.
export const spacing = {
  containerMargin: 20, // 1.25rem
  gutter: 16,           // 1rem
  stackSm: 8,           // 0.5rem
  stackMd: 16,          // 1rem
  stackLg: 24,          // 1.5rem
  sectionGap: 40,        // 2.5rem
} as const;

export const radius = {
  sm: 4,    // 0.25rem
  DEFAULT: 8, // 0.5rem
  md: 12,   // 0.75rem
  lg: 16,   // 1rem
  xl: 24,   // 1.5rem
  full: 9999,
} as const;
