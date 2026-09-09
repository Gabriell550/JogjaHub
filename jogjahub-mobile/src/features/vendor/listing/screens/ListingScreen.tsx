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
import { Pencil, Trash2, ImageOff, Search, ShoppingBag, Star, PackagePlus, Store, Plus } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { API_BASE_URL } from '../../../../constants/config';
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

// ⚠️ DUMMY: backend belum punya field order_count/rating di Service model.
// Angka di sini di-generate deterministik dari id, BUKAN data asli.
// Ganti fungsi ini begitu backend nyediain field aslinya.
function getDummyStats(id: number) {
  const seed = id * 37;
  return {
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
  const [headerHeight, setHeaderHeight] = useState(0);

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
      {/* Header sticky: absolute + zIndex supaya tetap nempel di atas walau list di-scroll */}
      <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <View style={styles.headerDecorCircleLarge} />
        <View style={styles.headerDecorCircleSmall} />

        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <Store size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Layanan Saya</Text>
            <Text style={styles.titleSubtitle}>
              {services.length} layanan {services.length === 1 ? 'aktif' : 'terdaftar'}
            </Text>
          </View>
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
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: (headerHeight || spacing.stackMd) + spacing.stackLg },
        ]}
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
        ItemSeparatorComponent={() => <View style={{ height: spacing.stackLg }} />}
        renderItem={({ item }) => {
          const photoUrl = getPrimaryPhotoUrl(item);
          const stats = getDummyStats(item.id);
          const categoryLabel = item.subcategory?.category?.name ?? item.subcategory?.name ?? 'Layanan';

          return (
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <View style={styles.photoWrap}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.photo} />
                  ) : (
                    <View style={[styles.photo, styles.photoPlaceholder]}>
                      <ImageOff size={28} color={colors.secondary} />
                    </View>
                  )}
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#F5A623" fill="#F5A623" />
                    <Text style={styles.ratingBadgeText}>{stats.rating}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{categoryLabel.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.serviceName}>{item.name}</Text>

                  {item.description ? (
                    <Text style={styles.serviceDescriptionPreview} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.detailLink}
                    onPress={() =>
                      navigation.navigate('ServiceDetail', {
                        service: {
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          description: item.description,
                          photos: item.photos,
                          subcategory: item.subcategory,
                        },
                      })
                    }
                  >
                    <Text style={styles.detailLinkText}>Lihat Detail</Text>
                  </TouchableOpacity>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Mulai dari</Text>
                    <Text style={styles.price}>{formatRupiah(item.price)}</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <TouchableOpacity
                      style={styles.statItem}
                      onPress={() => navigation.navigate('ServiceOrders', { serviceId: item.id, serviceName: item.name })}
                    >
                      <ShoppingBag size={14} color={colors.primary} />
                      <Text style={styles.statTextLink}>{stats.orders} dipesan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statItem}
                      onPress={() => navigation.navigate('ServiceReviews', { serviceId: item.id, serviceName: item.name })}
                    >
                      <Text style={styles.statTextLink}>Lihat Ulasan</Text>
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
                </View>
              </View>
            </View>
          );
        }}
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('ServiceForm', { mode: 'create' })}
      >
        <Plus size={24} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 6,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 60,
    paddingBottom: spacing.sectionGap * 0.5,
    backgroundColor: colors.primaryContainer,
    borderBottomLeftRadius: radius.xl * 1.5,
    borderBottomRightRadius: radius.xl * 1.5,
    overflow: 'hidden',
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, marginBottom: spacing.stackMd },
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
  titleSubtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: colors.onPrimaryContainer,
    marginTop: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
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
  listContent: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.sectionGap + 56,
    flexGrow: 1,
  },

  // Outer wrapper: pegang shadow/elevation SAJA, tanpa overflow:hidden.
  // Ini penting di Android — kalau overflow:hidden digabung sama elevation di view
  // yang sama, shadow-nya suka hilang/berkedip pas FlatList recycle item saat discroll.
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  // Inner wrapper: yang motong (clip) foto & konten biar rounded corner-nya rapi.
  cardInner: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photoWrap: { width: '100%', height: 160, position: 'relative' },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.stackSm,
    left: spacing.stackSm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingBadgeText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '700', color: colors.onSurface },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.stackSm,
    left: spacing.stackSm,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },

  cardBody: { padding: spacing.stackMd },
  serviceName: { fontFamily: typography.titleMd.fontFamily, fontSize: 16, fontWeight: '700', color: colors.onSurface },
  serviceDescriptionPreview: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    lineHeight: 17,
    color: colors.secondary,
    marginTop: 4,
  },
  detailLink: { alignSelf: 'flex-start', marginTop: 6 },
  detailLinkText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: spacing.stackSm },
  priceLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.secondary },
  price: { fontFamily: typography.titleMd.fontFamily, fontSize: 16, fontWeight: '700', color: colors.primary },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.stackLg,
    marginTop: spacing.stackMd,
    paddingTop: spacing.stackSm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTextLink: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.primary, fontWeight: '600' },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.stackSm,
    paddingTop: spacing.stackSm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  toggleLabel: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurface },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.stackLg,
    marginTop: spacing.stackSm,
    paddingTop: spacing.stackSm,
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

  fab: {
    position: 'absolute',
    right: spacing.containerMargin,
    bottom: spacing.containerMargin,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});