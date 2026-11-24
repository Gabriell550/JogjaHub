import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing } from '../../../../constants/theme';
import { TenantStatisticsCards } from '../components/TenantStatisticsCards';
import { useTenantBookings } from '../../dashboard/useTenantBookings';


export default function VendorStatisticsScreen() {
  const navigation = useNavigation();
  const active = useIsFocused();

  const { records, error, reload } = useTenantBookings();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Statistik</Text>
        <View style={{ width: 22 }} />
      </View>

      {error && <Text onPress={reload}>Statistik gagal dimuat. Coba lagi.</Text>}
      {!records && !error && <Text>Memuat statistik...</Text>}
      {records?.length === 0 && <Text>Belum ada transaksi untuk dihitung.</Text>}
      <TenantStatisticsCards records={records} initialPeriod="week" active={active} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60, paddingBottom: spacing.sectionGap, gap: spacing.stackSm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.stackLg },
  title: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
  },
});
