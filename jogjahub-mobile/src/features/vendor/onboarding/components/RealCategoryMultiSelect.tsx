import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../../../constants/theme';

type CategoryOption = { id: number; name: string };

type Props = {
  categories: CategoryOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
};

// Beda dari features/auth/components/CategoryMultiSelect.tsx: komponen itu pakai daftar
// STATIS berisi string alias ('salon_mua', dst) khusus form registrasi awal. Komponen ini
// pakai category_id ASLI dari database (hasil categoryApi.getCategories()) — wajib dipakai
// di sini karena PUT /tenant/profile validasinya `exists:categories,id`, bukan alias string.
export function RealCategoryMultiSelect({ categories, selected, onChange }: Props) {
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <View style={styles.wrap}>
      {categories.map((cat) => {
        const active = selected.includes(cat.id);
        return (
          <Pressable key={cat.id} onPress={() => toggle(cat.id)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{cat.name}</Text>
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
