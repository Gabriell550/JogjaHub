import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { ChevronRight, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, BackHandler, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { tenantColors, tenantLayout as tenantMetrics } from '../constants/theme/tenant';
import { TenantPressable } from '../features/vendor/components/TenantPressable';
import { dockFooterPadding, dockGap as tabGap, dockPadding as dockInset, dockRowMinHeight as tabHeight, getTenantDockGeometry } from './tenantDockGeometry';
import { useRubberDockMotion } from './useRubberDockMotion';

export type RubberDockPanel = {
  description: string;
  actions?: readonly {
    label: string;
    run: (navigation: BottomTabBarProps['navigation']) => void;
  }[];
};

type Props = BottomTabBarProps & {
  panels: Record<string, RubberDockPanel>;
  tenantLayout?: { usableHeight: number; onClosedHeightChange?: (height: number) => void };
};

const dockHeight = tabHeight + dockInset * 2;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function tabLabel(options: BottomTabBarProps['descriptors'][string]['options'], routeName: string) {
  return typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? routeName;
}

function rubberBand(distance: number) {
  const limit = 46;
  return Math.sign(distance) * (1 - 1 / (Math.abs(distance) * 0.55 / limit + 1)) * limit;
}

export function RubberDockTabBar({ state, descriptors, navigation, insets, panels, tenantLayout }: Props) {
  const window = useWindowDimensions();
  const isTenant = tenantLayout !== undefined;
  const [footerWidth, setFooterWidth] = useState<number | null>(null);
  const [rowHeight, setRowHeight] = useState(tabHeight);
  const rowRef = useRef<ComponentRef<typeof View>>(null);
  const rowLeft = useRef<number | null>(null);
  const activeTabRef = useRef<ComponentRef<typeof Pressable>>(null);
  const [focusedTab, setFocusedTab] = useState<number | null>(null);
  const [pressedTab, setPressedTab] = useState<number | null>(null);
  const panelControlFocused = useRef(false);
  const restoreFocus = useRef<{ keyboard: boolean; accessibility: boolean } | null>(null);
  const count = state.routes.length;
  const availableWidth = (footerWidth ?? window.width) - insets.left - insets.right;
  const tenantGeometry = isTenant ? getTenantDockGeometry(availableWidth, count) : null;
  const collapsedWidth = tenantGeometry?.width
    ?? Math.min(count * tabHeight + (count - 1) * tabGap + dockInset * 2, availableWidth - 24);
  const expandedWidth = tenantGeometry?.width ?? Math.min(340, availableWidth - 24);
  const rowWidth = tenantGeometry?.rowWidth ?? collapsedWidth - dockInset * 2;
  const gap = tenantGeometry?.gap ?? tabGap;
  const tabWidth = tenantGeometry?.slot ?? (rowWidth - (count - 1) * gap) / count;
  const pitch = tabWidth + gap;
  const firstCenter = insets.left + (availableWidth - rowWidth + tabWidth) / 2;
  const closedFooterHeight = rowHeight + 2 * (dockInset + dockFooterPadding) + insets.bottom;
  const reportClosedHeight = tenantLayout?.onClosedHeightChange;

  const [expanded, setExpanded] = useState(false);
  const [panelSizes, setPanelSizes] = useState<Record<string, number>>({});
  const activeRoute = state.routes[state.index];
  const activeOptions = descriptors[activeRoute.key].options;
  const panel = panels[activeRoute.name];
  const panelKey = `${activeRoute.key}:${expandedWidth}:${window.fontScale}`;
  const maxPanelHeight = Math.min(
    300, window.height * 0.4,
    tenantLayout ? Math.max(0, tenantLayout.usableHeight - closedFooterHeight - tenantMetrics.minTarget) : Infinity,
  );
  const measuredPanelHeight = panelSizes[panelKey];
  const panelHeight = Math.min(maxPanelHeight, measuredPanelHeight ?? 0);
  const { frame, movePill, select, resize } = useRubberDockMotion(state.index, count, isTenant);
  const lastIndex = useRef(state.index);
  const drag = useRef({ center: state.index, direction: 0 });
  const releasedDirection = useRef<number | undefined>(undefined);

  const measureRow = useCallback(() => {
    rowRef.current?.measureInWindow(x => { rowLeft.current = x; });
  }, []);

  useLayoutEffect(() => {
    if (isTenant) measureRow();
  }, [isTenant, measureRow, footerWidth, rowWidth, window.width, window.height, window.fontScale, insets.left, insets.right]);

  useLayoutEffect(() => {
    reportClosedHeight?.(closedFooterHeight);
  }, [closedFooterHeight, reportClosedHeight]);

  useLayoutEffect(() => {
    if (lastIndex.current === state.index) return;
    select(state.index, releasedDirection.current);
    releasedDirection.current = undefined;
    lastIndex.current = state.index;
  }, [select, state.index]);

  useLayoutEffect(() => {
    if (isTenant && expanded && measuredPanelHeight === undefined && maxPanelHeight > 0) return;
    resize(expanded, panelHeight, state.index);
  }, [expanded, isTenant, maxPanelHeight, measuredPanelHeight, panelHeight, resize, state.index]);

  const tenantPanelHeight = clamp(frame.height, 0, maxPanelHeight);
  const tenantPanelVisible = expanded && panelHeight > 0 && tenantPanelHeight >= panelHeight - 0.5;

  const closePanel = useCallback((returnAccessibilityFocus = false) => {
    if (isTenant) {
      restoreFocus.current = {
        keyboard: panelControlFocused.current,
        accessibility: returnAccessibilityFocus,
      };
      panelControlFocused.current = false;
    }
    setExpanded(false);
  }, [isTenant]);

  useEffect(() => {
    if (expanded || !restoreFocus.current) return;
    const { keyboard, accessibility } = restoreFocus.current;
    restoreFocus.current = null;
    let cancelled = false;
    const tab = activeTabRef.current;
    if (keyboard) tab?.focus();
    if (accessibility && tab) {
      AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
        if (enabled && !cancelled && activeTabRef.current === tab && navigation.isFocused()) {
          AccessibilityInfo.sendAccessibilityEvent(tab, 'focus');
        }
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [expanded, navigation, activeRoute.key]);

  useEffect(() => {
    if (!expanded) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused()) return false;
      closePanel(isTenant && tenantPanelVisible);
      return true;
    });
    return () => back.remove();
  }, [closePanel, expanded, isTenant, navigation, tenantPanelVisible]);

  const pressTab = useCallback((index: number, allowExpand: boolean, direction?: number) => {
    const route = state.routes[index];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) return false;
    if (index !== state.index) {
      panelControlFocused.current = false;
      releasedDirection.current = direction;
      navigation.dispatch({ ...CommonActions.navigate({ name: route.name, merge: true }), target: state.key });
    } else if (allowExpand && panels[route.name]) {
      if (isTenant && expanded) closePanel();
      else setExpanded(previous => !previous);
    }
    return true;
  }, [closePanel, expanded, isTenant, navigation, panels, state.index, state.key, state.routes]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => (!isTenant || rowLeft.current !== null)
      && Math.abs(gesture.dx) > 4 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: (_, gesture) => {
      const center = isTenant ? (rowLeft.current ?? 0) + tabWidth / 2 : firstCenter;
      drag.current = { center: (gesture.x0 - center) / pitch, direction: 0 };
    },
    onPanResponderMove: (_, gesture) => {
      const origin = isTenant ? (rowLeft.current ?? 0) + tabWidth / 2 : firstCenter;
      const center = (gesture.moveX - origin) / pitch;
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
  }), [count, firstCenter, isTenant, movePill, pitch, pressTab, select, state.index, tabWidth]);

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
    const style = [isTenant ? tenantStyles.tab : styles.tab, { width: tabWidth }];
    const content = (
      <>
        <View aria-hidden={isTenant || undefined} style={{ transform: [{ scale: frame.icons[index] }] }}>
          {options.tabBarIcon?.({ focused: selected, color, size: 20 })}
        </View>
        <Text
          style={[styles.label, { color }]}
          numberOfLines={isTenant ? undefined : 1}
          maxFontSizeMultiplier={isTenant ? undefined : 1.3}
          textBreakStrategy={isTenant ? 'simple' : undefined}
        >
          {label}
        </Text>
      </>
    );

    if (highlight) return <View key={route.key} style={style}>{content}</View>;

    return (
      <Pressable
        key={route.key}
        ref={isTenant && selected ? activeTabRef : undefined}
        style={({ pressed }) => [style, isTenant && pressed && tenantStyles.tabPressed]}
        accessibilityRole="tab"
        accessibilityState={{ selected, expanded: selected ? expanded : undefined }}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        accessibilityHint={selected && panel ? (expanded ? 'Tutup panel pintasan' : 'Buka panel pintasan') : undefined}
        testID={options.tabBarTestID ?? `rubber-dock-tab-${route.name}`}
        onPress={() => pressTab(index, true)}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        onFocus={isTenant ? () => setFocusedTab(index) : undefined}
        onBlur={isTenant ? () => setFocusedTab(focused => focused === index ? null : focused) : undefined}
        onPressIn={isTenant ? () => setPressedTab(index) : undefined}
        onPressOut={isTenant ? () => setPressedTab(null) : undefined}
      >
        {content}
      </Pressable>
    );
  });

  if (tenantGeometry) {
    const nudge = frame.nudge * pitch;
    const minIndicatorWidth = Math.min(24, tabWidth);
    const pillLeft = clamp(indicatorLeft + nudge, 0, rowWidth - minIndicatorWidth);
    const pillRight = clamp(Math.max(leftEdge, rightEdge) + nudge, pillLeft + minIndicatorWidth, rowWidth);
    const escapePanel = () => closePanel(true);
    const focusPanelControl = () => { panelControlFocused.current = true; };
    const blurPanelControl = () => { panelControlFocused.current = false; };
    return (
      <View
        style={[tenantStyles.footer, {
          paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom + dockFooterPadding,
        }]}
        onLayout={event => setFooterWidth(event.nativeEvent.layout.width)}
      >
        <View style={[tenantStyles.shadow, { width: tenantGeometry.width }]}>
          <View style={tenantStyles.surface}>
            {panel && (
              <View
                style={{ height: tenantPanelHeight, overflow: 'hidden' }}
                pointerEvents={tenantPanelVisible ? 'auto' : 'none'}
                accessibilityElementsHidden={!tenantPanelVisible}
                importantForAccessibility={tenantPanelVisible ? 'auto' : 'no-hide-descendants'}
              >
                <ScrollView
                  key={panelKey}
                  style={[tenantStyles.panel, { height: measuredPanelHeight === undefined ? maxPanelHeight : panelHeight }]}
                  contentContainerStyle={styles.panelContent}
                  onContentSizeChange={(_, height) => setPanelSizes(sizes => sizes[panelKey] === height ? sizes : { ...sizes, [panelKey]: height })}
                  onAccessibilityEscape={escapePanel}
                >
                  <View style={tenantStyles.panelHeader}>
                    <Text accessibilityRole="header" style={styles.panelTitle}>{tabLabel(activeOptions, activeRoute.name)}</Text>
                    <TenantPressable
                      style={tenantStyles.close}
                      accessibilityRole="button"
                      accessibilityLabel="Tutup panel pintasan"
                      focusable={tenantPanelVisible}
                      onPress={escapePanel}
                      onAccessibilityEscape={escapePanel}
                      onFocus={focusPanelControl}
                      onBlur={blurPanelControl}
                    >
                      <View aria-hidden><X size={20} color={colors.onSurfaceVariant} /></View>
                    </TenantPressable>
                  </View>
                  <Text style={styles.description}>{panel.description}</Text>
                  {panel.actions?.map(action => (
                    <TenantPressable
                      key={action.label}
                      accessibilityRole="button"
                      style={tenantStyles.action}
                      focusable={tenantPanelVisible}
                      onAccessibilityEscape={escapePanel}
                      onFocus={focusPanelControl}
                      onBlur={blurPanelControl}
                      onPress={() => {
                        panelControlFocused.current = false;
                        setExpanded(false);
                        action.run(navigation);
                      }}
                    >
                      <Text style={styles.actionLabel}>{action.label}</Text>
                      <View aria-hidden><ChevronRight size={18} color={colors.primary} /></View>
                    </TenantPressable>
                  ))}
                </ScrollView>
              </View>
            )}
            <View
              ref={rowRef}
              collapsable={false}
              onLayout={event => {
                setRowHeight(event.nativeEvent.layout.height);
                if (rowLeft.current === null) measureRow();
              }}
              style={[tenantStyles.row, { width: rowWidth, gap }]}
              {...pan.panHandlers}
            >
              {renderTabs(false)}
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.indicator, tenantStyles.pill, {
                  left: pillLeft, width: pillRight - pillLeft,
                  backgroundColor: pressedTab === state.index ? colors.onPrimaryFixedVariant : colors.primary,
                }]}
              >
                <View style={[styles.highlightRow, { width: rowWidth, height: '100%', left: -pillLeft, gap }]}>
                  {renderTabs(true)}
                </View>
              </View>
              {focusedTab !== null && (
                <View
                  aria-hidden
                  pointerEvents="none"
                  style={[tenantStyles.focusOutline, {
                    left: focusedTab * pitch + 2, width: Math.max(0, tabWidth - 4),
                    borderColor: focusedTab === state.index ? colors.onPrimary : colors.tertiary,
                  }]}
                />
              )}
            </View>
            <View aria-hidden pointerEvents="none" style={tenantStyles.border} />
          </View>
        </View>
      </View>
    );
  }

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

