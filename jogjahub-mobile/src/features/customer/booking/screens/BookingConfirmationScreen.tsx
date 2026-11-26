import React, { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { bookingApi, type CreateBookingPayload } from '../../../../api/bookingApi';
import { demoModeLabel, demoPaymentMethods, type DemoPaymentMethod } from '../../../../api/demoEscrowApi';
import { colors, radius, typography } from '../../../../constants/theme';
import type { CustomerStackParamList } from '../../../../navigation/types';
import { verifyBooking } from '../serviceSchedule';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingConfirmation'>;

export default function BookingConfirmationScreen({ navigation, route }: Props) {
  const { serviceId, serviceName, vendorName, date, timeSlot, price, slotId, checkInDate, checkOutDate } = route.params;
  const [method, setMethod] = useState<DemoPaymentMethod>();
  const [pickup, setPickup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const busy = useRef(false);
  const submitted = useRef<CreateBookingPayload | null>(null);
  const canPickUp = !slotId && !checkInDate;

  async function checkout() {
    if (busy.current || !method) return;
    busy.current = true;
    setSubmitting(true);

    try {
      if (!submitted.current) {
        const latest = await verifyBooking(serviceId, { date: checkInDate ?? date, checkout: checkOutDate, slotId });
        if (!latest) {
          Alert.alert('Jadwal tidak tersedia', 'Pilih jadwal lain untuk melanjutkan.', [{ text: 'Pilih jadwal', onPress: navigation.goBack }]);
          return;
        }
        if (latest.price !== price) {
          navigation.setParams(latest);
          Alert.alert('Harga berubah', 'Periksa total terbaru sebelum melanjutkan.');
          return;
        }
        submitted.current = {
          service_id: serviceId,
          slot_id: latest.slotId,
          check_in_date: latest.checkInDate,
          check_out_date: latest.checkOutDate,
          demo_payment_method: method,
          demo_checkout_key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          demo_expected_amount: price,
          demo_pickup: canPickUp && pickup,
        };
      }
      const { data } = await bookingApi.createBooking(submitted.current);
      navigation.replace('BookingDetail', { id: data.data.uuid });
    } catch (error) {
      const validation = isAxiosError(error) && error.response?.status === 422;
      if (validation) {
        submitted.current = null;
        setRetrying(false);
        const errors = error.response?.data?.errors;
        const scheduleChanged = errors?.slot_id || errors?.check_in_date || errors?.check_out_date;
        Alert.alert('Pembayaran demo gagal', apiErrorMessage(error, 'Periksa pesanan dan coba lagi.'),
          scheduleChanged ? [{ text: 'Pilih jadwal', onPress: navigation.goBack }] : undefined);
      } else if (submitted.current) {
        setRetrying(true);
        Alert.alert('Status pembayaran belum diketahui', 'Ulangi simulasi untuk memeriksa pesanan yang sama.');
      } else {
        Alert.alert('Pesanan gagal diperiksa', apiErrorMessage(error, 'Coba lagi.'));
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  const editingDisabled = submitting || retrying;
  const checkoutDisabled = submitting || !method;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" style={styles.back} disabled={submitting} onPress={navigation.goBack}>
          <Text style={styles.link}>Kembali</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Checkout</Text>
        <Text style={styles.notice}>{demoModeLabel}</Text>
        <View style={styles.summary}>
          <Text style={styles.heading}>{serviceName}</Text>
          <Text>{vendorName}</Text>
          {date && <Text>{checkOutDate ? `${date} sampai ${checkOutDate}` : [date, timeSlot].filter(Boolean).join(' · ')}</Text>}
          <Text style={styles.heading}>Total Rp {price.toLocaleString('id-ID')}</Text>
        </View>
        <Text accessibilityRole="header" style={styles.heading}>Metode pembayaran</Text>
        {demoPaymentMethods.map(option => (
          <Pressable key={option.value} accessibilityRole="radio"
            accessibilityState={{ checked: method === option.value, disabled: editingDisabled }}
            disabled={editingDisabled} onPress={() => setMethod(option.value)}
            style={[styles.option, method === option.value && styles.selected]}>
            <Text>{method === option.value ? '✓ ' : ''}{option.label}</Text>
          </Pressable>
        ))}
        {canPickUp && (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: pickup, disabled: editingDisabled }}
            disabled={editingDisabled} onPress={() => setPickup(value => !value)}
            style={[styles.option, pickup && styles.selected]}>
            <Text>{pickup ? '✓ ' : ''}Ambil sendiri di toko</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: checkoutDisabled, busy: submitting }}
          disabled={checkoutDisabled} onPress={checkout} style={[styles.button, checkoutDisabled && styles.disabled]}>
          <Text style={styles.buttonText}>{submitting ? 'Memproses…' : retrying ? 'Ulangi simulasi' : 'Simulasikan Pembayaran'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, gap: 12 },
  title: { ...typography.headlineLg, color: colors.navy },
  heading: { ...typography.titleMd, color: colors.navy },
  notice: { padding: 12, backgroundColor: colors.primaryFixed, borderRadius: radius.md, color: colors.onPrimaryFixed },
  summary: { padding: 14, gap: 6, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest },
  back: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center' },
  link: { color: colors.primary },
  option: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryFixed },
  button: { minHeight: 48, backgroundColor: colors.navy, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  buttonText: { ...typography.labelLg, color: colors.onNavy },
  disabled: { opacity: 0.6 },
});
