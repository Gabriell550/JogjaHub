import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, typography, radius } from '../../constants/theme';
import { UploadCloud, FileText, X } from 'lucide-react-native';

type Props = {
  label: string;
  fileName?: string | null;
  onPress: () => void;
  onRemove?: () => void;
};

// Kotak upload dokumen generik — dipakai untuk KTP & Surat Badan Usaha di RegisterVendorScreen,
// dan bisa dipakai ulang di features/vendor/onboarding untuk dokumen lain nanti.
// Belum terhubung ke image/document picker asli — lihat TODO di dalam onPress pemanggilnya.
export function FileUploadField({ label, fileName, onPress }: Props) {
export function FileUploadField({ label, fileName, onPress, onRemove }: Props) {
  if (fileName) {
    return (
      <View style={styles.filledBox}>
        <View style={styles.fileInfo}>
          <View style={styles.iconCircle}>
            <FileText size={20} color={colors.primaryContainer} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.filledLabel}>{label}</Text>
            <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
          </View>
        </View>
        {onRemove && (
          <Pressable onPress={onRemove} hitSlop={12} style={styles.removeBtn}>
            <X size={18} color={colors.error} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Pressable style={styles.box} onPress={onPress}>
      <Text style={styles.icon}>📎</Text>
      <Text style={styles.text} numberOfLines={1}>
        {fileName ? fileName : label}
      </Text>
    <Pressable style={({pressed}) => [styles.box, pressed && styles.boxPressed]} onPress={onPress}>
      <View style={styles.uploadIconCircle}>
        <UploadCloud size={24} color={colors.primaryContainer} />
      </View>
      <Text style={styles.text}>Pilih File {label}</Text>
      <Text style={styles.subText}>Maks. ukuran 5MB (JPG/PNG/PDF)</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: radius.DEFAULT,
    padding: 24,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 16,
  },
  boxPressed: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.primaryContainer,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  text: { 
    fontFamily: typography.labelLg.fontFamily, 
    fontSize: typography.labelLg.fontSize, 
    color: colors.onSurface,
    marginBottom: 4,
  },
  subText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
    color: colors.outline,
  },
  filledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    borderColor: colors.outlineVariant,
    borderRadius: radius.DEFAULT,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 16,
  },
  icon: { fontSize: 16 },
  text: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, flexShrink: 1 },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  filledLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    color: colors.outline,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  fileName: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onSurface,
  },
  removeBtn: {
    padding: 8,
    backgroundColor: colors.errorContainer,
    borderRadius: 20,
  }
});
