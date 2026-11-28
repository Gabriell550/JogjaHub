import React, { useId } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { typography } from '../../../../constants/theme';
import { tenantLayout } from '../../../../constants/theme/tenant';
import { TenantPressable } from '../../components/TenantPressable';

export type QuickActionItem = {
  key: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  iconBg: string;
  iconGradientEnd?: string;
  onPress: () => void;
  disabled?: boolean;
};

export function QuickActionsGrid({ actions }: { actions: QuickActionItem[] }) {
  const { width, fontScale } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const twoColumns = width - left - right < 320 || fontScale > tenantLayout.largeFontScale;
  const rows = twoColumns ? [actions.slice(0, 2), actions.slice(2)] : [actions];
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <View style={styles.grid}>
      {rows.filter(row => row.length > 0).map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map(({ key, icon: Icon, label, iconBg, iconGradientEnd, onPress, disabled }) => {
            const gradId = `qa-${baseId}-${key}`;
            const startColor = disabled ? '#CBD5E1' : iconBg;
            const endColor = disabled ? '#94A3B8' : (iconGradientEnd ?? iconBg);
            return (
              <TenantPressable
                key={key}
                style={styles.tile}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={onPress}
              >
                <View aria-hidden style={[styles.iconBox, { shadowColor: startColor }]}>
                  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
                    <Defs>
                      <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={startColor} />
                        <Stop offset="100%" stopColor={endColor} />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" rx={16} ry={16} fill={`url(#${gradId})`} />
                  </Svg>
                  <Icon size={22} color="#FFFFFF" />
                </View>
                <Text style={[styles.label, disabled && styles.disabledLabel]} numberOfLines={2}>
                  {label}
                </Text>
              </TenantPressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    minHeight: 92,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
  },
  disabledLabel: { color: '#94A3B8' },
});
