import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ChevronLeft, ChevronRight, Clock, CalendarDays, Lock, SlidersHorizontal, ChevronDown, Trash2, Store } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Card } from '../../../../components/Card/Card';
import { Button } from '../../../../components/Button/Button';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { vendorApi } from '../../../../api/vendorApi';
import { timeSlotApi } from '../../../../api/timeSlotApi';
import AddSlotModal from '../components/AddSlotModal';

// ============ TYPES ============
type ServiceItem = { id: number; name: string };
type SlotItem = {
  id: number; slot_date: string; start_time: string; end_time: string; quota: number; booked_count: number;
};
type WorkingHour = {
  id: number; day_of_week: number; label: string; start_time: string; end_time: string;
};
type CalendarDay = {
  date: string; dayOfMonth: number; isCurrentMonth: boolean; isSelected: boolean;
  status: 'available' | 'full' | 'none'; isToday: boolean;
};

// ============ MOCK DATA (ganti dengan API nanti) ============
const MOCK_WORKING_HOURS: WorkingHour[] = [
  { id: 1, day_of_week: 1, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 2, day_of_week: 1, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 3, day_of_week: 2, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 4, day_of_week: 2, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 5, day_of_week: 3, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 6, day_of_week: 3, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 7, day_of_week: 4, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 8, day_of_week: 4, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 9, day_of_week: 5, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 10, day_of_week: 5, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 11, day_of_week: 6, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 12, day_of_week: 6, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
];
const MOCK_BOOKING_LIMIT_H1 = 24;

// ============ HELPERS ===========
const DAY_NAMES_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const STATUS_COLORS = {
  available: colors.primary,
  full: colors.outline,
  none: colors.outlineVariant,
};
const STATUS_LABELS = {
  available: 'Tersedia',
  full: 'Penuh',
  none: '',
};
const MONTH_NAMES_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];
const YEAR_RANGE = [2020, 2035];

function calculateDayStatus(dateStr: string, slots: SlotItem[]): 'available' | 'full' | 'none' {
  const daySlots = slots.filter((s) => s.slot_date === dateStr);
  if (daySlots.length === 0) return 'none';
  const availableCount = daySlots.filter((s) => s.booked_count < s.quota).length;
  if (availableCount === 0) return 'full';
  return 'available';
}

