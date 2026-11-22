import React, { useState, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { tenantColors, tenantLayout } from '../../../../constants/theme/tenant';
import { TenantDockLayoutContext } from '../../../../navigation/TenantDockLayoutContext';
import { TenantPressable } from '../../components/TenantPressable';
import { dashboardStyles } from '../components/tenantDashboardStyles';
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
import { MyServicesSection } from '../components/MyServicesSection';

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

// TODO: 5 titik ini idealnya dari rekap booking per jam (bookingApi) begitu endpoint tenant
// aktif. `peakHour` dipilih otomatis dari nilai tertinggi kalau nanti datanya dinamis.
const MOCK_SALES_ACTIVITY = {
  amount: 3_400_000,
  growthPercent: 15,
  completedCount: 18,
  chartData: [
    { hour: '08:00', value: 0.2 },
    { hour: '11:00', value: 0.45 },
    { hour: '14:00', value: 1 },
    { hour: '17:00', value: 0.6 },
    { hour: '20:00', value: 0.3 },
  ],
  peakHour: '14:00',
  avgPerOrder: 188_800,
};

export default function VendorDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const closedSceneHeight = useContext(TenantDockLayoutContext);
  const redesigned = closedSceneHeight !== null;
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
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

    // FIX: 'OrderDetail' itu layar di DALAM stack Orders (VendorOrdersStackNavigator), bukan
    // layar langsung yang dikenal dari stack Dashboard — jadi harus lewat nested navigation
    // { screen, params }. Juga wajib kirim data booking LENGKAP (bukan cuma orderId), karena
    // OrderDetailScreen baca field seperti price/order_code langsung dari route params.
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    navigation.navigate('Orders', {
      screen: 'OrderDetail',
      params: {
        id: order.id,
        order_code: `JH-${order.id.padStart(4, '0')}`,
        service_name: order.title,
        customer_name: order.buyerName,
        customer_location: 'Yogyakarta', // TODO: ganti data asli begitu bookingApi sudah aktif
        price: order.price,
        status: order.status,
      },
    });
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
      disabled: true,
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
      disabled: true,
      onPress: () => {/* TODO */},
    },
  ];

  const handleSeeAllServices = () => {
    navigation.navigate('Listing', { screen: 'ServicesList' });
  };

  const handleAddService = () => {
    navigation.navigate('Listing', { screen: 'ServiceForm', params: { mode: 'create' } });
  };

  const handlePressService = (service: { id: number; name: string; price: number; photos?: any[] }) => {
    // Konsisten dengan tap kartu layanan di ListingScreen sendiri -> langsung ke mode edit.
    navigation.navigate('Listing', { screen: 'ServiceForm', params: { mode: 'edit', service } });
  };

  const unviewedOrders = getUnviewedOrders();

  const header = (
    <VendorHeaderBar
      businessName={businessName ?? 'Vendor'}
      isOpen={isOpen}
      onToggleOpen={() => setIsOpen((v) => !v)}
    />
  );
  const hero = (
    <SaldoTokoCard
      balance={MOCK_SUMMARY.estimatedRevenue}
      onTarik={redesigned ? undefined : () => {/* TODO: fitur tarik dana belum ada di scope MVP PRD */}}
      onRiwayat={redesigned ? undefined : () => {/* TODO: fitur riwayat dompet belum ada di scope MVP PRD */}}
      onPesanan={() => navigation.navigate('Orders')}
    />
  );
  const performance = (
    <PerformaCard
      label="Pendapatan Hari Ini"
      amount={MOCK_SALES_ACTIVITY.amount}
      growthPercent={MOCK_SALES_ACTIVITY.growthPercent}
      completedCount={MOCK_SALES_ACTIVITY.completedCount}
      chartData={MOCK_SALES_ACTIVITY.chartData}
      peakHour={MOCK_SALES_ACTIVITY.peakHour}
      avgPerOrder={MOCK_SALES_ACTIVITY.avgPerOrder}
      onSeeAnalysis={() => navigation.navigate('Statistics')}
    />
  );
  const quickActions = <QuickActionsGrid actions={actions} />;
  const services = (
    <MyServicesSection
      onSeeAll={handleSeeAllServices}
      onAddService={handleAddService}
      onPressService={handlePressService}
    />
  );
  const notifications = unviewedOrders.length > 0 && (
    <OrderNotificationCard
      orders={unviewedOrders}
      onPressOrder={handleOrderPress}
      onMarkAllViewed={handleMarkAllViewed}
    />
  );
  const renderOrder = (order: OrderType) => (
    <OrderPreviewCard
      key={order.id}
      title={order.title}
      badgeLabel={order.badgeLabel}
      buyerName={order.buyerName}
      timeAgo={order.timeAgo}
      price={order.price}
      icon={order.id === '2' ? IconlyCalendar : undefined}
    />
  );
  const seeOrders = () => navigation.navigate('Orders');
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />;

  if (redesigned) {
    return (
      <TenantDashboardLayout
        closedSceneHeight={closedSceneHeight}
        header={header}
        hero={hero}
        refreshControl={refreshControl}
      >
        <View style={tenantStyles.summary}>
          {quickActions}
          {performance}
        </View>
        {services}
        {notifications}
        <View style={tenantStyles.orders}>
          <View style={dashboardStyles.headingRow}>
            <Text accessibilityRole="header" style={dashboardStyles.heading}>Pesanan masuk</Text>
            <TenantPressable accessibilityRole="button" accessibilityLabel="Lihat Semua Pesanan" style={dashboardStyles.link} onPress={seeOrders}>
              <Text style={dashboardStyles.linkText}>Lihat Semua</Text>
            </TenantPressable>
          </View>
          <Text style={dashboardStyles.sample}>Data contoh</Text>
          <View style={tenantStyles.orderList}>{MOCK_ORDERS.map(renderOrder)}</View>
        </View>
      </TenantDashboardLayout>
    );
  }

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={refreshControl}
      >
        {hero}
        {performance}
        <View style={{ height: spacing.stackMd }} />
        <View style={{ height: spacing.stackMd }} />
        {quickActions}
        {services}
        {notifications && (
          <View style={{ marginTop: spacing.stackMd }}>
            {notifications}
          </View>
        )}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pesanan masuk</Text>
          <Text style={styles.seeAll} onPress={seeOrders}>Lihat Semua</Text>
        </View>
        {MOCK_ORDERS.map((order) => (
          <View key={order.id} style={{ marginBottom: spacing.stackSm }}>
            {renderOrder(order)}
          </View>
        ))}
        <View style={{ height: spacing.stackSm }} />
      </ScrollView>
    </View>
  );
}

