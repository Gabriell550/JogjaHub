import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Bell, Calendar as CalendarIcon, Clock, MessageCircle, X, CheckCircle2 } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { bookingApi } from '../../../../api/bookingApi';
import Toast from 'react-native-toast-message';
import type { VendorOrdersStackParamList } from '../../../../navigation/types';

type OrderDetailRoute = RouteProp<VendorOrdersStackParamList, 'OrderDetail'>;

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const { params: booking } = useRoute<OrderDetailRoute>();
  const [processing, setProcessing] = useState<'accept' | 'reject' | null>(null);

  const handleDecision = async (status: 'confirmed' | 'cancelled') => {
    setProcessing(status === 'confirmed' ? 'accept' : 'reject');
    try {
      await bookingApi.updateBookingStatus(booking.id, status);
      Toast.show({
        type: 'success',
        text1: status === 'confirmed' ? 'Pesanan diterima' : 'Pesanan ditolak',
        text2: booking.service_name,
        position: 'top',
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gagal memperbarui pesanan',
        text2: 'Coba lagi dalam beberapa saat.',
        position: 'top',
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.alertHeader}>
        <View style={styles.bellCircle}>
          <Bell size={32} color={colors.onPrimary} />
        </View>
        <Text style={styles.alertTitle}>Pesanan Baru!</Text>
        <Text style={styles.alertSubtitle}>Konfirmasi segera sebelum waktu habis</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.orderIdLabel}>ID PESANAN</Text>
            <Text style={styles.orderId}>#{booking.order_code}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{formatRupiah(booking.price)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.serviceRow}>
          <View style={styles.serviceIconWrap}>
            <CheckCircle2 size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.serviceName}>{booking.service_name}</Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          {booking.photo_url ? (
            <Image source={{ uri: booking.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{booking.customer_name}</Text>
            <Text style={styles.customerLocation}>{booking.customer_location}</Text>
          </View>
          <TouchableOpacity style={styles.chatButton}>
            <MessageCircle size={18} color={colors.onSecondaryContainer} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleDecision('cancelled')}
            disabled={processing !== null}
          >
            {processing === 'reject' ? (
              <ActivityIndicator size="small" color={colors.onErrorContainer} />
            ) : (
              <>
                <X size={18} color={colors.onErrorContainer} />
                <Text style={styles.rejectButtonText}>Tolak</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleDecision('confirmed')}
            disabled={processing !== null}
          >
            {processing === 'accept' ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <CheckCircle2 size={18} color={colors.onPrimary} />
                <Text style={styles.acceptButtonText}>Terima Pesanan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: spacing.sectionGap },
  alertHeader: { alignItems: 'center', marginBottom: spacing.stackLg },
  bellCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.stackSm,
  },
  alertTitle: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    color: colors.onSurface,
  },
  alertSubtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.secondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.stackLg,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderIdLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1,
  },
  orderId: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    color: colors.onSurface,
  },
  priceBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  priceBadgeText: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: 16,
    color: colors.secondary,
  },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHighest, marginVertical: spacing.stackLg },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackMd, marginBottom: spacing.stackLg },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    color: colors.onSurface,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackMd,
    backgroundColor: colors.surface,
    padding: spacing.stackMd,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.sectionGap * 0.6,
  },
  avatar: { width: 48, height: 48, borderRadius: radius.full },
  avatarPlaceholder: { backgroundColor: colors.surfaceContainerHigh },
  customerName: { fontFamily: typography.button.fontFamily, fontSize: 15, color: colors.onSurface },
  customerLocation: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.secondary },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: spacing.stackMd },
  rejectButton: {
    flex: 1,
    paddingVertical: spacing.stackMd,
    borderRadius: radius.lg,
    backgroundColor: colors.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButtonText: { fontFamily: typography.button.fontFamily, fontSize: 14, color: colors.onErrorContainer },
  acceptButton: {
    flex: 2,
    paddingVertical: spacing.stackMd,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: { fontFamily: typography.button.fontFamily, fontSize: 14, color: colors.onPrimary },
});