import React, { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, backgroundColor: '#fff', elevation: 2 },
});
