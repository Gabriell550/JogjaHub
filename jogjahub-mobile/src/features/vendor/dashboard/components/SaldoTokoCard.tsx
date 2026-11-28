import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Eye, EyeOff, Package, History, Download } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

import { tenantColors, tenantLayout } from '../../../../constants/theme/tenant';

type Props = {
  nativeLayout?: boolean;
  balance: number;
  onPesanan?: () => void;
};

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

// Kartu hero oranye — beda dari kartu putih lain di dashboard, sengaja paling menonjol
// karena ini angka yang paling sering dicek vendor tiap buka app.
export function SaldoTokoCard({ balance, onPesanan, nativeLayout = false }: Props) {
  const [hidden, setHidden] = useState(false);

  const { width } = useWindowDimensions();
  const foreground = colors.onPrimary;

  return (
    <View style={[styles.card, nativeLayout && styles.nativeCard]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, nativeLayout && styles.nativeLabel]}>ESTIMASI PENDAPATAN</Text>
      </View>

      <View style={styles.amountRow}>
        <Text accessibilityLabel={hidden ? 'Nominal disembunyikan' : undefined} style={[styles.amount, { color: foreground }, nativeLayout && width >= tenantLayout.narrowWidth && styles.largeAmount]}>{hidden ? '••••••••' : formatRupiah(balance)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'} style={styles.visibility} onPress={() => setHidden((v) => !v)}>
          {hidden ? <EyeOff size={18} color={foreground} /> : <Eye size={18} color={foreground} />}
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        {[{ label: 'Tarik', Icon: Download }, { label: 'Riwayat', Icon: History }].map(({ label, Icon }) => (
          <View key={label} accessible accessibilityRole="button" style={styles.actionItem}>
            <View style={styles.actionIcon}><Icon size={20} color={colors.onPrimary} /></View>
            <Text style={[styles.actionLabel, { color: foreground }]}>{label}</Text>
          </View>
        ))}
        <Pressable accessibilityRole="button" style={styles.actionItem} onPress={onPesanan}>
          <View style={styles.actionIcon}>
            <Package size={20} color={foreground} />
          </View>
          <Text style={[styles.actionLabel, { color: foreground }]}>Pesanan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FF5E00', borderRadius: radius.xl, padding: spacing.stackLg, marginBottom: 20 },
  nativeCard: { backgroundColor: '#FF5E00', padding: 18, marginBottom: 0, elevation: 4 },
  nativeLabel: { ...typography.labelSm, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.8 },
  visibility: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  largeAmount: { fontSize: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: typography.labelSm.fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: 'rgba(255,255,255,0.85)' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: spacing.stackLg },
  amount: { flex: 1, fontFamily: typography.headlineXl.fontFamily, fontSize: 30, fontWeight: '800', color: colors.onPrimary },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionItem: { flex: 1, minHeight: 48, alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 48, height: 48, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '600', color: colors.onPrimary },
});
