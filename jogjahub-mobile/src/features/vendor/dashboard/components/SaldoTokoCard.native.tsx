import React, { useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Eye, EyeOff, ArrowDownToLine, History, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantColors, tenantLayout } from '../../../../constants/theme/tenant';
import { TenantPressable } from '../../components/TenantPressable';

type Props = {
  balance: number;
  onTarik?: () => void;
  onRiwayat?: () => void;
  onPesanan?: () => void;
};

const hiddenLabel = 'Estimasi pendapatan disembunyikan';

export function SaldoTokoCard({ balance, onTarik, onRiwayat, onPesanan }: Props) {
  const [hidden, setHidden] = useState(false);
  const { width } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const compact = width - left - right < tenantLayout.narrowWidth;
  const VisibilityIcon = hidden ? EyeOff : Eye;
  const actions = [
    { label: 'Tarik', Icon: ArrowDownToLine, onPress: onTarik },
    { label: 'Riwayat', Icon: History, onPress: onRiwayat },
    { label: 'Pesanan', Icon: Package, onPress: onPesanan },
  ];

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        <View style={styles.summary}>
          <Text accessibilityRole="header" style={styles.label}>Estimasi Pendapatan</Text>
          <Text style={styles.sample}>Data contoh</Text>
        </View>
        <View style={styles.amountRow}>
          <Text accessibilityLabel={hidden ? hiddenLabel : undefined} style={[styles.amount, compact && styles.compactAmount]}>
            {hidden ? '••••••••' : `Rp${balance.toLocaleString('id-ID')}`}
          </Text>
          <TenantPressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan estimasi pendapatan' : 'Sembunyikan estimasi pendapatan'}
            onPress={() => {
              setHidden(!hidden);
              if (!hidden) AccessibilityInfo.announceForAccessibility(hiddenLabel);
            }}
            style={styles.eye}
            onDark
          >
            <View aria-hidden><VisibilityIcon size={20} color={colors.onPrimary} /></View>
          </TenantPressable>
        </View>
        <View style={styles.actions}>
          {actions.map(({ label, Icon, onPress }) => (
            <TenantPressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ disabled: !onPress }}
              accessibilityLabel={label}
              disabled={!onPress}
              onPress={onPress}
              onDark
              style={styles.action}
            >
              <View aria-hidden style={[styles.actionIcon, onPress && styles.activeIcon]}>
                <Icon size={20} color={onPress ? colors.onPrimary : colors.primaryFixed} />
              </View>
              <Text style={[styles.actionLabel, !onPress && styles.sample]}>{label}</Text>
            </TenantPressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.xl, backgroundColor: colors.primary, elevation: 2,
    shadowColor: colors.onSurface, shadowOpacity: 0.14, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  card: {
    backgroundColor: colors.primary, borderRadius: radius.xl, overflow: 'hidden',
    padding: spacing.stackMd, gap: 8,
  },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  label: { ...typography.labelMd, color: colors.onPrimary, flexShrink: 1 },
  sample: { ...typography.bodySm, color: colors.primaryFixed, flexShrink: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { ...typography.headlineXl, color: colors.onPrimary, flexShrink: 1 },
  compactAmount: { fontSize: 28, lineHeight: 36 },
  eye: { alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
  actionIcon: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: tenantColors.translucentWhite,
    alignItems: 'center', justifyContent: 'center',
  },
  activeIcon: { backgroundColor: tenantColors.heroAction },
  actionLabel: { ...typography.labelMd, color: colors.onPrimary, textAlign: 'center' },
});
