import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radius } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import AuthHeader from '../components/AuthHeader';
import RoleSwitchTab, { AuthRole } from '../components/RoleSwitchTab';
import type { AuthStackParamList } from '../../../navigation/types';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// FR-02: login pakai email & password. Role dipilih user sendiri lewat RoleSwitchTab,
// nanti dikirim bareng payload login supaya backend tahu mau login sebagai customer/vendor.
export default function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const [role, setRole] = useState<AuthRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: panggil useLogin() -> authApi.login({ email, password, role })
  };

  const goToRegister = () => {
    navigation.navigate(role === 'customer' ? 'RegisterCustomer' : 'RegisterVendor');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <AuthHeader title="Hello!" subtitle="Selamat datang di JogjaHub" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Login</Text>

        <RoleSwitchTab value={role} onChange={setRole} />

        <Input
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.inputSpacing}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.inputSpacing}
        />

        <Pressable style={styles.forgotWrap}>
          <Text style={styles.forgotText}>Lupa Password?</Text>
        </Pressable>

        <Button label={`Login sebagai ${role === 'customer' ? 'Customer' : 'Tenant'}`} onPress={handleLogin} />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Belum punya akun? </Text>
          <Pressable onPress={goToRegister}>
            <Text style={styles.footerLink}>Daftar</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.sectionGap },
  card: {
    marginTop: -40,
    marginHorizontal: spacing.containerMargin,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.stackLg,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: typography.headlineLg.fontWeight,
    color: colors.onSurface,
    marginBottom: spacing.stackMd,
  },
  inputSpacing: { marginBottom: spacing.stackSm },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: spacing.stackMd },
  forgotText: { color: colors.primary, fontFamily: typography.labelMd.fontFamily, fontSize: 13 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.stackLg },
  footerText: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
  },
  footerLink: {
    color: colors.primary,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '700',
  },
});
