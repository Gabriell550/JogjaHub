import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../../constants/theme';
import { VENDOR_CATEGORIES } from '../../../constants/categories';

type Props = {
  selected: string[];
  onChange: (categories: string[]) => void;
};

// Chip multi-pilih kategori layanan vendor. Tap sekali = pilih, tap lagi = batal pilih.
// Reusable — bisa dipakai lagi nanti di features/vendor/onboarding kalau vendor mau ubah kategori.
export default function CategoryMultiSelect({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <View style={styles.wrap}>
      {VENDOR_CATEGORIES.map((cat) => {
        const active = selected.includes(cat.id);
        return (
          <Pressable key={cat.id} onPress={() => toggle(cat.id)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{cat.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant },
  chipLabelActive: { color: colors.onPrimary, fontWeight: '600' },
});
