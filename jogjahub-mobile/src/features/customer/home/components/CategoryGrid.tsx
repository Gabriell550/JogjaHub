import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import { Ionicons } from '@expo/vector-icons';

interface CategoryGridProps {
  categories: { id: number; name: string }[];
  onSelectCategory: (id: number, name: string) => void;
}

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  penginapan: 'bed-outline',
  beautystyle: 'color-palette-outline',
  gifting: 'gift-outline',
  dokumentasi: 'camera-outline',
};

export default function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  if (!categories.length) return null;

  return (
    <View style={styles.row}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.item}
          onPress={() => onSelectCategory(cat.id, cat.name)}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name={categoryIcons[cat.name.toLowerCase().replace(/[^a-z]/g, '')] ?? 'grid-outline'}
              size={22}
              color={colors.primary}
              aria-hidden
            />
          </View>
          <Text style={styles.label}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 18, gap: 8 },
  item: {
    flex: 1, alignItems: 'center', paddingHorizontal: 2, paddingVertical: 8, gap: 6,
    borderRadius: radius.lg, borderWidth: 1, borderColor: customerColors.border,
    backgroundColor: colors.surfaceContainerLowest,
  },
  iconCircle: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { ...typography.labelSm, color: colors.navy, textAlign: 'center' },
});
