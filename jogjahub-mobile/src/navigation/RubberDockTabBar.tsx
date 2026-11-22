import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { ChevronRight, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useRubberDockMotion } from './useRubberDockMotion';

export type RubberDockPanel = {
  description: string;
  actions?: readonly {
    label: string;
    run: (navigation: BottomTabBarProps['navigation']) => void;
  }[];
};

type Props = BottomTabBarProps & { panels: Record<string, RubberDockPanel> };

const tabHeight = 56;
const tabGap = 4;
const dockInset = 6;
const dockHeight = tabHeight + dockInset * 2;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function tabLabel(options: BottomTabBarProps['descriptors'][string]['options'], routeName: string) {
  return typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? routeName;
}

function rubberBand(distance: number) {
  const limit = 46;
  return Math.sign(distance) * (1 - 1 / (Math.abs(distance) * 0.55 / limit + 1)) * limit;
}

export function RubberDockTabBar({ state, descriptors, navigation, insets, panels }: Props) {
  const window = useWindowDimensions();
  const count = state.routes.length;
  const availableWidth = window.width - insets.left - insets.right;
  const collapsedWidth = Math.min(count * tabHeight + (count - 1) * tabGap + dockInset * 2, availableWidth - 24);
  const expandedWidth = Math.min(340, availableWidth - 24);
  const rowWidth = collapsedWidth - dockInset * 2;
  const tabWidth = (rowWidth - (count - 1) * tabGap) / count;
  const pitch = tabWidth + tabGap;
  const firstCenter = insets.left + (availableWidth - rowWidth + tabWidth) / 2;

  const [expanded, setExpanded] = useState(false);
  const [panelSizes, setPanelSizes] = useState<Record<string, number>>({});
  const activeRoute = state.routes[state.index];
  const activeOptions = descriptors[activeRoute.key].options;
  const panel = panels[activeRoute.name];
  const panelKey = `${activeRoute.key}:${expandedWidth}:${window.fontScale}`;
  const maxPanelHeight = Math.min(300, window.height * 0.4);
  const panelHeight = Math.min(maxPanelHeight, panelSizes[panelKey] ?? 0);
  const { frame, movePill, select, resize } = useRubberDockMotion(state.index, count);
  const lastIndex = useRef(state.index);
  const drag = useRef({ center: state.index, direction: 0 });
  const releasedDirection = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (lastIndex.current === state.index) return;
    select(state.index, releasedDirection.current);
    releasedDirection.current = undefined;
    lastIndex.current = state.index;
  }, [select, state.index]);

  useLayoutEffect(() => {
    resize(expanded, panelHeight, state.index);
  }, [expanded, panelHeight, resize, state.index]);

  useEffect(() => {
    if (!expanded) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused()) return false;
      setExpanded(false);
      return true;
    });
    return () => back.remove();
  }, [expanded, navigation]);

  const pressTab = useCallback((index: number, allowExpand: boolean, direction?: number) => {
    const route = state.routes[index];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) return false;
    if (index !== state.index) {
      releasedDirection.current = direction;
      navigation.dispatch({ ...CommonActions.navigate({ name: route.name, merge: true }), target: state.key });
    } else if (allowExpand && panels[route.name]) {
      setExpanded(previous => !previous);
    }
    return true;
  }, [navigation, panels, state.index, state.key, state.routes]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 4 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: (_, gesture) => {
      drag.current = { center: (gesture.x0 - firstCenter) / pitch, direction: 0 };
    },
    onPanResponderMove: (_, gesture) => {
      const center = (gesture.moveX - firstCenter) / pitch;
      const delta = center - drag.current.center;
      const direction = Math.abs(delta * pitch) > 0.5 ? Math.sign(delta) : drag.current.direction;
      const bounded = clamp(center, 0, count - 1);
      const overshoot = rubberBand((center - bounded) * pitch) / pitch;
      drag.current = { center, direction };
      movePill(bounded + overshoot, direction, true, overshoot);
    },
    onPanResponderRelease: () => {
      const { center, direction } = drag.current;
      const index = clamp(Math.round(center + direction * 0.18), 0, count - 1);
      if (index === state.index || !pressTab(index, false, direction)) select(state.index, direction);
    },
    onPanResponderTerminate: () => movePill(state.index, 0),
  }), [count, firstCenter, movePill, pitch, pressTab, select, state.index]);

  const leftEdge = frame.left * pitch;
  const rightEdge = frame.right * pitch + tabWidth;
  const indicatorLeft = Math.min(leftEdge, rightEdge);
  const indicatorWidth = Math.max(24, Math.abs(rightEdge - leftEdge));
  const indicatorHeight = tabHeight * clamp(1 / Math.sqrt(indicatorWidth / tabWidth), 0.66, 1.1);
  const indicatorTop = (tabHeight - indicatorHeight) / 2;
  const panelReveal = clamp(frame.height / Math.max(1, Math.min(panelHeight, 72)), 0, 1);
  const panelVisible = expanded && panelReveal > 0.98;
  const cardWidth = (collapsedWidth + (expandedWidth - collapsedWidth) * frame.width)
    * (1 + clamp(-frame.heightVelocity / 9000, -0.04, 0.04));
  const cardRadius = dockHeight / 2 + (radius.xl - dockHeight / 2) * clamp(frame.width, 0, 1);

  const renderTabs = (highlight: boolean) => state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label = tabLabel(options, route.name);
    const selected = state.index === index;
    const color = highlight ? colors.onPrimary : colors.onSurfaceVariant;
    const style = [styles.tab, { width: tabWidth }];
    const content = (
      <>
        <View style={{ transform: [{ scale: frame.icons[index] }] }}>
          {options.tabBarIcon?.({ focused: selected, color, size: 20 })}
        </View>
        <Text style={[styles.label, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{label}</Text>
      </>
    );

    if (highlight) return <View key={route.key} style={style}>{content}</View>;

    return (
      <Pressable
        key={route.key}
        style={style}
        accessibilityRole="tab"
        accessibilityState={{ selected, expanded: selected ? expanded : undefined }}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        accessibilityHint={selected && panel ? (expanded ? 'Tutup panel pintasan' : 'Buka panel pintasan') : undefined}
        testID={options.tabBarTestID ?? `rubber-dock-tab-${route.name}`}
        onPress={() => pressTab(index, true)}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
      >
        {content}
      </Pressable>
    );
  });

  return (
    <View style={[styles.footer, { paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: Math.max(insets.bottom, spacing.stackSm) }]}>
      <View style={[styles.shadow, {
        width: cardWidth,
        height: dockHeight + Math.max(0, frame.height),
        borderRadius: cardRadius,
        transform: [{ translateX: frame.nudge * pitch }],
      }]}>
        <View style={[styles.card, { borderRadius: cardRadius }]}>
          {panel && (
            <ScrollView
              key={panelKey}
              style={[styles.panel, { width: expandedWidth, height: panelHeight || maxPanelHeight, opacity: panelReveal }]}
              contentContainerStyle={styles.panelContent}
              pointerEvents={panelVisible ? 'auto' : 'none'}
              accessibilityElementsHidden={!panelVisible}
              importantForAccessibility={panelVisible ? 'auto' : 'no-hide-descendants'}
              onContentSizeChange={(_, height) => setPanelSizes(sizes => sizes[panelKey] === height ? sizes : { ...sizes, [panelKey]: height })}
            >
              <View style={styles.panelHeader}>
                <Text accessibilityRole="header" style={styles.panelTitle}>{tabLabel(activeOptions, activeRoute.name)}</Text>
                <Pressable style={styles.close} onPress={() => setExpanded(false)} accessibilityRole="button" accessibilityLabel="Tutup panel pintasan">
                  <X size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
              <Text style={styles.description}>{panel.description}</Text>
              {panel.actions?.map(action => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                  onPress={() => {
                    setExpanded(false);
                    action.run(navigation);
                  }}
                >
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <ChevronRight size={18} color={colors.primary} />
                </Pressable>
              ))}
            </ScrollView>
          )}
          <View style={[styles.row, { width: rowWidth }]} {...pan.panHandlers}>
            {renderTabs(false)}
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.indicator, {
                left: indicatorLeft,
                top: indicatorTop,
                width: indicatorWidth,
                height: indicatorHeight,
                borderRadius: radius.full,
              }]}
            >
              <View style={[styles.highlightRow, { width: rowWidth, left: -indicatorLeft, top: -indicatorTop }]}>
                {renderTabs(true)}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', backgroundColor: colors.surface, paddingTop: dockInset },
  shadow: {
    backgroundColor: colors.surfaceContainerLowest,
    boxShadow: `0 4px 14px ${colors.onSurface}1f`,
  },
  card: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: dockInset,
    backgroundColor: colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  row: { height: tabHeight, flexDirection: 'row', gap: tabGap },
  tab: { height: tabHeight, gap: 2, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.labelSm, maxWidth: '100%', textAlign: 'center' },
  indicator: { position: 'absolute', overflow: 'hidden', backgroundColor: colors.primary },
  highlightRow: { position: 'absolute', flexDirection: 'row', gap: tabGap, height: tabHeight },
  panel: { position: 'absolute', bottom: dockHeight },
  panelContent: { paddingTop: spacing.stackSm, paddingHorizontal: spacing.gutter, paddingBottom: spacing.stackSm, gap: spacing.stackSm },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { ...typography.titleMd, color: colors.onSurface, flexShrink: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  description: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
  action: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.stackSm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  actionPressed: { backgroundColor: colors.surfaceContainer },
  actionLabel: { ...typography.labelMd, color: colors.primary, flexShrink: 1 },
});
