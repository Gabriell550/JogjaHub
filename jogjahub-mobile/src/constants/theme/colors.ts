// Diambil langsung dari DESIGN.md. Jangan hardcode warna hex di screen/komponen lain —
// selalu import dari sini supaya kalau tema berubah, cukup edit satu file ini.
export const colors = {
  surface: '#f8f9ff',
  surfaceDim: '#d0dbed',
  surfaceBright: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e6eeff',
  surfaceContainerHigh: '#dee9fc',
  surfaceContainerHighest: '#d9e3f6',
  onSurface: '#121c2a',
  onSurfaceVariant: '#5a4136',
  inverseSurface: '#27313f',
  inverseOnSurface: '#eaf1ff',
  outline: '#8e7164',
  outlineVariant: '#e2bfb0',

  surfaceTint: '#a04100',
  primary: '#a04100',
  onPrimary: '#ffffff',
  primaryContainer: '#ff6b00', // "Bright Orange" — warna utama CTA sesuai DESIGN.md
  onPrimaryContainer: '#572000',
  inversePrimary: '#ffb693',

  secondary: '#526069',
  onSecondary: '#ffffff',
  secondaryContainer: '#d3e2ed', // "Light Blue" — background sekunder
  onSecondaryContainer: '#56656e',

  tertiary: '#0062a1',
  onTertiary: '#ffffff',
  tertiaryContainer: '#059eff',
  onTertiaryContainer: '#003357',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  primaryFixed: '#ffdbcc',
  primaryFixedDim: '#ffb693',
  onPrimaryFixed: '#351000',
  onPrimaryFixedVariant: '#7a3000',

  secondaryFixed: '#d6e5ef',
  secondaryFixedDim: '#bac9d3',
  onSecondaryFixed: '#0f1d25',
  onSecondaryFixedVariant: '#3b4951',

  tertiaryFixed: '#d0e4ff',
  tertiaryFixedDim: '#9ccaff',
  onTertiaryFixed: '#001d35',
  onTertiaryFixedVariant: '#00497b',

  background: '#f8f9ff',
  onBackground: '#121c2a',
  surfaceVariant: '#d9e3f6',

    accentGreen: '#2E7D32',
  accentGreenContainer: '#e3f3e6',
} as const;
