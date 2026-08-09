import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export function Input(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor="#999" {...props} />;
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
});
