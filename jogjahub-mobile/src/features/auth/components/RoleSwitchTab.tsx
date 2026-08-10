import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../../constants/theme';

export type AuthRole = 'customer' | 'vendor'; // sesuai UserRole enum backend ('customer' | 'vendor' | 'admin')

type Props = {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
};

// Tab pill untuk pilih "Login/Daftar sebagai Customer" atau "Vendor".
// Dipakai bareng di LoginScreen dan kedua RegisterScreen supaya konsisten.
export default function RoleSwitchTab({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable style={[styles.tab, value === 'customer' && styles.tabActive]} onPress={() => onChange('customer')}>
        <Text style={[styles.label, value === 'customer' && styles.labelActive]}>Customer</Text>
      </Pressable>
      <Pressable style={[styles.tab, value === 'vendor' && styles.tabActive]} onPress={() => onChange('vendor')}>
        <Text style={[styles.label, value === 'vendor' && styles.labelActive]}>Tenant</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primaryContainer },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 14,
    color: colors.onSecondaryContainer,
    fontWeight: '600',
  },
  labelActive: { color: colors.onPrimary },
});
