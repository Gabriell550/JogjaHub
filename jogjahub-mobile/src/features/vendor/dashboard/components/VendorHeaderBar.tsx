import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

// Header khusus dashboard vendor: nama app + toggle "Buka/Tutup Toko". Ini BUKAN dekorasi —
// status ini yang menentukan apakah vendor masih bisa menerima booking baru dari customer.
// TODO: begitu vendorApi siap, ganti useState lokal ini dengan field `isOpen` dari
// vendorApi.getMyProfile(), dan panggil vendorApi.updateMyProfile({ isOpen }) tiap kali di-toggle.

export function VendorHeaderBar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <View style={styles.bar}>
      <Text style={styles.title}>JogjaHub Tenant</Text>
      <Pressable
        onPress={() => setIsOpen((v) => !v)}
        style={[styles.toggle, { backgroundColor: isOpen ? colors.primaryContainer : colors.onSurfaceVariant }]}
      >
        <View style={styles.toggleDot} />
        <Text style={styles.toggleText}>{isOpen ? 'BUKA' : 'TUTUP'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inverseSurface,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 20,
    paddingBottom: spacing.stackMd,
  },
  title: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 20,
    fontWeight: '600',
    color: colors.inverseOnSurface,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleDot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: '#ffffff' },
  toggleText: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, fontWeight: '700', color: '#ffffff' },
});

