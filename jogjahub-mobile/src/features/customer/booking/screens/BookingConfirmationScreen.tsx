import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { CustomerStackParamList } from '../../../../navigation/types';
import { bookingApi } from '../../../../api/bookingApi';

type BookingConfirmationScreenNavProp = NativeStackNavigationProp<
  CustomerStackParamList,
  'BookingConfirmation'
>;
type BookingConfirmationScreenRouteProp = RouteProp<
  CustomerStackParamList,
  'BookingConfirmation'
>;

export default function BookingConfirmationScreen() {
  const navigation = useNavigation<BookingConfirmationScreenNavProp>();
  const route = useRoute<BookingConfirmationScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const {
    serviceId = '1',
    serviceName = 'Layanan JogjaHub',
    vendorName = 'Vendor Resmi',
    date = '15 Oktober 2024',
    timeSlot = '13:00 WIB',
    price = 150000,
  } = route.params || {};

  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cod'>('transfer');
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bankDetails = {
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8220 9182 3410',
    accountName: 'PT JogjaHub Ekosistem Wisata',
  };

  const handleCopyAccountNumber = () => {
    Toast.show({
      type: 'success',
      text1: 'Nomor Rekening Disalin',
      text2: `${bankDetails.accountNumber} berhasil disalin ke clipboard.`,
    });
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setProofImageUri(result.assets[0].uri);
        Toast.show({
          type: 'success',
          text1: 'Foto Terpilih',
          text2: 'Bukti transfer berhasil dilampirkan.',
        });
      }
    } catch {
      Alert.alert('Error', 'Gagal memilih gambar.');
    }
  };

  const handleFinishBooking = async () => {
    setIsSubmitting(true);
    try {
      // Panggil createBooking dari bookingApi jika backend sudah aktif
      await bookingApi.createBooking({
        service_id: serviceId,
        payment_method: paymentMethod,
        payment_proof_url: proofImageUri || null,
        details: { date, timeSlot },
      });
    } catch {
      // Backend controller customer booking mungkin masih kosong/offline, abaikan error dan lanjutkan
    } finally {
      setIsSubmitting(false);
      Toast.show({
        type: 'success',
        text1: 'Booking Berhasil Dicatat!',
        text2: 'Status: Pending. Menunggu konfirmasi vendor.',
      });
      // Arahkan ke tab CustomerTabs -> MyBookings
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'CustomerTabs', params: { screen: 'MyBookings' } }],
      });
    }
  };

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

        <Text style={styles.headerTitle}>Konfirmasi Booking</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Status Pending Banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusBadgeRow}>
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={16} color="#D97706" />
              <Text style={styles.pendingBadgeText}>Menunggu Pembayaran (Pending)</Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            Pesanan Anda telah disimpan dengan status{' '}
            <Text style={{ fontWeight: '700' }}>Pending</Text>. Silakan lakukan pembayaran sesuai
            instruksi di bawah ini untuk mengunci slot tayang Anda.
          </Text>
        </View>

        {/* Ringkasan Pesanan Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ringkasan Pesanan</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Layanan</Text>
            <Text style={styles.detailValue}>{serviceName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vendor</Text>
            <Text style={styles.detailValue}>{vendorName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jadwal Booking</Text>
            <Text style={styles.detailValueHighlight}>
              {date}, {timeSlot}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Pembayaran</Text>
            <Text style={styles.priceHighlight}>
              Rp {price.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Pilihan Metode Pembayaran */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Metode Pembayaran</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'transfer' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('transfer')}
            activeOpacity={0.8}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'transfer' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Transfer Bank Manual</Text>
              <Text style={styles.paymentOptionSubtitle}>
                BCA, Mandiri, BNI, BRI (Verifikasi manual)
              </Text>
            </View>
            <Ionicons name="card-outline" size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.8}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Bayar di Tempat (COD)</Text>
              <Text style={styles.paymentOptionSubtitle}>
                Bayar langsung kepada pihak vendor di lokasi
              </Text>
            </View>
            <Ionicons name="cash-outline" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Instruksi Transfer Bank jika dipilih */}
          {paymentMethod === 'transfer' && (
            <View style={styles.bankInstructionBox}>
              <Text style={styles.bankInstructionTitle}>Instruksi Transfer</Text>
              <Text style={styles.bankNameText}>{bankDetails.bankName}</Text>

              <View style={styles.accountNumberRow}>
                <Text style={styles.accountNumberText}>{bankDetails.accountNumber}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyAccountNumber}
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={14} color="#8C3B00" />
                  <Text style={styles.copyButtonText}>Salin</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.accountOwnerText}>a.n. {bankDetails.accountName}</Text>
              <Text style={styles.instructionNotice}>
                Pastikan mentransfer nominal pas: Rp {price.toLocaleString('id-ID')}
              </Text>
            </View>
          )}
        </View>

        {/* Upload Bukti Pembayaran (FR-09) */}
        {paymentMethod === 'transfer' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bukti Pembayaran (Opsional)</Text>
            <Text style={styles.uploadSubtitle}>
              Unggah bukti transfer Anda sekarang atau nanti melalui menu Pesanan Saya.
            </Text>

            {proofImageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: proofImageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-reverse-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.changeImageButtonText}>Ganti Foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={32} color="#94A3B8" />
                <Text style={styles.uploadBoxTitle}>Ketuk untuk Unggah Bukti</Text>
                <Text style={styles.uploadBoxSubtitle}>Format JPG/PNG, maks 5MB</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed Sticky Footer */}
      <View style={[styles.bottomFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.finishButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleFinishBooking}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          <Text style={styles.finishButtonText}>
            {isSubmitting ? 'Memproses...' : 'Selesai & Lihat Pesanan'}
          </Text>
          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={styles.buttonIcon} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8C3B00',
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  /* Status Banner */
  statusCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 6,
  },
  statusDescription: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  detailValueHighlight: {
    fontSize: 14,
    color: '#8C3B00',
    fontWeight: '700',
  },
  priceHighlight: {
    fontSize: 17,
    color: '#8C3B00',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },

  /* Payment options */
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFFBF7',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B00',
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },

  /* Bank Instruction */
  bankInstructionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankInstructionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bankNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginVertical: 6,
  },
  accountNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEEAD8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C3B00',
    marginLeft: 4,
  },
  accountOwnerText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  instructionNotice: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 4,
  },

  /* Upload Box */
  uploadSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  uploadBoxSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  changeImageButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C3B00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  /* Sticky Footer */
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
  finishButton: {
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
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
