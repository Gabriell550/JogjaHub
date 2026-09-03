import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Input } from '../../../../components/Input/Input';
import { Button } from '../../../../components/Button/Button';
import { Card } from '../../../../components/Card/Card';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { vendorApi } from '../../../../api/vendorApi';
import { timeSlotApi } from '../../../../api/timeSlotApi';

type ServiceItem = { id: number; name: string };
type SlotItem = { id: number; slot_date: string; start_time: string; end_time: string; quota: number; booked_count: number };

// Atur slot waktu & kapasitas booking per layanan (termasuk slot dini hari).
// timeSlotApi.ts sudah nyambung ke backend asli (Tenant/TimeSlotController, logikanya lengkap).
export default function ManageCalendarScreen() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quota, setQuota] = useState('1');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await vendorApi.listMyServices();
        const list = res.data?.data?.data ?? [];
        setServices(list);
        if (list.length > 0) setSelectedServiceId(list[0].id);
      } catch (err) {
        console.log('Gagal ambil layanan:', err);
      } finally {
        setLoadingServices(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedServiceId) return;
    loadSlots(selectedServiceId);
  }, [selectedServiceId]);

  const loadSlots = async (serviceId: number) => {
    setLoadingSlots(true);
    try {
      const res = await timeSlotApi.listByService(serviceId);
      setSlots(res.data?.data ?? []);
    } catch (err) {
      console.log('Gagal ambil slot:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!selectedServiceId) return;
    if (!slotDate || !startTime || !endTime) {
      Toast.show({ type: 'error', text1: 'Data belum lengkap', text2: 'Isi tanggal, jam mulai, dan jam selesai.' });
      return;
    }
    const dateFormatOk = /^\d{4}-\d{2}-\d{2}$/.test(slotDate);
    const timeFormatOk = /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime);
    if (!dateFormatOk || !timeFormatOk) {
      Toast.show({ type: 'error', text1: 'Format salah', text2: 'Tanggal: YYYY-MM-DD, Jam: HH:MM (mis. 05:30).' });
      return;
    }

    setCreating(true);
    try {
      await timeSlotApi.createSlot({
        service_id: selectedServiceId,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        quota: Number(quota) || 1,
      });
      Toast.show({ type: 'success', text1: 'Slot berhasil dibuat' });
      setSlotDate('');
      setStartTime('');
      setEndTime('');
      setQuota('1');
      loadSlots(selectedServiceId);
    } catch (err: any) {
      console.log('Gagal buat slot:', err?.response?.data ?? err);
      const message = err?.response?.data?.message ?? 'Gagal membuat slot. Coba lagi.';
      Toast.show({ type: 'error', text1: 'Gagal membuat slot', text2: message });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      await timeSlotApi.deleteSlot(slotId);
      Toast.show({ type: 'success', text1: 'Slot dihapus' });
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err: any) {
      // Backend nolak (422) kalau slot sudah ada booking-nya — tampilkan pesan itu apa adanya,
      // jangan tampilkan pesan generik supaya vendor tahu alasan aslinya.
      const message = err?.response?.data?.message ?? 'Gagal menghapus slot.';
      Toast.show({ type: 'error', text1: 'Tidak bisa dihapus', text2: message });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Atur Jadwal</Text>

      {loadingServices ? (
        <Text style={styles.helperText}>Memuat layanan...</Text>
      ) : services.length === 0 ? (
        <EmptyState message="Tambahkan layanan dulu di tab Layanan sebelum atur jadwal." />
      ) : (
        <>
          <Text style={styles.sectionLabel}>Pilih Layanan</Text>
          <View style={styles.chipsWrap}>
            {services.map((s) => {
              const active = selectedServiceId === s.id;
              return (
                <Pressable key={s.id} onPress={() => setSelectedServiceId(s.id)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{s.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Tambah Slot Baru</Text>
          <Input placeholder="Tanggal (YYYY-MM-DD)" value={slotDate} onChangeText={setSlotDate} style={styles.inputSpacing} />
          <View style={styles.row}>
            <Input placeholder="Mulai (HH:MM)" value={startTime} onChangeText={setStartTime} style={[styles.inputSpacing, styles.rowInput]} />
            <Input placeholder="Selesai (HH:MM)" value={endTime} onChangeText={setEndTime} style={[styles.inputSpacing, styles.rowInput]} />
          </View>
          <Input placeholder="Kuota" value={quota} onChangeText={setQuota} keyboardType="number-pad" style={styles.inputSpacing} />
          <Button label={creating ? 'Menyimpan...' : '+ Tambah Slot'} onPress={handleCreateSlot} disabled={creating} />

          <View style={{ height: spacing.stackLg }} />
          <Text style={styles.sectionLabel}>Slot Tersedia</Text>
          {loadingSlots ? (
            <Text style={styles.helperText}>Memuat slot...</Text>
          ) : slots.length === 0 ? (
            <EmptyState message="Belum ada slot untuk layanan ini." />
          ) : (
            slots.map((slot) => (
              <View key={slot.id} style={{ marginBottom: spacing.stackSm }}>
                <Card>
                  <View style={styles.slotRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotDate}>{slot.slot_date}</Text>
                      <Text style={styles.slotTime}>{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</Text>
                      <Text style={styles.slotQuota}>Kuota: {slot.booked_count}/{slot.quota}</Text>
                    </View>
                    <Pressable onPress={() => handleDeleteSlot(slot.id)}>
                      <Text style={styles.deleteText}>Hapus</Text>
                    </Pressable>
                  </View>
                </Card>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60, paddingBottom: spacing.sectionGap },
  title: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
    marginBottom: spacing.stackLg,
  },
  sectionLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginBottom: spacing.stackSm,
    marginTop: spacing.stackSm,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.stackMd },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant },
  chipLabelActive: { color: colors.onPrimary, fontWeight: '600' },
  inputSpacing: { marginBottom: spacing.stackSm },
  row: { flexDirection: 'row', gap: spacing.stackSm },
  rowInput: { flex: 1 },
  helperText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotDate: { fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  slotTime: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  slotQuota: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.outline, marginTop: 2 },
  deleteText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.error, fontWeight: '600' },
});
