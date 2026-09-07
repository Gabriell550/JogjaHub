import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress?: () => void;
}

export default function PromoBanner({ title, subtitle, ctaLabel, onPress }: PromoBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.buttonText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1565C0',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#E3F2FD',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: '85%',
  },
  button: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  buttonText: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 13,
  },
});
