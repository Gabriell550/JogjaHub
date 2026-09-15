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
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ChevronLeft, Clock, CalendarDays, Lock, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Card } from '../../../../components/Card/Card';
import { Button } from '../../../../components/Button/Button';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { vendorApi } from '../../../../api/vendorApi';
import { timeSlotApi } from '../../../../api/timeSlotApi';

// ============ TYPES ============\ntype ServiceItem = { id: number; name: string };
type SlotItem = {
  id: number; slot_date: string; start_time: string; end_time: string; quota: number; booked_count: number;
};
type WorkingHour = {
  id: number; day_of_week: number; label: string; start_time: string; end_time: string;
};
type BlockedDate = {
  id: number; start_date: string; end_date: string; reason: string;
};
type CalendarDay = {
  date: string; dayOfMonth: number; isCurrentMonth: boolean; isSelected: boolean;
  status: 'available' | 'full' | 'blocked' | 'none'; isToday: boolean;
  workingHours: WorkingHour[]; storeOpen: boolean; slotsCount: number; blockedDates: BlockedDate[];
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
const MOCK_BLOCKED_DATES: BlockedDate[] = [
  { id: 1, start_date: '2026-09-28', end_date: '2026-10-01', reason: 'Libur Lebaran' },
  { id: 2, start_date: '2026-12-25', end_date: '2026-12-26', reason: 'Libur Natal' },
];
const MOCK_BOOKING_LIMIT_H1 = 24;
const MOCK_STORE_STATUS: Record<string, boolean> = {};

// ============ HELPERS ===========
const DAY_NAMES_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const STATUS_COLORS = {
  available: colors.primary,
  full: colors.outline,
  blocked: colors.error,
  none: colors.outlineVariant,
};
const STATUS_LABELS = {
  available: 'Tersedia',
  full: 'Penuh',
  blocked: 'Libur/Bloc',
  none: '',
};
const MONTH_NAMES_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];
const YEAR_RANGE = [2020, 2035];

function isDateInBlockedRange(dateStr: string, blockedDates: BlockedDate[]): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  return blockedDates.some((block) => {
    const start = new Date(block.start_date + 'T00:00:00');
    const end = new Date(block.end_date + 'T00:00:00');
    return date >= start && date <= end;
  });
}

