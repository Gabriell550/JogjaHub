import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantColors } from '../../../../constants/theme/tenant';
import { RevenueAreaChart, revenueChartHeight } from '../../components/RevenueAreaChart';
import { TenantPressable } from '../../components/TenantPressable';
import { useStatCardMotion } from '../../components/useStatCardMotion';

type Props<Period extends string> = {
  periods: readonly { key: Period; label: string }[];
  period: Period;
  onChangePeriod: (period: Period) => void;
  label: string;
  periodLabel?: string;
  value: number;
  change: number | null;
  values: readonly number[];
  formatValue: (value: number) => string;
  active: boolean;
};

const percent = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatChange = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${percent.format(rounded || 0)}%`;
};

export function StatCard<Period extends string>({
  periods, period, onChangePeriod, label, periodLabel, value, change, values, formatValue, active,
}: Props<Period>) {
  const [selectorWidth, setSelectorWidth] = useState(0);
  const selectedIndex = Math.max(0, periods.findIndex(item => item.key === period));
  const frame = useStatCardMotion(values, active, { revenue: value, change: change ?? 0, selectedIndex });
  const slotWidth = selectorWidth / Math.max(1, periods.length);
  const comparison = change === null ? '' : `. ${formatChange(change)} dibanding periode sebelumnya`;
  const range = periods[selectedIndex]?.label ?? 'periode ini';
  const falling = frame.change < -0.05;

  return (
    <View style={styles.card}>
      <View
        accessible
        accessibilityLabel={`${label} ${periodLabel ?? range}, ${formatValue(value)}${comparison}`}
        style={styles.metrics}
      >
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          {change !== null && (
            <View style={styles.comparison}>
              <Text style={[styles.delta, falling && styles.deltaNegative]}>{formatChange(frame.change)}</Text>
              <Text style={styles.comparisonLabel}>vs periode sebelumnya</Text>
            </View>
          )}
        </View>
        <Text style={styles.revenue}>{formatValue(frame.revenue)}</Text>
        {periodLabel && (
          <View style={styles.periodContext}>
            <CalendarDays size={14} color={colors.primary} />
            <Text style={styles.periodContextText}>{periodLabel}</Text>
          </View>
        )}
      </View>

      {values.length > 0 ? (
        <RevenueAreaChart points={frame.points} />
      ) : (
        <View style={styles.rangeTrack}>
          <View style={styles.rangeFill} />
          <View style={styles.rangeKnob} />
        </View>
      )}

      <View style={styles.track}>
        <View style={styles.periods} onLayout={event => setSelectorWidth(event.nativeEvent.layout.width)}>
          {selectorWidth > 0 && periods.length > 0 && (
            <View aria-hidden pointerEvents="none" style={[styles.indicator, {
              width: slotWidth,
              transform: [{ translateX: frame.indicator * slotWidth }],
            }]} />
          )}
          {periods.map(item => (
            <TenantPressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: item.key === period }}
              onPress={() => onChangePeriod(item.key)}
              focusRadius={radius.full}
              style={styles.period}
            >
              <Text style={[styles.periodLabel, item.key === period && styles.periodSelected]}>
                {item.label}
              </Text>
            </TenantPressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    padding: 20,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 2,
  },
  metrics: { gap: 4 },
  periodContext: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm, backgroundColor: '#FFF7ED',
  },
  periodContextText: { flexShrink: 1, color: colors.primary, fontSize: 12, fontWeight: '600' },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  label: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  revenue: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  comparison: { alignItems: 'flex-end', maxWidth: '100%', gap: 4 },
  delta: {
    ...typography.labelSm,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.8)',
    fontVariant: ['tabular-nums'],
    borderRadius: radius.full,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: '800',
  },
  deltaNegative: {
    color: '#E11D48',
    backgroundColor: '#FFF1F2',
    borderColor: 'rgba(254, 205, 211, 0.8)',
  },
  comparisonLabel: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: '#94A3B8',
  },
  emptyChart: { minHeight: revenueChartHeight, justifyContent: 'center' },
  rangeTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    justifyContent: 'center',
    marginVertical: 4,
  },
  rangeFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
    backgroundColor: 'rgba(251, 146, 60, 0.35)',
  },
  rangeKnob: {
    position: 'absolute',
    right: 0,
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: '#EA580C',
    borderWidth: 3,
    borderColor: '#FFEDD5',
  },
  track: {
    padding: 5,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  periods: { flexDirection: 'row' },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#EA580C',
    borderRadius: 12,
  },
  period: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 12,
  },
  periodLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  periodSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
