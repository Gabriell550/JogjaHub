import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import { isAxiosError } from 'axios';
import { timeSlotApi } from '../../../../api/timeSlotApi';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type SlotItem = {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  quota: number;
  booked_count: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  serviceId: number | null;
  selectedDates: string[];
  isHotel: boolean | null;
  existingSlots: SlotItem[];
  onCreated: (createdDates: string[]) => void;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function getErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const message: unknown = error.response?.data?.message;
  return typeof message === 'string' ? message : undefined;
}

function formatDate(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  return value.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  const [year, month, day] = value.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export default function AddSlotModal({
  visible,
  onClose,
  serviceId,
  selectedDates,
  isHotel,
  existingSlots,
  onCreated,
}: Props) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState(' ');
  const [quota, setQuota] = useState('1');
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    if (visible) {
      setStartTime(' ');
      setEndTime(' ');
      setQuota('1');
    }
  }, [visible]);

  const sortedDates = useMemo(
    () => [...new Set(selectedDates)].sort(),
    [selectedDates],
  );

  const handleSubmit = async () => {
    if (!serviceId || sortedDates.length === 0 || isHotel === null || submitLock.current) return;

    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (sortedDates.some((date) => !isValidDate(date) || date < todayISO)) {
      Toast.show({
        type: 'error',
        text1: 'Periksa tanggal yang dipilih',
        text2: 'Tanggal harus valid dan tidak boleh sebelum hari ini.',
        position: 'top',
      });
      return;
    }
    if (isHotel && (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime))) {
      Toast.show({ type: 'error', text1: 'Format jam harus HH:mm', position: 'top' });
      return;
    }
    if (isHotel && endTime <= startTime) {
      Toast.show({ type: 'error', text1: 'Jam selesai harus setelah jam mulai', position: 'top' });
      return;
    }

    const quotaNumber = Number(quota);
    if (!Number.isInteger(quotaNumber) || quotaNumber < 1) {
      Toast.show({ type: 'error', text1: 'Kuota minimal 1', position: 'top' });
      return;
    }

    const duplicateDates = sortedDates.filter((date) =>
      existingSlots.some(
        (slot) =>
          slot.slot_date === date &&
          (isHotel
            ? slot.start_time.slice(0, 5) === startTime && slot.end_time.slice(0, 5) === endTime
            : true),
      ),
    );
    if (duplicateDates.length > 0) {
      Toast.show({
        type: 'error',
        text1: isHotel ? 'Slot dengan waktu yang sama sudah ada' : 'Slot sudah ada pada tanggal ini',
        text2: duplicateDates.map(formatDate).join(', '),
        position: 'top',
      });
      return;
    }

    submitLock.current = true;
    setSaving(true);
    const createdDates: string[] = [];
    const failedDates: { date: string; message?: string }[] = [];
    try {
      for (const date of sortedDates) {
        try {
          await timeSlotApi.createSlot({
            service_id: serviceId,
            slot_date: date,
            start_time: startTime,
            end_time: endTime,
            quota: quotaNumber,
          });
          createdDates.push(date);
        } catch (error) {
          failedDates.push({ date, message: getErrorMessage(error) });
        }
      }

      if (createdDates.length > 0) onCreated(createdDates);
      if (failedDates.length === 0) {
        Toast.show({
          type: 'success',
          text1: `${createdDates.length} slot berhasil dibuat`,
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: `${createdDates.length} berhasil, ${failedDates.length} gagal`,
          text2: `${formatDate(failedDates[0].date)}${failedDates[0].message ? `: ${failedDates[0].message}` : ''}`,
          position: 'top',
        });
      }
      onClose();
    } finally {
      setSaving(false);
      submitLock.current = false;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => { if (!saving) onClose(); }}
    >
      <View style={styles.modalBackdrop}>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tambah slot</Text>
                <Text style={styles.modalSubtitle}>
                  {sortedDates.length === 1 ? 'Satu tanggal' : `${sortedDates.length} tanggal dipilih`}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                disabled={saving}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Tutup form tambah slot"
                style={styles.closeButton}
              >
                <X size={21} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {!serviceId && <Text style={styles.warningText}>Pilih layanan dulu sebelum tambah slot.</Text>}

            <Text style={styles.label}>Tanggal</Text>
            <View style={styles.dateList}>
              {sortedDates.map((date) => (
                <Text key={date} style={styles.dateItem}>{formatDate(date)}</Text>
              ))}
            </View>
            <Text style={styles.helperText}>
              Slot disimpan satu per satu. Jika sebagian gagal, tanggal yang berhasil akan tetap tersimpan.
            </Text>

            {isHotel ? (
              <>
                <Text style={styles.label}>Jam mulai</Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={styles.input}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Jam mulai"
                />
                <Text style={styles.label}>Jam selesai</Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={styles.input}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Jam selesai"
                />
              </>
            ) : (
              <Text style={styles.helperText}>
                Layanan non-penginapan menggunakan waktu standar 08:00–09:00 sesuai kontrak API.
              </Text>
            )}
            <Text style={styles.label}>Kuota per tanggal</Text>
            <TextInput
              value={quota}
              onChangeText={setQuota}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.onSurfaceVariant}
              style={styles.input}
              accessibilityLabel="Kuota per tanggal"
            />

            <Pressable
              disabled={!serviceId || sortedDates.length === 0 || isHotel === null || saving}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                (!serviceId || sortedDates.length === 0 || isHotel === null || saving) && styles.disabled,
                pressed && !saving && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Simpan slot untuk tanggal terpilih"
              accessibilityState={{ disabled: !serviceId || sortedDates.length === 0 || isHotel === null || saving, busy: saving }}
            >
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.submitText}>Simpan slot</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalScroll: { flexGrow: 0, maxHeight: '92%' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.containerMargin,
    paddingBottom: spacing.sectionGap,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.stackMd },
  modalTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: typography.titleMd.fontSize, fontWeight: typography.titleMd.fontWeight, color: colors.onSurface },
  modalSubtitle: { fontFamily: typography.bodySm.fontFamily, fontSize: typography.bodySm.fontSize, color: colors.onSurfaceVariant, marginTop: 4 },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: spacing.stackSm, marginBottom: 4 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.sm, paddingHorizontal: spacing.stackMd, paddingVertical: spacing.stackSm, color: colors.onSurface, fontFamily: typography.bodyMd.fontFamily },
  warningText: { color: colors.error, fontFamily: typography.bodyMd.fontFamily, fontSize: 12, marginBottom: spacing.stackSm },
  dateList: { gap: spacing.stackSm },
  dateItem: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.sm, paddingHorizontal: spacing.stackMd, paddingVertical: spacing.stackSm, color: colors.onSurface, fontFamily: typography.bodyMd.fontFamily },
  helperText: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: spacing.stackSm },
  submitButton: { backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.stackMd, marginTop: spacing.stackLg },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  submitText: { color: colors.onPrimary, fontFamily: typography.button.fontFamily, fontSize: typography.button.fontSize, fontWeight: typography.button.fontWeight },
});
