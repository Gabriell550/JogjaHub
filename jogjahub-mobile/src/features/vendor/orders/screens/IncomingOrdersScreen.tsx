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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Hourglass, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { bookingApi } from '../../../../api/bookingApi';
import Toast from 'react-native-toast-message';
import type { VendorOrdersStackParamList } from '../../../../navigation/types';

// FR-10: daftar pesanan masuk, tombol accept/reject.
// Catatan: status 'completed' belum ada di backend (enum BookingStatus cuma
// pending/confirmed/cancelled), jadi tombol "selesai" belum diimplementasi di sini.

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

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

const FILTERS: { key: 'all' | BookingStatus; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Diterima' },
  { key: 'confirmed', label: 'Diproses' },
];

const STATUS_CONFIG: Record<BookingStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'Diterima', icon: Bell, color: colors.tertiary },
  confirmed: { label: 'Sedang Diproses', icon: Hourglass, color: colors.primaryContainer },
  cancelled: { label: 'Dibatalkan', icon: CheckCircle2, color: colors.error },
};

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function IncomingOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorOrdersStackParamList>>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | BookingStatus>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bookingApi.listIncomingBookings();
      // ⚠️ Sesuaikan `res.data.data` kalau struktur response Laravel-mu beda
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

  const handleUpdateStatus = async (booking: Booking, newStatus: 'confirmed') => {
    setUpdatingId(booking.id);
    try {
      await bookingApi.updateBookingStatus(booking.id, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: newStatus } : b))
      );
      Toast.show({
        type: 'success',
        text1: 'Pesanan diterima',
        text2: `${booking.service_name} berhasil diperbarui.`,
        position: 'top',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gagal memperbarui status',
        text2: 'Coba lagi dalam beberapa saat.',
        position: 'top',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings =
    activeFilter === 'all' ? bookings : bookings.filter((b) => b.status === activeFilter);

  const renderCard = ({ item }: { item: Booking }) => {
    const config = STATUS_CONFIG[item.status];
    const StatusIcon = config.icon;
    const isUpdating = updatingId === item.id;
    const CardWrapper = item.status === 'pending' ? TouchableOpacity : View;
    const cardWrapperProps =
      item.status === 'pending'
        ? { onPress: () => navigation.navigate('OrderDetail', item), activeOpacity: 0.7 }
        : {};

    return (
      <CardWrapper style={[styles.card, { borderLeftColor: config.color }]} {...cardWrapperProps}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={[styles.statusBadge, { backgroundColor: `${config.color}1A` }]}>
              <StatusIcon size={14} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
            <Text style={styles.serviceName}>{item.service_name}</Text>
          </View>
          <Text style={styles.orderCode}>#{item.order_code}</Text>
        </View>

        <View style={styles.customerRow}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
          )}
          <View>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.customerLocation}>{item.customer_location}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.price,
              { color: item.status === 'cancelled' ? colors.secondary : colors.primary },
            ]}
          >
            {formatRupiah(item.price)}
          </Text>

          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.linkAction}
              onPress={() => handleUpdateStatus(item, 'confirmed')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.linkActionText}>Terima Pesanan</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </>
              )}
            </TouchableOpacity>
          )}

          {item.status === 'confirmed' && (
            <View style={styles.actionGroup}>
              <TouchableOpacity style={styles.iconButton}>
                <MessageCircle size={18} color={colors.secondary} />
              </TouchableOpacity>
              <Text style={styles.waitingText}>Menunggu pelaksanaan</Text>
            </View>
          )}

          {item.status === 'cancelled' && (
            <Text style={styles.waitingText}>Dibatalkan oleh customer</Text>
          )}
        </View>
      </CardWrapper>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Transaksi</Text>
        <Text style={styles.subtitle}>Pantau dan kelola semua pesanan pelanggan Anda.</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f.key}
        style={styles.filterList}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const isActive = activeFilter === item.key;
          return (
            <TouchableOpacity
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Belum ada pesanan di kategori ini.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.stackLg,
    paddingBottom: spacing.stackMd,
  },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.secondary,
    marginTop: spacing.stackSm / 2,
  },
  filterList: {
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.stackSm,
    paddingBottom: spacing.stackMd,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.stackLg,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
  },
  filterChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterChipText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    color: colors.secondary,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.sectionGap,
    gap: spacing.stackMd,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: spacing.stackLg,
    marginBottom: spacing.stackMd,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.stackMd,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.stackSm,
  },
  statusText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    color: colors.onSurface,
  },
  orderCode: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.secondary,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackMd,
    marginBottom: spacing.stackMd,
  },
  thumbnail: { width: 56, height: 56, borderRadius: radius.md },
  thumbnailPlaceholder: { backgroundColor: colors.surfaceContainerHigh },
  customerName: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '600',
    color: colors.onSurface,
  },
  customerLocation: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.stackMd,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  price: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  linkAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkActionText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm },
  iconButton: {
    padding: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  filledButton: {
    paddingHorizontal: spacing.stackMd,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
  },
  filledButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    color: colors.onPrimary,
  },
  outlineButton: {
    paddingHorizontal: spacing.stackMd,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  outlineButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    color: colors.secondary,
  },
  waitingText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  emptyState: { alignItems: 'center', paddingVertical: spacing.sectionGap },
  emptyText: {
    fontFamily: typography.bodyMd.fontFamily,
    color: colors.secondary,
  },
});