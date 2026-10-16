import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  MessageSquare,
  ShoppingCart,
  User,
  Camera,
  Ticket,
  ChevronRight,
  Wallet,
  Package,
  Truck,
  Star,
  CreditCard,
  MapPin,
  HelpCircle,
  ShieldCheck,
  LogOut,
} from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLogout } from '../../../auth/hooks/useLogout';
import { typography } from '../../../../constants/theme';
import type { RootState } from '../../../../store';

export default function CustomerProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { handleLogout } = useLogout();

  // Sembunyikan default header tab navigator agar header kustom kita yang tampil
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const confirmLogout = () => {
    Alert.alert(
      'Keluar dari Akun?',
      'Anda perlu masuk kembali untuk mengakses akun ini.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: () => void handleLogout() },
      ]
    );
  };

  const handleNavigateOrders = () => {
    navigation.navigate('MyBookings');
  };

  const handleOpenEditProfile = () => {
    navigation.navigate('EditCustomerProfile');
  };

  const handleFeatureNotice = (featureName: string) => {
    Alert.alert('Info', `Fitur "${featureName}" sedang dalam pengembangan.`);
  };

  const avatarUri = (user as any)?.avatar;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleFeatureNotice('Pesan / Chat')}
            activeOpacity={0.7}
          >
            <MessageSquare size={20} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleFeatureNotice('Keranjang')}
            activeOpacity={0.7}
          >
            <ShoppingCart size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── CARD 1: HERO PROFILE ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            {/* Avatar dengan Badge Kamera */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <User size={38} color="#EA580C" />
                )}
              </View>
              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.8}
                onPress={handleOpenEditProfile}
              >
                <Camera size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Info Pengguna */}
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Sinchan'}
                </Text>
                <MaterialIcons name="verified" size={17} color="#2563EB" />
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'sinchan@gmail.com'}
              </Text>
              <Text style={styles.userPhone} numberOfLines={1}>
                {(user as any)?.phone || (user as any)?.phone_number || '+62 812-3456-7890'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── CARD 2: VOUCHER & PROMO ── */}
        <TouchableOpacity
          style={styles.voucherCard}
          activeOpacity={0.75}
          onPress={() => handleFeatureNotice('Voucher & Promo')}
        >
          <View style={styles.voucherLeft}>
            <View style={styles.voucherIconBox}>
              <Ticket size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.voucherTitle}>Voucher &amp; Promo Saya</Text>
              <Text style={styles.voucherSubtitle}>Klaim atau gunakan voucher promo</Text>
            </View>
          </View>
          <View style={styles.voucherRight}>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>4</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* ── CARD 3: PESANAN SAYA ── */}
        <View style={styles.ordersCard}>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersTitle}>Pesanan Saya</Text>
            <TouchableOpacity
              style={styles.ordersHistoryLink}
              onPress={handleNavigateOrders}
              activeOpacity={0.7}
            >
              <Text style={styles.ordersHistoryText}>Lihat Riwayat Pesanan</Text>
              <ChevronRight size={15} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 4 Item Status Pesanan */}
          <View style={styles.ordersGrid}>
            {/* 1. Belum Bayar */}
            <TouchableOpacity
              style={styles.orderStatusItem}
              onPress={handleNavigateOrders}
              activeOpacity={0.7}
            >
              <View style={styles.statusIconWrap}>
                <Wallet size={25} color="#1E293B" strokeWidth={1.8} />
              </View>
              <Text style={styles.statusLabel}>Belum Bayar</Text>
            </TouchableOpacity>

            {/* 2. Diproses */}
            <TouchableOpacity
              style={styles.orderStatusItem}
              onPress={handleNavigateOrders}
              activeOpacity={0.7}
            >
              <View style={styles.statusIconWrap}>
                <Package size={25} color="#1E293B" strokeWidth={1.8} />
              </View>
              <Text style={styles.statusLabel}>Diproses</Text>
            </TouchableOpacity>

            {/* 3. Dikirim */}
            <TouchableOpacity
              style={styles.orderStatusItem}
              onPress={handleNavigateOrders}
              activeOpacity={0.7}
            >
              <View style={styles.statusIconWrap}>
                <Truck size={25} color="#1E293B" strokeWidth={1.8} />
              </View>
              <Text style={styles.statusLabel}>Dikirim</Text>
            </TouchableOpacity>

            {/* 4. Beri Penilaian (dengan badge notifikasi 7) */}
            <TouchableOpacity
              style={styles.orderStatusItem}
              onPress={handleNavigateOrders}
              activeOpacity={0.7}
            >
              <View style={styles.statusIconWrap}>
                <Star size={25} color="#1E293B" strokeWidth={1.8} />
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>7</Text>
                </View>
              </View>
              <Text style={styles.statusLabel}>Beri Penilaian</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION: PENGATURAN AKUN ── */}
        <Text style={styles.sectionHeaderTitle}>PENGATURAN AKUN</Text>
        <View style={styles.menuCard}>
          {/* Edit Profil & Biodata (Membuka EditCustomerProfileScreen) */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleOpenEditProfile}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F3E8FF' }]}>
                <User size={18} color="#9333EA" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Edit Profil &amp; Biodata</Text>
                <Text style={styles.menuItemSubtitle}>Nama, no hp, dan email</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleFeatureNotice('Metode Pembayaran')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                <CreditCard size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Metode Pembayaran</Text>
                <Text style={styles.menuItemSubtitle}>Kartu debit/kredit, e-wallet</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleFeatureNotice('Daftar Alamat')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#ECFEFF' }]}>
                <MapPin size={18} color="#0891B2" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Daftar Alamat</Text>
                <Text style={styles.menuItemSubtitle}>Rumah, kantor, dan lokasi favorit</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── SECTION: BANTUAN & LAINNYA ── */}
        <Text style={styles.sectionHeaderTitle}>BANTUAN &amp; LAINNYA</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleFeatureNotice('Pusat Bantuan')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F0FDFA' }]}>
                <HelpCircle size={18} color="#0D9488" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Pusat Bantuan</Text>
                <Text style={styles.menuItemSubtitle}>FAQ dan kontak live chat</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleFeatureNotice('Kebijakan Privasi & Ketentuan')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                <ShieldCheck size={18} color="#475569" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Kebijakan Privasi &amp; Ketentuan</Text>
                <Text style={styles.menuItemSubtitle}>Legalitas pengguna</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── TOMBOL LOGOUT ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={confirmLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>

        {/* ── VERSI APLIKASI ── */}
        <Text style={styles.versionText}>Aplikasi Versi 2.4.1 (Build 128)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 36,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  userEmail: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  userPhone: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Voucher Card
  voucherCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  voucherIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherTitle: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  voucherSubtitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
    marginTop: 2,
  },
  voucherRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontFamily: typography.labelSm.fontFamily,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Pesanan Saya Card
  ordersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ordersTitle: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  ordersHistoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ordersHistoryText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  ordersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  orderStatusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    fontFamily: typography.labelSm.fontFamily,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Section Headers
  sectionHeaderTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginHorizontal: 22,
    marginTop: 22,
    marginBottom: 8,
  },

  // Menu List Group Cards
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuItemSubtitle: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1.5,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: 66,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 22,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  logoutText: {
    fontFamily: typography.button.fontFamily,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer Version
  versionText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
});