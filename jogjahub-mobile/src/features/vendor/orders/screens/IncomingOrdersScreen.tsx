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
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { bookingLabel, paymentLabel } from '../../../../types/bookingRecord';
import type { VendorOrdersStackParamList } from '../../../../navigation/types';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

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
  status: BookingStatus;
  custom_note?: string;
  estimate_arrival?: string;
}

const FILTERS = [
  { key: 'all', label: 'Semua', countKey: 'all' },
  { key: 'pending', label: 'Perlu Diproses', countKey: 'pending' },
  { key: 'confirmed', label: 'Terkonfirmasi', countKey: 'confirmed' },
  { key: 'cancelled', label: 'Dibatalkan', countKey: 'cancelled' },
];

export default function IncomingOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorOrdersStackParamList>>();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await bookingApi.listAllBookings('tenant');
      setOrders(records.map(booking => ({
        id: String(booking.id),
        uuid: booking.uuid,
        order_code: bookingLabel(booking),
        time_ago: booking.created_at ? new Date(booking.created_at).toLocaleDateString('id-ID') : '',
        customer_name: booking.customer?.name ?? 'Pelanggan',
        customer_university: '',
        customer_avatar: booking.customer?.avatar_url ?? '',
        service_name: booking.service?.name ?? 'Layanan',
        price: Number(booking.total_amount ?? 0),
        schedule_date: booking.check_in_date ?? booking.slot?.slot_date.slice(0, 10) ?? 'Tanpa jadwal',
        schedule_time: booking.check_out_date ? 'Check-out ' + booking.check_out_date : booking.slot?.start_time.slice(0, 5) ?? '',
        location_detail: '',
        payment_status: paymentLabel(booking),
        package_type: booking.nights ? booking.nights + ' malam' : '',
        status: booking.status,
      })));
    } catch (error) {
      Toast.show({ type: 'error', text1: apiErrorMessage(error, 'Gagal memuat pesanan. Tarik untuk memuat ulang.') });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleUpdateStatus = async (item: OrderItem, newStatus: 'confirmed' | 'cancelled') => {
    if (updatingId) return;
    setUpdatingId(item.id);
    try {
      await bookingApi.updateBookingStatus(item.uuid, newStatus);
      setOrders(previous => previous.map(order => order.id === item.id ? { ...order, status: newStatus } : order));
      Toast.show({ type: 'success', text1: 'Pesanan diperbarui' });
    } catch (error) {
      Alert.alert('Gagal memperbarui pesanan', apiErrorMessage(error, 'Coba lagi nanti.'));
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

          {item.status === 'confirmed' && (
            <View style={styles.greyBadge}>
              <Ionicons name="calendar-outline" size={13} color="#475569" />
              <Text style={styles.greyBadgeText}>Jadwal Mendatang</Text>
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

        {item.status === 'confirmed' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.fullDetailButton}
              onPress={() => navigation.navigate('OrderDetail', { id: item.uuid })}
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