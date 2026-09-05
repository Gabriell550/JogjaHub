import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Card } from '../../../../components/Card/Card';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { vendorApi } from '../../../../api/vendorApi';
import type { VendorServicesStackParamList } from '../../../../navigation/types';

type ServiceItem = {
  id: number;
  name: string;
  price: number;
  description?: string;
  subcategory?: { id: number; name: string; category?: { id: number; name: string } };
};

const formatRupiah = (n: number) => `Rp${Number(n).toLocaleString('id-ID')}`;

// FR: kelola layanan/produk yang dijual vendor (create/read/update).
export default function ListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorServicesStackParamList>>();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await vendorApi.listMyServices();
      // Backend paginate() -> { success, data: { data: [...], current_page, ... } }
      setServices(res.data?.data?.data ?? []);
    } catch (err) {
      console.log('Gagal ambil layanan:', err);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  // useFocusEffect (bukan cuma useEffect) supaya list otomatis refresh tiap kali balik
  // dari ServiceForm setelah tambah/edit — tanpa ini, perubahan baru kelihatan setelah reload app.
  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Layanan Saya</Text>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('ServiceForm', { mode: 'create' })}>
          <Text style={styles.addButtonText}>+ Tambah</Text>
        </Pressable>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadServices(true)} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? <EmptyState message="Belum ada layanan. Tambahkan layanan pertamamu!" /> : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.stackSm }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ServiceForm', { mode: 'edit', service: item })}
          >
            <Card>
              <Text style={styles.serviceName}>{item.name}</Text>
              {item.subcategory ? <Text style={styles.serviceCategory}>{item.subcategory.name}</Text> : null}
              <Text style={styles.servicePrice}>{formatRupiah(item.price)}</Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 60,
    paddingBottom: spacing.stackSm,
  },
  title: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
  },
  addButton: { backgroundColor: colors.primaryContainer, borderRadius: radius.full, paddingVertical: 8, paddingHorizontal: 16 },
  addButtonText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onPrimary, fontWeight: '700' },
  listContent: { padding: spacing.containerMargin, paddingTop: spacing.stackSm, flexGrow: 1 },
  serviceName: { fontFamily: typography.titleMd.fontFamily, fontSize: 15, fontWeight: '600', color: colors.onSurface },
  serviceCategory: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  servicePrice: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.primary, fontWeight: '700', marginTop: 4 },
});