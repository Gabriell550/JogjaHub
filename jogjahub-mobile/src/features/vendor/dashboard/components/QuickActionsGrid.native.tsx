import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../../../../constants/theme';
import { tenantLayout } from '../../../../constants/theme/tenant';
import { TenantPressable } from '../../components/TenantPressable';
import { dashboardStyles } from './tenantDashboardStyles';

type Action = {
  key: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  iconBg: string;
  onPress: () => void;
  disabled?: boolean;
};

export function QuickActionsGrid({ actions }: { actions: Action[] }) {
  const { width, fontScale } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const twoColumns = width - left - right < tenantLayout.narrowWidth || fontScale > tenantLayout.largeFontScale;
  const rows = twoColumns ? [actions.slice(0, 2), actions.slice(2)] : [actions];

  return (
    <View style={styles.grid}>
      {rows.filter(row => row.length > 0).map(row => (
        <View key={row[0].key} style={styles.row}>
          {row.map(({ key, icon: Icon, label, iconBg, onPress, disabled }) => (
            <TenantPressable
              key={key}
              style={[dashboardStyles.card, styles.tile]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={onPress}
            >
              <View aria-hidden style={[styles.icon, { backgroundColor: disabled ? colors.grayPale : iconBg }]}>
                <Icon size={20} color={disabled ? colors.onSurfaceVariant : colors.onSurface} />
              </View>
              <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
            </TenantPressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minHeight: 80, padding: 8, alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.labelMd, color: colors.onSurface, textAlign: 'center' },
  disabledLabel: { color: colors.onSurfaceVariant },
});
