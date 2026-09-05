import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../constants/theme';

type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
};

// Filter tab pill sejajar — dipakai di VendorStatisticsScreen (Hari Ini/Minggu/Bulan/Tahun),
// reusable untuk filter serupa di layar lain nanti.
export function SegmentedTabs({ tabs, activeKey, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surfaceContainer, borderRadius: radius.full, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primaryContainer },
  label: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, fontWeight: '600' },
  labelActive: { color: colors.onPrimary },
});
