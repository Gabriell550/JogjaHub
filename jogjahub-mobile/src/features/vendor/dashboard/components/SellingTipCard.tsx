import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = { title: string; message: string; ctaLabel: string; onPressCta: () => void };

// TODO: konten tips ini idealnya dirotasi dari backend (mis. endpoint /vendor/tips) supaya
// tiap hari beda — untuk sekarang statis, dikirim sebagai props dari VendorDashboardScreen.
export function SellingTipCard({ title, message, ctaLabel, onPressCta }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>💡</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.cta} onPress={onPressCta}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.lg,
    padding: spacing.stackLg,
  },
  icon: { fontSize: 20, marginBottom: spacing.stackSm },
  title: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimaryFixed,
    marginBottom: 4,
  },
  message: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: colors.onPrimaryFixedVariant,
    lineHeight: 18,
    marginBottom: spacing.stackMd,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.DEFAULT,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  ctaText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '700', color: colors.onPrimary },
});
