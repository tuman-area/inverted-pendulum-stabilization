import { WALL, F_MAX, ROD_VIS } from './physics.js';
import { sim } from './simulation.js';

let worldXMin, worldXMax, worldYMin, worldYMax;

let canvas, ctx;
let scale, offX, offY;

export function initRenderer() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  window.addEventListener('resize', resize);
  resize();
}

export function resize() {
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const mobile = rect.width < 600;
  const aspect = mobile ? 0.65 : 0.42;
  worldXMin = mobile ? -2.8 : -4.2;
  worldXMax = mobile ?  2.8 :  4.2;
  worldYMin = mobile ? -0.5 : -1.2;
  worldYMax = mobile ?  1.6 :  2.2;
  canvas.width = rect.width * dpr;
  canvas.height = (rect.width * aspect) * dpr;
  canvas.style.height = (rect.width * aspect) + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const sx = canvas.width / (worldXMax - worldXMin);
  const sy = canvas.height / (worldYMax - worldYMin);
  scale = Math.min(sx, sy);
  offX = canvas.width / 2;
  offY = canvas.height - (-worldYMin) * scale;
}

export function w2c(wx, wy) {
  return [offX + wx * scale, offY - wy * scale];
}

export function getWorldPos(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cx = (e.clientX - rect.left) * dpr;
  const cy = (e.clientY - rect.top) * dpr;
  return [(cx - offX) / scale, -(cy - offY) / scale];
}

export function render() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#21262d';
  ctx.lineWidth = 1;
  for (let x = -4; x <= 4; x++) {
    const [cx] = w2c(x, 0);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
  }
  for (let y = -1; y <= 2; y++) {
    const [, cy] = w2c(0, y);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  }

  // Red wall zones
  ctx.fillStyle = 'rgba(248, 81, 73, 0.12)';
  const [wl] = w2c(-WALL, 0);
  const [wr] = w2c(WALL, 0);
  ctx.fillRect(0, 0, wl, H);
  ctx.fillRect(wr, 0, W - wr, H);

  // Wall lines
  ctx.strokeStyle = 'rgba(248, 81, 73, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(wl, 0); ctx.lineTo(wl, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wr, 0); ctx.lineTo(wr, H); ctx.stroke();
  ctx.setLineDash([]);

  // Track
  const [t0, ty] = w2c(-4, 0);
  const [t1] = w2c(4, 0);
  ctx.strokeStyle = '#8b949e';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(t0, ty); ctx.lineTo(t1, ty); ctx.stroke();

  // Target marker
  const [tx, tty] = w2c(sim.xcTarget, 0);
  ctx.fillStyle = 'rgba(88, 166, 255, 0.7)';
  ctx.beginPath();
  ctx.moveTo(tx, tty + 6);
  ctx.lineTo(tx - 6, tty + 16);
  ctx.lineTo(tx + 6, tty + 16);
  ctx.closePath();
  ctx.fill();

  // Dashed line target → cart
  const [cx0] = w2c(sim.state[0], 0);
  ctx.strokeStyle = 'rgba(88, 166, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(tx, tty); ctx.lineTo(cx0, tty); ctx.stroke();
  ctx.setLineDash([]);

  // Cart
  const cartW = 0.5 * scale, cartH = 0.25 * scale;
  const [cartCx, cartCy] = w2c(sim.state[0], 0);
  const r = 6;
  ctx.fillStyle = '#009688';
  ctx.beginPath();
  ctx.roundRect(cartCx - cartW / 2, cartCy - cartH / 2, cartW, cartH, r);
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#30363d';
  const wheelR = 5;
  ctx.beginPath(); ctx.arc(cartCx - cartW * 0.3, cartCy + cartH / 2, wheelR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cartCx + cartW * 0.3, cartCy + cartH / 2, wheelR, 0, Math.PI * 2); ctx.fill();

  // Rod — pivot at cart center
  const th = sim.state[2];
  const bobWx = sim.state[0] - ROD_VIS * Math.sin(th);
  const bobWy = ROD_VIS * Math.cos(th);
  const [bx, by] = w2c(bobWx, bobWy);

  ctx.strokeStyle = '#e6edf3';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cartCx, cartCy); ctx.lineTo(bx, by); ctx.stroke();

  // Bob
  const bobR = 12;
  ctx.fillStyle = '#4664aa';
  ctx.beginPath(); ctx.arc(bx, by, bobR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a7ec2';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(bx, by, bobR, 0, Math.PI * 2); ctx.stroke();

  // Force arrow
  if (Math.abs(sim.lastForce) > 0.5) {
    const arrowLen = (sim.lastForce / F_MAX) * 1.0 * scale;
    const ax1 = cartCx + arrowLen;
    ctx.strokeStyle = sim.lastForce > 0 ? 'rgba(63,185,80,0.6)' : 'rgba(248,81,73,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cartCx, cartCy); ctx.lineTo(ax1, cartCy); ctx.stroke();
    const dir = Math.sign(arrowLen);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(ax1, cartCy);
    ctx.lineTo(ax1 - dir * 8, cartCy - 5);
    ctx.lineTo(ax1 - dir * 8, cartCy + 5);
    ctx.closePath();
    ctx.fill();
  }
}
