import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  label: string;
  amount: number;
  subtitle: string;
  icon?: React.ReactNode;
};

export function PerformaCard({ label, amount, subtitle, icon }: Props) {
  const formatted = `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatted}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: 24,
    padding: 20,
  },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyAccent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  amount: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: colors.onNavy,
    lineHeight: 36,
  },
  icon: {
    fontSize: 24,
    marginLeft: 4,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: colors.navySub,
    marginTop: 0,
  },
});
