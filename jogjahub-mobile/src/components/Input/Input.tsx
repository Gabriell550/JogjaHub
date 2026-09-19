import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text, Pressable } from 'react-native';
import { colors, radius, typography } from '../../constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';

type InputProps = TextInputProps & {
  error?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
};

export function Input({ style, error, ...rest }: InputProps) {
export function Input({ style, error, label, leftIcon, isPassword, ...rest }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.outline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />
        {isPassword && (
          <Pressable 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={12}
          >
            {showPassword ? (
              <EyeOff color={colors.outline} size={20} />
            ) : (
              <Eye color={colors.outline} size={20} />
            )}
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onSurface,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerLowest,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: colors.primaryContainer,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorContainer,
  },
  iconContainer: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    padding: 10,
    paddingHorizontal: 12,
    color: colors.onSurface,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
  },
  eyeIcon: {
    paddingRight: 12,
  },
  errorText: {
    fontSize: 11,
    marginTop: 2,
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: typography.labelMd.fontFamily,
  },
});
