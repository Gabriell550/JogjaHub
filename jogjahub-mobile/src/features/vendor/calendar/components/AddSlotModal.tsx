import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import { timeSlotApi } from '../../../../api/timeSlotApi';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  serviceId: number | null;
  defaultDate: string;
  onCreated: () => void;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function AddSlotModal({ visible, onClose, serviceId, defaultDate, onCreated }: Props) {
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [quota, setQuota] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(defaultDate);
      setStartTime('08:00');
      setEndTime('09:00');
      setQuota('1');
    }
  }, [visible, defaultDate]);

  const handleSubmit = async () => {
    if (!serviceId) return;
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date < todayISO) {
      Toast.show({ type: 'error', text1: 'Tanggal tidak boleh sebelum hari ini', position: 'top' });
      return;
    }
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      Toast.show({ type: 'error', text1: 'Format jam harus HH:mm', position: 'top' });
      return;
    }
    if (endTime <= startTime) {
      Toast.show({ type: 'error', text1: 'Jam selesai harus setelah jam mulai', position: 'top' });
      return;
    }
    const quotaNumber = Number(quota);
    if (!Number.isInteger(quotaNumber) || quotaNumber < 1) {
      Toast.show({ type: 'error', text1: 'Kuota minimal 1', position: 'top' });
      return;
    }

    setSaving(true);
    try {
      await timeSlotApi.createSlot({
        service_id: serviceId,
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        quota: quotaNumber,
      });
      Toast.show({ type: 'success', text1: 'Slot berhasil dibuat', position: 'top' });
      onCreated();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      Toast.show({
        type: 'error',
        text1: message ?? 'Gagal membuat slot',
        text2: message ? undefined : 'Coba lagi dalam beberapa saat.',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tambah Slot</Text>
            <Pressable onPress={onClose} hitSlop={10}><X size={21} color={colors.onSurfaceVariant} /></Pressable>
          </View>
          {!serviceId && <Text style={styles.warningText}>Pilih layanan dulu sebelum tambah slot.</Text>}
          <Text style={styles.label}>Tanggal</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.onSurfaceVariant} style={styles.input} />
          <Text style={styles.label}>Jam mulai</Text>
          <TextInput value={startTime} onChangeText={setStartTime} placeholder="HH:mm" placeholderTextColor={colors.onSurfaceVariant} style={styles.input} />
          <Text style={styles.label}>Jam selesai</Text>
          <TextInput value={endTime} onChangeText={setEndTime} placeholder="HH:mm" placeholderTextColor={colors.onSurfaceVariant} style={styles.input} />
          <Text style={styles.label}>Kuota</Text>
          <TextInput value={quota} onChangeText={setQuota} keyboardType="numeric" placeholder="1" placeholderTextColor={colors.onSurfaceVariant} style={styles.input} />
          <Pressable disabled={!serviceId || saving} onPress={handleSubmit} style={[styles.submitButton, (!serviceId || saving) && styles.disabled]}>
            <Text style={styles.submitText}>{saving ? 'Menyimpan...' : 'Simpan Slot'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.containerMargin, paddingBottom: spacing.sectionGap },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.stackMd },
  modalTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: typography.titleMd.fontSize, fontWeight: typography.titleMd.fontWeight, color: colors.onSurface },
  label: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: spacing.stackSm, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.sm, paddingHorizontal: spacing.stackMd, paddingVertical: spacing.stackSm, color: colors.onSurface, fontFamily: typography.bodyMd.fontFamily },
  warningText: { color: colors.error, fontFamily: typography.bodyMd.fontFamily, fontSize: 12, marginBottom: spacing.stackSm },
  submitButton: { backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', padding: spacing.stackMd, marginTop: spacing.stackLg },
  disabled: { opacity: 0.5 },
  submitText: { color: colors.onPrimary, fontFamily: typography.button.fontFamily, fontSize: typography.button.fontSize, fontWeight: typography.button.fontWeight },
});
