import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../constants/theme';

type Props = { label: string; onPress: () => void; disabled?: boolean };

export function Button({ label, onPress, disabled }: Props) {
  return (
    <Pressable style={[styles.base, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primaryContainer, // Bright Orange, sesuai DESIGN.md
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.DEFAULT, // 8px, sesuai "Standard Components" di DESIGN.md
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  label: {
    color: colors.onPrimary,
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
});
