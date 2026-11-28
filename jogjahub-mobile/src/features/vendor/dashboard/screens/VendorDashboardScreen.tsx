import React, { useCallback, useId, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  ArrowDownToLine,
  Activity,
  History,
  Package,
  ShoppingBag,
  BarChart3,
  Star,
  Eye,
  EyeOff,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { vendorApi } from '../../../../api/vendorApi';
import { bookingApi } from '../../../../api/bookingApi';
import type { BookingRecord } from '../../../../types/bookingRecord';
import type { VendorDashboardStackParamList, VendorTabParamList } from '../../../../navigation/types';
import { getPrimaryPhotoUrl, getServicePhotoApiUrl, type ServiceWithPhotos } from '../../../../utils/serviceImage';
import type { RootState } from '../../../../store';
import { ServicePhoto } from '../../listing/components/ServicePhoto';
import { StatCard } from '../../statistics/components/StatCard';
import { getBookingStats, type PeriodKey } from '../../statistics/bookingStats';

type Nav = NativeStackNavigationProp<VendorDashboardStackParamList, 'DashboardHome'>;

// ---------- Tipe data ----------
type ServiceItem = ServiceWithPhotos & {
  id: number;
  name: string;
  price: number;
};
type BookingStatus = BookingRecord['status'];
type Booking = BookingRecord & {
  service_name?: string;
  customer_name?: string;
  price?: number;
  service?: ServiceWithPhotos & NonNullable<BookingRecord['service']>;
  // nama field tanggal bisa beda-beda tergantung response backend
  booking_date?: string;
  date?: string;
};

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
  { key: 'year', label: 'Tahun' },
];

// ---------- Warna sesuai desain ----------
const C = {
  navy: '#0B111E',
  navy2: '#131F37',
  brand: '#EA580C',
  brandDark: '#C2410C',
  card: '#E8530E',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',
};

