import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { advanceSpring, spring } from '../../../utils/spring';

// These are the Stat card's component-specific springs from DesignBookmark.
const chartTuning = [200, 17] as const;
const metricTuning = [160, 22] as const;
const indicatorTuning = [380, 30] as const;
const pointCount = 12;
const pointDelay = 0.03;
const revenueUnit = 1000;

function chartTargets(values: readonly number[]) {
  const max = Math.max(1, ...values);
  return Array.from({ length: pointCount }, (_, index) => {
    const offset = index * Math.max(0, values.length - 1) / (pointCount - 1);
    const left = Math.floor(offset);
    const start = values[left] ?? 0;
    const end = values[left + 1] ?? start;
    return (start + (end - start) * (offset - left)) / max;
  });
}

function createMotion(index: number) {
  return {
    points: Array.from({ length: pointCount }, () => spring(0, chartTuning)),
    revenue: spring(0, metricTuning),
    change: spring(0, metricTuning),
    indicator: spring(index, indicatorTuning),
  };
}

function readMotion(motion: ReturnType<typeof createMotion>) {
  return {
    points: motion.points.map(point => point.position),
    revenue: Math.max(0, Math.round(motion.revenue.position * revenueUnit)),
    change: motion.change.position,
    indicator: motion.indicator.position,
  };
}

export function useStatCardMotion(
  values: readonly number[], active: boolean, { revenue = 0, change = 0, selectedIndex = 0 } = {},
) {
  const [motion] = useState(() => createMotion(selectedIndex));
  const [frame, setFrame] = useState(() => readMotion(motion));
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let initialPending = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      initialPending = false;
      setReduceMotion(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (initialPending) setReduceMotion(enabled);
    }).catch(() => {
      if (initialPending) setReduceMotion(true);
    });
    return () => {
      initialPending = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;

    const targets = chartTargets(values);
    const springs = [motion.revenue, motion.change, motion.indicator, ...motion.points];
    motion.revenue.target = revenue / revenueUnit;
    motion.change.target = change;
    motion.indicator.target = selectedIndex;

    if (reduceMotion || !active || values.length === 0) {
      motion.points.forEach((point, index) => { point.target = targets[index]; });
      for (const value of springs) advanceSpring(value, 0, true);
      setFrame(readMotion(motion));
      return;
    }

    let last = performance.now();
    let elapsed = 0;
    let nextPoint = 0;
    let request: number;
    const renderFrame = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 30));
      elapsed += dt;
      last = now;
      while (nextPoint < targets.length && elapsed >= nextPoint * pointDelay) {
        motion.points[nextPoint].target = targets[nextPoint];
        nextPoint += 1;
      }
      let moving = nextPoint < targets.length;
      for (const value of springs) {
        moving = advanceSpring(value, dt) || moving;
      }
      setFrame(readMotion(motion));
      if (moving) request = requestAnimationFrame(renderFrame);
    };
    request = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(request);
  }, [active, change, motion, reduceMotion, revenue, selectedIndex, values]);

  return frame;
}
