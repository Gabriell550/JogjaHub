import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Alert,
  Linking,
  AppState,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { bookingLabel, paymentLabel, bookingStatusLabel, type BookingRecord } from '../../../../types/bookingRecord';
import Toast from 'react-native-toast-message';
import { bookingApi } from '../../../../api/bookingApi';
import OrderDetailsModal from '../components/OrderDetailsModal';

type CustomerBookingStatus = BookingRecord['status'];

interface CustomerBookingItem {
  id: string;
  order_code: string;
  time_ago: string;
  vendor_name: string;
  vendor_category: string;
  vendor_avatar: string;
  service_name: string;
  price: number;
  schedule_date: string;
  schedule_time: string;
  location_detail: string;
  payment_status: string;
  package_type: string;
  status: CustomerBookingStatus;
  custom_note?: string;
  payment_url?: string;
  whatsapp_url?: string;
  hasIssue: boolean;
}

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Perlu Diproses' },
  { key: 'confirmed', label: 'Jadwal Mendatang' },
  { key: 'awaiting_completion_confirmation', label: 'Menunggu selesai' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

export default function MyBookingsScreen() {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<CustomerBookingItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<CustomerBookingItem | null>(null);

  const loadSequence = useRef(0);

  const loadBookings = useCallback(async () => {
    const request = ++loadSequence.current;
    setIsLoading(true);
    try {
      const records = await bookingApi.listAllBookings('customer');
      if (request !== loadSequence.current) return;
      setBookings(records.map((booking: BookingRecord) => ({
        id: booking.uuid,
        order_code: bookingLabel(booking),
        time_ago: booking.created_at ? new Date(booking.created_at).toLocaleDateString('id-ID') : '',
        vendor_name: booking.service?.tenant?.business_name ?? 'Vendor JogjaHub',
        vendor_category: booking.service?.subcategory?.name ?? '',
        vendor_avatar: booking.service?.tenant?.logo_url ?? '',
        service_name: booking.service?.name ?? 'Layanan',
        price: Number(booking.total_amount ?? booking.service?.price ?? 0),
        schedule_date: booking.check_in_date ?? booking.slot?.slot_date.slice(0, 10) ?? 'Tanpa jadwal',
        schedule_time: booking.check_out_date ? 'Check-out ' + booking.check_out_date : booking.slot?.start_time.slice(0, 5) ?? '',
        location_detail: booking.service?.tenant?.address?.city ?? '',
        payment_status: paymentLabel(booking),
        whatsapp_url: booking.whatsapp_url,
        payment_url: booking.payment?.status === 'pending' && booking.payment.expires_at &&
          Date.parse(booking.payment.expires_at) > Date.now() ? booking.payment.payment_url ?? undefined : undefined,
        package_type: booking.nights ? booking.nights + ' malam' : '',
        status: booking.status,
        hasIssue: !!booking.issue_reported_at && !booking.issue_resolved_at,
      })));
    } catch (error) {
      if (request === loadSequence.current) Toast.show({ type: 'error', text1: apiErrorMessage(error, 'Gagal memuat pesanan. Tarik untuk memuat ulang.') });
    } finally {
      if (request === loadSequence.current) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
      const subscription = AppState.addEventListener('change', state => {
        if (state === 'active') void loadBookings();
      });
      return () => subscription.remove();
    }, [loadBookings])
  );

  const handleCancelBooking = (booking: CustomerBookingItem) => {
    Alert.alert(
      'Batalkan Pesanan',
      `Yakin ingin membatalkan pesanan "${booking.service_name}"? Sesuai ketentuan, pembatalan dapat dilakukan minimal 6 jam sebelum jadwal.`,
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingApi.cancelBooking(booking.id);
            } catch (error) {
              Alert.alert('Pembatalan gagal', apiErrorMessage(error, 'Coba lagi nanti.'));
              return;
            }
            setBookings((prev) =>
              prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled', payment_url: undefined, payment_status: 'Pesanan dibatalkan' } : b))
            );
            void loadBookings();
            Toast.show({
              type: 'success',
              text1: 'Pesanan Dibatalkan',
              text2: 'Pesanan Anda telah berhasil dibatalkan.',
            });
          },
        },
      ]
    );
  };


  const filteredBookings =
    activeFilter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === activeFilter);

  const countByFilter = (filterKey: string) => {
    if (filterKey === 'all') return bookings.length;
    return bookings.filter((b) => b.status === filterKey).length;
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const activeCount = bookings.filter((b) => b.status !== 'cancelled').length;

  const renderBookingCard = ({ item }: { item: CustomerBookingItem }) => {
    return (
      <View style={styles.orderCard}>
        {/* Top Badge & Order Code */}
        <View style={styles.cardHeaderRow}>
          {item.status === 'pending' && (
            <View style={styles.peachBadge}>
              <Ionicons name="time-outline" size={13} color="#9A3412" />
              <Text style={styles.peachBadgeText}>Menunggu • {item.time_ago}</Text>
            </View>
          )}

          {(item.status === 'confirmed' || item.status === 'awaiting_completion_confirmation' || item.status === 'completed') && (
            <View style={styles.greyBadge}>
              <Ionicons name="calendar-outline" size={13} color="#475569" />
              <Text style={styles.greyBadgeText}>{bookingStatusLabel[item.status]}</Text>
            </View>
          )}

          {item.status === 'cancelled' && (
            <View style={styles.redBadge}>
              <Ionicons name="close-circle-outline" size={13} color="#DC2626" />
              <Text style={styles.redBadgeText}>Dibatalkan</Text>
            </View>
          )}

          {item.hasIssue && item.status !== 'completed' && <Text>Kendala dilaporkan</Text>}
          <Text style={styles.orderCodeText}>#{item.order_code}</Text>
        </View>

        {/* Vendor Profile Row */}
        <View style={styles.customerRow}>
          <Image source={{ uri: item.vendor_avatar }} style={styles.customerAvatar} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerNameText}>{item.vendor_name}</Text>
            <Text style={styles.customerSubText}>{item.vendor_category}</Text>
          </View>
        </View>

        {/* Gray/Blue Details Container Box */}
        <TouchableOpacity
          style={styles.detailsContainer}
          activeOpacity={0.88}
          onPress={() => item.status === 'pending' || item.status === 'cancelled' ? setSelectedBookingForDetail(item) : navigation.navigate('BookingDetail', { id: item.id })}
        >
          <View style={styles.detailsTitleRow}>
            <Text style={styles.serviceNameText} numberOfLines={2}>
              {item.service_name}
            </Text>
            <Text style={styles.priceText}>
              Rp{item.price.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.specRow}>
            <Ionicons name="calendar-outline" size={14} color="#C2410C" />
            <Text style={styles.specText}>
              {item.schedule_date} • {item.schedule_time}
            </Text>
          </View>

          {item.custom_note ? (
            <View style={styles.specRow}>
              <Ionicons name="file-tray-full-outline" size={14} color="#0284C7" />
              <Text style={styles.specText}>{item.custom_note}</Text>
            </View>
          ) : (
            <View style={styles.specRow}>
              <Ionicons name="location-outline" size={14} color="#0284C7" />
              <Text style={styles.specText} numberOfLines={1}>
                {item.location_detail}
              </Text>
            </View>
          )}

          <View style={styles.paymentSubRow}>
            <View style={styles.paymentTag}>
              <Text style={styles.paymentTagText}>{item.payment_status}</Text>
            </View>
            <Text style={styles.packageTypeText}>{item.package_type}</Text>
          </View>
        </TouchableOpacity>

        {/* Customer Actions Row */}
        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleCancelBooking(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectButtonText}>Batalkan</Text>
            </TouchableOpacity>

            {(item.whatsapp_url || item.payment_url) && <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => Linking.openURL((item.whatsapp_url || item.payment_url)!).catch(() => Alert.alert('Tautan pembayaran gagal dibuka'))}
              activeOpacity={0.88}
            >
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>{item.whatsapp_url ? 'WhatsApp' : 'Bayar'}</Text>
            </TouchableOpacity>}
          </View>
        )}

        {(item.status === 'confirmed' || item.status === 'awaiting_completion_confirmation' || item.status === 'completed') && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.fullDetailButton}
              onPress={() => navigation.navigate('BookingDetail', { id: item.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.fullDetailButtonText}>Rincian Pesanan</Text>
              <Ionicons name="chevron-forward" size={16} color="#1E293B" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack?.()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.topHeaderIcon}
        >
          <Ionicons name="arrow-back" size={22} color="#8C3B00" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Pesanan Saya</Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.topHeaderIcon}
        >
          <Ionicons name="share-social-outline" size={22} color="#8C3B00" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadBookings} tintColor="#FF6B00" />
        }
      >
        {/* Dark Navy Hero Card */}
        <View style={styles.darkHeroCard}>
          <Text style={styles.heroSubHeader}>Customer Portal • JogjaHub</Text>

          <View style={styles.heroTitleRow}>
            <View style={styles.heroTitleLeft}>
              <View style={styles.storeIconWrapper}>
                <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.heroMainTitle}>Pesanan Saya</Text>
                <Text style={styles.heroMainTitle}>Wisuda</Text>
              </View>
            </View>

            <View style={styles.heroActionsRow}>
              <TouchableOpacity style={styles.heroActionCircle} activeOpacity={0.7}>
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.heroActionCircle, { marginLeft: 10 }]} activeOpacity={0.7}>
                <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                <View style={styles.heroNotifDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Boxes (Hari Ini & Perlu Konfirmasi) */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatBox}>
              <View style={styles.statIconWrap}>
                <Ionicons name="reader-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Pesanan Aktif</Text>
                <Text style={styles.statValue}>
                  <Text style={{ fontWeight: '800' }}>{activeCount}</Text> Order
                </Text>
              </View>
            </View>

            <View style={styles.heroStatBox}>
              <View style={styles.statIconWrap}>
                <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Perlu Pembayaran</Text>
                <Text style={styles.statValue}>
                  <Text style={{ fontWeight: '800', color: '#F97316' }}>{pendingCount}</Text> Pesanan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
          style={styles.filterScrollView}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const count = countByFilter(f.key);

            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.filterCountBadge,
                    isActive && styles.filterCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      isActive && styles.filterCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Orders List */}
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          scrollEnabled={false}
          contentContainerStyle={styles.ordersListContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
              <Text style={styles.emptySubtitle}>
                Pesanan yang Anda buat akan muncul di sini.
              </Text>
            </View>
          }
        />
      </ScrollView>

      {/* Rincian Pesanan Modal */}
      <OrderDetailsModal
        visible={!!selectedBookingForDetail}
        booking={selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  reviewOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' },
  reviewCard: { padding: 18, gap: 16, borderRadius: 16, backgroundColor: 'white' },
  reviewRatings: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewInput: { minHeight: 64, padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8 },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FAF9F6',
  },
  topHeaderIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8C3B00',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Dark Navy Hero Card */
  darkHeroCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  heroSubHeader: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 10,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroActionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroNotifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /* Filter Pills */
  filterScrollView: {
    marginVertical: 4,
  },
  filterScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  filterCountBadgeActive: {
    backgroundColor: '#C2410C',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },

  /* Orders List */
  ordersListContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexWrap: 'wrap',
    gap: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  peachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDE1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  peachBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
  },
  blueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  blueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  greyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  greyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  greenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  greenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  redBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  redBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  orderCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Customer/Vendor Row */
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  customerInfo: {
    flex: 1,
  },
  customerNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  customerSubText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Details Container Box */
  detailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C2410C',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  specText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  paymentSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  paymentTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  packageTypeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Action Buttons */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  acceptButton: {
    flex: 1.5,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFEDE1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
  shipButton: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  shipButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullDetailButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  fullDetailButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* Empty Container */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
