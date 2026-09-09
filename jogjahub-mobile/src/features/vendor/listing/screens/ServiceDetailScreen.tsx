import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  useWindowDimensions,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ImageOff } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { API_BASE_URL } from '../../../../constants/config';
import type { VendorServicesStackParamList } from '../../../../navigation/types';

const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/storage/';

const formatRupiah = (n: number) => `Rp${Number(n).toLocaleString('id-ID')}`;

type Props = {
  route: RouteProp<VendorServicesStackParamList, 'ServiceDetail'>;
};

export default function ServiceDetailScreen() {
  const { params } = useRoute<Props['route']>();
  const { service } = params;
  const { width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);

  // Urutkan foto berdasarkan sort_order, foto primary ditaruh paling depan.
  const sortedPhotos = [...(service.photos ?? [])].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const categoryLabel = service.subcategory?.category?.name ?? service.subcategory?.name ?? null;

  const onGalleryScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <ScrollView style={styles.screen} bounces={false}>
      {/* Galeri foto — bisa digeser (swipe) horizontal */}
      <View style={{ width, height: width }}>
        {sortedPhotos.length > 0 ? (
          <FlatList
            data={sortedPhotos}
            keyExtractor={(p, i) => `${p.url}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onGalleryScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image
                source={{ uri: `${STORAGE_BASE_URL}${item.url}` }}
                style={{ width, height: width }}
                resizeMode="cover"
              />
            )}
          />
        ) : (
          <View style={[styles.photoPlaceholder, { width, height: width }]}>
            <ImageOff size={40} color={colors.secondary} />
          </View>
        )}

        {sortedPhotos.length > 1 ? (
          <View style={styles.dotsRow}>
            {sortedPhotos.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* Konten detail */}
      <View style={styles.content}>
        {categoryLabel ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryLabel.toUpperCase()}</Text>
          </View>
        ) : null}

        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.price}>{formatRupiah(service.price)}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Deskripsi</Text>
        <Text style={styles.description}>
          {service.description?.trim() ? service.description : 'Belum ada deskripsi untuk layanan ini.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  photoPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.stackMd,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotActive: { backgroundColor: colors.onPrimary },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.5)' },

  content: { padding: spacing.containerMargin },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: spacing.stackSm,
  },
  categoryBadgeText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  name: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
  },
  price: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceContainerHigh,
    marginVertical: spacing.stackLg,
  },
  sectionTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: spacing.stackSm,
  },
  description: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    lineHeight: 21,
    color: colors.onSurface,
  },
});