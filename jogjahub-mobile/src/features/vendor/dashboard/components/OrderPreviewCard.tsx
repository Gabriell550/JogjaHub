import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Package, Clock } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  title: string;
  badgeLabel: 'TERBARU' | 'DIPROSES';
  buyerName: string;
  timeAgo: string;
  price: number;
  icon?: React.ComponentType<any>;
};

export function OrderPreviewCard({ title, badgeLabel, buyerName, timeAgo, price, icon: Icon }: Props) {
  const isProcessing = badgeLabel === 'DIPROSES';

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        {Icon ? <Icon size={22} color={colors.onSurfaceVariant} /> : <Package size={22} color={colors.onSurfaceVariant} />}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Pressable style={[styles.badge, isProcessing ? styles.badgeProcessing : styles.badgeNew]}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </Pressable>
        </View>
        <Text style={styles.buyerTime}>
          <Text style={styles.buyer}>{buyerName}</Text>
          <Text style={styles.dot}> • </Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </Text>
        <Text style={styles.price}>Rp{price.toLocaleString('id-ID')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: 14,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.grayPale,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: {
    flexShrink: 1,
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  badgeNew: { backgroundColor: colors.primaryContainer },
  badgeProcessing: { backgroundColor: '#DBEAFE' },
  badgeText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  buyerTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  buyer: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant },
  dot: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant },
  time: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant },
  price: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
});
