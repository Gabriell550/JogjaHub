import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  businessName: string;
  nativeLayout?: boolean;
  onPressBell?: () => void;
  onPressAvatar?: () => void;
};

export function VendorHeaderBar({ businessName, nativeLayout, onPressBell, onPressAvatar }: Props) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, paddingBottom: 20 }]}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>JH</Text>
          </View>
          <View>
            <Text style={styles.tenantTag}>TENANT</Text>
            <Text style={styles.brandTitle}>JogjaHub</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Profil tenant" style={styles.iconBtn} onPress={onPressAvatar}>
          <User size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text style={styles.greetingLabel}>Selamat Datang,</Text>

      <View style={styles.nameRow}>
        <Text style={styles.businessName} numberOfLines={1}>{businessName}</Text>
        <Pressable
          accessibilityRole="switch"
          onPress={() => setIsOpen(!isOpen)}
          style={[styles.statusPill, isOpen ? styles.statusOpen : styles.statusClosed]}
        >
          <View style={[styles.statusDot, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>{isOpen ? 'Toko Buka' : 'Toko Tutup'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0B111E',
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.stackLg,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, fontWeight: '800', color: '#FF5E00' },
  tenantTag: { fontFamily: typography.labelSm.fontFamily, fontSize: 10, fontWeight: '800', color: '#FF5E00', letterSpacing: 0.8 },
  brandTitle: { fontFamily: typography.headlineSm.fontFamily, fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingLabel: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.stackSm },
  businessName: { flex: 1, fontFamily: typography.headlineLg.fontFamily, fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  statusOpen: { backgroundColor: 'rgba(6, 78, 59, 0.4)', borderColor: 'rgba(16, 185, 129, 0.4)' },
  statusClosed: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderColor: 'rgba(255, 255, 255, 0.15)' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: typography.labelSm.fontFamily, fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
});
