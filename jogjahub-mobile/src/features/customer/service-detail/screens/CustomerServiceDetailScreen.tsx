import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { vendorApi } from '../../../../api/vendorApi';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import type { CustomerStackParamList } from '../../../../navigation/types';
import { getPhotoUrl } from '../../../../utils/serviceImage';
import type { PublicService } from '../../catalog/useCatalog';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ServiceDetail'>;
type Result = { status: 'loading' | 'missing' | 'error' } | { status: 'ready'; service: PublicService };

function ServicePhoto({ uri, thumbnail = false }: { uri?: string; thumbnail?: boolean }) {
  const [failed, setFailed] = useState(false);
  return uri && !failed
    ? <Image accessible={false} source={{ uri }} resizeMode="cover" style={styles.image} onError={() => setFailed(true)} />
    : <View style={styles.photoFallback}><Ionicons name="image-outline" size={thumbnail ? 22 : 40} color={colors.primary} /></View>;
}

export default function CustomerServiceDetailScreen({ route, navigation }: Props) {
  const { serviceId } = route.params;
  const [result, setResult] = useState<Result>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    let active = true;
    setResult({ status: 'loading' });
    setSelectedPhoto(0);
    vendorApi.getServiceDetail(serviceId).then(({ data }) => {
      if (active) setResult({ status: 'ready', service: data.data });
    }).catch((error: unknown) => {
      if (active) setResult({ status: isAxiosError(error) && error.response?.status === 404 ? 'missing' : 'error' });
    });
    return () => { active = false; };
  }, [serviceId, attempt]);

  const service = result.status === 'ready' && String(result.service.id) === String(serviceId) ? result.service : undefined;
  const photos = [...(service?.photos ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(photo => photo.full_url?.includes('/storage/') ? getPhotoUrl({ url: '', full_url: photo.full_url }) : photo.full_url)
    .filter(Boolean);
  const reviewsCount = service?.reviews_count ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Kembali" style={styles.back} onPress={navigation.goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
      </SafeAreaView>
      {!service ? (
        <View style={styles.state}>
          {result.status === 'missing' ? <Text style={styles.body}>Layanan tidak tersedia.</Text>
            : result.status === 'error' ? <>
              <Text style={styles.body}>Detail layanan gagal dimuat.</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.back} onPress={() => setAttempt(value => value + 1)}>
                <Text style={styles.link}>Coba lagi</Text>
              </TouchableOpacity>
            </> : <ActivityIndicator accessibilityLabel="Memuat detail layanan" color={colors.primary} />}
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <Text accessibilityRole="header" style={styles.title}>{service.name}</Text>
              <View style={styles.meta}>
                {!!service.subcategory?.name && <Text style={styles.body}>{service.subcategory.name}</Text>}
                <TouchableOpacity accessibilityRole="link" style={styles.vendorLink} onPress={() => navigation.navigate('VendorDetail', {
                  tenantUuid: service.tenant.uuid,
                  businessName: service.tenant.business_name,
                })}>
                  <Text style={styles.link}>{service.tenant.business_name}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.heroPhoto}>
                <ServicePhoto key={selectedPhoto} uri={photos[selectedPhoto]} />
              </View>
              <View style={styles.priceCard}>
                <Text style={styles.body}>Harga</Text>
                <Text style={styles.price}>Rp{Number(service.price).toLocaleString('id-ID')} <Text style={styles.body}>{service.price_type === 'per_night' ? 'per malam' : 'per sesi'}</Text></Text>
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text accessibilityRole="header" style={styles.heading}>Deskripsi</Text>
                <Text style={styles.rating}>{reviewsCount > 0 ? [
                  service.reviews_avg_rating != null ? '★ ' + Number(service.reviews_avg_rating).toLocaleString('id-ID') : '',
                  reviewsCount + ' ulasan',
                ].filter(Boolean).join(' · ') : 'Belum ada ulasan'}</Text>
              </View>
              <Text style={styles.body}>{service.description?.trim() || 'Deskripsi belum tersedia'}</Text>
            </View>
            {photos.length > 1 && <View style={styles.gallery}>
              <Text accessibilityRole="header" style={[styles.heading, styles.galleryHeading]}>Foto layanan</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>
                {photos.map((uri, index) => (
                  <TouchableOpacity key={index} accessibilityRole="button" accessibilityLabel={'Foto ' + (index + 1) + ' dari ' + photos.length}
                    accessibilityState={{ selected: selectedPhoto === index }}
                    style={[styles.thumbnail, selectedPhoto === index && styles.selected]} onPress={() => setSelectedPhoto(index)}>
                    <ServicePhoto uri={uri} thumbnail />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>}
          </ScrollView>
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <TouchableOpacity accessibilityRole="button" style={styles.book} onPress={() => navigation.navigate('Booking', { serviceId: service.id })}>
              <Text style={styles.bookText}>Pesan layanan</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: customerColors.canvas },
  header: { backgroundColor: colors.primaryFixed, paddingHorizontal: 20, paddingVertical: 8 },
  back: { minHeight: 48, minWidth: 48, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center' },
  state: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', gap: 8 },
  content: { gap: 24, paddingBottom: 16 },
  hero: { backgroundColor: colors.primaryFixed, paddingHorizontal: 20, paddingBottom: 16, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  title: { ...typography.headlineLg, fontSize: 24, color: colors.navy },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 12 },
  vendorLink: { minHeight: 48, justifyContent: 'center', flexShrink: 1 },
  link: { ...typography.labelLg, color: colors.primary, textDecorationLine: 'underline' },
  heroPhoto: { aspectRatio: 4 / 3, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primaryFixed },
  image: { width: '100%', height: '100%' },
  photoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryFixed },
  priceCard: { alignSelf: 'flex-start', maxWidth: '100%', marginTop: -24, marginLeft: 12, marginRight: 12, padding: 12,
    gap: 4, borderWidth: 1, borderColor: customerColors.border, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest },
  price: { ...typography.titleMd, color: colors.primary },
  body: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  section: { paddingHorizontal: 20, gap: 8 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  heading: { ...typography.titleMd, color: colors.navy },
  rating: { ...typography.bodySm, color: colors.primary },
  gallery: { gap: 8 },
  galleryHeading: { paddingHorizontal: 20 },
  thumbnails: { paddingHorizontal: 20, gap: 8 },
  thumbnail: { width: 72, height: 60, borderWidth: 2, borderColor: customerColors.border, borderRadius: radius.md, overflow: 'hidden' },
  selected: { borderColor: colors.primary },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: customerColors.border, backgroundColor: colors.surfaceContainerLowest },
  book: { minHeight: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: colors.primaryContainer },
  bookText: { ...typography.labelLg, color: colors.onPrimaryFixed },
});
