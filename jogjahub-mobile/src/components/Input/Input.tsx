import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import { colors, radius, typography } from '../../constants/theme';

type InputProps = TextInputProps & {
  error?: string;
};

export function Input({ style, error, ...rest }: InputProps) {
  return (
    <>
      <TextInput
        style={[
          styles.input,
          error && { borderColor: colors.error, backgroundColor: '#FEF2F2' },
          style,
        ]}
        placeholderTextColor={colors.outline}
        {...rest}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: radius.DEFAULT,
    padding: 10,
    color: colors.onSurface,
  },
  errorText: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.labelMd.fontFamily,
  },
});
