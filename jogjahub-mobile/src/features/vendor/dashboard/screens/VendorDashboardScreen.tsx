import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { VendorHeaderBar } from '../components/VendorHeaderBar';
import { QuickActionsGrid } from '../components/QuickActionsGrid';
import { OrderPreviewCard } from '../components/OrderPreviewCard';
import { OrderNotificationCard } from '../components/OrderNotificationCard';
import type { VendorTabParamList, VendorDashboardStackParamList } from '../../../../navigation/types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store';
import { IconlyChart } from '../../../../components/icons/iconlyChart';
import { IconlyCalendar } from '../../../../components/icons/iconlyCalendar';
import { IconlyBag } from '../../../../components/icons/iconlyBag';
import { IconlyTicket } from '../../../../components/icons/iconlyTicket';
import { IconlyWallet } from '../../../../components/icons/iconlyWallet';
import { orderTracking } from '../../../../utils/orderTracking';
import { PerformaCard } from '../components/PerformaCard';
import { SaldoTokoCard } from '../components/SaldoTokoCard';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<VendorDashboardStackParamList>,
  BottomTabNavigationProp<VendorTabParamList>
>;

type OrderType = {
  id: string;
  title: string;
  badgeLabel: 'TERBARU' | 'DIPROSES';
  buyerName: string;
  timeAgo: string;
  price: number;
  status: 'pending' | 'confirmed';
};

// TODO: ganti semua data mock di bawah dengan vendorApi.getMyProfile() + bookingApi.listIncomingBookings()
// begitu endpoint vendor sudah tersedia dari backend. Bentuk datanya sudah disiapkan mendekati
// response yang diharapkan supaya nanti tinggal ganti sumbernya, bukan tulis ulang tampilannya.

const MOCK_REVENUE = {
  amount: 12_450_000,
};
const MOCK_SUMMARY = {
  totalOrders: 128,
  totalOrdersGrowthPercent: 12,
  confirmedOrders: 5,
  estimatedRevenue: 4_250_000,
  completedRevenue: 3_800_000,
  processingRevenue: 450_000,
  storeRating: 4.9,
  ratingCount: 2400,
  avgResponseMinutes: 5,
};

const MOCK_ORDERS: OrderType[] = [
  { id: '1', title: 'Anindhya Fathia Rizki', badgeLabel: 'TERBARU', buyerName: 'Andi Wijaya', timeAgo: '2 jam yang lalu', price: 75000, status: 'pending' },
  { id: '2', title: 'Bouquet Matahari...', badgeLabel: 'DIPROSES', buyerName: 'Siti Khadijah', timeAgo: '6 jam yang lalu', price: 120000, status: 'confirmed' },
  { id: '3', title: 'Paket Wisuda Premium', badgeLabel: 'TERBARU', buyerName: 'Budi Santoso', timeAgo: '30 menit lalu', price: 250000, status: 'pending' },
  { id: '4', title: 'Foto Prewedding', badgeLabel: 'TERBARU', buyerName: 'Dewi Lestari', timeAgo: '1 jam yang lalu', price: 350000, status: 'pending' },
];

export default function VendorDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<OrderType[]>(MOCK_ORDERS);
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
  const businessName = useSelector(
  (state: RootState) => state.auth?.businessName
);

  useEffect(() => {
    loadViewedOrders();
  }, []);

  const loadViewedOrders = async () => {
    const viewed = await orderTracking.getViewedOrders();
    setViewedOrderIds(viewed);
  };

  const getUnviewedOrders = (): OrderType[] => {
    return orders.filter((order) => order.status === 'pending' && !viewedOrderIds.has(order.id));
  };

  const handleOrderPress = async (orderId: string) => {
    if (!viewedOrderIds.has(orderId)) {
      await orderTracking.markAsViewed(orderId);
      setViewedOrderIds((prev) => new Set(prev).add(orderId));
    }
    navigation.navigate('OrderDetail', { orderId });
  };

  const handleMarkAllViewed = async () => {
    const unviewedIds = getUnviewedOrders().map((o) => o.id);
    if (unviewedIds.length > 0) {
      await orderTracking.markMultipleAsViewed(unviewedIds);
      setViewedOrderIds((prev) => new Set([...prev, ...unviewedIds]));
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: panggil ulang vendorApi/bookingApi di sini saat sudah tersambung.
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const actions = [
    {
      key: 'listing',
      icon: IconlyBag,
      label: 'Produk Anda',
      iconBg: colors.orangePale,
      onPress: () => navigation.navigate('Listing'),
    },
    {
      key: 'promo',
      icon: IconlyWallet,
      label: 'Dompet',
      iconBg: colors.primaryFixed,
      onPress: () => {/* TODO */},
    },
    {
      key: 'stats',
      icon: IconlyChart,
      label: 'Statistik',
      iconBg: colors.accentGreenContainer,
      onPress: () => navigation.navigate('Statistics'),
    },
    {
      key: 'reviews',
      icon: IconlyTicket,
      label: 'Ulasan',
      iconBg: colors.grayPale,
      onPress: () => {/* TODO */},
    },
  ];

  const unviewedOrders = getUnviewedOrders();

  return (
    <View style={styles.screen}>
      <VendorHeaderBar />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.greetingBlock}>
        <Text style={styles.greeting}> Halo, {businessName ?? 'Vendor'}! </Text>
          <Text style={styles.subGreeting}>Semoga harimu produktif dan sukses.</Text>
        </View>

        <View style={{ height: spacing.stackMd }} />
        <PerformaCard
          label="Pendapatan Hari ini"
          amount={MOCK_REVENUE.amount}
          subtitle="Dari 45 order"
        />

        <View style={{ height: spacing.stackMd }} />
        <SaldoTokoCard
          balance={MOCK_SUMMARY.estimatedRevenue}
          onTarik={() => {/* TODO */}}
          onRiwayat={() => {/* TODO */}}
        />

        <View style={{ height: spacing.stackMd }} />
        <QuickActionsGrid actions={actions} />

        {unviewedOrders.length > 0 && (
          <View style={{ marginTop: spacing.stackMd }}>
            <OrderNotificationCard
              orders={unviewedOrders}
              onPressOrder={handleOrderPress}
              onMarkAllViewed={handleMarkAllViewed}
            />
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pesanan Terbaru</Text>
          <Text style={styles.seeAll} onPress={() => navigation.navigate('Orders')}>
            Lihat Semua
          </Text>
        </View>
        {MOCK_ORDERS.map((order) => (
          <View key={order.id} style={{ marginBottom: spacing.stackSm }}>
            <OrderPreviewCard
              title={order.title}
              badgeLabel={order.badgeLabel}
              buyerName={order.buyerName}
              timeAgo={order.timeAgo}
              price={order.price}
              icon={order.id === '2' ? IconlyCalendar : undefined}
            />
          </View>
        ))}

        <View style={{ height: spacing.stackSm }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingBottom: spacing.sectionGap },
  greetingBlock: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.lg,
    padding: 14,
    paddingTop: 14,
  },
  greeting: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSecondaryContainer,
  },
  subGreeting: { fontFamily: typography.bodyMd.fontFamily, fontSize: typography.bodyMd.fontSize, color: colors.onSecondaryContainer, marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.stackLg,
    marginBottom: spacing.stackSm,
  },
  sectionTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  seeAll: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.primary, fontWeight: '600' },
});