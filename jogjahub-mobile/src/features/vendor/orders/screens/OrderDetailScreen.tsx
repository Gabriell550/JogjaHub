import React, { useCallback, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Bell, X, CheckCircle2 } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { bookingLabel, bookingStatusLabel, fundStatusLabel, paymentLabel, type BookingRecord } from '../../../../types/bookingRecord';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { bookingApi } from '../../../../api/bookingApi';
import Toast from 'react-native-toast-message';
import type { VendorOrdersStackParamList, VendorTabParamList } from '../../../../navigation/types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type OrderDetailRoute = RouteProp<VendorOrdersStackParamList, 'OrderDetail'>;

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const { params: { id } } = useRoute<OrderDetailRoute>();
  const [booking, setBooking] = useState<BookingRecord>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [processing, setProcessing] = useState<'accept' | 'reject' | 'fulfill' | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setError(false);
    bookingApi.getIncomingBooking(id).then(({ data }) => {
      if (active) setBooking(data.data);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, [id, attempt]));

  if (error) return <Text style={styles.content} onPress={() => setAttempt(value => value + 1)}>Pesanan gagal dimuat. Coba lagi.</Text>;
  if (!booking || booking.uuid !== id) return <ActivityIndicator />;
  const fundStatus = booking.payment?.fund_status;
  const fulfillLabel = booking.demo_pickup ? 'Siap diambil' : 'Selesai dikerjakan';

  const handleDecision = async (status: 'confirmed' | 'cancelled') => {
    setProcessing(status === 'confirmed' ? 'accept' : 'reject');
    try {
      await bookingApi.updateBookingStatus(id, status);
      Toast.show({
        type: 'success',
        text1: status === 'confirmed' ? 'Pesanan diterima' : 'Pesanan ditolak',
        text2: booking.service?.name,
        position: 'top',
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gagal memperbarui pesanan',
        text2: apiErrorMessage(err, 'Coba lagi dalam beberapa saat.'),
        position: 'top',
      });
    } finally {
      setProcessing(null);
    }
  };

  const markFulfilled = async () => {
    setProcessing('fulfill');
    try {
      const { data } = await bookingApi.markFulfilled(id);
      setBooking(previous => ({ ...data.data, customer: previous?.customer }));
      setAttempt(value => value + 1);
    } catch (error) {
      Alert.alert('Pesanan gagal diperbarui', apiErrorMessage(error, 'Coba lagi.'));
    } finally {
      setProcessing(null);
    }
  };

  const openConversation = (conversationId: number) => {
    navigation.getParent<BottomTabNavigationProp<VendorTabParamList>>()?.navigate('Profile', {
      screen: 'VendorChatRoom',
      params: { conversationId: String(conversationId), customerName: booking.customer?.name ?? 'Pelanggan' },
      initial: false,
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.alertHeader}>
        <View style={styles.bellCircle}>
          <Bell size={32} color={colors.onPrimary} />
        </View>
        <Text style={styles.alertTitle}>Rincian Pesanan</Text>
        <Text style={styles.alertSubtitle}>{bookingStatusLabel[booking.status]}</Text>
        <Text style={styles.alertSubtitle}>{paymentLabel(booking)}</Text>
        {fundStatus && <Text style={styles.alertSubtitle}>Dana demo · {fundStatusLabel[fundStatus]}</Text>}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.orderIdLabel}>ID PESANAN</Text>
            <Text style={styles.orderId}>{bookingLabel(booking)}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{formatRupiah(Number(booking.total_amount ?? 0))}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.serviceRow}>
          <View style={styles.serviceIconWrap}>
            <CheckCircle2 size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.serviceName}>{booking.service?.name}</Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          {booking.customer?.avatar_url ? (
            <Image source={{ uri: booking.customer?.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{booking.customer?.name}</Text>
            <Text style={styles.customerLocation}>{booking.check_in_date ?? booking.slot?.slot_date.slice(0, 10) ?? ''}</Text>
          </View>
        </View>

        {!!booking.payment?.payout_destination && <Text>Tujuan pencairan {booking.payment.payout_destination}</Text>}
        {booking.payment?.payout_waiting_for_destination && (
          <Text accessibilityRole="button" style={styles.orderId}
            onPress={() => navigation.getParent<BottomTabNavigationProp<VendorTabParamList>>()?.navigate('Profile', { screen: 'DemoPayoutDestination', initial: false })}>
            Tambahkan tujuan pencairan agar dana demo dapat dicairkan.
          </Text>
        )}
        {fundStatus === 'processing' && <Text accessibilityRole="button" style={styles.orderId} onPress={() => setAttempt(value => value + 1)}>Perbarui status</Text>}
        {!!booking.fulfilled_at && <Text>{fulfillLabel} · {new Date(booking.fulfilled_at).toLocaleString('id-ID')}</Text>}
        {!!booking.completed_at && <Text>Dikonfirmasi customer {new Date(booking.completed_at).toLocaleString('id-ID')}</Text>}
        {!!booking.issue_reported_at && <>
          <Text>{booking.issue_resolved_at || booking.status === 'completed' ? 'Riwayat kendala' : 'Kendala dilaporkan'} · {new Date(booking.issue_reported_at).toLocaleString('id-ID')}</Text>
          <Text>{booking.completion_issue}</Text>
          {!!booking.issue_resolution && <Text>{booking.issue_resolution}</Text>}
          {booking.status !== 'completed' && booking.completion_conversation_id != null && (
            <TouchableOpacity accessibilityRole="button" style={styles.acceptButton}
              onPress={() => openConversation(booking.completion_conversation_id!)}>
              <Text style={styles.acceptButtonText}>Chat pelanggan</Text>
            </TouchableOpacity>
          )}
        </>}
        {booking.status === 'confirmed' && (booking.can_mark_fulfilled ?
          <TouchableOpacity accessibilityRole="button" style={styles.acceptButton} disabled={processing !== null}
            onPress={() => Alert.alert(fulfillLabel, booking.demo_pickup ? 'Pastikan pesanan sudah siap diambil.' : 'Pastikan layanan sudah diberikan kepada pelanggan.', [
              { text: 'Batal', style: 'cancel' },
              { text: fulfillLabel, onPress: () => void markFulfilled() },
            ])}>
            <Text style={styles.acceptButtonText}>{processing === 'fulfill' ? 'Memproses…' : fulfillLabel}</Text>
          </TouchableOpacity> : <Text>Tandai selesai tersedia setelah jadwal layanan berakhir.</Text>)}
        {booking.status === 'pending' && <View style={styles.actionRow}>
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
        </View>}
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
