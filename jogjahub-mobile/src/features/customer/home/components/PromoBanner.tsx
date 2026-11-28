import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerColors as c } from '../../../../constants/theme/customer';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export default function PromoBanner({
  title,
  subtitle,
  onPress,
}: PromoBannerProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.iconBox}>
        <Ionicons
          name="school-outline"
          size={25}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.button}>
        <Text style={styles.buttonText}>Lihat Vendor</Text>
        <Ionicons
          name="arrow-forward"
          size={13}
          color={c.primary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    backgroundColor: c.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    gap: 4,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: c.onHeroMuted,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },

  buttonText: {
    color: c.primary,
    fontSize: 10,
    fontWeight: '700',
  },
});