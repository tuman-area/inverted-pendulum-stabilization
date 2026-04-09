/* Inverted pendulum physics — exact port from model/pendulum.py */

export const MC = 4.0;
export const MP = 0.36;
export const LS = 0.451;
export const G = 9.81;
export const IZZ = 0.08433;
export const KC = 0.1;
export const KP_FRIC = 0.01;

export const WALL = 3.0;
export const F_MAX = 30.0;
export const PHYSICS_DT = 0.01;
export const ROD_VIS = 1.0;

export function ddx(xc, dxc, th, dth, F) {
  const s = Math.sin(th), c = Math.cos(th), s2 = Math.sin(2 * th);
  const num = F * IZZ + F * LS * LS * MP
    - IZZ * dth * dth * LS * MP * s - IZZ * dxc * KC
    - dth * dth * LS * LS * LS * MP * MP * s
    - dth * KP_FRIC * LS * MP * c - dxc * KC * LS * LS * MP
    + 0.5 * G * LS * LS * MP * MP * s2;
  const den = IZZ * MC + IZZ * MP + LS * LS * MC * MP + LS * LS * MP * MP * s * s;
  return num / den;
}

export function ddth(xc, dxc, th, dth, F) {
  const s = Math.sin(th), c = Math.cos(th), s2 = Math.sin(2 * th);
  const num = F * LS * MP * c
    - 0.5 * dth * dth * LS * LS * MP * MP * s2
    - dth * KP_FRIC * MC - dth * KP_FRIC * MP
    - dxc * KC * LS * MP * c
    + G * LS * MC * MP * s + G * LS * MP * MP * s;
  const den = IZZ * MC + IZZ * MP + LS * LS * MC * MP + LS * LS * MP * MP * s * s;
  return num / den;
}

function derivs(st, F) {
  return [
    st[1],
    ddx(st[0], st[1], st[2], st[3], F),
    st[3],
    ddth(st[0], st[1], st[2], st[3], F),
  ];
}

export function rk4(st, F, dt) {
  const k1 = derivs(st, F);
  const s2 = st.map((v, i) => v + 0.5 * dt * k1[i]);
  const k2 = derivs(s2, F);
  const s3 = st.map((v, i) => v + 0.5 * dt * k2[i]);
  const k3 = derivs(s3, F);
  const s4 = st.map((v, i) => v + dt * k3[i]);
  const k4 = derivs(s4, F);
  return st.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
