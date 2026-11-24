import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { bookingApi } from '../../../api/bookingApi';
import { vendorApi } from '../../../api/vendorApi';
import { colors, radius, typography } from '../../../constants/theme';
import type { CustomerStackParamList } from '../../../navigation/types';
import type { PublicService } from '../catalog/useCatalog';

type Slot = { id: number; slot_date: string; start_time: string; available: number };
type Selection = { date?: string; checkout?: string; slotId?: number };
const slotDate = (slot: Slot) => slot.slot_date.slice(0, 10);

function nextDate(date: string) {
  const day = new Date(date + 'T00:00:00Z');
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

export function resolveBooking(service: PublicService, slots: Slot[], selection: Selection): CustomerStackParamList['BookingConfirmation'] | undefined {
  const hotel = service.is_accommodation || service.price_type === 'per_night';
  const { date, checkout, slotId } = selection;
  const selected = slots.find(slot => slot.id === slotId && slotDate(slot) === date);
  const nights = hotel && checkout ? checkoutOptions(slots, date).indexOf(checkout) + 1 : 0;
  if (hotel ? !nights : service.subcategory?.requires_time_slot && !selected) return undefined;
  return {
    serviceId: service.id,
    serviceName: service.name,
    vendorName: service.tenant.business_name,
    price: Number(service.price) * (service.price_type === 'per_night' ? nights : 1),
    date: hotel || selected ? date : undefined,
    slotId: hotel ? undefined : selected?.id,
    timeSlot: !hotel && selected ? selected.start_time.slice(0, 5) + ' WIB' : undefined,
    checkInDate: hotel ? date : undefined,
    checkOutDate: hotel ? checkout : undefined,
  };
}

function checkoutOptions(slots: Slot[], date?: string) {
  const available = new Set(slots.map(slotDate));
  const dates: string[] = [];
  for (let night = date; night && available.has(night); night = nextDate(night)) {
    dates.push(nextDate(night));
  }
  return dates;
}

function needsSchedule(service: PublicService) {
  return !!(service.is_accommodation || service.price_type === 'per_night' || service.subcategory?.requires_time_slot);
}

async function loadSlots(service: PublicService): Promise<Slot[]> {
  if (!needsSchedule(service)) return [];
  const { data } = await bookingApi.getAvailableSlots(service.id);
  return (data.data as Slot[]).filter(slot => slot.available > 0);
}

export function useServiceSchedule(service?: PublicService) {
  const [result, setResult] = useState<{ status: 'loading' | 'error' | 'ready'; slots: Slot[] }>({ status: 'loading', slots: [] });
  const [selection, setSelection] = useState<Selection>({});
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => {
    setResult({ status: 'loading', slots: [] });
    setAttempt(value => value + 1);
  }, []);
  const required = service ? needsSchedule(service) : false;
  useEffect(() => {
    if (!service || !required) return;
    let active = true;
    setResult({ status: 'loading', slots: [] });
    loadSlots(service).then(slots => {
      if (active) setResult({ status: 'ready', slots });
    }).catch(() => {
      if (active) setResult({ status: 'error', slots: [] });
    });
    return () => { active = false; };
  }, [service, required, attempt]);

  return {
    ...result,
    required,
    selection,
    booking: service ? resolveBooking(service, result.slots, selection) : undefined,
    selectDate: (date: string) => setSelection(current => current.date === date ? current : { date }),
    selectCheckout: (checkout: string) => setSelection(current => ({ ...current, checkout })),
    selectSlot: (slotId: number) => setSelection(current => ({ ...current, slotId })),
    refresh,
  };
}

export async function verifyBooking(serviceId: string | number, selection: Selection) {
  const { data } = await vendorApi.getServiceDetail(serviceId);
  const latest: PublicService = data.data;
  return resolveBooking(latest, await loadSlots(latest), selection);
}

export function ScheduleOptions({ service, schedule }: { service: PublicService; schedule: ReturnType<typeof useServiceSchedule> }) {
  const { slots, status, required: requiresSlot, selectDate, selectCheckout: setCheckout, selectSlot: setSlotId } = schedule;
  const { date, checkout, slotId } = schedule.selection;
  const hotel = service.is_accommodation || service.price_type === 'per_night';
  const dates = [...new Set(slots.map(slotDate))];
  const checkoutDates = checkoutOptions(slots, date);
  if (!requiresSlot) return <Text>Layanan ini dapat langsung dipesan.</Text>;
  if (status === 'loading') return <ActivityIndicator accessibilityLabel="Memuat jadwal" color={colors.primary} />;
  if (status === 'error') return <Text accessibilityRole="button" style={styles.retry} onPress={schedule.refresh}>Jadwal gagal dimuat. Coba lagi.</Text>;
  if (!dates.length) return <Text>Belum ada jadwal tersedia.</Text>;

  const times = slots.filter(slot => slotDate(slot) === date);
  return (
    <>
      <Text style={styles.heading}>{hotel ? 'Check-in' : 'Tanggal tersedia'}</Text>
      <View style={styles.options}>
        {dates.map(day => (
          <ScheduleChoice key={day} label={day} selected={date === day} onPress={() => selectDate(day)} />
        ))}
      </View>
      {date && dates.includes(date) && (
        <>
          <Text style={styles.heading}>{hotel ? 'Check-out' : 'Pilih jam'}</Text>
          <View style={styles.options}>
            {hotel ? checkoutDates.map(day => (
              <ScheduleChoice key={day} label={day} selected={checkout === day} onPress={() => setCheckout(day)} />
            )) : times.map(slot => (
              <ScheduleChoice key={slot.id} label={slot.start_time.slice(0, 5) + ' WIB'} selected={slotId === slot.id} onPress={() => setSlotId(slot.id)} />
            ))}
          </View>
        </>
      )}
    </>
  );
}

function ScheduleChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }}
      style={[styles.option, selected && styles.selected]} onPress={onPress}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.titleMd, color: colors.navy },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  retry: { color: colors.primary, paddingVertical: 12 },
  option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md, padding: 12 },
  selected: { backgroundColor: colors.primaryFixed, borderColor: colors.primary },
});
