import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../constants/theme';

type Props = {
  label: string;
  fileName?: string | null;
  onPress: () => void;
};

// Kotak upload dokumen generik — dipakai untuk KTP & Surat Badan Usaha di RegisterVendorScreen,
// dan bisa dipakai ulang di features/vendor/onboarding untuk dokumen lain nanti.
// Belum terhubung ke image/document picker asli — lihat TODO di dalam onPress pemanggilnya.
export function FileUploadField({ label, fileName, onPress }: Props) {
  return (
    <Pressable style={styles.box} onPress={onPress}>
      <Text style={styles.icon}>📎</Text>
      <Text style={styles.text} numberOfLines={1}>
        {fileName ? fileName : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    borderRadius: radius.DEFAULT,
    padding: 12,
    gap: 8,
  },
  icon: { fontSize: 16 },
  text: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, flexShrink: 1 },
});
