import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  CircleHelp,
  Package,
  Plus,
  Search,
  Scissors,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { VendorTabParamList } from '../../../../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAxiosError } from 'axios';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { tenantLayout } from '../../../../constants/theme/tenant';
import { vendorApi } from '../../../../api/vendorApi';
import { categoryApi } from '../../../../api/categoryApi';
import { timeSlotApi } from '../../../../api/timeSlotApi';
import { bookingApi } from '../../../../api/bookingApi';
import AddSlotModal from '../components/AddSlotModal';

type ServiceItem = { id: number; name: string; subcategoryId: number; perNight: boolean; price?: number; active?: boolean };
type CategoryItem = { id: number; name: string; subcategories: { id: number }[] };
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
  uuid?: string;
  slotId?: number;
  status: string;
  serviceId?: string;
  serviceName?: string;
  customerName: string;
  slotDate?: string;
  startTime?: string;
  endTime?: string;
  checkInDate?: string;
  checkOutDate?: string;
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

const DAY_NAMES = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HOTEL_CATEGORY_NAME = 'penginapan';

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
    const subcategory = isRecord(item.subcategory) ? item.subcategory : undefined;
    const subcategoryId = Number(subcategory?.id);
    if (!Number.isInteger(id) || typeof item.name !== 'string' || !Number.isInteger(subcategoryId)) {
      throw new Error('Data layanan dari API tidak valid.');
    }
    return {
      id, name: item.name, subcategoryId, perNight: item.price_type === 'per_night',
      price: typeof item.price === 'number' || typeof item.price === 'string' ? Number(item.price) : undefined,
      active: typeof item.is_active === 'boolean' ? item.is_active : undefined,
    };
  });
}

