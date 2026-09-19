import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { useRegister } from '../hooks/useRegister';
import Toast from 'react-native-toast-message';
import { User, Mail, Lock, Phone, ArrowLeft } from 'lucide-react-native';

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
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.title}>Daftar Customer</Text>
          <Text style={styles.subtitle}>Buat akun untuk mulai mencari layanan wisuda terbaik di Jogja</Text>
        </View>

      <Text style={styles.title}>Daftar sebagai Customer</Text>
        <Input 
          label="Nama Lengkap" 
          placeholder="Masukkan nama Anda" 
          value={name} 
          onChangeText={setName} 
          leftIcon={<User size={20} color={colors.outline} />}
        />
        
        <Input 
          label="Email" 
          placeholder="Masukkan email" 
          keyboardType="email-address" 
          autoCapitalize="none" 
          value={email} 
          onChangeText={setEmail} 
          leftIcon={<Mail size={20} color={colors.outline} />}
        />
        
        <Input 
          label="Nomor HP" 
          placeholder="Masukkan nomor HP aktif" 
          keyboardType="phone-pad" 
          value={phone} 
          onChangeText={setPhone} 
          leftIcon={<Phone size={20} color={colors.outline} />}
        />
        
        <Input 
          label="Password" 
          placeholder="Buat password (min. 8 karakter)" 
          isPassword 
          value={password} 
          onChangeText={setPassword} 
          leftIcon={<Lock size={20} color={colors.outline} />}
        />
        
        <Input 
          label="Konfirmasi Password" 
          placeholder="Ulangi password Anda" 
          isPassword 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
          leftIcon={<Lock size={20} color={colors.outline} />}
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Input placeholder="Nama Lengkap" value={name} onChangeText={setName} style={styles.inputSpacing} />
      <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.inputSpacing} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.inputSpacing} />
      <Input placeholder="Konfirmasi Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.inputSpacing} />
      <Input placeholder="Nomor HP" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.inputSpacing} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label={loading ? 'Memproses...' : 'Sign Up'} onPress={handleRegister} disabled={loading} />
    </ScrollView>
        <View style={styles.footerSpacing}>
          <Button label="Daftar Sekarang" onPress={handleRegister} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60, paddingBottom: spacing.sectionGap },
  backRow: { marginBottom: spacing.stackLg },
  backText: { color: colors.onSurfaceVariant, fontFamily: typography.bodyMd.fontFamily, fontSize: typography.bodyMd.fontSize },
  header: { marginBottom: spacing.stackXl },
  backBtn: { marginBottom: spacing.stackLg },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: typography.headlineLg.fontWeight,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: spacing.stackLg,
    marginBottom: 8,
  },
  inputSpacing: { marginBottom: spacing.stackSm },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  errorText: { color: colors.error, fontFamily: typography.bodyMd.fontFamily, fontSize: 13, marginBottom: spacing.stackMd },
  footerSpacing: { marginTop: spacing.stackLg },
});