import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantColors } from '../../../../constants/theme/tenant';

export const dashboardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: tenantColors.border,
  },
  headingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.stackSm,
  },
  heading: { ...typography.titleMd, color: colors.onSurface, flexShrink: 1 },
  sample: { ...typography.bodySm, color: colors.onSurfaceVariant },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, maxWidth: '100%' },
  linkText: { ...typography.labelMd, color: colors.primary, flexShrink: 1 },
});
