import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ShoppingBag, Star, CheckCircle2, Clock } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { bookingApi } from '../../../../api/bookingApi';

// ⚠️ Cuma kategori "Order" yang pakai data asli (bookingApi). Review, Payment, dan
// System/Reminder masih dummy — backend belum punya endpoint terpisah untuk itu.
// Ganti MOCK_REVIEWS/MOCK_PAYMENTS/MOCK_REMINDERS begitu endpoint-nya tersedia.

type ActivityType = 'order' | 'review' | 'payment' | 'system';

const FILTERS: { key: 'all' | ActivityType; label: string }[] = [
  { key: 'all', label: 'All Updates' },
  { key: 'order', label: 'Orders' },
  { key: 'review', label: 'Reviews' },
  { key: 'system', label: 'System' },
];

const MOCK_REVIEWS = [
  {
    id: 'rev-1',
    customerName: 'Budi Santoso',
    packageName: 'Graduation Package',
    rating: 5,
    comment: 'Sangat puas dengan layanannya! Kebaya-nya cantik dan pas banget untuk wisuda kemarin.',
    timeAgo: '45m ago',
  },
];

const MOCK_PAYMENTS = [
  { id: 'pay-1', orderCode: 'JH-8810', amount: 450000, timeAgo: '2h ago' },
];

const MOCK_REMINDERS = [
  { id: 'rem-1', title: 'Upcoming Appointment', message: 'Makeup session for Siti Aminah starts in 1 hour.', timeAgo: '5h ago' },
];

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function RecentActivityScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | ActivityType>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bookingApi.listIncomingBookings();
      const data = res.data.data ?? res.data;
      setOrders(data.filter((b: any) => b.status === 'pending').slice(0, 3));
    } catch {
      // gagal diam-diam di sini, layar tetap tampil dengan data dummy lain
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const showOrders = activeFilter === 'all' || activeFilter === 'order';
  const showReviews = activeFilter === 'all' || activeFilter === 'review';
  const showPayments = activeFilter === 'all' || activeFilter === 'payment';
  const showSystem = activeFilter === 'all' || activeFilter === 'system';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
      >
        <Text style={styles.title}>Recent Activity</Text>
        <Text style={styles.subtitle}>Keep track of your latest orders and updates</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ height: spacing.stackLg }} />

        {showOrders &&
          orders.map((order) => (
            <View key={order.id} style={styles.itemRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryFixed }]}>
                <ShoppingBag size={20} color={colors.primary} />
              </View>
              <View style={styles.itemCard}>
                <View style={styles.itemHeaderRow}>
                  <Text style={[styles.itemBadge, { color: colors.primary }]}>NEW ORDER</Text>
                </View>
                <Text style={styles.itemTitle}>{order.service_name}</Text>
                <Text style={styles.itemMeta}>
                  Customer: {order.customer_name} • #{order.order_code}
                </Text>
              </View>
            </View>
          ))}

        {showReviews &&
          MOCK_REVIEWS.map((review) => (
            <View key={review.id} style={styles.itemRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.tertiaryFixed }]}>
                <Star size={20} color={colors.tertiary} />
              </View>
              <View style={styles.itemCard}>
                <View style={styles.itemHeaderRow}>
                  <Text style={[styles.itemBadge, { color: colors.tertiary }]}>NEW REVIEW</Text>
                  <Text style={styles.itemTime}>{review.timeAgo}</Text>
                </View>
                <Text style={styles.reviewComment}>"{review.comment}"</Text>
                <Text style={styles.itemMeta}>
                  {review.customerName} • {review.packageName}
                </Text>
              </View>
            </View>
          ))}

        {showPayments &&
          MOCK_PAYMENTS.map((payment) => (
            <View key={payment.id} style={styles.itemRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <CheckCircle2 size={20} color="#15803D" />
              </View>
              <View style={styles.itemCard}>
                <View style={styles.itemHeaderRow}>
                  <Text style={[styles.itemBadge, { color: '#15803D' }]}>PAYMENT SUCCESS</Text>
                  <Text style={styles.itemTime}>{payment.timeAgo}</Text>
                </View>
                <Text style={styles.itemTitle}>Payment Received: {formatRupiah(payment.amount)}</Text>
                <Text style={styles.itemMeta}>Order #{payment.orderCode} has been fully paid.</Text>
              </View>
            </View>
          ))}

        {showSystem &&
          MOCK_REMINDERS.map((reminder) => (
            <View key={reminder.id} style={styles.itemRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Clock size={20} color={colors.onSurfaceVariant} />
              </View>
              <View style={styles.itemCard}>
                <View style={styles.itemHeaderRow}>
                  <Text style={[styles.itemBadge, { color: colors.secondary }]}>REMINDER</Text>
                  <Text style={styles.itemTime}>{reminder.timeAgo}</Text>
                </View>
                <Text style={styles.itemTitle}>{reminder.title}</Text>
                <Text style={styles.itemMeta}>{reminder.message}</Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingBottom: spacing.sectionGap },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.secondary,
    marginTop: 2,
    marginBottom: spacing.stackLg,
  },
  filterScroll: { flexGrow: 0 },
  filterChip: {
    paddingHorizontal: spacing.stackLg,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    marginRight: spacing.stackSm,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant },
  filterChipTextActive: { color: colors.onPrimary },
  itemRow: { flexDirection: 'row', gap: spacing.stackMd, marginBottom: spacing.stackLg },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemBadge: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  itemTime: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.secondary },
  itemTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 15, color: colors.onSurface, marginBottom: 4 },
  itemMeta: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.secondary },
  reviewComment: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: colors.onSurface,
    fontStyle: 'italic',
    marginBottom: 6,
  },
});