import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Eye, EyeOff, ArrowUpRight, ArrowDownToLine, History, Package } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  balance: number;
  onTarik?: () => void;
  onRiwayat?: () => void;
  onPesanan?: () => void;
  onPressDetail?: () => void; // panah kanan atas -> ke halaman Dompet
};

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

// Kartu hero oranye — beda dari kartu putih lain di dashboard, sengaja paling menonjol
// karena ini angka yang paling sering dicek vendor tiap buka app.
export function SaldoTokoCard({ balance, onTarik, onRiwayat, onPesanan, onPressDetail }: Props) {
  const [hidden, setHidden] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Saldo Toko</Text>
        <Pressable onPress={onPressDetail} hitSlop={8}>
          <ArrowUpRight size={18} color={colors.onPrimary} />
        </Pressable>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amount}>{hidden ? '••••••••' : formatRupiah(balance)}</Text>
        <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
          {hidden ? <EyeOff size={18} color={colors.onPrimary} /> : <Eye size={18} color={colors.onPrimary} />}
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionItem} onPress={onTarik}>
          <View style={styles.actionIcon}>
            <ArrowDownToLine size={18} color={colors.onPrimary} />
          </View>
          <Text style={styles.actionLabel}>Tarik</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={onRiwayat}>
          <View style={styles.actionIcon}>
            <History size={18} color={colors.onPrimary} />
          </View>
          <Text style={styles.actionLabel}>Riwayat</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={onPesanan}>
          <View style={styles.actionIcon}>
            <Package size={18} color={colors.onPrimary} />
          </View>
          <Text style={styles.actionLabel}>Pesanan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.primaryContainer, borderRadius: radius.xl, padding: spacing.stackLg,marginBottom:20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '600', color: colors.onPrimary },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: spacing.stackLg },
  amount: { fontFamily: typography.headlineXl.fontFamily, fontSize: 28, fontWeight: '700', color: colors.onPrimary },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionItem: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '600', color: colors.onPrimary },
});
