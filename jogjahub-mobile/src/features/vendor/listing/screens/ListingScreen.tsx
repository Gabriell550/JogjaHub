import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Image, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pencil, Trash2, ImageOff } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { API_BASE_URL } from '../../../../constants/config';
import { Card } from '../../../../components/Card/Card';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
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

// Backend simpan path relatif (mis. "services/xxx.jpg") lewat Storage::disk('public'),
// jadi URL lengkapnya di /storage/{path} — pastikan backend sudah jalanin `php artisan storage:link`.
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/storage/';

function getPrimaryPhotoUrl(item: ServiceItem): string | null {
  if (!item.photos || item.photos.length === 0) return null;
  const primary = item.photos.find((p) => p.is_primary) ?? item.photos[0];
  return `${STORAGE_BASE_URL}${primary.url}`;
}

// FR: kelola layanan/produk yang dijual vendor (create/read/update/delete).
export default function ListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorServicesStackParamList>>();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        renderItem={({ item }) => {
          const photoUrl = getPrimaryPhotoUrl(item);
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
  cardRow: { flexDirection: 'row', gap: spacing.stackMd },
  thumbnail: { width: 64, height: 64, borderRadius: radius.md },
  thumbnailPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontFamily: typography.titleMd.fontFamily, fontSize: 15, fontWeight: '600', color: colors.onSurface },
  serviceCategory: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  servicePrice: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.primary, fontWeight: '700', marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.stackLg,
    marginTop: spacing.stackMd,
    paddingTop: spacing.stackSm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.primary, fontWeight: '600' },
});