const STATUS_BADGE: Record<BookingStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'MENUNGGU', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  confirmed: { label: 'DIPROSES', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
  awaiting_completion_confirmation: { label: 'MENUNGGU SELESAI', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  completed: { label: 'SELESAI', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  cancelled: { label: 'DIBATALKAN', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const SERVICE_TINTS = [
  { bg: '#FFF7ED', fg: '#FB923C' },
  { bg: '#EFF6FF', fg: '#0EA5E9' },
  { bg: '#FAF5FF', fg: '#A855F7' },
  { bg: '#F0FDF4', fg: '#22C55E' },
];

// ---------- Helper ----------
const formatRupiah = (n: number | undefined | null) =>
  `Rp${Number(n ?? 0).toLocaleString('id-ID')}`;

const formatCount = (value: number) => value.toLocaleString('id-ID');

function getBookingDate(b: Booking): Date | null {
  const raw = b.booking_date ?? b.date ?? b.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date | null): string {
  if (!d) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// ---------- Layar ----------
export default function VendorDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const tabs = navigation.getParent<BottomTabNavigationProp<VendorTabParamList>>();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();

  const businessName = useSelector((state: RootState) => {
    const auth: any = (state as any).auth;
    return auth?.businessName ?? auth?.user?.business_name ?? auth?.user?.name ?? 'Vendor';
  });

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false); // lokal saja, backend belum punya field status toko
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [bookingError, setBookingError] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [svcRes, bookRes] = await Promise.allSettled([
        vendorApi.listMyServices(),
        bookingApi.listAllBookings('tenant'),
      ]);
      if (svcRes.status === 'fulfilled') {
        const raw = svcRes.value.data?.data;
        setServices(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      }
      setBookingError(bookRes.status === 'rejected');
      if (bookRes.status === 'fulfilled') setBookings(bookRes.value);
      if (svcRes.status === 'rejected' && bookRes.status === 'rejected') {
        Toast.show({
          type: 'error',
          text1: 'Gagal memuat dashboard',
          text2: 'Tarik ke bawah untuk coba lagi.',
          position: 'top',
        });
      }
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Estimasi pendapatan = total harga pesanan yang sudah diterima (diproses) atau selesai.
  const estimatedRevenue = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + Number(b.price ?? b.total_amount ?? 0), 0),
    [bookings],
  );

  const stats = useMemo(() => {
    const { orders, previousOrders, periodLabel } = getBookingStats(bookings, period);
    const current = orders.reduce((total, count) => total + count, 0);
    const change = previousOrders > 0 ? (current / previousOrders - 1) * 100 : null;
    return { current, change, values: orders, periodLabel };
  }, [bookings, period, focused]);

  const recentOrders = useMemo(() => {
    return [...bookings]
      .sort((a, b) => (getBookingDate(b)?.getTime() ?? 0) - (getBookingDate(a)?.getTime() ?? 0))
      .slice(0, 4);
  }, [bookings]);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const goOrders = () => tabs?.navigate('Orders');
  const goListing = () => tabs?.navigate('Listing');
  const goStats = () => navigation.navigate('Statistics');
  const goActivity = () => navigation.navigate('RecentActivity');
  const goHistory = () => navigation.navigate('DemoEarnings');
  const soon = (label: string) =>
    Toast.show({ type: 'info', text1: `${label} segera hadir`, position: 'top' });

  const quickMenu = [
    { key: 'produk', label: 'Produk Anda', Icon: ShoppingBag, bg: '#FF6B6B', bgEnd: '#FF8E53', onPress: goListing },
    { key: 'activity', label: 'Recent Activity', Icon: Activity, bg: '#3B82F6', bgEnd: '#06B6D4', onPress: goActivity },
    { key: 'statistik', label: 'Statistik', Icon: BarChart3, bg: '#10B981', bgEnd: '#14B8A6', onPress: goStats },
    { key: 'ulasan', label: 'Ulasan', Icon: Star, bg: '#F59E0B', bgEnd: '#F97316', fillIcon: true, onPress: () => soon('Ulasan') },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 112 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.brand} colors={[C.brand]} />
        }
      >
        {/* ===== Header gelap ===== */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id={`hdr-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#0B111E" />
                <Stop offset="50%" stopColor="#0F172A" />
                <Stop offset="100%" stopColor="#131F37" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#hdr-${uid})`} />
          </Svg>
          <View style={styles.orbOrange} />
          <View style={styles.orbBlue} />

          <View style={styles.brandRow}>
            <View style={styles.brandLeft}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('../../../../assets/images/logo.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.tenantLabel}>TENANT</Text>
                <Text style={styles.brandName}>JogjaHub</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Profile' as never)}
              accessibilityLabel="Pengaturan"
            >
              <Settings size={20} color="#E2E8F0" />
            </TouchableOpacity>
          </View>

          <View style={styles.greetRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.greetSmall}>Selamat Datang,</Text>
              <Text style={styles.greetName} numberOfLines={1}>
                {businessName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.storePill}
              activeOpacity={0.8}
              onPress={() => setStoreOpen((v) => !v)}
            >
              <View style={[styles.dot, { backgroundColor: storeOpen ? '#10B981' : '#F43F5E' }]} />
              <Text style={styles.storePillText}>{storeOpen ? 'Toko Buka' : 'Toko Tutup'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {/* ===== Kartu pendapatan ===== */}
          <View style={styles.revenueCard}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id={`rev-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#E65100" />
                  <Stop offset="50%" stopColor="#F4511E" />
                  <Stop offset="100%" stopColor="#BF360C" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#rev-${uid})`} />
            </Svg>
            <View style={styles.circleA} />
            <View style={styles.circleB} />

            <Text style={styles.revenueLabel}>ESTIMASI PENDAPATAN</Text>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueAmount} numberOfLines={1} adjustsFontSizeToFit>
                {hideBalance ? 'Rp ••••••' : formatRupiah(estimatedRevenue)}
              </Text>
              <TouchableOpacity onPress={() => setHideBalance((v) => !v)} hitSlop={10} style={styles.eyeBtn}>
                {hideBalance ? <EyeOff size={20} color="#FED7AA" /> : <Eye size={20} color="#FED7AA" />}
              </TouchableOpacity>
            </View>

            <View style={styles.revenueActions}>
              {[
                { key: 'tarik', label: 'Tarik', Icon: ArrowDownToLine, onPress: () => soon('Tarik saldo') },
                { key: 'riwayat', label: 'Riwayat', Icon: History, onPress: goHistory },
                { key: 'pesanan', label: 'Pesanan', Icon: Package, onPress: goOrders },
              ].map(({ key, label, Icon, onPress }) => (
                <TouchableOpacity key={key} style={styles.actionItem} activeOpacity={0.7} onPress={onPress}>
                  <View style={styles.actionIcon}>
                    <Icon size={20} color="#fff" />
                  </View>
                  <Text style={styles.actionLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ===== Menu cepat ===== */}
          <View style={styles.quickRow}>
            {quickMenu.map(({ key, label, Icon, bg, bgEnd, fillIcon, onPress }) => (
              <TouchableOpacity key={key} style={styles.quickItem} activeOpacity={0.7} onPress={onPress}>
                <View style={styles.quickIcon}>
                  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
                    <Defs>
                      <LinearGradient id={`qm-${uid}-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={bg} />
                        <Stop offset="100%" stopColor={bgEnd} />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill={`url(#qm-${uid}-${key})`} />
                  </Svg>
                  <Icon size={18} color="#fff" fill={fillIcon ? '#fff' : 'none'} />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ===== Statistik ===== */}
          <SectionHeader title="Statistik" action="Lihat Statistik" onPress={goStats} />
          {loading ? (
            <ActivityIndicator color={C.brand} style={{ marginVertical: 24 }} />
          ) : bookingError ? (
            <EmptyBox text="Statistik gagal dimuat. Tarik ke bawah untuk coba lagi." />
          ) : <StatCard
            periods={PERIODS}
            period={period}
            periodLabel={stats.periodLabel}
            onChangePeriod={setPeriod}
            label={"Total Pesanan"}
            value={stats.current}
            values={stats.values}
            change={stats.change}
            formatValue={formatCount}
            active={focused}
          />}

          {/* ===== Layanan saya ===== */}
          <SectionHeader title="Layanan Saya" action="Lihat Semua" onPress={goListing} chevron />
          {loading ? (
            <ActivityIndicator color={C.brand} style={{ marginVertical: 24 }} />
          ) : services.length === 0 ? (
            <EmptyBox text="Belum ada layanan. Tambahkan lewat menu Layanan." />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.serviceRow}
              style={styles.serviceScroll}
            >
              {services.map((s, i) => {
                const tint = SERVICE_TINTS[i % SERVICE_TINTS.length];
                const photo = getPrimaryPhotoUrl(s);
                const photoApiUrl = getServicePhotoApiUrl(photo);
                return (
                  <TouchableOpacity key={s.id} style={styles.serviceCard} activeOpacity={0.8} onPress={goListing}>
                    <View style={[styles.serviceThumb, { backgroundColor: tint.bg }]}>
                      <ServicePhoto uri={photoApiUrl ?? photo}
                        fallbackUri={photoApiUrl ? photo : null}
                        style={styles.serviceImg} placeholderStyle={styles.photoPlaceholder}
                        iconSize={32} iconColor={tint.fg} />
                    </View>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.servicePrice}>{formatRupiah(s.price)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ===== Pesanan masuk ===== */}
          <SectionHeader title="Pesanan masuk" action="Lihat Semua" onPress={goOrders} />
          {loading ? null : bookingError ? (
            <EmptyBox text="Pesanan gagal dimuat. Tarik ke bawah untuk coba lagi." />
          ) : recentOrders.length === 0 ? (
            <EmptyBox text="Belum ada pesanan masuk." />
          ) : (
            recentOrders.map((o, idx) => {
              const badge = STATUS_BADGE[o.status] ?? STATUS_BADGE.pending;
              const title = o.service_name ?? o.service?.name ?? 'Layanan';
              const customer = o.customer_name ?? o.customer?.name ?? 'Pelanggan';
              const amount = Number(o.price ?? o.total_amount ?? 0);
              const listing = services.find(service => service.id === o.service?.id);
              const photo = getPrimaryPhotoUrl(o.service ?? {}) ?? getPrimaryPhotoUrl(listing ?? {});
              const photoApiUrl = getServicePhotoApiUrl(photo);
              return (
                <TouchableOpacity key={o.uuid ?? o.id ?? String(idx)} style={styles.orderCard} activeOpacity={0.8} onPress={goOrders}>
                  <View style={styles.orderIcon}>
                    {photo ? (
                      <ServicePhoto uri={photoApiUrl ?? photo}
                        fallbackUri={photoApiUrl ? photo : null}
                        style={styles.serviceImg} placeholderStyle={styles.photoPlaceholder}
                        iconSize={24} iconColor={C.brand} />
                    ) : (
                      <Package size={24} color={C.brand} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.orderTop}>
                      <Text style={styles.orderTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderMeta} numberOfLines={1}>
                      {customer} • {formatDate(getBookingDate(o))}
                    </Text>
                    <Text style={styles.orderPrice}>{formatRupiah(amount)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- Komponen kecil ----------
function SectionHeader({
  title,
  action,
  onPress,
  chevron,
}: {
  title: string;
  action: string;
  onPress: () => void;
  chevron?: boolean;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} hitSlop={8} style={styles.sectionAction}>
        <Text style={styles.sectionActionText}>{action}</Text>
        {chevron ? <ChevronRight size={16} color={C.brand} /> : null}
      </TouchableOpacity>
    </View>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ---------- Style ----------
const shadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },

  // Header
  header: {
    backgroundColor: C.navy2,
    paddingHorizontal: 20,
    paddingBottom: 64,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  orbOrange: {
    position: 'absolute',
    top: -48,
    left: -48,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(249,115,22,0.10)',
  },
  orbBlue: {
    position: 'absolute',
    top: 60,
    right: -64,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(14,165,233,0.10)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: '100%', height: '100%', borderRadius: 10 },
  tenantLabel: { color: '#FB923C', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  brandName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 24 },
  greetSmall: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
  greetName: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 2 },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(51,65,85,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  storePillText: { color: '#E2E8F0', fontSize: 11, fontWeight: '700' },

  // Body (menimpa header)
  body: { paddingHorizontal: 16, marginTop: -40 },

  // Kartu pendapatan
  revenueCard: {
    backgroundColor: C.card,
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  circleA: {
    position: 'absolute',
    right: -48,
    top: -48,
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 18,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  circleB: {
    position: 'absolute',
    right: -80,
    bottom: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 26,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  revenueLabel: { color: '#FFEDD5', fontSize: 12, fontWeight: '600', letterSpacing: 0.8 },
  revenueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  revenueAmount: { color: '#fff', fontSize: 36, fontWeight: '700', flexShrink: 1 },
  eyeBtn: { padding: 6 },
  revenueActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 8 },

  // Menu cepat
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  quickItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  quickIcon: { width: 36, height: 36, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#1E293B', textAlign: 'center' },

  // Section
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: 12, fontWeight: '700', color: C.brand },

  // Layanan
  serviceScroll: { marginHorizontal: -16 },
  serviceRow: { paddingHorizontal: 16, gap: 14, paddingBottom: 4 },
  serviceCard: {
    width: 155,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...shadow,
  },
  serviceThumb: { height: 96, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' },
  serviceImg: { width: '100%', height: '100%' },
  serviceName: { fontSize: 12, fontWeight: '700', color: C.text },
  servicePrice: { fontSize: 12, fontWeight: '800', color: C.brandDark, marginTop: 4 },

  // Pesanan
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    ...shadow,
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  orderMeta: { fontSize: 11, color: C.faint, marginTop: 2, fontWeight: '500' },
  orderPrice: { fontSize: 12, fontWeight: '800', color: C.brandDark, marginTop: 4 },

  // Kosong
  emptyBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 12, color: C.muted, textAlign: 'center' },
});
