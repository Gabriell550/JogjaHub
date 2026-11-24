import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../../navigation/types';
import { bookingApi } from '../../../../api/bookingApi';
import { vendorApi } from '../../../../api/vendorApi';
import { colors, radius, typography } from '../../../../constants/theme';
import type { PublicService } from '../../catalog/useCatalog';

type Slot = { id: number; slot_date: string; start_time: string; available: number };
type Props = NativeStackScreenProps<CustomerStackParamList, 'Booking'>;

function nextDate(date: string) {
  const day = new Date(date + 'T00:00:00Z');
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

export default function BookingScreen({ navigation, route }: Props) {
  const { serviceId } = route.params;
  const [service, setService] = useState<PublicService | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState<string>();
  const [checkout, setCheckout] = useState<string>();
  const [slotId, setSlotId] = useState<number>();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    setService(null);
    setSlots([]);
    setDate(undefined);
    setCheckout(undefined);
    setSlotId(undefined);
    async function load() {
      try {
        const { data } = await vendorApi.getServiceDetail(serviceId);
        const result: PublicService = data.data;
        const needsAvailability = result.is_accommodation || result.price_type === 'per_night' || result.subcategory?.requires_time_slot;
        const available: Slot[] = needsAvailability ? (await bookingApi.getAvailableSlots(serviceId)).data.data : [];
        if (!active) return;
        setSlots(available.filter(slot => slot.available > 0));
        setService(result);
      } catch {
        if (active) setError(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [serviceId, attempt]);

  const hotel = service?.is_accommodation || service?.price_type === 'per_night';
  const requiresSlot = service?.subcategory?.requires_time_slot;
  const dates = [...new Set(slots.map(slot => slot.slot_date.slice(0, 10)))];
  const checkoutDates: string[] = [];
  if (hotel && date) {
    for (let night = date; dates.includes(night); night = nextDate(night)) {
      checkoutDates.push(nextDate(night));
    }
  }
  const selected = slots.find(slot => slot.id === slotId);
  const nights = checkout ? checkoutDates.indexOf(checkout) + 1 : 0;
  const canContinue = !!service && (hotel ? nights > 0 : !requiresSlot || !!selected);
  const total = Number(service?.price ?? 0) * (service?.price_type === 'per_night' ? nights : 1);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.link} onPress={() => navigation.goBack()}>Kembali</Text>
        <Text style={styles.title}>{hotel ? 'Pilih tanggal menginap' : 'Pemesanan layanan'}</Text>
        {error ? (
          <Text style={styles.link} onPress={() => setAttempt(value => value + 1)}>Jadwal gagal dimuat. Coba lagi.</Text>
        ) : !service ? <ActivityIndicator /> : (
          <>
            <Text style={styles.heading}>{service.name}</Text>
            <Text>{service.tenant.business_name}</Text>
            {(hotel || requiresSlot) && (
              <>
                <Text style={styles.heading}>{hotel ? 'Check-in' : 'Tanggal tersedia'}</Text>
                {!dates.length && <Text>Belum ada jadwal tersedia.</Text>}
                <View style={styles.options}>
                  {dates.map(day => (
                    <TouchableOpacity key={day} accessibilityRole="button" accessibilityState={{ selected: date === day }}
                      style={[styles.option, date === day && styles.selected]}
                      onPress={() => { setDate(day); setSlotId(undefined); setCheckout(undefined); }}>
                      <Text>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {date && (
              <>
                <Text style={styles.heading}>{hotel ? 'Check-out' : 'Pilih jam'}</Text>
                <View style={styles.options}>
                  {hotel ? checkoutDates.map(day => (
                    <TouchableOpacity key={day} accessibilityRole="button" accessibilityState={{ selected: checkout === day }}
                      style={[styles.option, checkout === day && styles.selected]} onPress={() => setCheckout(day)}>
                      <Text>{day}</Text>
                    </TouchableOpacity>
                  )) : slots.filter(slot => slot.slot_date.slice(0, 10) === date).map(slot => (
                    <TouchableOpacity key={slot.id} accessibilityRole="button" accessibilityState={{ selected: slotId === slot.id }}
                      style={[styles.option, slotId === slot.id && styles.selected]} onPress={() => setSlotId(slot.id)}>
                      <Text>{slot.start_time.slice(0, 5)} WIB</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {canContinue && (
              <>
                <Text style={styles.heading}>Rp {total.toLocaleString('id-ID')}</Text>
                <TouchableOpacity style={styles.button} accessibilityRole="button" onPress={() => navigation.navigate('BookingConfirmation', {
                  serviceId,
                  serviceName: service.name,
                  vendorName: service.tenant.business_name,
                  price: total,
                  date,
                  slotId: selected?.id,
                  timeSlot: selected ? selected.start_time.slice(0, 5) + ' WIB' : undefined,
                  checkInDate: hotel ? date : undefined,
                  checkOutDate: hotel ? checkout : undefined,
                })}>
                  <Text style={styles.buttonText}>Lanjutkan</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, gap: 14 },
  title: { ...typography.headlineLg, color: colors.navy },
  heading: { ...typography.titleMd, color: colors.navy },
  link: { color: colors.primary, paddingVertical: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md, padding: 12 },
  selected: { backgroundColor: colors.primaryFixed, borderColor: colors.primary },
  button: { backgroundColor: colors.navy, padding: 14, borderRadius: radius.md, alignItems: 'center' },
  buttonText: { ...typography.labelLg, color: colors.onNavy },
});
