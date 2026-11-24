import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { bookingApi } from '../../../../api/bookingApi';
import { chatApi } from '../../../../api/chatApi';
import { colors, radius, typography } from '../../../../constants/theme';
import type { CustomerStackParamList } from '../../../../navigation/types';
import { bookingLabel, bookingStatusLabel, paymentLabel, type BookingRecord } from '../../../../types/bookingRecord';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingDetail'>;

export default function BookingDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [booking, setBooking] = useState<BookingRecord>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<'issue' | 'review'>();
  const [reason, setReason] = useState('');
  const [rating, setRating] = useState(0);
  const busy = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setFailed(false);
    bookingApi.getMyBooking(id).then(({ data }) => {
      if (active) setBooking(data.data);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id, attempt]));

  const run = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try { await action(); }
    catch (error) { Alert.alert('Aksi gagal', apiErrorMessage(error, 'Coba lagi.')); }
    finally { busy.current = false; setSaving(false); }
  };

  if (failed) return <Text style={styles.content} onPress={() => setAttempt(value => value + 1)}>Pesanan gagal dimuat. Coba lagi.</Text>;
  if (booking?.uuid !== id) return <ActivityIndicator accessibilityLabel="Memuat detail pesanan" />;
  const { tenant } = booking.service ?? {};
  const waiting = booking.status === 'awaiting_completion_confirmation';
  const formatTime = (value: string) => new Date(value).toLocaleString('id-ID');
  const openForm = (type: typeof form) => { setReason(''); setRating(0); setForm(type); };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{booking.service?.name ?? 'Layanan'}</Text>
        <Text>{[bookingLabel(booking), tenant?.business_name].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.heading}>{bookingStatusLabel[booking.status]}</Text>
        <Text>{paymentLabel(booking)}</Text>
        <Text>Rp {Number(booking.total_amount ?? booking.service?.price ?? 0).toLocaleString('id-ID')}</Text>
        {!!booking.check_in_date && <Text>Check-in {booking.check_in_date} · Check-out {booking.check_out_date}</Text>}
        {!!booking.slot && <Text>Jadwal {booking.slot.slot_date.slice(0, 10)} · {booking.slot.start_time.slice(0, 5)} WIB</Text>}
        {!!booking.fulfilled_at && <Text>Toko menandai selesai pada {formatTime(booking.fulfilled_at)}</Text>}
        {!!booking.completed_at && <Text>Dikonfirmasi selesai pada {formatTime(booking.completed_at)}</Text>}
        {!!booking.issue_reported_at && <View style={styles.issue}>
          <Text style={styles.heading}>{waiting ? 'Kendala dilaporkan' : 'Riwayat kendala'}</Text>
          <Text>{formatTime(booking.issue_reported_at)}</Text>
          <Text>{booking.completion_issue}</Text>
        </View>}
        {waiting && <>
          <Action label="Konfirmasi selesai" disabled={saving} onPress={() => Alert.alert(
            'Konfirmasi selesai', 'Pastikan layanan telah diterima sesuai pesanan.', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Konfirmasi', onPress: () => void run(async () => {
                const { data } = await bookingApi.confirmCompletion(id);
                setBooking(data.data);
                setForm(undefined);
              }) },
            ],
          )} />
          {!booking.issue_reported_at && <Action label="Laporkan kendala" disabled={saving} onPress={() => openForm('issue')} />}
          {!!booking.issue_reported_at && !!tenant?.uuid && <Action label="Chat toko" disabled={saving} onPress={() => void run(async () => {
            const { data } = await chatApi.start(tenant.uuid!);
            navigation.navigate('CustomerChatRoom', { id: data.data.id, name: tenant.business_name });
          })} />}
        </>}
        {booking.status === 'completed' && !booking.review && <Action label="Beri ulasan" disabled={saving} onPress={() => openForm('review')} />}
        {form && <View style={styles.form}>
          <Text style={styles.heading}>{form === 'issue' ? 'Jelaskan kendala' : 'Beri ulasan'}</Text>
          {form === 'review' && <View style={styles.ratings}>
            {[1, 2, 3, 4, 5].map(value => <TouchableOpacity key={value} accessibilityRole="button"
              accessibilityLabel={value + ' bintang'} accessibilityState={{ selected: rating === value }}
              style={[styles.rating, rating === value && styles.selected]} disabled={saving} onPress={() => setRating(value)}>
              <Text>{value}</Text>
            </TouchableOpacity>)}
          </View>}
          <TextInput style={styles.input} accessibilityLabel={form === 'issue' ? 'Alasan kendala' : 'Komentar ulasan'}
            maxLength={1000} editable={!saving} multiline value={reason} onChangeText={setReason} />
          <Action label={saving ? 'Mengirim…' : 'Kirim'} disabled={saving || (form === 'issue' ? !reason.trim() : !rating)}
            onPress={() => void run(async () => {
              if (form === 'issue') {
                const { data } = await bookingApi.reportCompletionIssue(id, reason.trim());
                setBooking(data.data);
              } else {
                await bookingApi.submitReview(id, { rating, comment: reason.trim() || undefined });
                setBooking(previous => previous && { ...previous, review: { rating, comment: reason.trim() } });
              }
              setForm(undefined);
            })} />
          <Action label="Batal" disabled={saving} onPress={() => setForm(undefined)} />
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} style={[styles.action, disabled && styles.disabled]} onPress={onPress}>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, gap: 12 },
  title: { ...typography.headlineLg, color: colors.navy },
  heading: { ...typography.titleMd, color: colors.navy },
  issue: { padding: 12, gap: 4, borderRadius: radius.md, backgroundColor: colors.errorContainer },
  form: { gap: 10, padding: 12, backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.md },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rating: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md },
  selected: { backgroundColor: colors.primaryFixed },
  input: { minHeight: 80, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.outline, color: colors.onSurface },
  action: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: radius.full, backgroundColor: colors.primaryContainer },
  actionLabel: { ...typography.labelLg, color: colors.onPrimaryFixed },
  disabled: { opacity: 0.5 },
});
