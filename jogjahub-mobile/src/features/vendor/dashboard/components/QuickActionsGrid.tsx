import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Action = {
  key: string;
  icon: string | React.ComponentType<any>;
  label: string;
  subtitle: string;
  iconBg: string;
  onPress: () => void;
};

export function QuickActionsGrid({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Pressable
            key={action.key}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={action.onPress}
          >
            <View
              style={[styles.iconWrap, { backgroundColor: action.iconBg }]}
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

  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
  },
});