import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomerStackParamList } from '../../../../navigation/types';
import { bookingApi } from '../../../../api/bookingApi';

type BookingScreenNavProp = NativeStackNavigationProp<CustomerStackParamList, 'Booking'>;
type BookingScreenRouteProp = RouteProp<CustomerStackParamList, 'Booking'>;

interface TimeSlotItem {
  id: string;
  time: string;
  status: 'available' | 'full';
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const DEFAULT_TIME_SLOTS: TimeSlotItem[] = [
  { id: '1', time: '08:00', status: 'available' },
  { id: '2', time: '10:00', status: 'full' },
  { id: '3', time: '13:00', status: 'available' },
  { id: '4', time: '15:30', status: 'available' },
  { id: '5', time: '19:00', status: 'available' },
  { id: '6', time: '21:00', status: 'full' },
];

export default function BookingScreen() {
  const navigation = useNavigation<BookingScreenNavProp>();
  const route = useRoute<BookingScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const serviceId = route.params?.serviceId ?? '1';
  const serviceName = route.params?.serviceName ?? 'Layanan JogjaHub';
  const vendorName = route.params?.vendorName ?? 'Vendor Resmi';
  const price = route.params?.price ?? 150000;

  // Calendar State - default to October 2024 (or current date if desired, defaults to 2024 Oct 15 matching screenshot)
  const [currentYear, setCurrentYear] = useState(2024);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(9); // 9 = October (0-indexed)
  const [selectedDay, setSelectedDay] = useState(15);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('3'); // 13:00 by default matching screenshot
  const [slots, setSlots] = useState<TimeSlotItem[]>(DEFAULT_TIME_SLOTS);

  // Fetch available slots from backend if serviceId is provided, with fallback to default
  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      try {
        if (serviceId) {
          const res = await bookingApi.getAvailableSlots(serviceId);
          if (isMounted && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
            const mappedSlots: TimeSlotItem[] = res.data.data.map((item: any) => ({
              id: String(item.id),
              time: item.start_time?.substring(0, 5) || '08:00',
              status: item.booked_count >= item.quota ? 'full' : 'available',
            }));
            setSlots(mappedSlots);
            const firstAvail = mappedSlots.find((s) => s.status === 'available');
            if (firstAvail) {
              setSelectedSlotId(firstAvail.id);
            }
          }
        }
      } catch {
        // Fallback to default mock slots
      }
    }
    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleSelectSlot = (slot: TimeSlotItem) => {
    if (slot.status === 'full') return;
    setSelectedSlotId(slot.id);
  };

  const handleShowHelp = () => {
    Alert.alert(
      'Informasi Slot Booking',
      '• Pilih tanggal dan jam tayang yang tersedia.\n' +
      '• Slot yang bertanda "Penuh" tidak dapat dipilih.\n' +
      '• Garansi Slot menjamin pesanan Anda diproses langsung oleh vendor.\n' +
      '• Pembatalan dapat diajukan minimal 6 jam sebelum waktu tayang.',
      [{ text: 'Mengerti', style: 'default' }]
    );
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];

