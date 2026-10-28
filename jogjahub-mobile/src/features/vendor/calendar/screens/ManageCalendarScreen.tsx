import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAxiosError } from 'axios';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { vendorApi } from '../../../../api/vendorApi';
import { timeSlotApi } from '../../../../api/timeSlotApi';
import { bookingApi } from '../../../../api/bookingApi';
import AddSlotModal from '../components/AddSlotModal';

type ServiceItem = { id: number; name: string };
type SlotItem = {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  quota: number;
  booked_count: number;
};
type BookingItem = {
  id: string;
  status: string;
  serviceId?: string;
  serviceName?: string;
  customerName: string;
  slotDate?: string;
  startTime?: string;
  endTime?: string;
};
type CalendarDay = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isMultiSelected: boolean;
  status: 'available' | 'partial' | 'full' | 'none' | 'unknown';
};
type UnknownRecord = Record<string, unknown>;

const DAY_NAMES = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function resourceRows(payload: unknown): UnknownRecord[] {
  if (!isRecord(payload)) throw new Error('Respons API tidak valid.');
  const rows = Array.isArray(payload.data)
    ? payload.data
    : isRecord(payload.data) && Array.isArray(payload.data.data)
      ? payload.data.data
      : null;
  if (!rows) throw new Error('Daftar data tidak tersedia pada respons API.');
  const records = rows.filter(isRecord);
  if (records.length !== rows.length) throw new Error('Format item pada respons API tidak valid.');
  return records;
}

function parseServices(payload: unknown): ServiceItem[] {
  return resourceRows(payload).map((item) => {
    const id = Number(item.id);
    if (!Number.isInteger(id) || typeof item.name !== 'string') {
      throw new Error('Data layanan dari API tidak valid.');
    }
    return { id, name: item.name };
  });
}

function parseSlots(payload: unknown): SlotItem[] {
  return resourceRows(payload).map((item) => {
    const id = Number(item.id);
    const quota = Number(item.quota);
    const bookedCount = Number(item.booked_count);
    if (
      !Number.isInteger(id) ||
      typeof item.slot_date !== 'string' ||
      typeof item.start_time !== 'string' ||
      typeof item.end_time !== 'string' ||
      !Number.isInteger(quota) ||
      quota < 1 ||
      !Number.isInteger(bookedCount) ||
      bookedCount < 0
    ) {
      throw new Error('Data slot dari API tidak valid.');
    }
    return {
      id,
      slot_date: item.slot_date,
      start_time: item.start_time,
      end_time: item.end_time,
      quota,
      booked_count: bookedCount,
    };
  });
}

function parseBookings(payload: unknown): BookingItem[] {
  return resourceRows(payload).map((item) => {
    const service = isRecord(item.service) ? item.service : undefined;
    const customer = isRecord(item.customer) ? item.customer : undefined;
    const slot = isRecord(item.slot) ? item.slot : undefined;
    if (
      item.id === undefined ||
      item.id === null ||
      typeof item.status !== 'string' ||
      service?.id === undefined ||
      typeof customer?.name !== 'string' ||
      (slot !== undefined && typeof slot.slot_date !== 'string')
    ) {
      throw new Error('Data booking dari API tidak valid.');
    }
    return {
      id: String(item.id),
      status: item.status,
      serviceId: String(service.id),
      serviceName: typeof service?.name === 'string' ? service.name : undefined,
      customerName: customer.name,
      slotDate: typeof slot?.slot_date === 'string' ? slot.slot_date : undefined,
      startTime: typeof slot?.start_time === 'string' ? slot.start_time : undefined,
      endTime: typeof slot?.end_time === 'string' ? slot.end_time : undefined,
    };
  });
}

function responseMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const message: unknown = error.response?.data?.message;
  return typeof message === 'string' ? message : undefined;
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  const value = new Date(`${date}T00:00:00`);
  return value.toLocaleDateString('id-ID', options ?? {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getDayStatus(date: string, slots: SlotItem[]): CalendarDay['status'] {
  const daySlots = slots.filter((slot) => slot.slot_date === date);
  if (daySlots.length === 0) return 'none';
  if (daySlots.every((slot) => slot.booked_count >= slot.quota)) return 'full';
  if (daySlots.some((slot) => slot.booked_count > 0)) return 'partial';
  return 'available';
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Menunggu';
    case 'confirmed': return 'Dikonfirmasi';
    case 'cancelled': return 'Dibatalkan';
    default: return status;
  }
}

function bookingStatusStyle(status: string) {
  if (status === 'confirmed') return styles.bookingStatusConfirmed;
  if (status === 'cancelled') return styles.bookingStatusCancelled;
  return styles.bookingStatusPending;
}

export default function ManageCalendarScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const todayISO = formatDateISO(today);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [multiDateMode, setMultiDateMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [datePicker, setDatePicker] = useState<'month' | 'year' | null>(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const slotsRequestId = useRef(0);
  const bookingsRequestId = useRef(0);

  const loadServices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setServiceLoading(true);
    setServiceError(null);
    try {
      const response = await vendorApi.listMyServices();
      const list = parseServices(response.data);
      setServices(list);
      setSelectedServiceId((previous) =>
        previous !== null && list.some((service) => service.id === previous)
          ? previous
          : list[0]?.id ?? null,
      );
    } catch (error) {
      setServiceError(responseMessage(error) ?? 'Gagal memuat layanan. Periksa koneksi lalu coba lagi.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setServiceLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadServices();
    }, [loadServices]),
  );

  const loadSlots = useCallback(async (serviceId: number) => {
    const requestId = ++slotsRequestId.current;
    setSlotLoading(true);
    setSlotError(null);
    setSlots([]);
    try {
      const response = await timeSlotApi.listByService(serviceId);
      const list = parseSlots(response.data);
      if (requestId === slotsRequestId.current) setSlots(list);
    } catch (error) {
      if (requestId === slotsRequestId.current) {
        setSlotError(responseMessage(error) ?? 'Gagal memuat slot layanan. Coba muat ulang.');
      }
    } finally {
      if (requestId === slotsRequestId.current) setSlotLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    const requestId = ++bookingsRequestId.current;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const firstResponse = await bookingApi.listIncomingBookings({ page: 1 });
      const root = isRecord(firstResponse.data) ? firstResponse.data : {};
      const meta = isRecord(root.meta) ? root.meta : {};
      const lastPage = Number(meta.last_page);
      if (!Number.isInteger(lastPage) || lastPage < 1) {
        throw new Error('Informasi halaman booking dari API tidak valid.');
      }
      const allBookings = parseBookings(firstResponse.data);
      for (let page = 2; page <= lastPage; page += 1) {
        const response = await bookingApi.listIncomingBookings({ page });
        allBookings.push(...parseBookings(response.data));
      }
      if (requestId === bookingsRequestId.current) setBookings(allBookings);
    } catch (error) {
      if (requestId === bookingsRequestId.current) {
        setBookingError(responseMessage(error) ?? 'Gagal memuat daftar booking. Coba muat ulang.');
      }
    } finally {
      if (requestId === bookingsRequestId.current) setBookingLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings]),
  );

  React.useEffect(() => {
    if (selectedServiceId === null) {
      slotsRequestId.current += 1;
      setSlots([]);
      setSlotError(null);
      setSlotLoading(false);
      return;
    }
    void loadSlots(selectedServiceId);
  }, [selectedServiceId, loadSlots]);

  const visibleServices = useMemo(() => {
    const query = serviceSearch.trim().toLocaleLowerCase('id-ID');
    if (!query) return services;
    return services.filter((service) => service.name.toLocaleLowerCase('id-ID').includes(query));
  }, [services, serviceSearch]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const first = new Date(selectedYear, selectedMonth, 1);
    const last = new Date(selectedYear, selectedMonth + 1, 0);
    const days: CalendarDay[] = [];
    const startPadding = first.getDay();
    const endPadding = 6 - last.getDay();

    for (let offset = -startPadding; offset <= last.getDate() + endPadding - 1; offset += 1) {
      const date = new Date(selectedYear, selectedMonth, offset + 1);
      const iso = formatDateISO(date);
      days.push({
        date: iso,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === selectedMonth,
        isSelected: iso === selectedDate,
        isToday: iso === todayISO,
        isMultiSelected: multiDateMode && selectedDates.includes(iso),
        status: slotLoading || slotError ? 'unknown' : getDayStatus(iso, slots),
      });
    }
    return days;
  }, [selectedDate, selectedMonth, selectedYear, selectedDates, multiDateMode, slots, todayISO, slotLoading, slotError]);

  const selectedService = services.find((service) => service.id === selectedServiceId);
  const slotsForDate = useMemo(
    () => slots.filter((slot) => slot.slot_date === selectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots, selectedDate],
  );
  const bookingsForDate = useMemo(
    () => bookings.filter((booking) =>
      booking.serviceId === String(selectedServiceId) && booking.slotDate === selectedDate,
    ),
    [bookings, selectedDate, selectedServiceId],
  );
  const capacity = useMemo(() => slotsForDate.reduce(
    (total, slot) => ({
      total: total.total + slot.quota,
      booked: total.booked + slot.booked_count,
      remaining: total.remaining + Math.max(0, slot.quota - slot.booked_count),
    }),
    { total: 0, booked: 0, remaining: 0 },
  ), [slotsForDate]);

  const handleSelectDate = (date: string) => {
    const value = new Date(`${date}T00:00:00`);
    setSelectedDate(date);
    if (multiDateMode) {
      setSelectedDates((current) =>
        current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort(),
      );
    }
    if (value.getMonth() !== selectedMonth || value.getFullYear() !== selectedYear) {
      setSelectedMonth(value.getMonth());
      setSelectedYear(value.getFullYear());
    }
  };

  const handleToggleMultiDate = () => {
    if (multiDateMode) {
      setSelectedDates([]);
      setMultiDateMode(false);
      return;
    }
    setSelectedDates([selectedDate]);
    setMultiDateMode(true);
  };

  const handleMonthChange = (offset: number) => {
    const value = new Date(selectedYear, selectedMonth + offset, 1);
    setSelectedMonth(value.getMonth());
    setSelectedYear(value.getFullYear());
  };

  const handleDeleteSlot = async (slot: SlotItem) => {
    if (slot.booked_count > 0) {
      Toast.show({
        type: 'error',
        text1: 'Slot tidak dapat dihapus',
        text2: 'Slot sudah memiliki booking.',
        position: 'top',
      });
      return;
    }
    try {
      await timeSlotApi.deleteSlot(slot.id);
      Toast.show({ type: 'success', text1: 'Slot dihapus', position: 'top' });
      if (selectedServiceId !== null) await loadSlots(selectedServiceId);
      await loadBookings();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: responseMessage(error) ?? 'Gagal menghapus slot',
        text2: responseMessage(error) ? undefined : 'Coba lagi dalam beberapa saat.',
        position: 'top',
      });
    }
  };

  const handleCreated = (createdDates: string[]) => {
    if (selectedServiceId !== null) void loadSlots(selectedServiceId);
    void loadBookings();
    if (multiDateMode && createdDates.length > 0) {
      setSelectedDates((current) => current.filter((date) => !createdDates.includes(date)));
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadServices(true),
      selectedServiceId !== null ? loadSlots(selectedServiceId) : Promise.resolve(),
      loadBookings(),
    ]);
  };

  const yearOptions = useMemo(() => {
    const start = Math.min(new Date().getFullYear() - 1, selectedYear - 5);
    const end = Math.max(new Date().getFullYear() + 10, selectedYear + 5);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [selectedYear]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}><CalendarDays size={22} color={colors.primary} /></View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Kalender booking</Text>
            <Text style={styles.subtitle}>Atur ketersediaan layanan dan pantau booking.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAYANAN</Text>
          {serviceLoading ? (
            <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /><Text style={styles.helperText}>Memuat layanan...</Text></View>
          ) : serviceError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{serviceError}</Text>
              <Pressable onPress={() => void loadServices()} style={styles.retryButton} accessibilityRole="button">
                <Text style={styles.retryText}>Coba lagi</Text>
              </Pressable>
            </View>
          ) : services.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Belum ada layanan</Text>
              <Text style={styles.helperText}>Tambahkan layanan di menu Listing untuk mulai mengatur slot.</Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.serviceSelect, pressed && styles.pressed]}
              onPress={() => { setServiceSearch(''); setShowServicePicker(true); }}
              accessibilityRole="button"
              accessibilityLabel={`Pilih layanan, layanan terpilih ${selectedService?.name ?? ''}`}
              accessibilityState={{ expanded: showServicePicker }}
            >
              <View style={styles.serviceSelectText}>
                <Text style={styles.serviceSelectLabel}>Layanan dipilih</Text>
                <Text style={styles.serviceSelectValue}>{selectedService?.name ?? 'Pilih layanan'}</Text>
              </View>
              <ChevronDown size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          )}
        </View>

        {!serviceLoading && !serviceError && services.length > 0 && (
          <>
            <View style={styles.monthControls}>
              <Pressable
                onPress={() => handleMonthChange(-1)}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Bulan sebelumnya"
              >
                <ChevronLeft size={22} color={colors.onSurface} />
              </Pressable>
              <View style={styles.monthTitleContainer}>
                <Pressable
                  onPress={() => setDatePicker('month')}
                  style={styles.monthPickerButton}
                  accessibilityRole="button"
                  accessibilityLabel="Pilih bulan"
                >
                  <Text style={styles.monthTitle}>{MONTH_NAMES[selectedMonth]}</Text>
                  <ChevronDown size={16} color={colors.onSurfaceVariant} />
                </Pressable>
                <Pressable
                  onPress={() => setDatePicker('year')}
                  style={styles.yearPickerButton}
                  accessibilityRole="button"
                  accessibilityLabel="Pilih tahun"
                >
                  <Text style={styles.yearTitle}>{selectedYear}</Text>
                  <ChevronDown size={16} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
              <Pressable
                onPress={() => handleMonthChange(1)}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Bulan berikutnya"
              >
                <ChevronRight size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.calendarCard}>
              <View style={styles.weekRow}>
                {DAY_NAMES.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}
              </View>
              <View style={styles.daysGrid}>
                {calendarDays.map((day) => (
                  <Pressable
                    key={day.date}
                    onPress={() => handleSelectDate(day.date)}
                    style={[
                      styles.dayCell,
                      day.isSelected && styles.dayCellSelected,
                      day.isMultiSelected && !day.isSelected && styles.dayCellMultiSelected,
                      day.isToday && !day.isSelected && styles.dayCellToday,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDate(day.date)}, ${day.status === 'unknown' ? 'status belum tersedia' : day.status === 'none' ? 'tanpa slot' : day.status === 'available' ? 'tersedia' : day.status === 'partial' ? 'terisi sebagian' : 'penuh'}${day.isMultiSelected ? ', dipilih untuk pengaturan slot' : ''}`}
                    accessibilityState={{ selected: day.isSelected || day.isMultiSelected }}
                  >
                    <Text style={[
                      styles.dayNumber,
                      !day.isCurrentMonth && styles.dayNumberOutside,
                      day.isSelected && styles.dayNumberSelected,
                    ]}>
                      {day.day}
                    </Text>
                    <View style={styles.dayStatusArea}>
                      <View style={[styles.statusDot, styles[`status_${day.status}`]]} />
                      {day.isMultiSelected && <Check size={10} color={day.isSelected ? colors.onPrimary : colors.primary} />}
                    </View>
                  </Pressable>
                ))}
              </View>
              <View style={styles.legend}>
                <LegendItem label="Tersedia" status="available" />
                <LegendItem label="Sebagian" status="partial" />
                <LegendItem label="Penuh" status="full" />
                {slotLoading || slotError
                  ? <LegendItem label="Data belum tersedia" status="unknown" />
                  : <LegendItem label="Tanpa slot" status="none" />}
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleToggleMultiDate}
                style={({ pressed }) => [styles.secondaryButton, multiDateMode && styles.secondaryButtonActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: multiDateMode }}
              >
                <CalendarDays size={17} color={multiDateMode ? colors.onPrimary : colors.primary} />
                <Text style={[styles.secondaryButtonText, multiDateMode && styles.secondaryButtonTextActive]}>
                  {multiDateMode ? 'Mode beberapa tanggal aktif' : 'Pilih beberapa tanggal'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowAddSlotModal(true)}
                disabled={!selectedServiceId || (multiDateMode && selectedDates.length === 0)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (!selectedServiceId || (multiDateMode && selectedDates.length === 0)) && styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={multiDateMode ? `Tambah slot di ${selectedDates.length} tanggal` : 'Tambah slot'}
              >
                <Plus size={18} color={colors.onPrimary} />
                <Text style={styles.primaryButtonText}>Tambah slot</Text>
              </Pressable>
            </View>

            {multiDateMode && (
              <View style={styles.selectionSummary}>
                <Text style={styles.selectionSummaryTitle}>Tanggal untuk slot baru ({selectedDates.length})</Text>
                {selectedDates.length === 0 ? (
                  <Text style={styles.helperText}>Pilih satu atau beberapa tanggal pada kalender.</Text>
                ) : (
                  <View style={styles.selectedDateList}>
                    {[...selectedDates].sort().map((date) => (
                      <View key={date} style={styles.selectedDateChip}>
                        <Text style={styles.selectedDateText}>{formatDate(date, { day: 'numeric', month: 'short' })}</Text>
                        <Pressable
                          onPress={() => setSelectedDates((current) => current.filter((item) => item !== date))}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Hapus ${formatDate(date)} dari tanggal terpilih`}
                          style={styles.chipRemoveButton}
                        >
                          <X size={14} color={colors.primary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.detailHeading}>
              <Text style={styles.detailDate}>{formatDate(selectedDate)}</Text>
              {selectedDate === todayISO && <Text style={styles.todayPill}>HARI INI</Text>}
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIcon}><Clock3 size={18} color={colors.primary} /></View>
                <Text style={styles.cardTitle}>Kapasitas slot</Text>
              </View>
              {slotLoading ? (
                <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /><Text style={styles.helperText}>Memuat slot...</Text></View>
              ) : slotError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{slotError}</Text>
                  <Pressable onPress={() => selectedServiceId !== null && void loadSlots(selectedServiceId)} style={styles.retryButton} accessibilityRole="button">
                    <Text style={styles.retryText}>Coba lagi</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.capacityRow}>
                    <CapacityValue label="Total" value={capacity.total} />
                    <CapacityValue label="Terisi" value={capacity.booked} />
                    <CapacityValue label="Tersisa" value={capacity.remaining} />
                  </View>
                  {slotsForDate.length === 0 ? (
                    <Text style={styles.emptyMessage}>Belum ada slot pada tanggal ini.</Text>
                  ) : (
                    <View style={styles.slotList}>
                      {slotsForDate.map((slot) => (
                        <View key={slot.id} style={styles.slotRow}>
                          <View style={styles.slotTimeIcon}><Clock3 size={16} color={colors.onSurfaceVariant} /></View>
                          <View style={styles.slotDetails}>
                            <Text style={styles.slotTime}>{slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</Text>
                            <Text style={styles.slotCapacity}>{slot.booked_count} dari {slot.quota} terisi · {Math.max(0, slot.quota - slot.booked_count)} tersisa</Text>
                          </View>
                          <Pressable
                            onPress={() => void handleDeleteSlot(slot)}
                            disabled={slot.booked_count > 0}
                            style={({ pressed }) => [styles.deleteButton, slot.booked_count > 0 && styles.buttonDisabled, pressed && slot.booked_count === 0 && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`Hapus slot ${slot.start_time} sampai ${slot.end_time}`}
                            accessibilityState={{ disabled: slot.booked_count > 0 }}
                          >
                            <Trash2 size={18} color={slot.booked_count > 0 ? colors.outline : colors.error} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIcon}><Users size={18} color={colors.primary} /></View>
                <Text style={styles.cardTitle}>Booking masuk</Text>
                {!bookingLoading && !bookingError && (
                  <Text style={styles.bookingCount}>{bookingsForDate.length}</Text>
                )}
              </View>
              {bookingLoading ? (
                <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /><Text style={styles.helperText}>Memuat booking...</Text></View>
              ) : bookingError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{bookingError}</Text>
                  <Pressable onPress={() => void loadBookings()} style={styles.retryButton} accessibilityRole="button">
                    <Text style={styles.retryText}>Coba lagi</Text>
                  </Pressable>
                </View>
              ) : bookingsForDate.length === 0 ? (
                <Text style={styles.emptyMessage}>Belum ada booking pada tanggal ini.</Text>
              ) : (
                <View style={styles.bookingList}>
                  {bookingsForDate.map((booking) => (
                    <View key={booking.id} style={styles.bookingRow}>
                      <View style={styles.bookingAvatar}><Text style={styles.bookingInitial}>{booking.customerName.slice(0, 1).toUpperCase()}</Text></View>
                      <View style={styles.bookingDetails}>
                        <Text style={styles.bookingName}>{booking.customerName}</Text>
                        <Text style={styles.bookingTime}>
                          {booking.startTime && booking.endTime
                            ? `${booking.startTime.slice(0, 5)}–${booking.endTime.slice(0, 5)}`
                            : booking.serviceName ?? selectedService?.name}
                        </Text>
                      </View>
                      <View style={[styles.bookingStatus, bookingStatusStyle(booking.status)]}>
                        <Text style={styles.bookingStatusText}>{statusLabel(booking.status)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showServicePicker} transparent animationType="fade" onRequestClose={() => setShowServicePicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih layanan</Text>
              <Pressable
                onPress={() => setShowServicePicker(false)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Tutup pilihan layanan"
              >
                <X size={21} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <View style={styles.searchBox}>
              <Search size={18} color={colors.onSurfaceVariant} />
              <TextInput
                value={serviceSearch}
                onChangeText={setServiceSearch}
                placeholder="Cari nama layanan"
                placeholderTextColor={colors.onSurfaceVariant}
                style={styles.searchInput}
                autoCorrect={false}
                accessibilityLabel="Cari nama layanan"
              />
            </View>
            <FlatList
              data={visibleServices}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.emptyMessage}>Layanan tidak ditemukan.</Text>}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedServiceId;
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedServiceId(item.id);
                      setShowServicePicker(false);
                    }}
                    style={({ pressed }) => [styles.serviceOption, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.serviceOptionText, isSelected && styles.serviceOptionTextSelected]}>{item.name}</Text>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={datePicker !== null} transparent animationType="fade" onRequestClose={() => setDatePicker(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{datePicker === 'month' ? 'Pilih bulan' : 'Pilih tahun'}</Text>
              <Pressable onPress={() => setDatePicker(null)} style={styles.modalClose} accessibilityRole="button" accessibilityLabel="Tutup pemilih tanggal">
                <X size={21} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <FlatList
              key={datePicker}
              data={datePicker === 'month' ? MONTH_NAMES : yearOptions.map(String)}
              keyExtractor={(item) => String(item)}
              initialScrollIndex={datePicker === 'month' ? selectedMonth : yearOptions.indexOf(selectedYear)}
              getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
              renderItem={({ item, index }) => {
                const isSelected = datePicker === 'month' ? index === selectedMonth : Number(item) === selectedYear;
                return (
                  <Pressable
                    onPress={() => {
                      if (datePicker === 'month') setSelectedMonth(index);
                      else setSelectedYear(Number(item));
                      setDatePicker(null);
                    }}
                    style={({ pressed }) => [styles.serviceOption, isSelected && styles.pickerOptionSelected, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.serviceOptionText, isSelected && styles.serviceOptionTextSelected]}>{item}</Text>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <AddSlotModal
        visible={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        serviceId={selectedServiceId}
        selectedDates={multiDateMode ? selectedDates : [selectedDate]}
        existingSlots={slots}
        onCreated={handleCreated}
      />
    </View>
  );
}

function LegendItem({ label, status }: { label: string; status: CalendarDay['status'] }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, styles[`status_${status}`]]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function CapacityValue({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.capacityValue}>
      <Text style={styles.capacityNumber}>{value}</Text>
      <Text style={styles.capacityLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.sectionGap, paddingHorizontal: spacing.containerMargin },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackMd, paddingTop: spacing.stackLg, paddingBottom: spacing.stackMd },
  headerIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontFamily: typography.headlineLgMobile.fontFamily, fontSize: typography.headlineLgMobile.fontSize, fontWeight: typography.headlineLgMobile.fontWeight, color: colors.onSurface },
  subtitle: { fontFamily: typography.bodySm.fontFamily, fontSize: typography.bodySm.fontSize, color: colors.onSurfaceVariant, marginTop: 3 },
  section: { marginTop: spacing.stackSm },
  sectionLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, letterSpacing: 0.8, color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
  serviceSelect: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.stackMd, borderRadius: radius.md, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
  serviceSelectText: { flex: 1, marginRight: spacing.stackMd },
  serviceSelectLabel: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant },
  serviceSelectValue: { fontFamily: typography.labelLg.fontFamily, fontSize: 15, fontWeight: '600', color: colors.onSurface, marginTop: 2 },
  monthControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.stackLg, marginBottom: spacing.stackMd },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceContainerLow },
  monthTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm },
  monthPickerButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.stackSm },
  monthTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: typography.titleMd.fontSize, fontWeight: typography.titleMd.fontWeight, color: colors.onSurface },
  yearPickerButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.stackSm },
  yearTitle: { fontFamily: typography.labelLg.fontFamily, fontSize: typography.labelLg.fontSize, color: colors.onSurfaceVariant },
  calendarCard: { paddingHorizontal: spacing.stackSm, paddingTop: spacing.stackMd, paddingBottom: spacing.stackMd, backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.outlineVariant },
  weekRow: { flexDirection: 'row', marginBottom: spacing.stackSm },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: typography.labelSm.fontFamily, fontSize: 10, color: colors.onSurfaceVariant, paddingVertical: spacing.stackSm },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, marginVertical: 2 },
  dayCellSelected: { backgroundColor: colors.primary },
  dayCellMultiSelected: { backgroundColor: colors.primaryFixed, borderWidth: 1, borderColor: colors.primary },
  dayCellToday: { borderWidth: 1, borderColor: colors.primary },
  dayNumber: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, fontWeight: '500', color: colors.onSurface },
  dayNumberOutside: { color: colors.outline },
  dayNumberSelected: { color: colors.onPrimary, fontWeight: '700' },
  dayStatusArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 10, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  status_available: { backgroundColor: colors.accentGreen },
  status_partial: { backgroundColor: colors.tertiary },
  status_full: { backgroundColor: colors.error },
  status_none: { backgroundColor: colors.outlineVariant },
  status_unknown: { backgroundColor: colors.outline },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.stackMd, marginTop: spacing.stackMd },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant },
  actionsRow: { gap: spacing.stackSm, marginTop: spacing.stackMd },
  secondaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.stackSm, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.full, backgroundColor: colors.surfaceContainerLowest, paddingHorizontal: spacing.stackMd },
  secondaryButtonActive: { backgroundColor: colors.primary },
  secondaryButtonText: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, color: colors.primary },
  secondaryButtonTextActive: { color: colors.onPrimary },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.stackSm, borderRadius: radius.full, backgroundColor: colors.primary, paddingHorizontal: spacing.stackMd },
  primaryButtonText: { fontFamily: typography.button.fontFamily, fontSize: 14, fontWeight: typography.button.fontWeight, color: colors.onPrimary },
  buttonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  selectionSummary: { padding: spacing.stackMd, marginTop: spacing.stackMd, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  selectionSummaryTitle: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, color: colors.onSurface, marginBottom: spacing.stackSm },
  selectedDateList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.stackSm },
  selectedDateChip: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: spacing.stackSm, paddingRight: 4, borderRadius: radius.full, backgroundColor: colors.surfaceContainerLowest },
  selectedDateText: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurface },
  chipRemoveButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  detailHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, marginTop: spacing.stackLg, marginBottom: spacing.stackSm },
  detailDate: { fontFamily: typography.titleMd.fontFamily, fontSize: 17, fontWeight: typography.titleMd.fontWeight, color: colors.onSurface },
  todayPill: { overflow: 'hidden', borderRadius: radius.full, backgroundColor: colors.primaryFixed, paddingHorizontal: spacing.stackSm, paddingVertical: 4, fontFamily: typography.labelSm.fontFamily, fontSize: 9, color: colors.onPrimaryFixedVariant },
  card: { padding: spacing.stackMd, marginBottom: spacing.stackMd, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, marginBottom: spacing.stackMd },
  cardIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryFixed },
  cardTitle: { flex: 1, fontFamily: typography.labelLg.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  bookingCount: { minWidth: 28, textAlign: 'center', overflow: 'hidden', borderRadius: radius.full, paddingHorizontal: spacing.stackSm, paddingVertical: 3, backgroundColor: colors.surfaceContainerLow, fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant },
  capacityRow: { flexDirection: 'row', borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow, paddingVertical: spacing.stackMd, marginBottom: spacing.stackMd },
  capacityValue: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.outlineVariant },
  capacityNumber: { fontFamily: typography.titleMd.fontFamily, fontSize: 20, fontWeight: typography.titleMd.fontWeight, color: colors.onSurface },
  capacityLabel: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  emptyMessage: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, paddingVertical: spacing.stackMd },
  slotList: { gap: spacing.stackSm },
  slotRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, paddingVertical: spacing.stackSm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  slotTimeIcon: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  slotDetails: { flex: 1 },
  slotTime: { fontFamily: typography.labelLg.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  slotCapacity: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 3 },
  deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  bookingList: { gap: spacing.stackSm },
  bookingRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, paddingVertical: spacing.stackSm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  bookingAvatar: { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryContainer },
  bookingInitial: { fontFamily: typography.labelLg.fontFamily, fontSize: 14, color: colors.onSecondaryContainer },
  bookingDetails: { flex: 1 },
  bookingName: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, fontWeight: '600', color: colors.onSurface },
  bookingTime: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 3 },
  bookingStatus: { borderRadius: radius.full, paddingHorizontal: spacing.stackSm, paddingVertical: 5 },
  bookingStatusPending: { backgroundColor: colors.primaryFixed },
  bookingStatusConfirmed: { backgroundColor: colors.accentGreenContainer },
  bookingStatusCancelled: { backgroundColor: colors.surfaceContainerHigh },
  bookingStatusText: { fontFamily: typography.labelSm.fontFamily, fontSize: 10, color: colors.onSurface },
  loadingRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.stackSm },
  helperText: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18 },
  emptyBox: { padding: spacing.stackMd, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  emptyTitle: { fontFamily: typography.labelLg.fontFamily, fontSize: 14, color: colors.onSurface, marginBottom: 4 },
  errorBox: { padding: spacing.stackMd, borderRadius: radius.md, backgroundColor: colors.errorContainer },
  errorText: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onErrorContainer, lineHeight: 18 },
  retryButton: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.stackSm },
  retryText: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, color: colors.onErrorContainer, textDecorationLine: 'underline' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.containerMargin, backgroundColor: 'rgba(0,0,0,0.45)' },
  pickerModal: { maxHeight: '80%', padding: spacing.stackMd, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest },
  modalHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.stackSm },
  modalTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 17, fontWeight: typography.titleMd.fontWeight, color: colors.onSurface },
  modalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, paddingHorizontal: spacing.stackMd, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md, marginBottom: spacing.stackSm },
  searchInput: { flex: 1, minHeight: 44, fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface },
  serviceOption: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.stackSm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  serviceOptionText: { flex: 1, fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface },
  serviceOptionTextSelected: { color: colors.primary, fontWeight: '600' },
  pickerOptionSelected: { backgroundColor: colors.surfaceContainerLow },
});
