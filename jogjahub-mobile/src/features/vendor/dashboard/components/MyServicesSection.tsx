import React, { useCallback, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ImageOff, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { vendorApi } from '../../../../api/vendorApi';
import { getPrimaryPhotoUrl, type ServiceWithPhotos } from '../../../../utils/serviceImage';
import Toast from 'react-native-toast-message';

type ServiceItem = ServiceWithPhotos & { id: number; name: string; price: number };

type Props = {
  onSeeAll: () => void;
  onAddService: () => void;
  onPressService: (service: ServiceItem) => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.4;

const formatRupiah = (n: number) => `Rp${Number(n).toLocaleString('id-ID')}`;

// Prinsip cache-first ringan: state awal array kosong (bukan undefined) supaya render pertama
// tidak pernah crash walau data belum datang — lihat pembahasan .map() undefined sebelumnya.
export function MyServicesSection({ onSeeAll, onAddService, onPressService }: Props) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = useCallback(async () => {
    try {
      const res = await vendorApi.listMyServices();
      const rawData = res.data?.data;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
      setServices(items);
    } catch (err) {
      console.log('Gagal ambil layanan untuk dashboard:', err);
      Toast.show({
        type: 'error',
        text1: 'Gagal memuat layanan',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh tiap kali dashboard fokus lagi — supaya layanan yang baru ditambah di tab Listing
  // langsung kelihatan di sini tanpa perlu reload app.
  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices]),
  );

  if (loading) return null; // hindari kedip "Belum ada layanan" sekilas sebelum data datang

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Layanan Saya</Text>
        {services.length > 0 && (
          <Pressable style={styles.seeAllRow} onPress={onSeeAll}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
            <ChevronRight size={14} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Belum ada layanan</Text>
          <Text style={styles.emptyDescription}>Tambahkan layanan yang kamu tawarkan.</Text>
          <Pressable style={styles.emptyCta} onPress={onAddService}>
            <Text style={styles.emptyCtaText}>+ Tambah Layanan</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {services.map((service) => {
            const photoUrl = getPrimaryPhotoUrl(service);
            return (
              <Pressable
                key={service.id}
                style={({ pressed }) => [styles.card, { width: CARD_WIDTH }, pressed && styles.cardPressed]}
                onPress={() => onPressService(service)}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <ImageOff size={20} color={colors.onSurfaceVariant} />
                  </View>
                )}
                <Text style={styles.cardName} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.cardPrice}>{formatRupiah(service.price)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.stackMd },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.stackSm },
  sectionTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.primary, fontWeight: '600' },
  scrollContent: { gap: spacing.stackSm, paddingRight: spacing.containerMargin },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, padding: spacing.stackSm, elevation: 1 },
  cardPressed: { opacity: 0.85 },
  cardImage: { width: '100%', height: 80, borderRadius: radius.md, marginBottom: spacing.stackSm },
  cardImagePlaceholder: { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontFamily: typography.titleMd.fontFamily, fontSize: 13, fontWeight: '600', color: colors.onSurface },
  cardPrice: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 2 },
  emptyBox: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, padding: spacing.stackLg, alignItems: 'center' },
  emptyTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '700', color: colors.onSurface },
  emptyDescription: { fontFamily: typography.bodyMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  emptyCta: { marginTop: spacing.stackMd, backgroundColor: colors.primaryContainer, borderRadius: radius.full, paddingVertical: 8, paddingHorizontal: 18 },
  emptyCtaText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '700', color: colors.onPrimary },
});
