export type SpringTuning = readonly [stiffness: number, damping: number];

export function spring(position: number, tuning: SpringTuning = [600, 44]) {
  return { position, target: position, velocity: 0, tuning };
}

type Spring = ReturnType<typeof spring>;

export function advanceSpring(spring: Spring, dt: number, reduceMotion = false) {
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
