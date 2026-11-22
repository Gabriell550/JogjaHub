import React, { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../../../constants/theme';

export const revenueChartHeight = 96;

function buildChart(points: readonly number[], width: number) {
  const coords = points.map((point, index) => ({
    x: 5 + index * (width - 10) / (points.length - 1),
    y: 8 + (1 - Math.max(-0.05, Math.min(1.05, point))) * (revenueChartHeight - 16),
  }));
  const first = coords[0];
  const last = coords[coords.length - 1];
  let line = `M${first.x} ${first.y}`;

  for (let index = 0; index < coords.length - 1; index += 1) {
    const start = coords[index];
    const end = coords[index + 1];
    const before = coords[index - 1] ?? start;
    const after = coords[index + 2] ?? end;
    const outX = start.x + (end.x - before.x) / 6;
    const outY = start.y + (end.y - before.y) / 6;
    const inX = end.x - (after.x - start.x) / 6;
    const inY = end.y - (after.y - start.y) / 6;
    line += ` C${outX} ${outY} ${inX} ${inY} ${end.x} ${end.y}`;
  }

  return { line, area: `${line} L${last.x} ${revenueChartHeight} L${first.x} ${revenueChartHeight} Z`, last };
}

export function RevenueAreaChart({ points }: { points: readonly number[] }) {
  const [width, setWidth] = useState(0);
  const gradientId = `stat-revenue-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const chart = width > 10 && points.length > 1 ? buildChart(points, width) : null;

  return (
    <View aria-hidden style={{ height: revenueChartHeight }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {chart && (
        <Svg width="100%" height={revenueChartHeight}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primaryContainer} stopOpacity={0.32} />
              <Stop offset="100%" stopColor={colors.primaryContainer} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={chart.area} fill={`url(#${gradientId})`} />
          <Path d={chart.line} fill="none" stroke={colors.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={chart.last.x} cy={chart.last.y} r={4.5} fill={colors.primary} />
        </Svg>
      )}
    </View>
  );
}