  const handleConfirm = () => {
    if (!selectedSlot) {
      Alert.alert('Pemberitahuan', 'Silakan pilih jam tayang terlebih dahulu.');
      return;
    }

    const formattedDateString = `${selectedDay} ${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;
    navigation.navigate('BookingConfirmation', {
      serviceId,
      serviceName,
      vendorName,
      date: formattedDateString,
      timeSlot: `${selectedSlot.time} WIB`,
      price,
      paymentMethod: 'transfer',
    });
  };

  // Generate calendar grid
  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
  // Days in previous month for leading padding
  const daysInPrevMonth = new Date(currentYear, currentMonthIndex, 0).getDate();

  const prevMonthPaddingDays: number[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthPaddingDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const totalCells = prevMonthPaddingDays.length + currentMonthDays.length;
  const trailingPaddingDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthPaddingDays: number[] = [];
  for (let i = 1; i <= trailingPaddingDaysCount; i++) {
    nextMonthPaddingDays.push(i);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#8C3B00" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleTop}>Pilih Slot</Text>
          <Text style={styles.headerTitleBottom}>Booking</Text>
        </View>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={handleShowHelp}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={26} color="#8C3B00" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.calendarYearLabel}>TAHUN {currentYear}</Text>
              <Text style={styles.calendarMonthName}>{MONTH_NAMES[currentMonthIndex]}</Text>
            </View>

            <View style={styles.calendarNavRow}>
              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={18} color="#1E293B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navCircleButton, { marginLeft: 10 }]}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={18} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Names */}
          <View style={styles.weekdayRow}>
            {DAY_NAMES.map((name, idx) => (
              <View key={idx} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Previous month padding days */}
            {prevMonthPaddingDays.map((d, idx) => (
              <View key={`prev-${idx}`} style={styles.dayCell}>
                <Text style={styles.prevMonthDayText}>{d}</Text>
              </View>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((d) => {
              const isSelected = d === selectedDay;
              const isHighlighted = d === 8; // Highlight day 8 as in design
              return (
                <TouchableOpacity
                  key={`day-${d}`}
                  style={styles.dayCell}
                  onPress={() => setSelectedDay(d)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.dayNumberWrapper,
                      isSelected && styles.selectedDayWrapper,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelected && styles.selectedDayText,
                        isHighlighted && !isSelected && styles.highlightedDayText,
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Next month padding days */}
            {nextMonthPaddingDays.map((d, idx) => (
              <View key={`next-${idx}`} style={styles.dayCell}>
                <Text style={styles.nextMonthDayText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Pilih Jam Tayang */}
        <View style={styles.slotSection}>
          <Text style={styles.slotSectionTitle}>Pilih Jam Tayang</Text>

          <View style={styles.slotGrid}>
            {slots.map((slot) => {
              const isSelected = slot.id === selectedSlotId;
              const isFull = slot.status === 'full';

              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    isFull && styles.slotCardFull,
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                  disabled={isFull}
                  activeOpacity={0.85}
                >
                  <View style={styles.slotHeaderRow}>
                    <Text
                      style={[
                        styles.slotTimeText,
                        isFull && styles.slotTimeTextFull,
                        isSelected && styles.slotTimeTextSelected,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#FF6B00"
                        style={styles.selectedCheckIcon}
                      />
                    )}
                  </View>

                  <View style={styles.slotStatusRow}>
                    {isSelected ? (
                      <Text style={styles.selectedStatusLabel}>Selected</Text>
                    ) : isFull ? (
                      <>
                        <View style={styles.greyDot} />
                        <Text style={styles.fullStatusLabel}>Penuh</Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.blueDot} />
                        <Text style={styles.availableStatusLabel}>Tersedia</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ringkasan Pilihan Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.calendarIconBox}>
            <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryLabel}>RINGKASAN PILIHAN</Text>
            <Text style={styles.summaryValue}>
              {selectedDay} {MONTH_NAMES[currentMonthIndex]} {currentYear}, {selectedSlot?.time ?? '13:00'} WIB
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Sticky Footer */}
      <View style={[styles.bottomFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.footerTopRow}>
          <View>
            <Text style={styles.footerTotalLabel}>Total Pembayaran</Text>
            <Text style={styles.footerPriceValue}>
              Rp {price.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.guaranteeBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#0284C7" />
            <Text style={styles.guaranteeText}>Garansi Slot</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.88}
        >
          <Text style={styles.confirmButtonText}>Konfirmasi Slot</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonArrow} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FAF9F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleTop: {
    fontSize: 17,
    fontWeight: '700',
    color: '#8C3B00',
    lineHeight: 22,
  },
  headerTitleBottom: {
    fontSize: 17,
    fontWeight: '700',
    color: '#8C3B00',
    lineHeight: 22,
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  /* Calendar Card */
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  calendarYearLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  calendarMonthName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
  },
  dayNumberWrapper: {
    width: 38,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayWrapper: {
    backgroundColor: '#A04100',
    shadowColor: '#A04100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  highlightedDayText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  prevMonthDayText: {
    fontSize: 14,
    color: '#E2B8A8', // Faded terracotta/pink as in screenshot
  },
  nextMonthDayText: {
    fontSize: 14,
    color: '#CBD5E1',
  },

  /* Slot Section */
  slotSection: {
    marginTop: 24,
  },
  slotSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  slotCardSelected: {
    borderColor: '#FF6B00',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  slotCardFull: {
    backgroundColor: '#F3F6FA',
    borderColor: '#F3F6FA',
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  slotTimeTextFull: {
    color: '#94A3B8',
  },
  slotTimeTextSelected: {
    color: '#1E293B',
  },
  selectedCheckIcon: {
    marginLeft: 6,
  },
  slotStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
    marginRight: 6,
  },
  greyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginRight: 6,
  },
  availableStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  fullStatusLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  selectedStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },

  /* Summary Banner */
  summaryBanner: {
    backgroundColor: '#FEEAD8',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  calendarIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#A04100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* Bottom Sticky Footer */
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF9F6',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  footerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerTotalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  footerPriceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8C3B00',
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guaranteeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    marginLeft: 5,
  },
  confirmButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonArrow: {
    marginLeft: 8,
  },
});
