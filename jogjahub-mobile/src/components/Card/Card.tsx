import React, { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../../constants/theme';

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg, // "Large Containers" di DESIGN.md pakai rounded-lg (16px)
    padding: 14,
    backgroundColor: colors.surfaceContainerLowest,
    elevation: 2,
  },
});
