import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { advanceSpring, spring, type SpringTuning } from '../utils/spring';

// Rubber Dock values from DesignBookmark's shared/tokens.css.
const springs = {
  lead: [640, 38],
  trail: [150, 16],
  dragLead: [1100, 56],
  dragTrail: [320, 26],
  openWidth: [340, 21],
  openHeight: [230, 21],
  close: [420, 30],
  pop: [520, 16],
} as const satisfies Record<string, SpringTuning>;

export function useRubberDockMotion(initialIndex: number, tabCount: number, instantReducedMotion = false) {
  const [motion] = useState(() => ({
    left: spring(initialIndex),
    right: spring(initialIndex),
    nudge: spring(0, [300, 18]),
    width: spring(0, springs.openWidth),
    height: spring(0, springs.openHeight),
    icons: Array.from({ length: tabCount }, () => spring(1, springs.pop)),
  }));
  const readFrame = useCallback(() => ({
    left: motion.left.position,
    right: motion.right.position,
    nudge: motion.nudge.position,
    width: motion.width.position,
    height: motion.height.position,
    heightVelocity: motion.height.velocity,
    icons: motion.icons.map(icon => icon.position),
  }), [motion]);
  const [frame, setFrame] = useState(readFrame);
  const request = useRef<number | null>(null);
  const lastTime = useRef(0);
  const reduceMotion = useRef(false);

  const animate = useCallback(() => {
    const values = [motion.left, motion.right, motion.nudge, motion.width, motion.height, ...motion.icons];
    if (instantReducedMotion && reduceMotion.current) {
      if (request.current !== null) cancelAnimationFrame(request.current);
      request.current = null;
      motion.nudge.target = 0;
      for (const value of values) advanceSpring(value, 0, true);
      setFrame(readFrame());
      return;
    }
    if (request.current !== null) {
      return;
    }

    lastTime.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.max(0, Math.min((now - lastTime.current) / 1000, 1 / 30));
      lastTime.current = now;
      let moving = false;
      for (const value of values) {
        moving = advanceSpring(value, dt, reduceMotion.current) || moving;
      }
      setFrame(readFrame());
      request.current = moving ? requestAnimationFrame(tick) : null;
    };
    request.current = requestAnimationFrame(tick);
  }, [instantReducedMotion, motion, readFrame]);

  useEffect(() => {
    let receivedChange = false;
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      receivedChange = true;
      reduceMotion.current = enabled;
      if (instantReducedMotion && enabled) animate();
    });
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted && !receivedChange) {
        reduceMotion.current = enabled;
        if (instantReducedMotion && enabled) animate();
      }
    }).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
      if (request.current !== null) cancelAnimationFrame(request.current);
      request.current = null;
    };
  }, [animate, instantReducedMotion]);

  const movePill = useCallback((center: number, direction: number, drag = false, overshoot = 0) => {
    const lead = drag ? springs.dragLead : springs.lead;
    const trail = drag ? springs.dragTrail : springs.trail;
    const still: SpringTuning = [600, 44];
    motion.left.tuning = direction === 0 ? still : direction > 0 ? trail : lead;
    motion.right.tuning = direction === 0 ? still : direction > 0 ? lead : trail;
    const reduced = instantReducedMotion && reduceMotion.current;
    motion.left.target = reduced ? center - overshoot : center;
    motion.right.target = motion.left.target;
    motion.nudge.target = reduced ? 0 : overshoot * 0.35;
    animate();
  }, [animate, instantReducedMotion, motion]);

  const select = useCallback((index: number, direction?: number) => {
    movePill(index, direction ?? Math.sign(index - (motion.left.position + motion.right.position) / 2));
    if (!instantReducedMotion || !reduceMotion.current) motion.icons[index].velocity -= 3.2;
  }, [instantReducedMotion, motion, movePill]);

  const resize = useCallback((expanded: boolean, panelHeight: number, index: number) => {
    const changed = expanded !== (motion.width.target === 1);
    const [closeStiffness, closeDamping] = springs.close;
    motion.width.tuning = expanded ? springs.openWidth : [closeStiffness * 0.72, closeDamping * 0.66];
    motion.height.tuning = expanded
      ? (changed || motion.height.target === 0 ? springs.openHeight : [260, 20])
      : springs.close;
    motion.width.target = Number(expanded);
    motion.height.target = expanded ? panelHeight : 0;
    if (changed && (!instantReducedMotion || !reduceMotion.current)) motion.icons[index].velocity -= 2.4;
    animate();
  }, [animate, instantReducedMotion, motion]);

  return { frame, movePill, select, resize };
}
