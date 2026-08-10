import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../constants/theme';

type Props = { title: string; subtitle?: string };

// Header lengkung dekoratif dipakai di Login & Register, meniru gaya "curved header" pada referensi
// tapi pakai warna brand JogjaHub (oranye) dan bentuk lingkaran alih-alih ilustrasi tanaman.
export default function AuthHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.header}>
      <View style={[styles.blob, styles.blobOne]} />
      <View style={[styles.blob, styles.blobTwo]} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 220,
    backgroundColor: colors.primaryContainer,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 64,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.primary,
    opacity: 0.35,
  },
  blobOne: { width: 160, height: 160, top: -60, right: -40 },
  blobTwo: { width: 100, height: 100, bottom: -30, left: -30 },
  title: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: typography.headlineXl.fontSize,
    fontWeight: typography.headlineXl.fontWeight,
    color: colors.onPrimary,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onPrimary,
    marginTop: 4,
  },
});
