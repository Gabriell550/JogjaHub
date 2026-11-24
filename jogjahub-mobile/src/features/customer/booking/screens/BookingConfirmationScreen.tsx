import React, { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../../navigation/types';
import { bookingApi } from '../../../../api/bookingApi';
import { colors, radius, typography } from '../../../../constants/theme';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingConfirmation'>;

export default function BookingConfirmationScreen({ navigation, route }: Props) {
  const { serviceId, serviceName, vendorName, date, timeSlot, price, slotId, checkInDate, checkOutDate } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>();
  const busy = useRef(false);

  const showBookings = () => navigation.reset({
    index: 0,
    routes: [{ name: 'CustomerTabs', params: { screen: 'MyBookings' } }],
  });

  async function checkout() {
    if (busy.current) return;
    busy.current = true;
    setSubmitting(true);
    try {
      let url = paymentUrl;
      if (!url) {
        const { data } = await bookingApi.createBooking({
          service_id: serviceId,
          slot_id: slotId,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
        });
        url = data.payment_url;
        if (!url) {
          Alert.alert('Pesanan dibuat', 'Tautan pembayaran belum tersedia. Periksa Pesanan Saya.');
          showBookings();
          return;
        }
        setPaymentUrl(url);
      }
      try {
        await Linking.openURL(url);
        showBookings();
      } catch {
        Alert.alert('Tautan gagal dibuka', 'Coba buka kembali pembayaran untuk pesanan ini.');
      }
    } catch (error) {
      if (isAxiosError(error) && error.response && error.response.status < 500) {
        Alert.alert('Gagal membuat pesanan', apiErrorMessage(error, 'Periksa pesanan dan coba lagi.'));
      } else {
        Alert.alert('Status pesanan belum diketahui', 'Periksa Pesanan Saya sebelum mencoba kembali.');
        showBookings();
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.link} onPress={() => paymentUrl ? showBookings() : navigation.goBack()}>Kembali</Text>
      <Text style={styles.title}>Konfirmasi pesanan</Text>
      <Text style={styles.heading}>{serviceName}</Text>
      <Text>{vendorName}</Text>
      {date && <Text>{checkOutDate ? date + ' sampai ' + checkOutDate : [date, timeSlot].filter(Boolean).join(' ? ')}</Text>}
      <Text style={styles.heading}>Rp {price.toLocaleString('id-ID')}</Text>
      <Text>Pilih metode pembayaran di halaman Xendit.</Text>
      <TouchableOpacity accessibilityRole="button" disabled={submitting} onPress={checkout} style={styles.button}>
        <Text style={styles.buttonText}>{submitting ? 'Memproses...' : paymentUrl ? 'Buka kembali Xendit' : 'Bayar melalui Xendit'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 14, backgroundColor: colors.surface },
  title: { ...typography.headlineLg, color: colors.navy },
  heading: { ...typography.titleMd, color: colors.navy },
  link: { color: colors.primary, paddingVertical: 12 },
  button: { backgroundColor: colors.navy, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  buttonText: { ...typography.labelLg, color: colors.onNavy },
});
