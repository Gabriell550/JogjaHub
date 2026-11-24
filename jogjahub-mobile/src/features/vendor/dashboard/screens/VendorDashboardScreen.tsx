import React, { useState, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, useWindowDimensions } from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
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
import { IconlyBag } from '../../../../components/icons/iconlyBag';
import { bookingApi } from '../../../../api/bookingApi';
import { type BookingRecord } from '../../../../types/bookingRecord';
import { orderTracking } from '../../../../utils/orderTracking';
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

export default function VendorDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const closedSceneHeight = useContext(TenantDockLayoutContext);
  const redesigned = closedSceneHeight !== null;
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
  const businessName = useSelector(
  (state: RootState) => state.auth?.businessName
);

  const orders: OrderType[] = bookings.flatMap(booking => {
    if (booking.status === 'cancelled') return [];
    return [{
      id: booking.uuid,
      title: booking.service?.name ?? 'Layanan',
      badgeLabel: booking.status === 'pending' ? 'TERBARU' : 'DIPROSES',
      buyerName: booking.customer?.name ?? 'Pelanggan',
      timeAgo: booking.created_at ? new Date(booking.created_at).toLocaleDateString('id-ID') : '',
      price: Number(booking.total_amount ?? 0),
      status: booking.status,
    }];
  });
  const paidTotal = bookings.reduce((total, booking) =>
    total + (booking.payment?.status === 'paid' ? Number(booking.total_amount ?? 0) : 0), 0);

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

    navigation.navigate('Orders', { screen: 'OrderDetail', params: { id: orderId }, initial: false });
  };

  const handleMarkAllViewed = async () => {
    const unviewedIds = getUnviewedOrders().map((o) => o.id);
    if (unviewedIds.length > 0) {
      await orderTracking.markMultipleAsViewed(unviewedIds);
      setViewedOrderIds((prev) => new Set([...prev, ...unviewedIds]));
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoadError(false);
    try {
      setBookings(await bookingApi.listAllBookings('tenant'));
    } catch {
      setLoadError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void onRefresh(); }, [onRefresh]));

  const actions = [
    {
      key: 'listing',
      icon: IconlyBag,
      label: 'Produk Anda',
      iconBg: colors.orangePale,
      onPress: () => navigation.navigate('Listing'),
    },
    {
      key: 'stats',
      icon: IconlyChart,
      label: 'Statistik',
      iconBg: colors.accentGreenContainer,
      onPress: () => navigation.navigate('Statistics'),
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
      onPressBell={() => navigation.navigate('RecentActivity')}
      onPressAvatar={() => navigation.navigate('Profile')}
    />
  );
  const hero = (
    <SaldoTokoCard
      balance={paidTotal}
      onPesanan={() => navigation.navigate('Orders')}
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
      onPress={() => handleOrderPress(order.id)}
    />
  );
  const orderState = loadError
    ? <Text onPress={onRefresh}>Pesanan gagal dimuat. Coba lagi.</Text>
    : !refreshing && !orders.length ? <Text>Belum ada pesanan masuk.</Text> : null;
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
          {orderState}
          <View style={tenantStyles.orderList}>{orders.slice(0, 4).map(renderOrder)}</View>
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
        {orderState}
        {orders.slice(0, 4).map((order) => (
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
