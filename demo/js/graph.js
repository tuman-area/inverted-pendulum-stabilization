import { sim } from './simulation.js';
import { PHYSICS_DT } from './physics.js';

const HISTORY_SEC = 6;
const MAX_SAMPLES = Math.ceil(HISTORY_SEC / PHYSICS_DT);

const history = {
  theta: [],
  xc: [],
  target: [],
};

let canvas, ctx;
let sampleCounter = 0;
const SAMPLE_EVERY = 3; // record every 3rd physics step (~30 Hz)

export function initGraph() {
  canvas = document.getElementById('graph-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  window.addEventListener('resize', resizeGraph);
  resizeGraph();
}

export function resizeGraph() {
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = 180 * dpr;
  canvas.style.height = '180px';
}

export function recordSample() {
  sampleCounter++;
  if (sampleCounter % SAMPLE_EVERY !== 0) return;

  const maxLen = MAX_SAMPLES / SAMPLE_EVERY;
  history.theta.push(sim.state[2]);
  history.xc.push(sim.state[0]);
  history.target.push(sim.xcTarget);

  if (history.theta.length > maxLen) {
    history.theta.shift();
    history.xc.shift();
    history.target.shift();
  }
}

export function clearHistory() {
  history.theta.length = 0;
  history.xc.length = 0;
  history.target.length = 0;
}

export function renderGraph() {
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  const pad = { top: 12 * dpr, bottom: 6 * dpr, left: 48 * dpr, right: 12 * dpr };
  const plotW = W - pad.left - pad.right;
  const halfH = (H - pad.top - pad.bottom) / 2;
  const midY = pad.top + halfH;

  ctx.clearRect(0, 0, W, H);

  // background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // divider
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, midY);
  ctx.lineTo(W - pad.right, midY);
  ctx.stroke();

  const n = history.theta.length;
  if (n < 2) return;

  drawPanel(pad.left, pad.top, plotW, halfH, n, 'theta', {
    data: history.theta,
    color: '#58a6ff',
    label: '\u03B8',
    unit: 'rad',
    yMin: -0.5,
    yMax: 0.5,
    zero: true,
    dpr,
  });

  drawPanel(pad.left, midY, plotW, halfH, n, 'xc', {
    data: history.xc,
    color: '#3fb950',
    label: 'xc',
    unit: 'm',
    yMin: -3.5,
    yMax: 3.5,
    zero: true,
    target: history.target,
    targetColor: 'rgba(88,166,255,0.35)',
    dpr,
  });
}

function drawPanel(x0, y0, w, h, n, _id, opts) {
  const { data, color, label, unit, yMin, yMax, zero, target, targetColor, dpr } = opts;

  // zero line
  if (zero) {
    const zy = y0 + h * (1 - (0 - yMin) / (yMax - yMin));
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, zy);
    ctx.lineTo(x0 + w, zy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // y-axis labels
  ctx.fillStyle = '#8b949e';
  ctx.font = `${10 * dpr}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${yMax}`, x0 - 4 * dpr, y0);
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${yMin}`, x0 - 4 * dpr, y0 + h);

  // label
  ctx.fillStyle = color;
  ctx.font = `bold ${11 * dpr}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${label} (${unit})`, x0 + 4 * dpr, y0 + 2 * dpr);

  // target line (for xc panel)
  if (target) {
    ctx.strokeStyle = targetColor;
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = x0 + (i / (n - 1)) * w;
      const py = y0 + h * (1 - (target[i] - yMin) / (yMax - yMin));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // data line
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const px = x0 + (i / (n - 1)) * w;
    const val = Math.max(yMin, Math.min(yMax, data[i]));
    const py = y0 + h * (1 - (val - yMin) / (yMax - yMin));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}
