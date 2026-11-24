import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { vendorApi } from '../../../../api/vendorApi';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import type { CustomerStackParamList } from '../../../../navigation/types';
import { customerPhotoUrls } from '../../../../utils/serviceImage';
import { chatApi } from '../../../../api/chatApi';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import CustomerPhoto from '../../catalog/components/CustomerPhoto';
import { ScheduleOptions, useServiceSchedule, verifyBooking } from '../../booking/serviceSchedule';
import type { PublicService } from '../../catalog/useCatalog';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ServiceDetail'>;
type Result = { status: 'loading' | 'missing' | 'error' } | { status: 'ready'; service: PublicService };

export default function CustomerServiceDetailScreen(props: Props) {
  return <ServiceDetail key={props.route.params.serviceId} {...props} />;
}

function ServiceDetail({ route, navigation }: Props) {
  const { serviceId } = route.params;
  const [result, setResult] = useState<Result>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [openingChat, setOpeningChat] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scheduleTop = useRef(0);
  const returningFromConfirmation = useRef(false);

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
  const photos = customerPhotoUrls(service?.photos);
  const fallback = customerPhotoUrls(service?.photos, service?.tenant.logo_url);
  const schedule = useServiceSchedule(service);
  const reviewsCount = service?.reviews_count ?? 0;
  const { refresh } = schedule;
  useFocusEffect(useCallback(() => {
    if (!returningFromConfirmation.current) return;
    returningFromConfirmation.current = false;
    refresh();
    scroll.current?.scrollTo({ y: scheduleTop.current, animated: true });
  }, [refresh]));

  async function openChat() {
    if (!service || openingChat) return;
    setOpeningChat(true);
    try {
      const { data } = await chatApi.start(service.tenant.uuid);
      navigation.navigate('CustomerChatRoom', {
        id: data.data.id, name: service.tenant.business_name, draft: 'Halo, saya ingin bertanya tentang ' + service.name + '.',
      });
    } catch (error) {
      Alert.alert('Chat gagal dibuka', apiErrorMessage(error, 'Coba lagi nanti.'));
    } finally {
      setOpeningChat(false);
    }
  }

  async function continueBooking() {
    if (!service || verifying) return;
    if (!schedule.booking) {
      scroll.current?.scrollTo({ y: scheduleTop.current, animated: true });
      return;
    }
    setVerifying(true);
    try {
      const booking = await verifyBooking(service.id, schedule.selection);
      if (booking) {
        returningFromConfirmation.current = true;
        navigation.navigate('BookingConfirmation', booking);
      } else {
        schedule.refresh();
        scroll.current?.scrollTo({ y: scheduleTop.current, animated: true });
        Alert.alert('Jadwal tidak tersedia', 'Pilih jadwal lain untuk melanjutkan.');
      }
    } catch (error) {
      Alert.alert('Pesanan gagal diperiksa', apiErrorMessage(error, 'Coba lagi.'));
    } finally {
      setVerifying(false);
    }
  }

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
          <ScrollView ref={scroll} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <CustomerPhoto urls={selectedPhoto ? [photos[selectedPhoto], ...fallback.filter(uri => uri !== photos[selectedPhoto])] : fallback} style={styles.heroPhoto} />
              {photos.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>
                  {photos.map((uri, index) => (
                    <TouchableOpacity key={uri} accessibilityRole="button" accessibilityLabel={'Foto ' + (index + 1) + ' dari ' + photos.length}
                      accessibilityState={{ selected: selectedPhoto === index }}
                      style={[styles.thumbnail, selectedPhoto === index && styles.selected]} onPress={() => setSelectedPhoto(index)}>
                      <CustomerPhoto urls={[uri]} style={styles.image} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
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
            <View style={styles.section} onLayout={event => { scheduleTop.current = event.nativeEvent.layout.y; }}>
              <Text accessibilityRole="header" style={styles.heading}>Ketersediaan</Text>
              <ScheduleOptions service={service} schedule={schedule} />
              {schedule.booking && schedule.required && <Text style={styles.price}>Total Rp {schedule.booking.price.toLocaleString('id-ID')}</Text>}
            </View>
          </ScrollView>
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <TouchableOpacity accessibilityRole="button" style={styles.chat} disabled={openingChat} onPress={openChat}>
              <Text style={styles.link}>{openingChat ? 'Membuka chat…' : 'Chat toko'}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.book} disabled={verifying} onPress={continueBooking}>
              <Text style={styles.bookText}>{verifying ? 'Memeriksa…' : schedule.booking ? 'Pesan layanan' : 'Pilih jadwal'}</Text>
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
  hero: { backgroundColor: colors.primaryFixed, gap: 8, paddingHorizontal: 20, paddingBottom: 16, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  title: { ...typography.headlineLg, fontSize: 24, color: colors.navy },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 12 },
  vendorLink: { minHeight: 48, justifyContent: 'center', flexShrink: 1 },
  link: { ...typography.labelLg, color: colors.primary, textDecorationLine: 'underline' },
  heroPhoto: { aspectRatio: 4 / 3, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primaryFixed },
  image: { width: '100%', height: '100%' },
  priceCard: { alignSelf: 'flex-start', maxWidth: '100%', padding: 12,
    gap: 4, borderWidth: 1, borderColor: customerColors.border, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest },
  price: { ...typography.titleMd, color: colors.primary },
  body: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  section: { paddingHorizontal: 20, gap: 8 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  heading: { ...typography.titleMd, color: colors.navy },
  rating: { ...typography.bodySm, color: colors.primary },
  thumbnails: { gap: 8 },
  thumbnail: { width: 72, height: 60, borderWidth: 2, borderColor: customerColors.border, borderRadius: radius.md, overflow: 'hidden' },
  selected: { borderColor: colors.primary },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: customerColors.border, backgroundColor: colors.surfaceContainerLowest },
  chat: { minHeight: 48, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  book: { flexGrow: 1, minHeight: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: colors.primaryContainer },
  bookText: { ...typography.labelLg, color: colors.onPrimaryFixed },
});
