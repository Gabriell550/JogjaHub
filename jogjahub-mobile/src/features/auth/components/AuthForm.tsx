import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { colors, spacing, typography } from '../../../constants/theme';
import { useLogin } from '../hooks/useLogin';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();

  const handleSubmit = () => {
    if (!email.trim() || !password) return;
    login({ email: email.trim(), password });
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <Input
          placeholder="nama@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <Input
          placeholder="Masukkan password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label={loading ? 'Memuat...' : 'Masuk'} onPress={handleSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.stackLg,
  },
  field: {
    gap: spacing.stackSm,
  },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.onSurfaceVariant,
  },
  error: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: typography.bodyMd.fontWeight,
    color: colors.error,
  },
});
