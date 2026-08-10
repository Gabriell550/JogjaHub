import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';

// FR-01: form registrasi customer.
export default function RegisterCustomerScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = () => {
    // TODO: panggil useRegister() -> authApi.registerCustomer({ email, password, phone })
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backText}>{'← Kembali ke Login'}</Text>
      </Pressable>

      <Text style={styles.title}>Daftar sebagai Customer</Text>

      <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.inputSpacing} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.inputSpacing} />
      <Input placeholder="Konfirmasi Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.inputSpacing} />
      <Input placeholder="Nomor HP" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.inputSpacing} />

      <Button label="Sign Up" onPress={handleRegister} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60 },
  backRow: { marginBottom: spacing.stackLg },
  backText: { color: colors.onSurfaceVariant, fontFamily: typography.bodyMd.fontFamily, fontSize: typography.bodyMd.fontSize },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: typography.headlineLg.fontWeight,
    color: colors.onSurface,
    marginBottom: spacing.stackLg,
  },
  inputSpacing: { marginBottom: spacing.stackSm },
});
