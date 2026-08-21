import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { VendorHeaderBar } from '../components/VendorHeaderBar';
import { RevenueCard } from '../components/RevenueCard';
import { QuickActionsGrid } from '../components/QuickActionsGrid';
import { OrderPreviewCard } from '../components/OrderPreviewCard';
import { SellingTipCard } from '../components/SellingTipCard';
import type { VendorTabParamList } from '../../../../navigation/types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store';
import { IconlyChart } from '../../../../components/icons/iconlyChart';
import { IconlyCalendar } from '../../../../components/icons/iconlyCalendar';
import { IconlyBag } from '../../../../components/icons/iconlyBag';
import { IconlyTicket } from '../../../../components/icons/iconlyTicket';
import { IconlyWallet } from '../../../../components/icons/iconlyWallet';

type Nav = BottomTabNavigationProp<VendorTabParamList>;

// TODO: ganti semua data mock di bawah dengan vendorApi.getMyProfile() + bookingApi.listIncomingBookings()
// begitu endpoint vendor sudah tersedia dari backend. Bentuk datanya sudah disiapkan mendekati
// response yang diharapkan supaya nanti tinggal ganti sumbernya, bukan tulis ulang tampilannya.

const MOCK_REVENUE = {
  amount: 12_450_000,
};
const MOCK_RECENT_ORDERS = [
  { id: '1', title: 'Anindhya Fathia Rizki', badgeLabel: 'TERBARU' as const, buyerName: 'Andi Wijaya', timeAgo: '2 jam yang lalu', price: 75000 },
  { id: '2', title: 'Bouquet Matahari...', badgeLabel: 'DIPROSES' as const, buyerName: 'Siti Khadijah', timeAgo: '6 jam yang lalu', price: 120000 },
];

export default function VendorDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const businessName = useSelector(
  (state: RootState) => state.auth?.businessName
);

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
      subtitle: 'Kelola listing barang',
      iconBg: colors.tertiaryContainer,
      onPress: () => navigation.navigate('Listing'),
    },
    {
      key: 'promo',
      icon: IconlyWallet,
      label: 'Dompet',
      subtitle: 'Lihat Keuangan Bisnis',
      iconBg: colors.primaryFixed,
      onPress: () => {/* TODO: fitur promosi belum ada di scope MVP PRD */},
    },
    {
      key: 'stats',
      icon: IconlyChart,
      label: 'Statistik',
      subtitle: 'Data pengunjung',
      iconBg: colors.tertiaryFixedDim,
      onPress: () => {/* TODO: layar statistik detail belum dibuat */},
    },
    {
      key: 'reviews',
      icon: IconlyTicket,
      label: 'Ulasan',
      subtitle: 'Respon pelanggan',
      iconBg: colors.errorContainer,
      onPress: () => {/* TODO: layar ulasan belum dibuat */},
    },
  ];

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

        <View style={{ height: spacing.stackLg }} />
        <RevenueCard amount={MOCK_REVENUE.amount}/>

        <View style={{ height: spacing.stackLg }} />
        <QuickActionsGrid actions={actions} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pesanan Baru</Text>
          <Text style={styles.seeAll} onPress={() => navigation.navigate('Orders')}>Lihat Semua</Text>
        </View>
        {MOCK_RECENT_ORDERS.map((order) => (
          <View key={order.id} style={{ marginBottom: spacing.stackSm }}>
            <OrderPreviewCard {...order} />
          </View>
        ))}

        <View style={{ height: spacing.stackSm }} />
        <SellingTipCard
          title="Tips Jualan Hari Ini"
          message="Update foto produk Anda dengan pencahayaan alami untuk meningkatkan klik hingga 25%!"
          ctaLabel="Pelajari Selengkapnya"
          onPressCta={() => {/* TODO: konten edukasi vendor belum ada di scope MVP PRD */}}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingBottom: spacing.sectionGap },
  greetingBlock: {
    backgroundColor: colors.secondaryContainer, // biru muda, sesuai palet DESIGN.md
    borderRadius: radius.lg,
    padding: spacing.stackLg,
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


