import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

type Tuning = readonly [stiffness: number, damping: number];

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
} as const satisfies Record<string, Tuning>;

function spring(position: number, tuning: Tuning = [600, 44]) {
  return { position, target: position, velocity: 0, tuning };
}

type Spring = ReturnType<typeof spring>;

function advance(spring: Spring, dt: number, reduceMotion: boolean) {
  if (reduceMotion || (Math.abs(spring.position - spring.target) < 0.0005 && Math.abs(spring.velocity) < 0.01)) {
    spring.position = spring.target;
    spring.velocity = 0;
    return false;
  }

  const [stiffness, damping] = spring.tuning;
  for (let step = 0; step < 4; step += 1) {
    const acceleration = -stiffness * (spring.position - spring.target) - damping * spring.velocity;
    spring.velocity += acceleration * dt / 4;
    spring.position += spring.velocity * dt / 4;
  }
  return true;
}

export function useRubberDockMotion(initialIndex: number, tabCount: number) {
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
    if (request.current !== null) {
      return;
    }

    const values = [motion.left, motion.right, motion.nudge, motion.width, motion.height, ...motion.icons];
    lastTime.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.max(0, Math.min((now - lastTime.current) / 1000, 1 / 30));
      lastTime.current = now;
      let moving = false;
      for (const value of values) {
        moving = advance(value, dt, reduceMotion.current) || moving;
      }
      setFrame(readFrame());
      request.current = moving ? requestAnimationFrame(tick) : null;
    };
    request.current = requestAnimationFrame(tick);
  }, [motion, readFrame]);

  useEffect(() => {
    let receivedChange = false;
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      receivedChange = true;
      reduceMotion.current = enabled;
    });
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted && !receivedChange) reduceMotion.current = enabled;
    }).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
      if (request.current !== null) cancelAnimationFrame(request.current);
      request.current = null;
    };
  }, []);

  const movePill = useCallback((center: number, direction: number, drag = false, overshoot = 0) => {
    const lead = drag ? springs.dragLead : springs.lead;
    const trail = drag ? springs.dragTrail : springs.trail;
    const still: Tuning = [600, 44];
    motion.left.tuning = direction === 0 ? still : direction > 0 ? trail : lead;
    motion.right.tuning = direction === 0 ? still : direction > 0 ? lead : trail;
    motion.left.target = center;
    motion.right.target = center;
    motion.nudge.target = overshoot * 0.35;
    animate();
  }, [animate, motion]);

  const select = useCallback((index: number, direction?: number) => {
    movePill(index, direction ?? Math.sign(index - (motion.left.position + motion.right.position) / 2));
    motion.icons[index].velocity -= 3.2;
  }, [motion, movePill]);

  const resize = useCallback((expanded: boolean, panelHeight: number, index: number) => {
    const changed = expanded !== (motion.width.target === 1);
    const [closeStiffness, closeDamping] = springs.close;
    motion.width.tuning = expanded ? springs.openWidth : [closeStiffness * 0.72, closeDamping * 0.66];
    motion.height.tuning = expanded
      ? (changed || motion.height.target === 0 ? springs.openHeight : [260, 20])
      : springs.close;
    motion.width.target = Number(expanded);
    motion.height.target = expanded ? panelHeight : 0;
    if (changed) motion.icons[index].velocity -= 2.4;
    animate();
  }, [animate, motion]);

  return { frame, movePill, select, resize };
}
