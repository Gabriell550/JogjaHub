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
      <View style={[styles.blob, styles.blobThree]} />

      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          Jogja<Text style={styles.logoHub}>Hub</Text>
        </Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 240,
    backgroundColor: colors.primaryContainer,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 60,
    overflow: 'hidden',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoText: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 24,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: -0.5,
  },
  logoHub: {
    color: colors.primaryFixed,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.primary,
    opacity: 0.35,
  },
  blobOne: { width: 220, height: 220, top: -100, right: -60 },
  blobTwo: { width: 140, height: 140, bottom: -40, left: -40 },
  blobThree: { width: 80, height: 80, top: 40, right: 120, opacity: 0.2 },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  subtitle: {
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: typography.bodyLg.fontSize,
    color: colors.onPrimary,
    marginTop: 8,
    opacity: 0.9,
  },
});