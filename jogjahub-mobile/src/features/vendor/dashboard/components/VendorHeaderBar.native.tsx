import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantColors, tenantLayout } from '../../../../constants/theme/tenant';
import { TenantPressable } from '../../components/TenantPressable';

type Props = {
  businessName: string;
  isOpen: boolean;
  onToggleOpen: () => void;
};

export function VendorHeaderBar({ businessName, isOpen, onToggleOpen }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const stacked = width - left - right < tenantLayout.narrowWidth || fontScale > tenantLayout.largeFontScale;

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logoBox} aria-hidden>
          <Text allowFontScaling={false} style={styles.logoText}>JH</Text>
        </View>
        <Text style={styles.brandTitle}>JogjaHub</Text>
      </View>
      <Text style={styles.greeting}>Selamat Datang,</Text>
      <View style={[styles.nameRow, stacked && styles.nameStack]}>
        <Text accessibilityRole="header" style={styles.businessName}>{businessName}</Text>
        <TenantPressable
          accessibilityRole="switch"
          accessibilityLabel="Status toko"
          accessibilityState={{ checked: isOpen }}
          onPress={onToggleOpen}
          onDark={!isOpen}
          focusRadius={radius.full}
          style={[styles.status, !stacked && styles.statusInline, isOpen ? styles.open : styles.closed]}
        >
          <Text style={[styles.statusText, isOpen && styles.openText]}>
            {isOpen ? 'Toko Buka' : 'Toko Tutup'}
          </Text>
        </TenantPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: spacing.stackMd },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  logoBox: {
    width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { ...typography.labelMd, color: colors.onPrimaryContainer },
  brandTitle: { ...typography.headlineSm, color: colors.onNavy, flexShrink: 1 },
  greeting: { ...typography.bodySm, color: colors.navySub, marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm },
  nameStack: { flexDirection: 'column', alignItems: 'flex-start' },
  businessName: { ...typography.headlineLgMobile, color: colors.onNavy, flexShrink: 1 },
  status: {
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', maxWidth: '100%',
  },
  statusInline: { marginLeft: 'auto', maxWidth: '50%' },
  open: { backgroundColor: colors.accentGreenContainer },
  closed: { backgroundColor: tenantColors.translucentWhite },
  statusText: { ...typography.labelMd, color: colors.onNavy, textAlign: 'center' },
  openText: { color: tenantColors.onPositive },
});
