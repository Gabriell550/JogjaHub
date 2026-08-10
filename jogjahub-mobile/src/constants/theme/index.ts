// Titik akses tunggal untuk seluruh design token.
// Cara pakai di komponen: import { theme } from '@constants/theme';  ->  theme.colors.primary
export { colors } from './colors';
export { typography } from './typography';
export { spacing, radius } from './spacing';

import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';

export const theme = { colors, typography, spacing, radius };
