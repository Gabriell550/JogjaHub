import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { useRegister } from '../hooks/useRegister';
import Toast from 'react-native-toast-message';

export default function RegisterCustomerScreen() {
  const navigation = useNavigation();
  const { registerCustomer, loading, error } = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password tidak cocok',
        text2: 'Password dan konfirmasi password harus sama.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    const result = await registerCustomer({ name, email, password, passwordConfirmation: confirmPassword, phone });
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Akun customer berhasil dibuat. Silakan login.',
        position: 'top',
        visibilityTime: 2500,
      });
      navigation.goBack();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Registrasi Gagal',
        text2: result.message,
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backText}>{'← Kembali ke Login'}</Text>
      </Pressable>

      <Text style={styles.title}>Daftar sebagai Customer</Text>

      <Input placeholder="Nama Lengkap" value={name} onChangeText={setName} style={styles.inputSpacing} />
      <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.inputSpacing} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.inputSpacing} />
      <Input placeholder="Konfirmasi Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.inputSpacing} />
      <Input placeholder="Nomor HP" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.inputSpacing} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label={loading ? 'Memproses...' : 'Sign Up'} onPress={handleRegister} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60, paddingBottom: spacing.sectionGap },
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
  errorText: { color: colors.error, fontFamily: typography.bodyMd.fontFamily, fontSize: 13, marginBottom: spacing.stackMd },
});