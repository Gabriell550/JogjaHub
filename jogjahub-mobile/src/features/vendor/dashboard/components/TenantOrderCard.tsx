import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../constants/theme';
import { TenantPressable } from '../../components/TenantPressable';
import { dashboardStyles } from './tenantDashboardStyles';

type Props = {
  title: string;
  badgeLabel: 'TERBARU' | 'DIPROSES' | 'MENUNGGU SELESAI' | 'SELESAI';
  buyerName: string;
  timeAgo: string;
  price: number;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  onPress?: () => void;
};

export function TenantOrderCard({ title, badgeLabel, buyerName, timeAgo, price, icon: Icon = Package, onPress }: Props) {
  const isProcessing = badgeLabel !== 'TERBARU';
  const formattedPrice = `Rp${price.toLocaleString('id-ID')}`;
  const content = (
    <>
      <View aria-hidden style={styles.icon}>
        <Icon size={22} color="#EA580C" />
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

  return (
    <View style={styles.outer}>
      {onPress ? (
        <TenantPressable
          accessibilityRole="button"
          accessibilityLabel={`${title}, ${badgeLabel}, ${buyerName}, ${timeAgo}, ${formattedPrice}`}
          onPress={onPress}
          style={styles.card}
        >
          {content}
        </TenantPressable>
      ) : <View style={styles.card}>{content}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: 'rgba(254, 215, 170, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  badge: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    borderRadius: radius.full,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  processing: {
    backgroundColor: '#F0F9FF',
    color: '#0369A1',
    borderColor: 'rgba(186, 230, 253, 0.85)',
  },
  latest: {
    backgroundColor: '#FFF7ED',
    color: '#C2410C',
    borderColor: 'rgba(254, 215, 170, 0.85)',
  },
  metadata: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  price: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
    marginTop: 2,
  },
});
