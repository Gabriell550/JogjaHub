import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Action = {
  key: string;
  icon: string | React.ComponentType<any>;
  label: string;
  subtitle?: string;
  iconBg: string;
  onPress?: () => void;
};

export function QuickActionsGrid({ actions, columns }: { actions: Action[]; columns?: 2 | 4 }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Pressable
            key={action.key}
            style={({ pressed }) => [
              styles.card,
              columns && { width: columns === 2 ? '48%' : '23%', elevation: 0, padding: 8, minHeight: 80 },
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !action.onPress }}
            disabled={!action.onPress}
            onPress={action.onPress}
          >
            <View
              style={[styles.iconWrap, columns && styles.compactIcon, { backgroundColor: action.iconBg }]}
            >
              {typeof action.icon === 'string' ? (
                <Text style={styles.icon}>{action.icon}</Text>
              ) : (
                <Icon size={22} color={colors.onSurface} />
              )}
            </View>

            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.stackSm,
  },

  card: {
    width: '23%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackSm,
    paddingTop: 14,
    elevation: 1,
    alignItems: 'center',
    minHeight: 88,
  },

  cardPressed: {
    backgroundColor: colors.surfaceContainerHigh,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  compactIcon: { width: 40, height: 40 },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
  },


  icon: {
    fontSize: 22,
  },
});