function formatDateISO(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getTodayISO(): string {
  return formatDateISO(new Date());
}

function isTodayDate(dateStr: string): boolean {
  const todayStr = getTodayISO();
  return dateStr === todayStr;
}

// ============ COMPONENT ===========
export default function ManageCalendarScreen() {
  // --- State utama ---
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(MOCK_WORKING_HOURS);
  const [bookingLimitH1, setBookingLimitH1] = useState<number>(MOCK_BOOKING_LIMIT_H1);

  // --- State calendar (dipilih user: bulan + tahun) ---
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [lastTapInfo, setLastTapInfo] = useState<{ date: string; time: number } | null>(null);

  // --- State form edit ---
  const [storeOpen, setStoreOpen] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingWorkingHours, setSavingWorkingHours] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);

  // --- Picker modals ---
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const res = await vendorApi.listMyServices();
      const rawData = res.data?.data;
      const list: ServiceItem[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
      setServices(list);
      setSelectedServiceId((previousId) => {
        if (previousId && list.some((service) => service.id === previousId)) return previousId;
        return list.length > 0 ? list[0].id : null;
      });
    } catch (err) {
      console.log('Gagal ambil layanan:', err);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices]),
  );

  // Load slot dari API tiap service berubah
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

  // Generate days grid berdasarkan bulan & tahun terpilih
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startPad = firstDayOfMonth.getDay(); // 0=Sun ... 6=Sab

    const days: CalendarDay[] = [];

    // Padding awal (hari dari bulan sebelumnya)
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = formatDateISO(d);
      days.push(createCalendarDay(dateStr, d, false));
    }

    // Hari dalam bulan ini
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(year, month, day);
      const dateStr = formatDateISO(d);
      days.push(createCalendarDay(dateStr, d, true));
    }

    // Padding akhir (sampai habis minggu)
    const endPad = 6 - lastDayOfMonth.getDay();
    for (let i = 1; i <= endPad; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = formatDateISO(d);
      days.push(createCalendarDay(dateStr, d, false));
    }

    return days;
  }, [selectedYear, selectedMonth, selectedDate, slots]);

  function createCalendarDay(dateStr: string, d: Date, isCurrentMonth: boolean): CalendarDay {
    const dayOfMonth = d.getDate();
    const isToday = isTodayDate(dateStr);
    const isSelected = dateStr === selectedDate;
    const status = calculateDayStatus(dateStr, slots);

    return {
      date: dateStr,
      dayOfMonth,
      isCurrentMonth,
      isSelected,
      status,
      isToday,
    };
  }

  // Derived display strings
  const monthName = MONTH_NAMES_ID[selectedMonth] ?? '';
  const yearLabel = String(selectedYear);

  const monthYearLabel = useMemo(() => {
    return `${monthName} ${yearLabel}`;
  }, [monthName, yearLabel]);

  // Load working hours dari API (mock sekarang)
  const loadWorkingHours = useCallback(async () => {
    // TODO: panggil API endpoint untuk working hours
    setWorkingHours(MOCK_WORKING_HOURS);
  }, []);

  // Load booking limit H-1 dari API (mock sekarang)
  const loadBookingLimit = useCallback(async () => {
    // TODO: panggil API endpoint untuk booking limit H-1
    setBookingLimitH1(MOCK_BOOKING_LIMIT_H1);
  }, []);

  // Load semua data saat mount
  useEffect(() => {
    loadWorkingHours();
    loadBookingLimit();
  }, [loadWorkingHours, loadBookingLimit]);

  // Handle pilih tanggal
  const handleSelectDate = (dateStr: string) => {
    const now = Date.now();
    const isDoubleTap = lastTapInfo?.date === dateStr && now - lastTapInfo.time < 300;

    setSelectedDate(dateStr);
    setLastTapInfo(isDoubleTap ? null : { date: dateStr, time: now });

    if (isDoubleTap) {
      if (!selectedServiceId) {
        Toast.show({
          type: 'info',
          text1: 'Pilih layanan dulu',
          text2: 'Pilih salah satu layanan di atas sebelum menambah slot.',
          position: 'top',
        });
        return;
      }
      setShowAddSlotModal(true);
    }
  };

  // Handle previous/next month
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Handle save working hours
  const handleSaveWorkingHours = async () => {
    setSavingWorkingHours(true);
    try {
      Toast.show({
        type: 'success',
        text1: 'Jam kerja disimpan',
        text2: 'Pengaturan jam kerja berhasil diperbarui.',
      });
    } catch (err) {
      console.log('Gagal simpan jam kerja:', err);
      Toast.show({ type: 'error', text1: 'Gagal menyimpan', text2: 'Coba lagi.' });
    } finally {
      setSavingWorkingHours(false);
    }
  };

  const handleDeleteSlot = async (slot: SlotItem) => {
    try {
      await timeSlotApi.deleteSlot(slot.id);
      Toast.show({ type: 'success', text1: 'Slot dihapus', position: 'top' });
      if (selectedServiceId) await loadSlots(selectedServiceId);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      Toast.show({
        type: 'error',
        text1: message ?? 'Gagal menghapus slot',
        text2: message ? undefined : 'Coba lagi dalam beberapa saat.',
        position: 'top',
      });
    }
  };

  const selectedServiceName = services.find((service) => service.id === selectedServiceId)?.name;
  const slotsForSelectedDate = slots.filter((slot) => slot.slot_date === selectedDate);

  // Get status hari ini
  const todayStatus = calendarDays.find((d) => d.isToday);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerDecorCircleLarge} />
        <View style={styles.headerDecorCircleSmall} />
        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <CalendarDays size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Kelola Slot Booking</Text>
            <Text style={styles.titleSubtitle}>{selectedServiceName ?? 'Pilih layanan'} · {monthYearLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.servicePickerSection}>
        <Text style={styles.sectionHeading}>Pilih layanan</Text>
        {loadingServices ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : services.length === 0 ? (
          <EmptyState message="Belum ada layanan. Tambahkan layanan dulu di menu Listing sebelum atur slot booking." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicePicker}>
            {services.map((service) => {
              const isActive = service.id === selectedServiceId;
              return (
                <Pressable
                  key={service.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedServiceId(service.id)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{service.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {services.length > 0 && !loadingServices && <>
      {/* ===== PICKER BULAN & TAHUN ===== */}
      <View style={styles.pickerRow}>
        <Pressable style={styles.pickerBtn} onPress={() => setShowMonthPicker(true)}>
          <Text style={styles.pickerLabel}>Bulan</Text>
          <Text style={styles.pickerValue}>{monthName}</Text>
          <ChevronDown size={16} color={colors.onSurfaceVariant} />
        </Pressable>
        <Pressable style={styles.pickerBtn} onPress={() => setShowYearPicker(true)}>
          <Text style={styles.pickerLabel}>Tahun</Text>
          <Text style={styles.pickerValue}>{yearLabel}</Text>
          <ChevronDown size={16} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>Tersedia</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.outline }]} />
          <Text style={styles.legendLabel}>Penuh</Text>
        </View>
      </View>
      <Text style={styles.calendarHint}>Tips: ketuk 2x tanggal untuk langsung tambah slot</Text>

      {/* ===== SCROLL VIEW UTAMA ===== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} tintColor={colors.primary} />
        }
      >
        {/* Calendar Grid — border, scrollable (sekarang di dalam scrollView utama) */}
        <View style={styles.calendarContainer}>
          {/* Day names header */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES_SHORT.map((day, idx) => (
              <Text key={idx} style={styles.dayName}>{day}</Text>
            ))}
          </View>

          {/* Day cells grid */}
          <View style={styles.weekContainer}>
            {calendarDays.map((day, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSelectDate(day.date)}
                style={[
                  styles.dayCell,
                  day.isCurrentMonth ? {} : styles.dayCellOtherMonth,
                  day.isSelected && styles.dayCellSelected,
                  day.status === 'full' && styles.dayCellFull,
                  day.status === 'available' && styles.dayCellAvailable,
                  day.isToday && styles.dayCellToday,
                ]}
              >
                <View style={styles.dayNumberContainer}>
                  <Text
                    style={[
                      styles.dayNumber,
                      day.isCurrentMonth ? {} : styles.dayNumberOtherMonth,
                      day.isSelected && styles.dayNumberSelected,
                      day.isToday && styles.dayNumberToday,
                    ]}
                  >
                    {day.dayOfMonth}
                  </Text>
                  {day.status !== 'none' && (
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[day.status] }]} />
                  )}
                </View>
                {day.isSelected && day.status !== 'none' && (
                  <Text style={styles.statusLabel}>{STATUS_LABELS[day.status]}</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Month navigation bar di dalam calendar */}
          <View style={styles.navRow}>
            <Pressable onPress={goToPreviousMonth} style={styles.navBtn}>
              <ChevronLeft size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.navMonthLabel}>{monthYearLabel}</Text>
            <Pressable onPress={goToNextMonth} style={styles.navBtn}>
              <ChevronRight size={22} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        {/* Spacer kecil */}
        <View style={{ height: spacing.stackMd }} />

        {/* Detail Panel untuk tanggal yang dipilih */}
        <View style={styles.detailContainer}>
          {/* Judul detail */}
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Pengaturan {formatSelectedDate(selectedDate)}</Text>
          </View>

          {/* Form pengaturan tanggal */}
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <SlidersHorizontal size={20} color={colors.onSurfaceVariant} />
                <Text style={styles.settingLabelText}>Buka Toko</Text>
              </View>
              <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>Segera Hadir</Text></View>
            </View>

            <View style={styles.dayInfoCard}>
              <View style={styles.dayInfoRow}>
                <CalendarDays size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.dayInfoText}>
                  {todayStatus?.status === 'available'
                    ? 'Tersedia — Pelanggan bisa memesan'
                    : todayStatus?.status === 'full'
                    ? 'Penuh — Semua slot sudah terbooking'
                    : 'Belum ada pengaturan'}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.slotsCard}>
            <View style={styles.cardHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Slot untuk {formatSelectedDate(selectedDate)}</Text>
            </View>
            {loadingSlots ? (
              <ActivityIndicator color={colors.primary} />
            ) : slotsForSelectedDate.length === 0 ? (
              <Text style={styles.emptySlotText}>Belum ada slot untuk tanggal ini.</Text>
            ) : (
              slotsForSelectedDate.map((slot) => (
                <View key={slot.id} style={styles.slotRow}>
                  <View style={styles.slotInfo}>
                    <Text style={styles.slotTime}>{slot.start_time} - {slot.end_time}</Text>
                    <Text style={styles.slotCapacity}>{slot.booked_count}/{slot.quota} terisi ({slot.quota - slot.booked_count} tersisa)</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteSlot(slot)} style={styles.deleteSlotButton}>
                    <Trash2 size={19} color={colors.error} />
                  </Pressable>
                </View>
              ))
            )}
            <Pressable style={styles.addSlotButton} onPress={() => setShowAddSlotModal(true)}>
              <Text style={styles.addSlotText}>+ Tambah Slot</Text>
            </Pressable>
          </Card>

          {/* Jam Kerja */}
          <Card style={styles.workingHoursCard}>
            <View style={styles.cardHeader}>
              <Clock size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.cardTitle}>Jam Kerja</Text>
              <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>Segera Hadir</Text></View>
            </View>

            {/* List sesi per hari */}
            <View style={styles.sessionsList}>
              {workingHours.map((wh) => (
                <View key={wh.id} style={styles.sessionRow}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionLabel}>{wh.label}</Text>
                    <Text style={styles.sessionTime}>
                      {wh.start_time} - {wh.end_time}
                    </Text>
                  </View>
                  <Pressable disabled style={[styles.editButton, styles.disabledOverlay]}>
                    <Text style={styles.editText}>✎</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Tambah Sesi */}
            <Pressable
              disabled
              style={[styles.addSessionButton, styles.disabledOverlay]}
            >
              <Text style={styles.addSessionText}>+ Tambah Sesi</Text>
            </Pressable>

            {/* Save button */}
            <Button
              label={savingWorkingHours ? 'Menyimpan...' : 'Simpan Jam Kerja'}
              onPress={handleSaveWorkingHours}
              disabled
              style={[styles.saveButton, styles.disabledOverlay]}
            />
          </Card>

          {/* Blokir Tanggal Massal */}
          <Pressable
            style={[styles.blockDateCard, styles.disabledOverlay]}
            disabled
          >
            <View style={styles.blockDateIcon}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.blockDateInfo}>
              <Text style={styles.blockDateTitle}>Blokir Tanggal Massal</Text>
              <Text style={styles.comingSoonText}>Segera Hadir</Text>
              <Text style={styles.blockDateDesc}>Tutup semua layanan untuk periode libur panjang.</Text>
            </View>
            <View style={styles.blockDateArrow}>
              <ChevronRight size={20} color={colors.onSurfaceVariant} />
            </View>
          </Pressable>

          {/* Batas Booking H-1 */}
          <Pressable
            style={[styles.bookingLimitCard, styles.disabledOverlay]}
            disabled
          >
            <View style={styles.bookingLimitIcon}>
              <CalendarDays size={20} color="#3B82F6" />
            </View>
            <View style={styles.bookingLimitInfo}>
              <Text style={styles.bookingLimitTitle}>Batas Booking H-1</Text>
              <Text style={styles.comingSoonText}>Segera Hadir</Text>
              <Text style={styles.bookingLimitDesc}>
                Cegah pelanggan memesan di hari yang sama (minimum {bookingLimitH1} jam pertama).
              </Text>
            </View>
            <View style={styles.bookingLimitArrow}>
              <ChevronRight size={20} color={colors.onSurfaceVariant} />
            </View>
          </Pressable>
        </View>

        {/* Spacer bawah untuk padding */}
        <View style={{ height: spacing.sectionGap }} />
      </ScrollView>
      </>}

      <AddSlotModal
        visible={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        serviceId={selectedServiceId}
        defaultDate={selectedDate}
        onCreated={() => selectedServiceId && loadSlots(selectedServiceId)}
      />

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Bulan</Text>
            <FlatList
              data={MONTH_NAMES_ID}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <Pressable
                  style={[styles.modalItem, index === selectedMonth && styles.modalItemSelected]}
                  onPress={() => { setSelectedMonth(index); setShowMonthPicker(false); }}
                >
                  <Text style={[styles.modalItemText, index === selectedMonth && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.modalCancel} onPress={() => setShowMonthPicker(false)}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal visible={showYearPicker} transparent animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Tahun</Text>
            <FlatList
              data={Array.from({ length: YEAR_RANGE[1] - YEAR_RANGE[0] + 1 }, (_, i) => YEAR_RANGE[0] + i)}
              keyExtractor={(y) => String(y)}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.modalItem, item === selectedYear && styles.modalItemSelected]}
                  onPress={() => { setSelectedYear(item); setShowYearPicker(false); }}
                >
                  <Text style={[styles.modalItemText, item === selectedYear && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.modalCancel} onPress={() => setShowYearPicker(false)}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============ HELPER FUNCS ===========
function formatSelectedDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_ID[d.getMonth()] ?? '';
  return `${day} ${month}`;
}

