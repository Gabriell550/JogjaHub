import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export interface BookingDetailData {
  id: string;
  order_code: string;
  service_name: string;
  vendor_name: string;
  vendor_category?: string;
  schedule_date: string;
  schedule_time: string;
  price: number;
  payment_status: string;
  location_detail?: string;
  custom_note?: string;
  proof_url?: string;
  status: string;
}

interface OrderDetailsModalProps {
  visible: boolean;
  booking: BookingDetailData | null;
  onClose: () => void;
}

export default function OrderDetailsModal({
  visible,
  booking,
  onClose,
}: OrderDetailsModalProps) {
  if (!booking) return null;

  const isPaid =
    booking.payment_status.toLowerCase().includes('lunas') ||
    booking.status === 'confirmed' ||
    booking.status === 'shipping' ||
    booking.status === 'completed';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* Header with Brand Orange Gradient & Tugu Silhouette */}
              <View style={styles.headerContainer}>
                {/* Decorative background watermark circles */}
                <View style={styles.circleWatermark1} />
                <View style={styles.circleWatermark2} />

                {/* Tugu Jogja Silhouette */}
                <View style={styles.tuguSilhouetteContainer} pointerEvents="none">
                  <Svg width={75} height={135} viewBox="0 0 100 160" fill="none">
                    {/* Spire peak & orb */}
                    <Circle cx="50" cy="8" r="4" fill="#FFFFFF" opacity={0.85} />
                    <Path d="M49 12 L51 12 L52 28 L48 28 Z" fill="#FFFFFF" opacity={0.85} />
                    {/* Upper decorative cone */}
                    <Path d="M46 28 L54 28 L56 50 L44 50 Z" fill="#FFFFFF" opacity={0.85} />
                    {/* Middle tier cornice */}
                    <Rect x="43" y="50" width="14" height="6" rx="2" fill="#FFFFFF" opacity={0.85} />
                    {/* Main pillar body */}
                    <Path d="M44 56 L56 56 L58 102 L42 102 Z" fill="#FFFFFF" opacity={0.85} />
                    {/* Lower cornice */}
                    <Rect x="39" y="102" width="22" height="7" rx="2" fill="#FFFFFF" opacity={0.85} />
                    {/* Stepped base pyramid */}
                    <Path d="M37 109 L63 109 L67 132 L33 132 Z" fill="#FFFFFF" opacity={0.85} />
                    {/* Plinth */}
                    <Rect x="28" y="132" width="44" height="10" rx="2" fill="#FFFFFF" opacity={0.85} />
                    <Rect x="20" y="142" width="60" height="18" rx="3" fill="#FFFFFF" opacity={0.85} />
                  </Svg>
                </View>

                {/* Brand Header */}
                <View style={styles.brandRow}>
                  <View style={styles.brandIconWrapper}>
                    <Ionicons name="school" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.brandName}>JogjaHub</Text>
                    <Text style={styles.brandTagline}>WISUDA & VENDOR</Text>
                  </View>
                </View>

                {/* Title & Ref */}
                <Text style={styles.modalTitle}>Rincian Pesanan</Text>
                <Text style={styles.modalRefText}>
                  No. Ref: #{booking.order_code || 'JH-2026-8891'}
                </Text>
              </View>

              {/* Body Content */}
              <View style={styles.bodyContainer}>
                {/* 1. PESANAN Card */}
                <View style={styles.infoCard}>
                  <View style={[styles.infoIconBox, styles.orderIconBox]}>
                    <Ionicons name="cube-outline" size={20} color="#EA580C" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>PESANAN</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {booking.service_name}
                    </Text>
                  </View>
                </View>

                {/* 2. VENDOR Card */}
                <View style={styles.infoCard}>
                  <View style={[styles.infoIconBox, styles.vendorIconBox]}>
                    <Ionicons name="storefront-outline" size={19} color="#0284C7" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>VENDOR</Text>
                    <View style={styles.vendorValueRow}>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {booking.vendor_name}
                      </Text>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={12} color="#16A34A" />
                        <Text style={styles.verifiedText}>Terverifikasi</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. JADWAL PENGAMBILAN Card */}
                <View style={styles.infoCard}>
                  <View style={[styles.infoIconBox, styles.scheduleIconBox]}>
                    <Ionicons name="calendar-outline" size={19} color="#D97706" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>JADWAL PENGAMBILAN</Text>
                    <Text style={styles.infoValue}>
                      {booking.schedule_date}, {booking.schedule_time}
                    </Text>
                  </View>
                </View>

                {/* 4. TOTAL PEMBAYARAN Card */}
                <View style={styles.paymentCard}>
                  <View>
                    <Text style={styles.paymentLabel}>TOTAL PEMBAYARAN</Text>
                    <Text style={styles.paymentAmount}>
                      Rp{booking.price.toLocaleString('id-ID')}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.paymentBadge,
                      { backgroundColor: isPaid ? '#10B981' : '#F59E0B' },
                    ]}
                  >
                    <Ionicons
                      name={isPaid ? 'checkmark-circle' : 'time'}
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.paymentBadgeText}>
                      {isPaid || booking.payment_status.toLowerCase().includes('lunas')
                        ? 'Lunas'
                        : booking.payment_status || 'Menunggu'}
                    </Text>
                  </View>
                </View>

                {/* OK Button */}
                <TouchableOpacity
                  style={styles.okButton}
                  onPress={onClose}
                  activeOpacity={0.88}
                >
                  <Text style={styles.okButtonText}>Oke, Mengerti</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  modalCard: {
    width: Math.min(width - 40, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  /* Header Container */
  headerContainer: {
    backgroundColor: '#FF6000',
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  circleWatermark1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -30,
    left: -40,
  },
  circleWatermark2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -20,
    left: 20,
  },
  tuguSilhouetteContainer: {
    position: 'absolute',
    right: 8,
    bottom: -5,
    opacity: 0.26,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 1.2,
    marginTop: -2,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalRefText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
    marginTop: 4,
  },

  /* Body Content */
  bodyContainer: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 11,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderIconBox: {
    backgroundColor: '#FFF2E8',
  },
  vendorIconBox: {
    backgroundColor: '#E0F2FE',
  },
  scheduleIconBox: {
    backgroundColor: '#FEF3C7',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  vendorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },

  /* Total Payment Card */
  paymentCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentBadge: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Buttons */
  okButton: {
    backgroundColor: '#FF6000',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#FF6000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  okButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

