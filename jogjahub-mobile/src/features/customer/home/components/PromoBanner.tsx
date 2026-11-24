import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';

interface PromoBannerProps {
  title: string;
  subtitle: string;
}

export default function PromoBanner({ title, subtitle }: PromoBannerProps) {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.accent} />
      <View pointerEvents="none" style={styles.ring} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: customerColors.hero,
    borderRadius: radius.xl,
    padding: 22,
    minHeight: 144,
    justifyContent: 'center',
    overflow: 'hidden',
    marginHorizontal: 20,
    marginTop: 16,
  },
  accent: {
    position: 'absolute', width: 176, height: 176, borderRadius: 88,
    right: -90, top: -54, backgroundColor: customerColors.heroAccent,
  },
  ring: {
    position: 'absolute', width: 210, height: 210, borderRadius: 105,
    right: -109, top: -70, borderWidth: 1, borderColor: customerColors.heroAccent,
  },
  title: { ...typography.headlineXl, color: colors.onNavy, marginBottom: 6 },
  subtitle: { ...typography.bodyMd, color: customerColors.onHeroMuted, maxWidth: 260 },
});
