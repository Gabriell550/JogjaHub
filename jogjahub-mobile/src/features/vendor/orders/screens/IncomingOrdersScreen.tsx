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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  Hourglass,
  CheckCircle2,
  XCircle,
  MessageCircle,
  MapPin,
  ClipboardList,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { bookingApi } from '../../../../api/bookingApi';
import Toast from 'react-native-toast-message';
import type { VendorOrdersStackParamList } from '../../../../navigation/types';

// FR-10: daftar pesanan masuk, tombol accept/reject.
// Catatan: status 'completed' belum ada di backend (enum BookingStatus cuma
// pending/confirmed/cancelled). Status "Selesai" di layar ini murni penanda LOKAL
// (disimpan di state completedMap), BELUM tersimpan ke server. Begitu backend
// nambahin field ini, ganti completedMap jadi baca dari data booking asli.

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
type DisplayStatus = BookingStatus | 'completed';

type Booking = {
  id: string;
  order_code: string;
  service_name: string;
  customer_name: string;
  customer_location: string;
  price: number;
  status: BookingStatus;
  photo_url?: string;
};

const FILTERS: { key: 'all' | DisplayStatus; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'confirmed', label: 'Diproses' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_CONFIG: Record<DisplayStatus, { label: string; icon: any; color: string; bg: string }> = {
  pending:   { label: 'Menunggu',       icon: Bell,         color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: 'Sedang Diproses', icon: Hourglass,    color: '#2563EB', bg: '#DBEAFE' },
  cancelled: { label: 'Dibatalkan',     icon: XCircle,      color: '#DC2626', bg: '#FEE2E2' },
  completed: { label: 'Selesai',        icon: CheckCircle2, color: '#16A34A', bg: '#DCFCE7' },
};

// ⚠️ Defensif: beberapa data booking dari backend ternyata punya field `price`
// yang undefined/null. Fallback ke 0 supaya app tidak crash.
function formatRupiah(value: number | undefined | null) {
  return `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`;
}

export default function IncomingOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorOrdersStackParamList>>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | DisplayStatus>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bookingApi.listIncomingBookings();
      setBookings(res.data.data ?? res.data);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gagal memuat pesanan',
        text2: 'Coba tarik ke bawah untuk refresh.',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Optimistic update: UI langsung pindah status duluan supaya terasa instan.
  // Kalau ternyata API gagal, di-rollback balik ke status semula + toast error,
  // jadi kegagalan network/server tetap kelihatan, tidak diam-diam gagal.
  const handleUpdateStatus = async (booking: Booking, newStatus: 'confirmed' | 'cancelled') => {
    const previousStatus = booking.status;
    setUpdatingId(booking.id);

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: newStatus } : b))
    );

    try {
      await bookingApi.updateBookingStatus(booking.id, newStatus);
      Toast.show({
        type: 'success',
        text1: newStatus === 'confirmed' ? 'Pesanan diterima' : 'Pesanan ditolak',
        text2: `${booking.service_name} berhasil diperbarui.`,
        position: 'top',
      });
    } catch (err) {
      // rollback
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: previousStatus } : b))
      );
      Toast.show({
        type: 'error',
        text1: 'Gagal memperbarui status',
        text2: 'Perubahan dibatalkan, coba lagi.',
        position: 'top',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmReject = (booking: Booking) => {
    Alert.alert(
      'Tolak Pesanan',
      `Yakin mau tolak pesanan dari "${booking.customer_name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Tolak', style: 'destructive', onPress: () => handleUpdateStatus(booking, 'cancelled') },
      ]
    );
  };

  const getDisplayStatus = (b: Booking): DisplayStatus =>
    completedMap[b.id] ? 'completed' : b.status;

  const markAsCompleted = (booking: Booking) => {
    setCompletedMap((prev) => ({ ...prev, [booking.id]: true }));
    Toast.show({
      type: 'success',
      text1: 'Ditandai selesai',
      text2: 'Catatan: belum tersimpan ke server (fitur backend menyusul).',
      position: 'top',
    });
  };

  const filteredBookings =
    activeFilter === 'all'
      ? bookings
      : bookings.filter((b) => getDisplayStatus(b) === activeFilter);

  // Hitung jumlah pesanan per status, dipakai buat angka di samping label filter chip.
  const countFor = (key: 'all' | DisplayStatus) =>
    key === 'all' ? bookings.length : bookings.filter((b) => getDisplayStatus(b) === key).length;

  // ─── CARD ────────────────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: Booking }) => {
    const displayStatus = getDisplayStatus(item);
    const config        = STATUS_CONFIG[displayStatus];
    const StatusIcon    = config.icon;
    const isUpdating    = updatingId === item.id;

    return (
      <View style={styles.card}>
        <View style={[styles.cardStripe, { backgroundColor: config.color }]} />

        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <StatusIcon size={12} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
            <Text style={styles.orderCode}>#{item.order_code}</Text>
          </View>

          <Text style={styles.serviceName} numberOfLines={2}>{item.service_name}</Text>

          <View style={styles.customerRow}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <Text style={styles.thumbnailInitial}>
                  {item.customer_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{item.customer_name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={11} color={colors.secondary} />
                <Text style={styles.customerLocation} numberOfLines={1}>
                  {item.customer_location}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Total Harga</Text>
              <Text
                style={[
                  styles.price,
                  { color: displayStatus === 'cancelled' ? colors.secondary : colors.primary },
                ]}
              >
                {formatRupiah(item.price)}
              </Text>
            </View>

            {displayStatus === 'pending' && (
              <View style={styles.actionGroup}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnReject, isUpdating && { opacity: 0.6 }]}
                  onPress={() => confirmReject(item)}
                  disabled={isUpdating}
                >
                  <Text style={styles.actionBtnRejectText}>Tolak</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary, isUpdating && { opacity: 0.6 }]}
                  onPress={() => handleUpdateStatus(item, 'confirmed')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionBtnPrimaryText}>Terima</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {displayStatus === 'confirmed' && (
              <View style={styles.actionGroup}>
                <TouchableOpacity style={styles.iconBtn}>
                  <MessageCircle size={17} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSuccess]}
                  onPress={() => markAsCompleted(item)}
                >
                  <Text style={styles.actionBtnSuccessText}>Kirim Selesai</Text>
                </TouchableOpacity>
              </View>
            )}

            {displayStatus === 'completed' && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
                <Text style={styles.actionBtnOutlineText}>Lihat Invoice</Text>
              </TouchableOpacity>
            )}

            {displayStatus === 'cancelled' && (
              <View style={styles.cancelledTag}>
                <XCircle size={12} color="#DC2626" />
                <Text style={styles.cancelledText}>Dibatalkan</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerDecorCircleLarge} />
        <View style={styles.headerDecorCircleSmall} />

        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <ClipboardList size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Pesanan Masuk</Text>
            <Text style={styles.subtitle}>Kelola pesanan pelanggan Anda</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const count = countFor(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.filterChipCount, isActive && styles.filterChipCountActive]}>
                <Text style={[styles.filterChipCountText, isActive && styles.filterChipCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
              <Text style={styles.emptyText}>
                Pesanan baru akan muncul di sini saat pelanggan melakukan booking.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 60,
    paddingBottom: spacing.stackLg,
    backgroundColor: colors.primaryContainer,
    borderBottomLeftRadius: radius.xl * 1.5,
    borderBottomRightRadius: radius.xl * 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  headerDecorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryFixed,
    opacity: 0.35,
  },
  headerDecorCircleSmall: {
    position: 'absolute',
    bottom: -20,
    right: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.onPrimaryContainer,
    opacity: 0.12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm },
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: colors.onPrimaryContainer,
    marginTop: 1,
  },

  filterScroll: {
    backgroundColor: '#fff',
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterRow: {
    paddingHorizontal: spacing.containerMargin,
    gap: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: colors.secondary,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterChipCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterChipCountText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  filterChipCountTextActive: {
    color: '#fff',
  },

  listContent: {
    padding: spacing.containerMargin,
    gap: 12,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardStripe: {
    height: 4,
    width: '100%',
  },
  cardInner: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  serviceName: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 12,
    lineHeight: 21,
  },
  orderCode: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  customerName: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  customerLocation: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: colors.secondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 11,
    color: colors.secondary,
    marginBottom: 2,
  },
  price: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 17,
    fontWeight: '700',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnPrimaryText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnReject: {
    backgroundColor: '#FEE2E2',
  },
  actionBtnRejectText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  actionBtnSuccessText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
  },
  actionBtnOutlineText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: radius.full,
    backgroundColor: '#EFF6FF',
  },
  cancelledTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#FEE2E2',
  },
  cancelledText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.containerMargin,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});