function calculateDayStatus(dateStr: string, slots: SlotItem[], blockedDates: BlockedDate[]): 'available' | 'full' | 'blocked' | 'none' {
  if (isDateInBlockedRange(dateStr, blockedDates)) return 'blocked';
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
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(MOCK_BLOCKED_DATES);
  const [bookingLimitH1, setBookingLimitH1] = useState<number>(MOCK_BOOKING_LIMIT_H1);

  // --- State calendar (dipilih user: bulan + tahun) ---
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());

  // --- State form edit ---
  const [storeOpen, setStoreOpen] = useState(true);
  const [slotsPerDay, setSlotsPerDay] = useState(12);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingWorkingHours, setSavingWorkingHours] = useState(false);
  const [editingWorkingHourId, setEditingWorkingHourId] = useState<number | null>(null);

  // --- Picker modals ---
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Load layanan vendor
  useEffect(() => {
    (async () => {
      try {
        const res = await vendorApi.listMyServices();
        const list = res.data?.data?.data ?? [];
        setServices(list);
        if (list.length > 0 && !selectedServiceId) {
          setSelectedServiceId(list[0].id);
        }
      } catch (err) {
        console.log('Gagal ambil layanan:', err);
      } finally {
        setLoadingServices(false);
      }
    })();
  }, []);

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
  }, [selectedYear, selectedMonth, selectedDate, slots, blockedDates, workingHours, storeOpen]);

  function createCalendarDay(dateStr: string, d: Date, isCurrentMonth: boolean): CalendarDay {
    const dayOfMonth = d.getDate();
    const isToday = isTodayDate(dateStr);
    const isSelected = dateStr === selectedDate;
    const status = calculateDayStatus(dateStr, slots, blockedDates);
    const dayOfWeek = d.getDay();
    const dayWorkingHours = workingHours.filter((wh) => wh.day_of_week === dayOfWeek);
    const blockedDatesForDay = blockedDates.filter((bd) => {
      const bdStart = new Date(bd.start_date + 'T00:00:00');
      const bdEnd = new Date(bd.end_date + 'T00:00:00');
      const dayStart = new Date(dateStr + 'T00:00:00');
      return dayStart >= bdStart && dayStart <= bdEnd;
    });

    return {
      date: dateStr,
      dayOfMonth,
      isCurrentMonth,
      isSelected,
      status,
      isToday,
      workingHours: dayWorkingHours,
      storeOpen: MOCK_STORE_STATUS[dateStr] ?? true,
      slotsCount: slotsPerDay,
      blockedDates: blockedDatesForDay,
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

  // Load blocked dates dari API (mock sekarang)
  const loadBlockedDates = useCallback(async () => {
    // TODO: panggil API endpoint untuk blocked dates
    setBlockedDates(MOCK_BLOCKED_DATES);
  }, []);

  // Load booking limit H-1 dari API (mock sekarang)
  const loadBookingLimit = useCallback(async () => {
    // TODO: panggil API endpoint untuk booking limit H-1
    setBookingLimitH1(MOCK_BOOKING_LIMIT_H1);
  }, []);

  // Load semua data saat mount
  useEffect(() => {
    loadWorkingHours();
    loadBlockedDates();
    loadBookingLimit();
  }, [loadWorkingHours, loadBlockedDates, loadBookingLimit]);

  // Handle pilih tanggal
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
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

  // Handle toggle store open
  const handleToggleStoreOpen = async () => {
    const newVal = !storeOpen;
    if (newVal === storeOpen) return;
    setStoreOpen(newVal);
    Toast.show({
      type: newVal ? 'success' : 'info',
      text1: newVal ? 'Toko dibuka' : 'Toko ditutup',
      text2: newVal
        ? 'Layanan Anda aktif hari ini. Pelanggan bisa memesan.'
        : 'Toko ditutup. Tidak ada pemesanan hari ini.',
    });
  };

  // Handle tambah/mengurangi slot per hari
  const handleDecreaseSlots = () => {
    if (slotsPerDay > 1) setSlotsPerDay(slotsPerDay - 1);
  };
  const handleIncreaseSlots = () => {
    if (slotsPerDay < 100) setSlotsPerDay(slotsPerDay + 1);
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

  // Handle edit working hour
  const handleEditWorkingHour = (workingHourId: number) => {
    setEditingWorkingHourId(workingHourId);
    Toast.show({ type: 'info', text1: 'Edit jam kerja', text2: 'Fitur edit jam kerja akan segera tersedia.' });
  };

  // Handle add session
  const handleAddSession = () => {
    Toast.show({ type: 'info', text1: 'Tambah sesi', text2: 'Fitur tambah sesi akan segera tersedia.' });
  };

  // Handle blokir tanggal
  const handleBlockDatePress = () => {
    Toast.show({ type: 'info', text1: 'Blokir tanggal', text2: 'Fitur blokir tanggal massal akan segera tersedia.' });
  };

  // Handle booking limit H-1
  const handleBookingLimitPress = () => {
    Toast.show({ type: 'info', text1: 'Batas booking H-1', text2: 'Fitur batas booking akan segera tersedia.' });
  };

  // Get status hari ini
  const todayStatus = calendarDays.find((d) => d.isToday);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Calender</Text>
        <View style={styles.headerCenter}>
          <Text style={styles.monthYear}>{monthYearLabel}</Text>
          <Text style={styles.subtitle}>Kelola ketersediaan layanan Anda</Text>
        </View>
        <View style={styles.datePickerRow}>
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
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>Tersedia</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.outline }]} />
          <Text style={styles.legendLabel}>Penuh</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendLabel}>Libur/Bloc</Text>
        </View>
      </View>

      {/* Calendar Grid — border, scrollable */}
      <View style={styles.calendarContainer}>
        {/* Day names header */}
        <View style={styles.dayNamesRow}>
          {DAY_NAMES_SHORT.map((day, idx) => (
            <Text key={idx} style={styles.dayName}>{day}</Text>
          ))}
        </View>

        {/* Day cells grid — dapat discroll ke bawah */}
        <ScrollView
          style={styles.calendarScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} tintColor={colors.primary} />
          }
        >
          <View style={styles.weekContainer}>
            {calendarDays.map((day, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSelectDate(day.date)}
                style={[
                  styles.dayCell,
                  day.isCurrentMonth ? {} : styles.dayCellOtherMonth,
                  day.isSelected && styles.dayCellSelected,
                  day.status === 'blocked' && styles.dayCellBlocked,
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

          {/* Month navigation juga bisa diputar di sini */}
          <View style={styles.navRow}>
            <Pressable onPress={goToPreviousMonth} style={styles.navBtn}>
              <ChevronLeft size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.navMonthLabel}>{monthYearLabel}</Text>
            <Pressable onPress={goToNextMonth} style={styles.navBtn}>
              <ChevronLeft size={22} color={colors.onSurface} style={styles.rotatedChevron} />
            </Pressable>
          </View>
        </ScrollView>
        <View style={{height: spacing.stackMd}} />
      </View>

      {/* Detail Panel untuk tanggal yang dipilih */}
      <View style={styles.detailContainer}>
        {/* Judul detail */}
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>Pengaturan {formatSelectedDate(selectedDate)}</Text>
        </View>

        {/* Form pengaturan tanggal */}
        <Card style={styles.settingCard}>
          {/* Toggle Buka Toko */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <SlidersHorizontal size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.settingLabelText}>Buka Toko</Text>
            </View>
            <Pressable
              onPress={handleToggleStoreOpen}
              style={[styles.toggle, storeOpen && styles.toggleActive]}
            >
              <View style={[styles.toggleKnob, storeOpen && styles.toggleKnobActive]} />
            </Pressable>
          </View>

          {/* Slot Per Hari */}
          <View style={styles.slotsSection}>
            <Text style={styles.sectionText}>Slot Per Hari</Text>
            <View style={styles.slotsCounter}>
              <Pressable onPress={handleDecreaseSlots} style={styles.slotsButton}>
                <Text style={styles.slotsButtonText}>−</Text>
              </Pressable>
              <Text style={styles.slotsCount}>{slotsPerDay}</Text>
              <Pressable onPress={handleIncreaseSlots} style={styles.slotsButton}>
                <Text style={styles.slotsButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Info status hari */}
          <View style={styles.dayInfoCard}>
            <View style={styles.dayInfoRow}>
              <CalendarDays size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.dayInfoText}>
                {todayStatus?.status === 'available'
                  ? 'Tersedia — Pelanggan bisa memesan'
                  : todayStatus?.status === 'full'
                  ? 'Penuh — Semua slot sudah terbooking'
                  : todayStatus?.status === 'blocked'
                  ? 'Libur/Blok — Layanan ditutup hari ini'
                  : 'Belum ada pengaturan'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Jam Kerja */}
        <Card style={styles.workingHoursCard}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.cardTitle}>Jam Kerja</Text>
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
                <Pressable onPress={() => handleEditWorkingHour(wh.id)} style={styles.editButton}>
                  <Text style={styles.editText}>✎</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Tambah Sesi */}
          <Pressable
            style={styles.addSessionButton}
            onPress={handleAddSession}
            disabled={savingWorkingHours}
          >
            <Text style={styles.addSessionText}>+ Tambah Sesi</Text>
          </Pressable>

          {/* Save button */}
          <Button
            label={savingWorkingHours ? 'Menyimpan...' : 'Simpan Jam Kerja'}
            onPress={handleSaveWorkingHours}
            disabled={savingWorkingHours}
            style={styles.saveButton}
          />
        </Card>

        {/* Blokir Tanggal Massal */}
        <Pressable
          style={styles.blockDateCard}
          onPress={handleBlockDatePress}
        >
          <View style={styles.blockDateIcon}>
            <Lock size={20} color={colors.primary} />
          </View>
          <View style={styles.blockDateInfo}>
            <Text style={styles.blockDateTitle}>Blokir Tanggal Massal</Text>
            <Text style={styles.blockDateDesc}>Tutup semua layanan untuk periode libur panjang.</Text>
          </View>
          <View style={styles.blockDateArrow}>
            <ChevronLeft size={20} color={colors.onSurfaceVariant} style={styles.rotatedChevron} />
          </View>
        </Pressable>

        {/* Batas Booking H-1 */}
        <Pressable
          style={styles.bookingLimitCard}
          onPress={handleBookingLimitPress}
        >
          <View style={styles.bookingLimitIcon}>
            <CalendarDays size={20} color="#3B82F6" />
          </View>
          <View style={styles.bookingLimitInfo}>
            <Text style={styles.bookingLimitTitle}>Batas Booking H-1</Text>
            <Text style={styles.bookingLimitDesc}>
              Cegah pelanggan memesan di hari yang sama (minimum {bookingLimitH1} jam pertama).
            </Text>
          </View>
          <View style={styles.bookingLimitArrow}>
            <ChevronLeft size={20} color={colors.onSurfaceVariant} style={styles.rotatedChevron} />
          </View>
        </Pressable>
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 60,
    paddingBottom: spacing.stackMd,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  pageTitle: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
    flex: 1,
  },
  headerCenter: {
    alignItems: 'center',
    marginHorizontal: spacing.stackMd,
  },
  monthYear: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: spacing.stackMd,
    marginLeft: spacing.stackMd,
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
  calendarContainer: {
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.stackMd,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
  },
  calendarScroll: {
    maxHeight: 420,
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
  dayCellBlocked: {
    backgroundColor: colors.errorContainer,
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
  rotatedChevron: {
    transform: [{ rotate: '180deg' }],
  },
  detailContainer: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.sectionGap,
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