const tenantStyles = StyleSheet.create({
  footer: { alignItems: 'center', flexShrink: 0, backgroundColor: tenantColors.canvas, paddingTop: dockFooterPadding },
  shadow: {
    borderRadius: radius.xl, backgroundColor: colors.surfaceContainerLowest,
    ...Platform.select({ android: { elevation: 4, shadowColor: colors.onSurface }, ios: { boxShadow: tenantColors.dockShadow } }),
  },
  surface: {
    alignItems: 'center', borderRadius: radius.xl, backgroundColor: colors.surfaceContainerLowest,
    paddingVertical: dockInset, overflow: 'hidden',
  },
  border: { ...StyleSheet.absoluteFill, borderRadius: radius.xl, borderWidth: 1, borderColor: tenantColors.border },
  row: { flexDirection: 'row', minHeight: tabHeight },
  tab: { minHeight: tabHeight, paddingVertical: 4, gap: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  tabPressed: { backgroundColor: colors.primaryFixed },
  pill: { top: 0, bottom: 0, borderRadius: 20 },
  focusOutline: { position: 'absolute', top: 2, bottom: 2, borderWidth: 2, borderRadius: 18 },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  close: { alignItems: 'center' },
  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    padding: 8, borderRadius: radius.md, backgroundColor: tenantColors.canvas,
  },
});

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
