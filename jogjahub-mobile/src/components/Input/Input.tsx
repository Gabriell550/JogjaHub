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

export function Input({ style, error, label, leftIcon, isPassword, ...rest }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.outline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />

        {isPassword ? (
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
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 12,
    color: colors.onSurface,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
  },
  eyeIcon: {
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.error,
    fontFamily: typography.labelMd.fontFamily,
  },
});