// ============ STYLES ===========
const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_CELL_WIDTH = (SCREEN_WIDTH - spacing.containerMargin * 2 - spacing.stackSm * 6) / 7;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.sectionGap,
  },
  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 60,
    paddingBottom: spacing.stackMd,
    backgroundColor: colors.primaryContainer,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 130,
  },
  headerDecorCircleLarge: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: colors.primary, opacity: 0.08, right: -70, top: -90,
  },
  headerDecorCircleSmall: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.secondary, opacity: 0.08, right: 50, bottom: -45,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackMd },
  titleIconWrap: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: typography.headlineLg.fontFamily, fontSize: 22,
    fontWeight: typography.headlineLg.fontWeight, color: colors.onSurface,
  },
  titleSubtitle: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  servicePickerSection: { paddingHorizontal: spacing.containerMargin, paddingTop: spacing.stackMd },
  sectionHeading: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
  servicePicker: { gap: spacing.stackSm, paddingBottom: spacing.stackSm },
  filterChip: { paddingHorizontal: spacing.stackMd, paddingVertical: spacing.stackSm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant },
  filterChipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  brandTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  openBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: spacing.stackSm,
    borderRadius: radius.full,
  },
  openBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    color: colors.onPrimary,
  },
  // ---- Title Section ----
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.stackMd,
    paddingBottom: spacing.stackSm,
  },
  titleLeft: {
    flex: 1,
  },
  monthYear: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: typography.headlineLg.fontWeight,
    color: colors.onSurface,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  navArrowRow: {
    flexDirection: 'row',
    gap: spacing.stackMd,
  },
  navArrowBtn: {
    padding: spacing.stackSm,
  },
  // ---- Picker Row ----
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.stackMd,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.stackSm,
    paddingBottom: spacing.stackMd,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: spacing.stackSm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  pickerLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  pickerValue: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    color: colors.onSurface,
    fontWeight: '600',
    minWidth: 50,
  },
  // ---- Legend ----
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.stackMd,
    gap: spacing.stackMd,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  calendarHint: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.stackSm,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  // ---- Calendar Container ----
  calendarContainer: {
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.stackMd,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.stackSm,
  },
  dayName: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    width: DAY_CELL_WIDTH,
  },
  weekContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: DAY_CELL_WIDTH,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.stackSm,
    borderRadius: radius.sm,
    marginBottom: spacing.stackSm,
  },
  dayCellOtherMonth: {
    opacity: 0.4,
  },
  dayCellSelected: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.sm,
  },
  dayCellFull: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
  },
  dayCellAvailable: {
    backgroundColor: colors.accentGreenContainer,
    borderRadius: radius.sm,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  dayNumberOtherMonth: {
    color: colors.outline,
  },
  dayNumberSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: colors.primary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 2,
  },
  statusLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 9,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: DAY_CELL_WIDTH,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.stackMd,
    marginTop: spacing.stackMd,
  },
  navBtn: {
    padding: spacing.stackSm,
  },
  navMonthLabel: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    minWidth: 120,
    textAlign: 'center',
  },
  // ---- Detail Container ----
  detailContainer: {
    paddingHorizontal: spacing.containerMargin,
  },
  detailHeader: {
    marginBottom: spacing.stackMd,
  },
  detailTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  settingCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    marginBottom: spacing.stackMd,
  },
  slotsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    marginBottom: spacing.stackMd,
  },
  emptySlotText: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.stackMd },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainer, borderRadius: radius.sm, padding: spacing.stackMd, marginBottom: spacing.stackSm },
  slotInfo: { flex: 1 },
  slotTime: { fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  slotCapacity: { fontFamily: typography.bodyMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 3 },
  deleteSlotButton: { padding: spacing.stackSm },
  addSlotButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.full, padding: spacing.stackMd, alignItems: 'center', marginTop: spacing.stackSm },
  addSlotText: { fontFamily: typography.button.fontFamily, fontSize: typography.button.fontSize, color: colors.primary, fontWeight: typography.button.fontWeight },
  comingSoonBadge: { marginLeft: 'auto', backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.full, paddingHorizontal: spacing.stackSm, paddingVertical: 4 },
  comingSoonText: { fontFamily: typography.labelMd.fontFamily, fontSize: 10, color: colors.onSurfaceVariant },
  disabledOverlay: { opacity: 0.5 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.stackMd,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  settingLabelText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    color: colors.onSurface,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.outlineVariant,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.onSurface,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  slotsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.stackMd,
    marginBottom: spacing.stackMd,
  },
  sectionText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.stackSm,
  },
  slotsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.stackMd,
  },
  slotsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsButtonText: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 20,
    color: colors.onSurface,
    fontWeight: '600',
  },
  slotsCount: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
    minWidth: 40,
    textAlign: 'center',
  },
  dayInfoCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    padding: spacing.stackSm,
    marginTop: spacing.stackMd,
  },
  dayInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  dayInfoText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  workingHoursCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    marginBottom: spacing.stackMd,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    marginBottom: spacing.stackMd,
  },
  cardTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  sessionsList: {
    gap: spacing.stackSm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    padding: spacing.stackSm,
    marginBottom: spacing.stackSm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurface,
    fontWeight: '500',
  },
  sessionTime: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  editButton: {
    padding: spacing.stackSm,
  },
  editText: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    color: colors.primary,
  },
  addSessionButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    padding: spacing.stackMd,
    alignItems: 'center',
    marginTop: spacing.stackMd,
    marginBottom: spacing.stackMd,
  },
  addSessionText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: colors.primary,
    fontWeight: typography.button.fontWeight,
  },
  saveButton: {
    marginTop: spacing.stackSm,
  },
  blockDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    marginBottom: spacing.stackMd,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  blockDateIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.stackMd,
  },
  blockDateInfo: {
    flex: 1,
  },
  blockDateTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  blockDateDesc: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  blockDateArrow: {
    padding: spacing.stackSm,
  },
  bookingLimitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  bookingLimitIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.stackMd,
  },
  bookingLimitInfo: {
    flex: 1,
  },
  bookingLimitTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  bookingLimitDesc: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  bookingLimitArrow: {
    padding: spacing.stackSm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.containerMargin,
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    width: SCREEN_WIDTH - spacing.containerMargin * 2,
    maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
    marginBottom: spacing.stackMd,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: spacing.stackMd,
    paddingHorizontal: spacing.stackMd,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.sm,
  },
  modalItemText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 16,
    color: colors.onSurface,
  },
  modalItemTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  modalCancel: {
    marginTop: spacing.stackMd,
    paddingVertical: spacing.stackMd,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: colors.error,
    fontWeight: typography.button.fontWeight,
  },
});
