import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, typography } from '../../constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
};

export function Button({ label, onPress, disabled, loading, style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primaryContainer, // Bright Orange, sesuai DESIGN.md
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.DEFAULT, // 8px, sesuai "Standard Components" di DESIGN.md
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: colors.outlineVariant,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.onPrimary,
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
});