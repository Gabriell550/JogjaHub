import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { TenantPressable } from '../../components/TenantPressable';
import { dashboardStyles } from './tenantDashboardStyles';
import { TenantOrderCard } from './TenantOrderCard';

type Props = {
  orders: { id: string; title: string; buyerName: string; timeAgo: string; price: number }[];
  onPressOrder: (orderId: string) => void;
  onMarkAllViewed: () => void;
};

export function OrderNotificationCard({ orders, onPressOrder, onMarkAllViewed }: Props) {
  if (orders.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={dashboardStyles.headingRow}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={dashboardStyles.heading}>Pesanan Baru</Text>
          <Text accessibilityLabel={`${orders.length} pesanan belum dilihat`} style={styles.count}>{orders.length}</Text>
        </View>
        <TenantPressable accessibilityRole="button" style={dashboardStyles.link} onPress={onMarkAllViewed}>
          <Text style={dashboardStyles.linkText}>Tandai Dilihat</Text>
        </TenantPressable>
      </View>
      <Text style={dashboardStyles.sample}>Data contoh</Text>
      <View style={styles.list}>
        {orders.map(order => (
          <TenantOrderCard
            key={order.id}
            title={order.title}
            buyerName={order.buyerName}
            timeAgo={order.timeAgo}
            price={order.price}
            badgeLabel="TERBARU"
            onPress={() => onPressOrder(order.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.stackLg, gap: 4 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flexShrink: 1, gap: 8 },
  count: {
    ...typography.labelMd, color: colors.onPrimaryFixedVariant, backgroundColor: colors.primaryFixed,
    overflow: 'hidden', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, textAlign: 'center',
  },
  list: { gap: 8, marginTop: 4 },
});
