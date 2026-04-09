import { PHYSICS_DT, F_MAX, WALL, rk4 } from './physics.js';
import { PID } from './pid.js';

export const PRESETS = {
  stabilization: { theta: [150, 0.5, 15], cart: [-5, -0.05, -5] },
  tracking:      { theta: [150, 0.5, 15], cart: [-10, -0.30, -8] },
  conservative:  { theta: [100, 0.3, 10], cart: [-3, -0.02, -3] },
  off:           { theta: [0, 0, 0],      cart: [0, 0, 0] },
};

export const sim = {
  state: [0, 0, 0.1, 0],
  xcTarget: 0,
  lastForce: 0,
  paused: false,
  dragging: false,
  dragPrevAngle: 0,
};

export const pidTheta = new PID(150, 0.5, 15);
export const pidCart = new PID(-10, -0.30, -8);

export function physicsStep() {
  const ft = pidTheta.compute(0 - sim.state[2]);
  const fc = pidCart.compute(sim.xcTarget - sim.state[0]);
  let F = ft + fc;
  F = Math.max(-F_MAX, Math.min(F_MAX, F));
  sim.lastForce = F;

  sim.state = rk4(sim.state, F, PHYSICS_DT);

  if (sim.state[0] > WALL)  { sim.state[0] = WALL;  if (sim.state[1] > 0) sim.state[1] = 0; }
  if (sim.state[0] < -WALL) { sim.state[0] = -WALL; if (sim.state[1] < 0) sim.state[1] = 0; }
}

export function resetSim() {
  sim.state = [0, 0, 0.1, 0];
  sim.xcTarget = 0;
  sim.lastForce = 0;
  pidTheta.reset();
  pidCart.reset();
}

export function togglePause() {
  sim.paused = !sim.paused;
}

export function applyDisturbance() {
  const sign = Math.random() > 0.5 ? 1 : -1;
  sim.state[2] += sign * 0.15;
  sim.state[3] += sign * 0.5;
}
