import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Action = {
  key: string;
  icon: string;
  label: string;
  subtitle: string;
  iconBg: string;
  onPress: () => void;
};

export function QuickActionsGrid({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={action.onPress}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
            <Text style={styles.icon}>{action.icon}</Text>
          </View>
          <Text style={styles.label}>{action.label}</Text>
          <Text style={styles.subtitle}>{action.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.stackSm },
  card: {
    width: '47%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    elevation: 1,
  },
  cardPressed: { backgroundColor: colors.surfaceContainerHigh },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.stackSm,
  },
  icon: { fontSize: 16 },
  label: { fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  subtitle: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
});
