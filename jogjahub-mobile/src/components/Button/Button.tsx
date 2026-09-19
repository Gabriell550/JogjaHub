import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, typography } from '../../constants/theme';

type Props = { label: string; onPress: () => void; disabled?: boolean };
type Props = { 
  label: string; 
  onPress: () => void; 
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, disabled }: Props) {
export function Button({ label, onPress, disabled, loading, style }: Props) {
  return (
    <Pressable style={[styles.base, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.label}>{label}</Text>
    <Pressable 
      style={({ pressed }) => [
        styles.base, 
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style
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
    paddingVertical: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.DEFAULT, // 8px, sesuai "Standard Components" di DESIGN.md
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabled: { opacity: 0.5 },
  pressed: {
    opacity: 0.8,
  },
  disabled: { 
    opacity: 0.5,
    backgroundColor: colors.outlineVariant,
  },
  label: {
    color: colors.onPrimary,
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
});
