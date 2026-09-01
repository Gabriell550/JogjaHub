import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { useLogout } from '../../../auth/hooks/useLogout';
import type { RootState } from '../../../../store';

export default function VendorProfileScreen() {
  const navigation = useNavigation();
  const { handleLogout } = useLogout();
  const user = useSelector((state: RootState) => state.auth?.user);
  const businessName = useSelector((state: RootState) => (state.auth as any)?.businessName);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{businessName || user?.name || 'Vendor'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Pressable style={styles.menuItem} onPress={() => navigation.getParent()?.navigate('EditBusinessProfile' as never)}>
        <Text style={styles.menuLabel}>Lengkapi / Edit Profil Bisnis</Text>
        <Text style={styles.menuArrow}>›</Text>
      </Pressable>

      <Pressable style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
        <Text style={[styles.menuLabel, styles.logoutLabel]}>Keluar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface, padding: spacing.containerMargin, paddingTop: 60 },
  title: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
    marginBottom: spacing.stackLg,
  },
  card: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.lg,
    padding: spacing.stackLg,
    marginBottom: spacing.stackLg,
  },
  name: { fontFamily: typography.titleMd.fontFamily, fontSize: 17, fontWeight: '700', color: colors.onSecondaryContainer },
  email: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSecondaryContainer, marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    marginBottom: spacing.stackSm,
  },
  menuLabel: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface, fontWeight: '600' },
  menuArrow: { fontSize: 18, color: colors.onSurfaceVariant },
  logoutItem: { marginTop: spacing.stackLg, borderWidth: 1, borderColor: colors.error, backgroundColor: 'transparent' },
  logoutLabel: { color: colors.error },
});
