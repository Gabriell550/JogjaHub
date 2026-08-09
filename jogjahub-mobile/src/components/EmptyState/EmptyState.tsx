import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, alignItems: 'center' },
  text: { color: '#888' },
});
