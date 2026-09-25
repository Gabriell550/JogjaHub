import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../../../api/bookingApi';
import Toast from 'react-native-toast-message';
import type { VendorOrdersStackParamList } from '../../../../navigation/types';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
type DisplayStatus = BookingStatus | 'shipping' | 'completed';

interface OrderItem {
  id: string;
  uuid: string;
  order_code: string;
  time_ago: string;
  customer_name: string;
  customer_university: string;
  customer_avatar: string;
  service_name: string;
  price: number;
  schedule_date: string;
  schedule_time: string;
  location_detail: string;
  payment_status: string;
  package_type: string;
  status: DisplayStatus;
  custom_note?: string;
  estimate_arrival?: string;
}

const MOCK_ORDERS: OrderItem[] = [
  {
    id: '1',
    uuid: 'uuid-1',
    order_code: 'JH-20260906-001',
    time_ago: '10m lalu',
    customer_name: 'Anindhya Fathia Rizki',
    customer_university: 'Mahasiswi UGM • Wisuda Periode IV',
    customer_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    service_name: 'Makeup Wisuda + Hijab Do Reguler',
    price: 450000,
    schedule_date: 'Minggu, 6 Sep 2026',
    schedule_time: '06:00 WIB',
    location_detail: 'Datang ke Lokasi: Kost Putri Samirono C...',
    payment_status: 'Lunas (BCA VA)',
    package_type: '1 Paket Terpilih',
    status: 'pending',
  },
  {
    id: '2',
    uuid: 'uuid-2',
    order_code: 'JH-20260906-002',
    time_ago: '1 jam lalu',
    customer_name: 'Siti Khadijah',
    customer_university: 'Mahasiswi UNY • Kampus Karangmalang',
    customer_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    service_name: 'Bouquet Matahari + Selempang Satin',
    price: 185000,
    schedule_date: 'Minggu, 6 Sep 2026',
    schedule_time: '09:30 WIB',
    location_detail: 'Estimasi Tiba: 09:30 WIB (Kurir Toko)',
    estimate_arrival: 'Estimasi Tiba: 09:30 WIB (Kurir Toko)',
    custom_note: 'Custom Bordir: "Siti Khadijah, S.Pd. Cumlaude"',
    payment_status: 'Lunas (QRIS)',
    package_type: '1 Paket Terpilih',
    status: 'shipping',
  },
  {
    id: '3',
    uuid: 'uuid-3',
    order_code: 'JH-20260907-005',
    time_ago: '3 jam lalu',
    customer_name: 'Budi Pratama',
    customer_university: 'UPN "Veteran" Yogyakarta',
    customer_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    service_name: 'Sewa Jas & Toga Lengkap Pria',
    price: 250000,
    schedule_date: 'Senin, 7 Sep 2026',
    schedule_time: '08:00 WIB',
    location_detail: 'Pengambilan: Senin, 7 Sep 2026 (Ukuran L)',
    payment_status: 'Lunas (Transfer Manual)',
    package_type: '1 Paket Lengkap',
    status: 'confirmed',
  },
];

const FILTERS = [
  { key: 'all', label: 'Semua', countKey: 'all' },
  { key: 'pending', label: 'Perlu Diproses', countKey: 'pending' },
  { key: 'shipping', label: 'Sedang Dikirim', countKey: 'shipping' },
  { key: 'confirmed', label: 'Terkonfirmasi', countKey: 'confirmed' },
  { key: 'completed', label: 'Selesai', countKey: 'completed' },
];

