import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  businessName: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onPressBell?: () => void;
  onPressAvatar?: () => void;
};

// Header gelap dashboard vendor: logo app + notifikasi + avatar di baris atas,
// sapaan + nama bisnis + status Buka/Tutup Toko di baris bawah.
// Status Buka/Tutup ini BUKAN dekorasi — menentukan apakah vendor masih bisa menerima booking baru.
// TODO: begitu vendorApi siap, ganti `isOpen` jadi field asli dari vendorApi.getMyProfile(),
// dan panggil vendorApi.updateMyProfile({ isOpen }) tiap kali di-toggle.
export function VendorHeaderBar({ businessName, isOpen, onToggleOpen, onPressBell, onPressAvatar }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>JH</Text>
          </View>
          <Text style={styles.brandTitle}>JogjaHub</Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.iconBtn} onPress={onPressBell} hitSlop={8}>
            <Bell size={18} color={colors.onNavy} />
            <View style={styles.notifDot} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onPressAvatar} hitSlop={8}>
            <User size={18} color={colors.onNavy} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.greetingLabel}>Selamat Datang,</Text>

      <View style={styles.nameRow}>
        <Text style={styles.businessName} numberOfLines={1}>{businessName} </Text>
        <Pressable style={[styles.statusPill, isOpen ? styles.statusOpen : styles.statusClosed]} onPress={onToggleOpen}>
          <View style={[styles.statusDot, { backgroundColor: isOpen ? colors.accentGreen : colors.onSurfaceVariant }]} />
          <Text style={styles.statusText}>{isOpen ? 'Toko Buka' : 'Toko Tutup'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.stackLg,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.stackMd },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 28, height: 28, borderRadius: radius.md, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '800', color: colors.onPrimary },
  brandTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 15, fontWeight: '700', color: colors.onNavy },
  actionsRow: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: { position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.notificationRed },
  greetingLabel: { fontFamily: typography.bodyMd.fontFamily, fontSize: 12, color: colors.navySub, marginBottom: 2 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.stackSm },
  businessName: { flex: 1, fontFamily: typography.headlineLgMobile.fontFamily, fontSize: 19, fontWeight: '700', color: colors.onNavy },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.full, paddingVertical: 5, paddingHorizontal: 10 },
  statusOpen: { backgroundColor: 'rgba(46,125,50,0.25)' },
  statusClosed: { backgroundColor: 'rgba(255,255,255,0.12)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, fontWeight: '700', color: colors.onNavy },
});
