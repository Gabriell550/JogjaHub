import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowDown, History } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  balance: number;
  onTarik?: () => void;
  onRiwayat?: () => void;
};

const formatRupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export function SaldoTokoCard({ balance, onTarik, onRiwayat }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Kiri: info saldo */}
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            <ArrowDown size={20} color={colors.onPrimary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Saldo Toko</Text>
            <Text style={styles.amount}>{formatRupiah(balance)}</Text>
          </View>
        </View>

        {/* Kanan: 2 pill button */}
        <View style={styles.rightContent}>
          <Pressable style={styles.pillButton} onPress={onTarik}>
            <View style={[styles.pill, styles.pillOrange]}>
              <ArrowDown size={18} color={colors.onPrimary} />
            </View>
            <Text style={styles.pillLabel}>Tarik</Text>
          </Pressable>
          <Pressable style={styles.pillButton} onPress={onRiwayat}>
            <View style={[styles.pill, styles.pillGray]}>
              <History size={18} color={colors.onSurfaceVariant} />
            </View>
            <Text style={[styles.pillLabel, { color: colors.onSurfaceVariant }]}>
              Riwayat
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  amount: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
  },
  rightContent: {
    flexDirection: 'row',
    gap: 16,
  },
  pillButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  pill: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pillOrange: {
    backgroundColor: colors.orangePale,
  },
  pillGray: {
    backgroundColor: colors.grayPale,
  },
  pillLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: colors.onSurface,
  },
});
