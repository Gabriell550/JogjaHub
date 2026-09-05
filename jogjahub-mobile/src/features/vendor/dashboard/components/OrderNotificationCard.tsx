import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Bell } from 'lucide-react-native';

type OrderType = {
  id: string;
  title: string;
  buyerName: string;
  timeAgo: string;
  price: number;
  status: 'pending' | 'confirmed';
};

type Props = {
  orders: OrderType[];
  onPressOrder: (orderId: string) => void;
  onMarkAllViewed: () => void;
};

export function OrderNotificationCard({ orders, onPressOrder, onMarkAllViewed }: Props) {
  if (orders.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.bellWrapper}>
            <Bell size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Pesanan Baru</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.badge}>{orders.length}</Text>
          <TouchableOpacity onPress={onMarkAllViewed} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tandai Dilihat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ordersList}>
        {orders.map((order) => (
          <TouchableOpacity key={order.id} onPress={() => onPressOrder(order.id)} style={styles.orderCard}>
            <View style={styles.thumbnail} />
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{order.title}</Text>
                <View style={styles.badgeNew}>
                  <Text style={styles.badgeNewText}>TERBARU</Text>
                </View>
              </View>
              <Text style={styles.buyer}>{order.buyerName} • {order.timeAgo}</Text>
              <Text style={styles.price}>Rp{order.price.toLocaleString('id-ID')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.primaryFixed,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.stackMd,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  bellWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  markAllButton: {
    paddingHorizontal: spacing.stackSm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  markAllText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  ordersList: {
    gap: spacing.stackSm,
  },
  orderCard: {
    flexDirection: 'row',
    gap: spacing.stackMd,
    paddingVertical: spacing.stackSm,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryContainer,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  title: {
    flexShrink: 1,
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  badgeNew: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
  },
  badgeNewText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 9,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
  buyer: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 3,
  },
  price: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
});