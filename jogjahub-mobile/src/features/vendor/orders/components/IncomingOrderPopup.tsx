import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantColors } from '../../../../constants/theme/tenant';
import { bookingLabel, type BookingRecord } from '../../../../types/bookingRecord';
import { TenantPressable } from '../../components/TenantPressable';

export function IncomingOrderPopup({ orders, onClose, onOpen }: {
  orders: BookingRecord[];
  onClose: () => void;
  onOpen: (id?: string) => void;
}) {
  const order = orders[0];
  const multiple = orders.length > 1;
  return (
    <Modal transparent visible={!!order} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.card}>
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            <View style={styles.icon} aria-hidden><ClipboardList size={26} color={colors.primary} /></View>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>
              {multiple ? orders.length + ' pesanan baru masuk' : 'Pesanan baru masuk'}
            </Text>
            {!!order && !multiple && (
              <View style={styles.details}>
                <Text style={styles.code}>{bookingLabel(order)}</Text>
                <Text style={styles.service}>{order.service?.name ?? 'Layanan JogjaHub'}</Text>
                <Text style={styles.customer}>{order.customer?.name ?? 'Pelanggan'}</Text>
              </View>
            )}
            <TenantPressable accessibilityRole="button" style={styles.open} onPress={() => onOpen(multiple ? undefined : order?.uuid)}>
              <Text style={styles.openText}>{multiple ? 'Lihat pesanan masuk' : 'Lihat detail pesanan'}</Text>
            </TenantPressable>
            <TenantPressable accessibilityRole="button" style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>Nanti</Text>
            </TenantPressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(18,28,42,0.58)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, maxHeight: '85%', borderRadius: radius.xl, backgroundColor: colors.surfaceContainerLowest },
  content: { padding: 22, gap: spacing.stackMd },
  icon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryFixed },
  title: { ...typography.headlineLgMobile, color: colors.navy },
  details: { padding: 14, gap: 4, borderRadius: radius.lg, backgroundColor: tenantColors.canvas, borderWidth: 1, borderColor: tenantColors.border },
  code: { ...typography.labelMd, color: colors.primary },
  service: { ...typography.titleMd, color: colors.navy },
  customer: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  open: { alignItems: 'center', padding: 10, borderRadius: radius.full, backgroundColor: colors.primaryContainer },
  openText: { ...typography.labelLg, color: colors.onPrimaryFixed, textAlign: 'center' },
  close: { alignItems: 'center', padding: 10, borderRadius: radius.full, borderWidth: 1, borderColor: tenantColors.border },
  closeText: { ...typography.labelLg, color: colors.navy, textAlign: 'center' },
});
