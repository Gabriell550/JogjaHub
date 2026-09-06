import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

// Header khusus dashboard vendor: nama app + toggle "Buka/Tutup Toko". Ini BUKAN dekorasi —
// status ini yang menentukan apakah vendor masih bisa menerima booking baru dari customer.
// TODO: begitu vendorApi siap, ganti useState lokal ini dengan field `isOpen` dari
// vendorApi.getMyProfile(), dan panggil vendorApi.updateMyProfile({ isOpen }) tiap kali di-toggle.

export function VendorHeaderBar({ name }: { name?: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [query, setQuery] = useState('');

  return (
    <View style={styles.header}>
      {/* Kiri: avatar + greeting */}
      <View style={styles.left}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarEmoji}>✨</Text>
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Halo, {name ?? 'Vendor'}! 👋</Text>
          <Text style={styles.subtitle}>Siap menerima pesanan wisuda & pernikahan</Text>
        </View>
      </View>

      {/* Kanan: notifikasi + toggle */}
      <View style={styles.right}>
        <TouchableOpacity style={styles.notifBtn}>
          <Bell size={20} color={colors.onSurface} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
        <Pressable
          onPress={() => setIsOpen((v) => !v)}
          style={[styles.toggle, { backgroundColor: isOpen ? colors.primary : colors.onSurfaceVariant }]}
        >
          <View style={[styles.toggleDot, { backgroundColor: isOpen ? '#ffffff' : 'transparent' }]} />
          <Text style={styles.toggleText}>{isOpen ? 'BUKA' : 'TUTUP'}</Text>
        </Pressable>
      </View>

      {/* Search bar di bawah header */}
      <View style={styles.searchBar}>
        <Search size={18} color={colors.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Cari pesanan atau produk..."
          placeholderTextColor={colors.onSurfaceVariant}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grayPale,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.notificationRed,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  toggleDot: { width: 6, height: 6, borderRadius: radius.full },
  toggleText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    marginTop: 10,
    marginHorizontal: spacing.containerMargin,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurface,
    padding: 0,
    height: 20,
  },
});

