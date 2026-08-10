import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius } from '../../constants/theme';

export function Input({ style, ...rest }: TextInputProps) {
  return <TextInput style={[styles.input, style]} placeholderTextColor={colors.outline} {...rest} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: radius.DEFAULT,
    padding: 10,
    color: colors.onSurface,
  },
});