function TenantDashboardLayout({ closedSceneHeight, header, hero, refreshControl, children }: {
  closedSceneHeight: number;
  header: ReactNode;
  hero: ReactNode;
  refreshControl: React.ReactElement;
  children: ReactNode;
}) {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const safeWidth = width - insets.left - insets.right;
  const gutter = safeWidth < tenantLayout.narrowWidth ? spacing.gutter : spacing.containerMargin;
  const columnWidth = safeWidth >= tenantLayout.tabletWidth
    ? tenantLayout.maxContentWidth
    : Math.max(0, safeWidth - gutter * 2);
  const scrollHeader = closedSceneHeight < 560 || fontScale > tenantLayout.largeFontScale;
  const horizontalInsets = { paddingLeft: insets.left, paddingRight: insets.right };
  const headerBlock = (
    <View style={[tenantStyles.header, horizontalInsets]}>
      <View style={{ width: columnWidth }}>{header}</View>
    </View>
  );

  return (
    <View style={tenantStyles.screen}>
      {focused && <StatusBar barStyle="light-content" />}
      <View style={[tenantStyles.header, { height: insets.top }]} />
      {!scrollHeader && headerBlock}
      <ScrollView
        style={tenantStyles.scroll}
        contentContainerStyle={tenantStyles.scrollContent}
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustsScrollIndicatorInsets={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={refreshControl}
      >
        {scrollHeader && headerBlock}
        <View style={tenantStyles.canvas}>
          <View aria-hidden pointerEvents="none" style={tenantStyles.transition} />
          <View aria-hidden pointerEvents="none" style={tenantStyles.roundedCanvas} />
          <View style={[tenantStyles.columnHost, horizontalInsets]}>
            <View style={{ width: columnWidth }}>
              {hero}
              {children}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const tenantStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tenantColors.canvas },
  header: { backgroundColor: colors.navy, alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  canvas: { flexGrow: 1 },
  transition: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 32 + radius.xl, backgroundColor: colors.navy,
  },
  roundedCanvas: {
    position: 'absolute', top: 32, left: 0, right: 0, bottom: 0,
    backgroundColor: tenantColors.canvas, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
  },
  columnHost: { alignItems: 'center', paddingBottom: spacing.stackMd },
  summary: { gap: spacing.stackMd, marginTop: spacing.stackMd },
  orders: { gap: 4, marginTop: spacing.stackLg },
  orderList: { gap: 8, marginTop: 4 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingBottom: spacing.sectionGap },
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