export default function IncomingOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorOrdersStackParamList>>();
  const [orders, setOrders] = useState<OrderItem[]>(MOCK_ORDERS);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bookingApi.listIncomingBookings();
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data) && data.length > 0) {
        // Map backend bookings into our structured format
        const mapped: OrderItem[] = data.map((b: any, idx: number) => ({
          id: String(b.id || idx),
          uuid: b.uuid || String(b.id || idx),
          order_code: b.order_code || `JH-20260906-${String(idx + 1).padStart(3, '0')}`,
          time_ago: 'Baru saja',
          customer_name: b.customer_name || b.customer?.name || 'Pelanggan',
          customer_university: b.customer_location || 'Yogyakarta',
          customer_avatar: b.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          service_name: b.service_name || b.service?.name || 'Layanan Wisuda',
          price: b.price || b.service?.price || 150000,
          schedule_date: b.slot?.slot_date || '6 Sep 2026',
          schedule_time: b.slot?.start_time ? `${b.slot.start_time.substring(0, 5)} WIB` : '08:00 WIB',
          location_detail: b.customer_location || 'Lokasi Pelanggan',
          payment_status: b.payment_method === 'transfer' ? 'Lunas (Transfer)' : 'COD / Bayar di Tempat',
          package_type: '1 Paket Terpilih',
          status: b.status === 'confirmed' ? 'confirmed' : b.status === 'cancelled' ? 'cancelled' : 'pending',
        }));
        setOrders(mapped);
      }
    } catch {
      // Fallback silently to mock orders
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleUpdateStatus = async (item: OrderItem, newStatus: DisplayStatus) => {
    const prevStatus = item.status;
    setOrders((prev) =>
      prev.map((o) => (o.id === item.id ? { ...o, status: newStatus } : o))
    );
    setUpdatingId(item.id);

    try {
      if (newStatus === 'confirmed' || newStatus === 'cancelled') {
        await bookingApi.updateBookingStatus(item.uuid, newStatus);
      }
      Toast.show({
        type: 'success',
        text1: newStatus === 'confirmed' ? '✅ Pesanan Diterima' : 'Pesanan Diperbarui',
        text2: `${item.service_name} berhasil diperbarui.`,
      });
    } catch {
      // Revert if API fails
      setOrders((prev) =>
        prev.map((o) => (o.id === item.id ? { ...o, status: prevStatus } : o))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmReject = (item: OrderItem) => {
    Alert.alert(
      'Tolak Pesanan',
      `Yakin ingin menolak pesanan dari "${item.customer_name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: () => handleUpdateStatus(item, 'cancelled'),
        },
      ]
    );
  };

  const filteredOrders =
    activeFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  const countByFilter = (filterKey: string) => {
    if (filterKey === 'all') return orders.length;
    return orders.filter((o) => o.status === filterKey).length;
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const todayCount = orders.length;

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.orderCard}>
        {/* Top Badge & Order Code */}
        <View style={styles.cardHeaderRow}>
          {item.status === 'pending' && (
            <View style={styles.peachBadge}>
              <Ionicons name="time-outline" size={13} color="#9A3412" />
              <Text style={styles.peachBadgeText}>Pesanan Baru • {item.time_ago}</Text>
            </View>
          )}

          {item.status === 'shipping' && (
            <View style={styles.blueBadge}>
              <Ionicons name="car-outline" size={13} color="#0284C7" />
              <Text style={styles.blueBadgeText}>Siap Kirim • {item.time_ago}</Text>
            </View>
          )}

          {item.status === 'confirmed' && (
            <View style={styles.greyBadge}>
              <Ionicons name="calendar-outline" size={13} color="#475569" />
              <Text style={styles.greyBadgeText}>Jadwal Mendatang</Text>
            </View>
          )}

          {item.status === 'completed' && (
            <View style={styles.greenBadge}>
              <Ionicons name="checkmark-circle-outline" size={13} color="#16A34A" />
              <Text style={styles.greenBadgeText}>Selesai</Text>
            </View>
          )}

          <Text style={styles.orderCodeText}>#{item.order_code}</Text>
        </View>

        {/* Customer Profile Row */}
        <View style={styles.customerRow}>
          <Image source={{ uri: item.customer_avatar }} style={styles.customerAvatar} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerNameText}>{item.customer_name}</Text>
            <Text style={styles.customerSubText}>{item.customer_university}</Text>
          </View>
        </View>

        {/* Gray/Blue Details Container Box */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsTitleRow}>
            <Text style={styles.serviceNameText} numberOfLines={2}>
              {item.service_name}
            </Text>
            <Text style={styles.priceText}>
              Rp{item.price.toLocaleString('id-ID')}
            </Text>
          </View>

          {item.estimate_arrival ? (
            <View style={styles.specRow}>
              <Ionicons name="time-outline" size={14} color="#C2410C" />
              <Text style={styles.specText}>{item.estimate_arrival}</Text>
            </View>
          ) : (
            <View style={styles.specRow}>
              <Ionicons name="calendar-outline" size={14} color="#C2410C" />
              <Text style={styles.specText}>
                {item.schedule_date} • {item.schedule_time}
              </Text>
            </View>
          )}

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

          {/* Sub-row: Payment status + Package type */}
          <View style={styles.paymentSubRow}>
            <View style={styles.paymentTag}>
              <Text style={styles.paymentTagText}>{item.payment_status}</Text>
            </View>
            <Text style={styles.packageTypeText}>{item.package_type}</Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.rejectButton, isUpdating && { opacity: 0.6 }]}
              onPress={() => confirmReject(item)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectButtonText}>Tolak</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, isUpdating && { opacity: 0.6 }]}
              onPress={() => handleUpdateStatus(item, 'confirmed')}
              disabled={isUpdating}
              activeOpacity={0.88}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.acceptButtonText}>Terima Pesanan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'shipping' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() =>
                Alert.alert('Chat Pembeli', `Membuka percakapan dengan ${item.customer_name}`)
              }
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#C2410C" />
              <Text style={styles.chatButtonText}>Chat Pembeli</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shipButton}
              onPress={() => handleUpdateStatus(item, 'completed')}
              activeOpacity={0.88}
            >
              <Ionicons name="car" size={18} color="#FFFFFF" />
              <Text style={styles.shipButtonText}>Kirim Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'confirmed' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.fullDetailButton}
              onPress={() => {
                navigation.navigate('OrderDetail', {
                  id: item.id,
                  order_code: item.order_code,
                  service_name: item.service_name,
                  customer_name: item.customer_name,
                  customer_location: item.location_detail,
                  price: item.price,
                  status: 'confirmed',
                });
              }}
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
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.topHeaderIcon}
        >
          <Ionicons name="arrow-back" size={22} color="#8C3B00" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Detail Pesanan</Text>
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
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#FF6B00" />
        }
      >
        {/* Dark Navy Hero Card */}
        <View style={styles.darkHeroCard}>
          <Text style={styles.heroSubHeader}>Vendor Portal • JogjaHub</Text>

          <View style={styles.heroTitleRow}>
            <View style={styles.heroTitleLeft}>
              <View style={styles.storeIconWrapper}>
                <Ionicons name="storefront-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.heroMainTitle}>Kelola Pesanan</Text>
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
                <Text style={styles.statLabel}>Hari Ini</Text>
                <Text style={styles.statValue}>
                  <Text style={{ fontWeight: '800' }}>{todayCount}</Text> Order
                </Text>
              </View>
            </View>

            <View style={styles.heroStatBox}>
              <View style={styles.statIconWrap}>
                <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Perlu Konfirmasi</Text>
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
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          scrollEnabled={false}
          contentContainerStyle={styles.ordersListContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Tidak ada pesanan</Text>
              <Text style={styles.emptySubtitle}>
                Pesanan pada kategori ini akan ditampilkan di sini.
              </Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  orderCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Customer Row */
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