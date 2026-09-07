import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const categories: Category[] = [
  { id: 'hotel', label: 'Hotel', icon: 'bed-outline' },
  { id: 'beauty', label: 'Beauty&Style', icon: 'color-palette-outline' },
  { id: 'gifting', label: 'Gifting', icon: 'gift-outline' },
  { id: 'photo', label: 'Photo', icon: 'camera-outline' },
];

interface CategoryGridProps {
  onSelectCategory?: (id: string) => void;
}

export default function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  return (
    <View style={styles.row}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.item}
          onPress={() => onSelectCategory?.(cat.id)}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={cat.icon} size={22} color="#F97316" />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
  },
  item: {
    alignItems: 'center',
    width: '23%',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
});
