import React, { useId, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Eye, EyeOff, ArrowDown, Clock, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, radius, typography } from '../../../../constants/theme';
import { tenantLayout } from '../../../../constants/theme/tenant';
import { TenantPressable } from '../../components/TenantPressable';

type Props = {
  balance: number;
  nativeLayout?: boolean;
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
  const gradientId = `saldo-bg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const actions = [
    { label: 'Tarik', Icon: ArrowDown, onPress: onTarik },
    { label: 'Riwayat', Icon: Clock, onPress: onRiwayat },
    { label: 'Pesanan', Icon: Package, onPress: onPesanan },
  ];

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#E65100" />
              <Stop offset="50%" stopColor="#F4511E" />
              <Stop offset="100%" stopColor="#BF360C" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
          <Circle cx="92%" cy="10%" r="88" stroke="rgba(255,255,255,0.10)" strokeWidth="18" fill="none" />
          <Circle cx="94%" cy="95%" r="118" stroke="rgba(255,255,255,0.07)" strokeWidth="24" fill="none" />
        </Svg>

        <View style={styles.summary}>
          <Text accessibilityRole="header" style={styles.label}>ESTIMASI PENDAPATAN</Text>
        </View>

        <View style={styles.amountRow}>
          <Text
            accessibilityLabel={hidden ? hiddenLabel : undefined}
            style={[styles.amount, compact && styles.compactAmount]}
          >
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
            <View aria-hidden>
              <VisibilityIcon size={20} color="rgba(254, 215, 170, 0.9)" />
            </View>
          </TenantPressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.actions}>
          {actions.map(({ label, Icon, onPress }) => (
            <TenantPressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={onPress}
              onDark
              style={styles.action}
            >
              <View aria-hidden style={styles.actionIcon}>
                <Icon size={20} color={colors.onPrimary} strokeWidth={2.2} />
              </View>
              <Text style={styles.actionLabel}>{label}</Text>
            </TenantPressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 28,
    backgroundColor: '#E65100',
    elevation: 8,
    shadowColor: '#C2410C',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: 'rgba(255, 237, 213, 0.92)',
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  amount: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 34,
    fontWeight: '700',
    color: colors.onPrimary,
    letterSpacing: -0.5,
  },
  compactAmount: {
    fontSize: 28,
    lineHeight: 34,
  },
  eye: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
    textAlign: 'center',
  },
});
