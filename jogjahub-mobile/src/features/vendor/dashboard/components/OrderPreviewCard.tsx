import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  title: string;
  badgeLabel: 'TERBARU' | 'DIPROSES';
  buyerName: string;
  timeAgo: string;
  price: number;
};

export function OrderPreviewCard({ title, badgeLabel, buyerName, timeAgo, price }: Props) {
  const badgeStyle = badgeLabel === 'TERBARU' ? styles.badgeNew : styles.badgeProcessing;
  return (
    <View style={styles.card}>
      <View style={styles.thumbnail} />
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={[styles.badge, badgeStyle]}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        </View>
        <Text style={styles.buyer}>{buyerName} • {timeAgo}</Text>
        <Text style={styles.price}>Rp{price.toLocaleString('id-ID')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    elevation: 1,
  },
  thumbnail: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.secondaryContainer },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1, fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: radius.full },
  badgeNew: { backgroundColor: colors.primaryContainer },
  badgeProcessing: { backgroundColor: colors.tertiaryContainer },
  badgeText: { fontFamily: typography.labelMd.fontFamily, fontSize: 9, fontWeight: '700', color: colors.onPrimary },
  buyer: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 3 },
  price: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 4 },
});