function parseCategories(payload: unknown): CategoryItem[] {
  return resourceRows(payload).map((item) => {
    if (typeof item.name !== 'string' || !Array.isArray(item.subcategories)) {
      throw new Error('Data kategori dari API tidak valid.');
    }
    const subcategories = item.subcategories.map((subcategory) => {
      if (!isRecord(subcategory) || !Number.isInteger(Number(subcategory.id))) {
        throw new Error('Data subkategori dari API tidak valid.');
      }
      return { id: Number(subcategory.id) };
    });
    return { id: Number(item.id), name: item.name, subcategories };
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

function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseBookings(payload: unknown): BookingItem[] {
  return resourceRows(payload).map((item) => {
    const service = isRecord(item.service) ? item.service : undefined;
    const customer = isRecord(item.customer) ? item.customer : undefined;
    const slot = isRecord(item.slot) ? item.slot : undefined;
    const details = isRecord(item.details) ? item.details : undefined;
    const checkInDate = details?.check_in_date;
    const checkOutDate = details?.check_out_date;
    if (
      item.id === undefined ||
      item.id === null ||
      typeof item.status !== 'string' ||
      service?.id === undefined ||
      typeof customer?.name !== 'string' ||
      (slot !== undefined && typeof slot.slot_date !== 'string') ||
      ((checkInDate !== undefined || checkOutDate !== undefined) &&
        (!isDateOnly(checkInDate) || !isDateOnly(checkOutDate) || checkOutDate <= checkInDate))
    ) {
      throw new Error('Data booking dari API tidak valid.');
    }
    return {
      id: String(item.id),
      uuid: typeof item.uuid === 'string' ? item.uuid : undefined,
      slotId: typeof slot?.id === 'number' ? slot.id : undefined,
      status: item.status,
      serviceId: String(service.id),
      serviceName: typeof service?.name === 'string' ? service.name : undefined,
      customerName: customer.name,
      slotDate: typeof slot?.slot_date === 'string' ? slot.slot_date : undefined,
      startTime: typeof slot?.start_time === 'string' ? slot.start_time : undefined,
      endTime: typeof slot?.end_time === 'string' ? slot.end_time : undefined,
      checkInDate: isDateOnly(checkInDate) ? checkInDate : undefined,
      checkOutDate: isDateOnly(checkOutDate) ? checkOutDate : undefined,
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
    case 'awaiting_completion_confirmation': return 'Menunggu konfirmasi selesai';
    case 'completed': return 'Selesai';
    case 'cancelled': return 'Dibatalkan';
    default: return status;
  }
}

export default function ManageCalendarScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<VendorTabParamList>>();
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
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [multiDateMode, setMultiDateMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [slotFormDates, setSlotFormDates] = useState<string[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [datePicker, setDatePicker] = useState<'month' | 'year' | null>(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const slotsRequestId = useRef(0);
  const bookingsRequestId = useRef(0);
  const lastDateTap = useRef<{ date: string; time: number } | null>(null);

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

  const loadCategories = useCallback(async () => {
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      const response = await categoryApi.getCategories();
      setCategories(parseCategories(response.data));
    } catch (error) {
      setCategoryError(responseMessage(error) ?? 'Gagal memuat kategori layanan.');
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories]),
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
    const startPadding = (first.getDay() + 6) % 7;
    const endPadding = (7 - last.getDay()) % 7;

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
  const selectedServiceCategory = selectedService
    ? categories.find((category) => category.subcategories.some(
      (subcategory) => subcategory.id === selectedService.subcategoryId,
    ))
    : undefined;
  const isHotelService = selectedService?.perNight ? true : selectedServiceCategory
    ? selectedServiceCategory.name.trim().toLocaleLowerCase('id-ID') === HOTEL_CATEGORY_NAME
    : null;
  const slotsForDate = useMemo(
    () => slots.filter((slot) => slot.slot_date === selectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots, selectedDate],
  );
  const bookingsForDate = useMemo(
    () => bookings.filter((booking) =>
      booking.serviceId === String(selectedServiceId) && (
        booking.slotDate === selectedDate ||
        (booking.checkInDate !== undefined &&
          booking.checkOutDate !== undefined &&
          booking.checkInDate <= selectedDate &&
          selectedDate < booking.checkOutDate)
      ),
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
  const pendingBookings = bookingsForDate.filter(booking => booking.status === 'pending');
  const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null);

  const confirmBooking = (booking: BookingItem) => {
    const uuid = booking.uuid;
    if (!uuid || confirmingBooking) return;
    Alert.alert('Konfirmasi booking', `Terima booking dari ${booking.customerName}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Konfirmasi',
        onPress: async () => {
          const slotRequestId = slotsRequestId.current;
          setConfirmingBooking(booking.id);
          try {
            await bookingApi.updateBookingStatus(uuid, 'confirmed');
            setBookings(current => current.map(item => item.id === booking.id ? { ...item, status: 'confirmed' } : item));
            await Promise.all([
              loadBookings(),
              selectedServiceId !== null && slotRequestId === slotsRequestId.current ? loadSlots(selectedServiceId) : undefined,
            ]);
          } catch (error) {
            Alert.alert('Booking gagal dikonfirmasi', responseMessage(error) ?? 'Coba lagi.');
          } finally {
            setConfirmingBooking(null);
          }
        },
      },
    ]);
  };

  const handleSelectDate = (date: string) => {
    const now = Date.now();
    const previousTap = lastDateTap.current;
    if (!multiDateMode && previousTap?.date === date && now - previousTap.time < 300) {
      lastDateTap.current = null;
      setSelectedDate(date);
      openAddSlot([date]);
      return;
    }

    lastDateTap.current = { date, time: now };
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

  const openAddSlot = (dates: string[]) => {
    if (categoryLoading || categoryError || isHotelService === null) {
      Toast.show({
        type: 'error',
        text1: 'Kategori layanan belum tersedia',
        text2: categoryError ?? 'Tunggu sampai data kategori selesai dimuat.',
        position: 'top',
      });
      return;
    }
    setSlotFormDates(dates);
    setShowAddSlotModal(true);
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

  const handleGoToToday = () => {
    lastDateTap.current = null;
    setSelectedDate(todayISO);
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
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
      loadCategories(),
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.headerButton} onPress={() => navigation.navigate('Dashboard')} accessibilityRole="button" accessibilityLabel="Kembali ke dashboard">
          <ChevronLeft size={21} color={colors.navy} />
        </Pressable>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={styles.title}>Kalender Booking</Text>
          <Text style={styles.subtitle}>Ketersediaan &amp; Jadwal Layanan</Text>
        </View>
        <Pressable
          style={styles.headerButton}
          onPress={() => Alert.alert('Bantuan kalender', 'Pilih layanan dan ketuk tanggal untuk melihat jadwal. Ketuk dua kali untuk menambah slot, atau gunakan tombol Pilih beberapa tanggal untuk membuat slot sekaligus.')}
          accessibilityRole="button"
          accessibilityLabel="Bantuan kalender"
        >
          <CircleHelp size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAYANAN DIPILIH</Text>
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
              <View style={styles.serviceIcon}>
                {/salon|barber|rambut|hair/i.test(selectedServiceCategory?.name ?? '')
                  ? <Scissors size={21} color={colors.primary} />
                  : <Package size={21} color={colors.primary} />}
              </View>
              <View style={styles.serviceSelectText}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceSelectValue}>{selectedService?.name ?? 'Pilih layanan'}</Text>
                  {selectedService?.active && <Text style={styles.activeBadge}>Aktif</Text>}
                </View>
                {Number.isFinite(selectedService?.price) && (
                  <Text style={styles.serviceSelectLabel}>Rp{selectedService?.price?.toLocaleString('id-ID')}{selectedService?.perNight ? ' / malam' : ''}</Text>
                )}
              </View>
              <ChevronDown size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          )}
          {categoryError && (
            <View style={styles.categoryWarning}>
              <Text style={styles.categoryWarningText}>{categoryError} Pembuatan slot dinonaktifkan sampai tipe layanan dapat dipastikan.</Text>
              <Pressable onPress={() => void loadCategories()} style={styles.retryButton} accessibilityRole="button">
                <Text style={styles.retryText}>Muat ulang kategori</Text>
              </Pressable>
            </View>
          )}
          {!categoryLoading && !categoryError && selectedService && isHotelService === null && (
            <View style={styles.categoryWarning}>
              <Text style={styles.categoryWarningText}>Kategori untuk layanan ini tidak ditemukan. Pembuatan slot dinonaktifkan.</Text>
            </View>
          )}
        </View>

        {!serviceLoading && !serviceError && services.length > 0 && (
          <>
            <View style={styles.calendarCard}>
              <View style={styles.monthControls}>
                <View style={styles.monthTitleContainer}>
                  <Pressable onPress={() => setDatePicker('month')} style={styles.monthPickerButton}
                    accessibilityRole="button" accessibilityLabel={`Pilih bulan, ${MONTH_NAMES[selectedMonth]}`}>
                    <Text style={styles.monthTitle}>{MONTH_NAMES[selectedMonth]}</Text>
                  </Pressable>
                  <Pressable onPress={() => setDatePicker('year')} style={styles.yearPickerButton}
                    accessibilityRole="button" accessibilityLabel={`Pilih tahun, ${selectedYear}`}>
                    <Text style={styles.yearTitle}>{selectedYear}</Text>
                    <ChevronDown size={14} color={colors.onSurfaceVariant} />
                  </Pressable>
                </View>
                <View style={styles.monthActions}>
                  <Pressable onPress={handleGoToToday} style={styles.todayButton}
                    accessibilityRole="button" accessibilityLabel="Kembali ke tanggal hari ini">
                    <Text style={styles.todayButtonText}>Hari Ini</Text>
                  </Pressable>
                  <View style={styles.monthArrows}>
                    <Pressable onPress={() => handleMonthChange(-1)} style={styles.iconButton}
                      accessibilityRole="button" accessibilityLabel="Bulan sebelumnya">
                      <ChevronLeft size={16} color={colors.onSurfaceVariant} />
                    </Pressable>
                    <Pressable onPress={() => handleMonthChange(1)} style={styles.iconButton}
                      accessibilityRole="button" accessibilityLabel="Bulan berikutnya">
                      <ChevronRight size={16} color={colors.onSurfaceVariant} />
                    </Pressable>
                  </View>
                </View>
              </View>
              <View style={styles.weekRow}>
                {DAY_NAMES.map((day, index) => <Text key={day} style={[styles.weekDay, index === 5 && styles.saturday, index === 6 && styles.sunday]}>{day}</Text>)}
              </View>
              <View style={styles.daysGrid}>
                {calendarDays.map((day, index) => (
                  <Pressable
                    key={day.date}
                    onPress={() => handleSelectDate(day.date)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      day.isSelected && styles.dayCellSelected,
                      day.isMultiSelected && !day.isSelected && styles.dayCellMultiSelected,
                      day.isToday && !day.isSelected && styles.dayCellToday,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDate(day.date)}, ${day.status === 'unknown' ? 'status belum tersedia' : day.status === 'none' ? 'tanpa slot' : day.status === 'available' ? 'tersedia' : day.status === 'partial' ? 'terisi sebagian' : 'penuh'}${day.isMultiSelected ? ', dipilih untuk pengaturan slot' : ''}`}
                    accessibilityState={{ selected: day.isSelected || day.isMultiSelected }}
                  >
                    <Text style={[
                      styles.dayNumber,
                      index % 7 === 5 && styles.saturday,
                      index % 7 === 6 && styles.sunday,
                      !day.isCurrentMonth && styles.dayNumberOutside,
                      day.isSelected && styles.dayNumberSelected,
                    ]}>
                      {day.day}
                    </Text>
                    <View style={styles.dayStatusArea}>
                      <View style={[styles.statusDot, styles[`status_${day.status}`], day.isSelected && styles.statusDotSelected]} />
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
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleToggleMultiDate}
                  style={({ pressed }) => [styles.secondaryButton, multiDateMode && styles.secondaryButtonActive, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: multiDateMode }}
                >
                  <CalendarDays size={17} color={multiDateMode ? colors.onPrimary : colors.primary} />
                  <Text style={[styles.secondaryButtonText, multiDateMode && styles.secondaryButtonTextActive]}>
                    {multiDateMode ? 'Selesai memilih' : 'Pilih beberapa tanggal'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => openAddSlot(multiDateMode ? selectedDates : [selectedDate])}
                  disabled={!selectedServiceId || (multiDateMode && selectedDates.length === 0) || categoryLoading || Boolean(categoryError) || isHotelService === null}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (!selectedServiceId || (multiDateMode && selectedDates.length === 0) || categoryLoading || Boolean(categoryError) || isHotelService === null) && styles.buttonDisabled,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={multiDateMode ? `Tambah slot di ${selectedDates.length} tanggal` : 'Tambah slot'}
                >
                  <Plus size={18} color={colors.onPrimary} />
                  <Text style={styles.primaryButtonText}>Tambah &amp; Kelola Slot</Text>
                </Pressable>
              </View>
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
              <View style={styles.serviceSelectText}>
                <Text style={styles.detailDate}>{formatDate(selectedDate)}</Text>
                {!slotLoading && !slotError && (
                  <Text style={styles.serviceSelectLabel}>
                    Status Ketersediaan: <Text style={styles.accentText}>{capacity.total === 0
                      ? 'Tanpa slot' : capacity.remaining === 0 ? 'Penuh' : capacity.booked > 0 ? 'Tersedia Sebagian' : 'Tersedia'}</Text>
                  </Text>
                )}
              </View>
              {!slotLoading && !slotError && capacity.remaining > 0 && <Text style={styles.activeBadge}>Aktif Booking</Text>}
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIcon}><Clock3 size={18} color={colors.primary} /></View>
                <Text style={styles.cardTitle}>Kapasitas Slot Layanan</Text>
                {!slotLoading && !slotError && capacity.total > 0 && (
                  <Text style={styles.serviceSelectLabel}>{Math.round(capacity.booked / capacity.total * 100)}% terisi</Text>
                )}
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
                    <CapacityValue label="Total Slot" value={capacity.total} />
                    <CapacityValue label="Terisi" value={capacity.booked} color="#C2410C" />
                    <CapacityValue label="Tersisa" value={capacity.remaining} color="#047857" />
                  </View>
                  {capacity.total > 0 && (
                    <View style={styles.capacityTrack}>
                      <View style={[styles.capacityFill, { width: `${Math.min(100, capacity.booked / capacity.total * 100)}%` }]} />
                    </View>
                  )}
                </>
              )}
            </View>

            {!slotLoading && !slotError && (
              <View style={styles.slotList}>
                <View style={styles.sessionHeading}>
                  <Text style={styles.sectionLabel}>JADWAL SESI WAKTU</Text>
                  <Pressable onPress={() => openAddSlot([selectedDate])} accessibilityRole="button">
                    <Text style={styles.accentText}>Atur Jam Kerja</Text>
                  </Pressable>
                </View>
                {slotsForDate.length === 0 && <Text style={styles.emptyMessage}>Belum ada slot pada tanggal ini.</Text>}
                {slotsForDate.map(slot => {
                  const full = slot.booked_count >= slot.quota;
                  const partial = !full && slot.booked_count > 0;
                  const status = full ? 'full' : partial ? 'partial' : 'available';
                  const customers = bookingsForDate
                    .filter(booking => booking.slotId === slot.id && booking.status !== 'cancelled' && booking.status !== 'pending')
                    .map(booking => booking.customerName);
                  return (
                    <View key={slot.id} style={[styles.slotRow, !full && !partial && styles.slotRowAvailable]}>
                      <View style={[styles.statusDot, styles[`status_${status}`]]} />
                      <View style={styles.slotDetails}>
                        <Text style={styles.slotTime}>{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)} WIB</Text>
                        <Text style={styles.slotCapacity} numberOfLines={2}>
                          {customers.length > 0 ? customers.join(', ') : full || partial
                            ? `${slot.booked_count} dari ${slot.quota} terisi` : 'Buka untuk booking online'}
                        </Text>
                      </View>
                      <Text style={[styles.slotBadge, full ? styles.slotBadgeFull : partial ? styles.slotBadgePartial : styles.slotBadgeAvailable]}>
                        {full ? 'Penuh' : partial ? 'Sebagian' : 'Tersedia'}
                      </Text>
                      {slot.booked_count === 0 && (
                        <Pressable onPress={() => void handleDeleteSlot(slot)} style={styles.deleteButton}
                          accessibilityRole="button" accessibilityLabel={`Hapus slot ${slot.start_time} sampai ${slot.end_time}`}>
                          <Trash2 size={15} color={colors.onSurfaceVariant} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIcon}><Users size={18} color={colors.primary} /></View>
                <Text style={styles.cardTitle}>Booking Menunggu Konfirmasi</Text>
                {!bookingLoading && !bookingError && (
                  <Text style={styles.bookingCount}>{pendingBookings.length}</Text>
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
              ) : pendingBookings.length === 0 ? (
                <Text style={styles.emptyMessage}>Tidak ada booking yang menunggu konfirmasi pada tanggal ini.</Text>
              ) : (
                <View style={styles.bookingList}>
                  {pendingBookings.map((booking) => (
                    <View key={booking.id} style={styles.bookingItem}>
                      <View style={styles.bookingRow}>
                        <View style={styles.bookingAvatar}><Text style={styles.bookingInitial}>{booking.customerName.slice(0, 1).toUpperCase()}</Text></View>
                        <View style={styles.bookingDetails}>
                          <Text style={styles.bookingName}>{booking.customerName}</Text>
                          <Text style={styles.bookingTime}>
                            {booking.checkInDate && booking.checkOutDate
                              ? `Check-in ${formatDate(booking.checkInDate, { day: 'numeric', month: 'short', year: 'numeric' })} · Check-out ${formatDate(booking.checkOutDate, { day: 'numeric', month: 'short', year: 'numeric' })}`
                              : booking.startTime && booking.endTime
                              ? `${booking.startTime.slice(0, 5)}–${booking.endTime.slice(0, 5)}`
                              : booking.serviceName ?? selectedService?.name}
                          </Text>
                        </View>
                        <Text style={[styles.bookingStatus, styles.bookingStatusPending, styles.bookingStatusText]}>{statusLabel(booking.status)}</Text>
                      </View>
                      {booking.uuid && (
                        <View style={styles.bookingActions}>
                          <Pressable style={styles.bookingDetailButton} accessibilityRole="button"
                            onPress={() => booking.uuid && navigation.navigate('Orders', { screen: 'OrderDetail', params: { id: booking.uuid }, initial: false })}>
                            <Text style={styles.bookingDetailText}>Lihat Detail</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.bookingConfirmButton, confirmingBooking !== null && styles.buttonDisabled]}
                            accessibilityRole="button" disabled={confirmingBooking !== null}
                            onPress={() => confirmBooking(booking)}>
                            <Text style={styles.bookingConfirmText}>{confirmingBooking === booking.id ? 'Memproses…' : 'Konfirmasi'}</Text>
                          </Pressable>
                        </View>
                      )}
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
        selectedDates={slotFormDates}
        isHotel={isHotelService}
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

function CapacityValue({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.capacityValue}>
      <Text style={[styles.capacityNumber, color && { color }]}>{value}</Text>
      <Text style={styles.capacityLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  serviceNameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  accentText: { fontSize: 12, fontWeight: '600', color: '#C2410C' },
  sessionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  slotRowAvailable: { borderColor: '#A7F3D0' },
  slotBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: '600', overflow: 'hidden' },
  slotBadgeFull: { color: '#BE123C', backgroundColor: '#FFF1F2' },
  slotBadgePartial: { color: '#1D4ED8', backgroundColor: '#EFF6FF' },
  slotBadgeAvailable: { color: '#047857', backgroundColor: '#D1FAE5' },
  bookingItem: { backgroundColor: '#F6F8FC', borderRadius: 12, borderWidth: 1, borderColor: '#E8EDF3', padding: 10, gap: 9 },
  bookingActions: { flexDirection: 'row', gap: 8 },
  bookingDetailButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8 },
  bookingConfirmButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#C2410C' },
  bookingDetailText: { color: colors.navy, fontSize: 12, fontWeight: '600' },
  bookingConfirmText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  serviceIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  activeBadge: { color: '#047857', backgroundColor: '#ECFDF5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, fontSize: 10, fontWeight: '700' },
  monthActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  monthArrows: { flexDirection: 'row', borderRadius: 8, backgroundColor: '#F1F5F9' },
  saturday: { color: '#A16207' },
  sunday: { color: '#BE123C' },
  capacityTrack: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 12 },
  capacityFill: { height: '100%', borderRadius: 3, backgroundColor: '#EA580C' },
  screen: { flex: 1, backgroundColor: '#F8F9FC' },
  content: { alignSelf: 'center', width: '100%', maxWidth: tenantLayout.maxContentWidth, paddingHorizontal: 16, paddingTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 6, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  title: { fontSize: 16, fontWeight: '800', color: colors.navy, textAlign: 'center' },
  subtitle: { fontSize: 11, color: '#64748B', marginTop: 3, textAlign: 'center' },
  section: { marginBottom: 14 },
  sectionLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, letterSpacing: 0.8, color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
  serviceSelect: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 16, borderWidth: 1, borderColor: '#E8EDF3', backgroundColor: '#FFFFFF' },
  serviceSelectText: { flex: 1 },
  serviceSelectLabel: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant },
  serviceSelectValue: { fontFamily: typography.labelLg.fontFamily, fontSize: 15, fontWeight: '600', color: colors.onSurface, marginTop: 2 },
  todayButton: { minHeight: 32, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 7, backgroundColor: '#FFF7ED' },
  todayButtonText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  monthControls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 4, marginBottom: 3 },
  iconButton: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthPickerButton: { minHeight: 44, justifyContent: 'center' },
  monthTitle: { fontSize: 15, fontWeight: '800', color: colors.navy },
  yearPickerButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3 },
  yearTitle: { fontSize: 15, fontWeight: '800', color: colors.navy },
  calendarCard: { padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E8EDF3', shadowColor: '#0F172A', shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  weekRow: { flexDirection: 'row', marginBottom: 3 },
  weekDay: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 10, color: '#64748B', paddingVertical: 5 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  dayCellSelected: { backgroundColor: '#C2410C' },
  dayCellMultiSelected: { backgroundColor: colors.primaryFixed, borderWidth: 1, borderColor: colors.primary },
  dayCellToday: { borderWidth: 1, borderColor: '#EA580C' },
  dayNumber: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, fontWeight: '500', color: colors.onSurface },
  dayNumberOutside: { color: colors.outline },
  dayNumberSelected: { color: colors.onPrimary, fontWeight: '700' },
  dayStatusArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 10, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotSelected: { borderWidth: 1, borderColor: colors.onPrimary },
  status_available: { backgroundColor: colors.accentGreen },
  status_partial: { backgroundColor: '#3B82F6' },
  status_full: { backgroundColor: colors.error },
  status_none: { backgroundColor: colors.outlineVariant },
  status_unknown: { backgroundColor: colors.outline },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant },
  actionsRow: { gap: 8, marginTop: 12 },
  secondaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#EA580C', borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 12 },
  secondaryButtonActive: { backgroundColor: colors.primary },
  secondaryButtonText: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, color: colors.primary },
  secondaryButtonTextActive: { color: colors.onPrimary },
  primaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#C2410C', paddingHorizontal: 12 },
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
  card: { padding: 14, marginBottom: 12, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF3' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, marginBottom: spacing.stackMd },
  cardIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryFixed },
  cardTitle: { flex: 1, fontFamily: typography.labelLg.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  bookingCount: { minWidth: 22, textAlign: 'center', overflow: 'hidden', borderRadius: radius.full, paddingHorizontal: 5, paddingVertical: 3, backgroundColor: '#C2410C', fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  capacityRow: { flexDirection: 'row', borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow, paddingVertical: spacing.stackMd, marginBottom: spacing.stackMd },
  capacityValue: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.outlineVariant },
  capacityNumber: { fontFamily: typography.titleMd.fontFamily, fontSize: 20, fontWeight: typography.titleMd.fontWeight, color: colors.onSurface },
  capacityLabel: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  emptyMessage: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, paddingVertical: spacing.stackMd },
  slotList: { gap: 8, marginBottom: 16 },
  slotRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#E8EDF3', borderRadius: 12, backgroundColor: '#FFFFFF' },
  slotDetails: { flex: 1 },
  slotTime: { fontFamily: typography.labelLg.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  slotCapacity: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 3 },
  deleteButton: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  bookingList: { gap: spacing.stackSm },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookingAvatar: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEDD5' },
  bookingInitial: { fontFamily: typography.labelLg.fontFamily, fontSize: 14, color: colors.onSecondaryContainer },
  bookingDetails: { flex: 1 },
  bookingName: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, fontWeight: '600', color: colors.onSurface },
  bookingTime: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 3 },
  bookingStatus: { borderRadius: radius.full, paddingHorizontal: spacing.stackSm, paddingVertical: 5 },
  bookingStatusPending: { backgroundColor: colors.primaryFixed },
  bookingStatusText: { fontFamily: typography.labelSm.fontFamily, fontSize: 10, color: colors.onSurface },
  loadingRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.stackSm },
  helperText: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18 },
  emptyBox: { padding: spacing.stackMd, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  emptyTitle: { fontFamily: typography.labelLg.fontFamily, fontSize: 14, color: colors.onSurface, marginBottom: 4 },
  errorBox: { padding: spacing.stackMd, borderRadius: radius.md, backgroundColor: colors.errorContainer },
  categoryWarning: { padding: spacing.stackMd, marginTop: spacing.stackSm, borderRadius: radius.md, backgroundColor: colors.primaryFixed },
  categoryWarningText: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onPrimaryFixedVariant, lineHeight: 18 },
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
