import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

type Props = { label: string; onPress: () => void; disabled?: boolean };

export function Button({ label, onPress, disabled }: Props) {
  return (
    <Pressable style={[styles.base, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  label: { color: '#fff', fontWeight: '600' },
});
