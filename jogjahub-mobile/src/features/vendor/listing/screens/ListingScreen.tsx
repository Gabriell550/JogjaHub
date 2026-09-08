import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  Alert,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pencil, Trash2, ImageOff, Search, Eye, ShoppingBag, Star, PackagePlus } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { API_BASE_URL } from '../../../../constants/config';
import { Card } from '../../../../components/Card/Card';
import { vendorApi } from '../../../../api/vendorApi';
import Toast from 'react-native-toast-message';
import type { VendorServicesStackParamList } from '../../../../navigation/types';

type ServicePhoto = { url: string; is_primary: boolean; sort_order: number };

type ServiceItem = {
  id: number;
  name: string;
  price: number;
  description?: string;
  photos?: ServicePhoto[];
  subcategory?: { id: number; name: string; category?: { id: number; name: string } };
};

const formatRupiah = (n: number) => `Rp${Number(n).toLocaleString('id-ID')}`;

const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/storage/';

function getPrimaryPhotoUrl(item: ServiceItem): string | null {
  if (!item.photos || item.photos.length === 0) return null;
  const primary = item.photos.find((p) => p.is_primary) ?? item.photos[0];
  return `${STORAGE_BASE_URL}${primary.url}`;
}

// ⚠️ DUMMY: backend belum punya field views/order_count/rating di Service model.
// Angka di sini di-generate deterministik dari id (biar konsisten tiap render, bukan
// acak ulang tiap kali list di-render), BUKAN data asli. Ganti fungsi ini begitu
// backend nyediain field aslinya, dan hapus generator di bawah.
function getDummyStats(id: number) {
  const seed = id * 37;
  return {
    views: 100 + (seed % 900),
    orders: 5 + (seed % 60),
    rating: (4 + ((seed % 10) / 10)).toFixed(1),
  };
}

// FR: kelola layanan/produk yang dijual vendor (create/read/update/delete).
export default function ListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorServicesStackParamList>>();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleMap, setVisibleMap] = useState<Record<number, boolean>>({});

  const loadServices = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await vendorApi.listMyServices();
      setServices(res.data?.data?.data ?? []);
    } catch (err) {
      console.log('Gagal ambil layanan:', err);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices]),
  );

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.trim().toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.subcategory?.name.toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  const confirmDelete = (item: ServiceItem) => {
    Alert.alert(
      'Hapus Layanan',
      `Yakin mau hapus "${item.name}"? Tindakan ini tidak bisa dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => handleDelete(item.id) },
      ]
    );
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await vendorApi.deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      Toast.show({ type: 'success', text1: 'Layanan dihapus', position: 'top' });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gagal menghapus layanan',
        text2: 'Coba lagi dalam beberapa saat.',
        position: 'top',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Layanan Saya</Text>
          <Pressable style={styles.addButton} onPress={() => navigation.navigate('ServiceForm', { mode: 'create' })}>
            <Text style={styles.addButtonText}>+ Tambah</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color={colors.secondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari Layanan..."
            placeholderTextColor={colors.secondary}
          />
        </View>
      </View>

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadServices(true)} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <PackagePlus size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Kelola semua layananmu di sini.</Text>
              <Text style={styles.emptySubtitle}>Tambahkan layanan baru untuk jangkauan yang lebih luas.</Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.stackSm }} />}
        renderItem={({ item }) => {
          const photoUrl = getPrimaryPhotoUrl(item);
          const stats = getDummyStats(item.id);
          return (
            <Card>
              <View style={styles.cardRow}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <ImageOff size={20} color={colors.secondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  {item.subcategory ? <Text style={styles.serviceCategory}>{item.subcategory.name}</Text> : null}
                  <Text style={styles.servicePrice}>{formatRupiah(item.price)}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Eye size={14} color={colors.secondary} />
                  <Text style={styles.statText}>{stats.views} dilihat</Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => navigation.navigate('ServiceOrders', { serviceId: item.id, serviceName: item.name })}
                >
                  <ShoppingBag size={14} color={colors.secondary} />
                  <Text style={[styles.statText, styles.statTextLink]}>{stats.orders} dipesan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => navigation.navigate('ServiceReviews', { serviceId: item.id, serviceName: item.name })}
                >
                  <Star size={14} color="#F5A623" fill="#F5A623" />
                  <Text style={[styles.statText, styles.statTextLink]}>{stats.rating}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Tampilkan</Text>
                <Switch
                  value={visibleMap[item.id] ?? true}
                  onValueChange={(val) => setVisibleMap((prev) => ({ ...prev, [item.id]: val }))}
                  trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('ServiceForm', { mode: 'edit', service: item })}
                >
                  <Pencil size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => confirmDelete(item)}
                  disabled={deletingId === item.id}
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>
                    {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 60,
    paddingBottom: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.stackMd,
  },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: '700',
    color: colors.onSurface,
  },
  addButton: { backgroundColor: colors.primaryContainer, borderRadius: radius.full, paddingVertical: 10, paddingHorizontal: 18 },
  addButtonText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onPrimary, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    color: colors.onSurface,
    padding: 0,
  },
  listContent: { padding: spacing.containerMargin, paddingTop: spacing.stackMd, flexGrow: 1 },
  cardRow: { flexDirection: 'row', gap: spacing.stackMd, width: '100%', alignItems: 'center' },
  thumbnail: { width: 64, height: 64, borderRadius: radius.md },
  thumbnailPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontFamily: typography.titleMd.fontFamily, fontSize: 15, fontWeight: '600', color: colors.onSurface },
  serviceCategory: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  servicePrice: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.primary, fontWeight: '700', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.stackLg,
    marginTop: spacing.stackMd,
    paddingTop: spacing.stackSm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    width: '100%',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.secondary },
  statTextLink: { textDecorationLine: 'underline', color: colors.primary },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.stackSm,
    paddingTop: spacing.stackSm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    width: '100%',
  },
  toggleLabel: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurface },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.stackLg,
    marginTop: spacing.stackSm,
    paddingTop: spacing.stackSm,
    width: '100%',
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: spacing.sectionGap, paddingHorizontal: spacing.containerMargin },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.stackMd,
  },
  emptyTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
});