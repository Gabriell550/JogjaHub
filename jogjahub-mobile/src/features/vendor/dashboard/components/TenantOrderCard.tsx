import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../constants/theme';
import { TenantPressable } from '../../components/TenantPressable';
import { dashboardStyles } from './tenantDashboardStyles';

type Props = {
  title: string;
  badgeLabel: 'TERBARU' | 'DIPROSES';
  buyerName: string;
  timeAgo: string;
  price: number;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  onPress?: () => void;
};

export function TenantOrderCard({ title, badgeLabel, buyerName, timeAgo, price, icon: Icon = Package, onPress }: Props) {
  const isProcessing = badgeLabel === 'DIPROSES';
  const formattedPrice = `Rp${price.toLocaleString('id-ID')}`;
  const style = [dashboardStyles.card, styles.card];
  const content = (
    <>
      <View aria-hidden style={styles.icon}>
        <Icon size={20} color={colors.onSurfaceVariant} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.badge, isProcessing ? styles.processing : styles.latest]}>{badgeLabel}</Text>
        </View>
        <Text style={styles.metadata}>{buyerName} • {timeAgo}</Text>
        <Text style={styles.price}>{formattedPrice}</Text>
      </View>
    </>
  );

  return onPress ? (
    <TenantPressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${badgeLabel}, ${buyerName}, ${timeAgo}, ${formattedPrice}`}
      onPress={onPress}
      style={style}
    >
      {content}
    </TenantPressable>
  ) : <View style={style}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12 },
  icon: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.grayPale,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  title: { ...typography.bodyMd, color: colors.onSurface, flexShrink: 1 },
  badge: {
    ...typography.labelSm, borderRadius: radius.full, overflow: 'hidden', maxWidth: '100%',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  processing: { backgroundColor: colors.tertiaryFixed, color: colors.onTertiaryFixedVariant },
  latest: { backgroundColor: colors.primaryFixed, color: colors.onPrimaryFixedVariant },
  metadata: { ...typography.bodySm, color: colors.onSurfaceVariant },
  price: { ...typography.labelMd, color: colors.primary },
});
