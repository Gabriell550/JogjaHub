import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Search, Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

export function VendorHeaderBar({ name }: { name?: string }) {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.container}>
        {/* Search bar di sebelah kiri (memenuhi sisa ruang) */}
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

        {/* Tombol Notifikasi & Profil di samping pencarian */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Bell size={20} color={colors.onSurface} />
            <View style={styles.notifDot} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <User size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
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
});