import React, { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../../constants/theme';

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
type Props = PropsWithChildren & {
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg, // "Large Containers" di DESIGN.md pakai rounded-lg (16px)
    padding: 14,
    backgroundColor: colors.surfaceContainerLowest,
    elevation: 2,
  },
});

