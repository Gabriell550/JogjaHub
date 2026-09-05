import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, typography } from '../../constants/theme';

type Props = {
  labels: string[];
  values: number[];
  color?: string;
  valueFormatter?: (n: number) => string;
  height?: number;
};

// Bar chart ringan pakai react-native-svg (sudah ada di project, tidak nambah dependency baru).
// Dipakai di VendorStatisticsScreen untuk grafik pendapatan & grafik total order.
export function SimpleBarChart({ labels, values, color = colors.primaryContainer, valueFormatter, height = 160 }: Props) {
  const VIEWBOX_WIDTH = 320;
  const VIEWBOX_HEIGHT = 140;
  const maxValue = Math.max(...values, 1);
  const barCount = values.length;
  const gap = 8;
  const barWidth = (VIEWBOX_WIDTH - gap * (barCount - 1)) / barCount;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none">
        {values.map((value, i) => {
          const barHeight = Math.max((value / maxValue) * (VIEWBOX_HEIGHT - 20), 3);
          const x = i * (barWidth + gap);
          const y = VIEWBOX_HEIGHT - 20 - barHeight;
          return <Rect key={i} x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={color} />;
        })}
      </Svg>
      <View style={styles.labelRow}>
        {labels.map((label, i) => (
          <Text key={i} style={styles.labelText} numberOfLines={1}>{label}</Text>
        ))}
      </View>
      {valueFormatter && (
        <Text style={styles.peakText}>
          Tertinggi: {valueFormatter(maxValue)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelText: { flex: 1, textAlign: 'center', fontFamily: typography.labelMd.fontFamily, fontSize: 10, color: colors.onSurfaceVariant },
  peakText: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.outline, marginTop: 8 },
});
