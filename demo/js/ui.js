import { T, LANG_META, getLang, setLangCode } from './i18n.js';
import { sim, pidTheta, pidCart, PRESETS, resetSim, togglePause, applyDisturbance } from './simulation.js';
import { clearHistory } from './graph.js';
/* --- Language --- */

export function applyLang(l) {
  setLangCode(l);
  document.documentElement.lang = l;
  document.getElementById('lang-flag').textContent = LANG_META[l].flag;
  document.getElementById('lang-label').textContent = LANG_META[l].label;
  ['en', 'de', 'ru'].forEach(code => {
    document.getElementById(`opt-${code}`).classList.toggle('active', code === l);
  });
  const sel = document.getElementById('lang-select');
  sel.classList.remove('open');
  document.getElementById('lang-toggle').setAttribute('aria-expanded', 'false');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (T[l][key] !== undefined) el.textContent = T[l][key];
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (T[l][key] !== undefined) {
      el.title = T[l][key];
      el.setAttribute('aria-label', T[l][key]);
    }
  });

  syncPauseButton();
  updateStatus();
}

/* --- Achievement toast --- */

let wasFallen = false;
let achievementShown = false;
let toastTimeout = null;

function showAchievement(title) {
  const el = document.getElementById('achievement');
  document.getElementById('achievement-title').textContent = title;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 4000);
}

/* --- Status --- */

export function updateStatus() {
  const l = getLang();
  const th = Math.abs(sim.state[2]);
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-text');

  if (th > Math.PI / 2) {
    dot.className = 'indicator st-fallen';
    txt.textContent = T[l].fallen;
    if (!wasFallen) {
      wasFallen = true;
      if (!achievementShown) {
        achievementShown = true;
        showAchievement(T[l].achFallen);
      }
    }
  } else if (th > 0.02 || Math.abs(sim.state[3]) > 0.1) {
    wasFallen = false;
    dot.className = 'indicator st-stabilizing';
    txt.textContent = T[l].stabilizing;
  } else {
    wasFallen = false;
    dot.className = 'indicator st-stable';
    txt.textContent = T[l].stable;
  }

  document.getElementById('val-xc').textContent = sim.state[0].toFixed(2);
  document.getElementById('val-theta').textContent = (sim.state[2] * 180 / Math.PI).toFixed(1);
  document.getElementById('val-target').textContent = sim.xcTarget.toFixed(2);
  document.getElementById('val-force').textContent = sim.lastForce.toFixed(1);
}

/* --- Pause button sync --- */

function syncPauseButton() {
  const l = getLang();
  const btn = document.getElementById('btn-pause');
  const key = sim.paused ? 'play' : 'pause';
  btn.textContent = sim.paused ? '\u25B6\uFE0F' : '\u23F8\uFE0F';
  btn.title = T[l][key];
  btn.setAttribute('aria-label', T[l][key]);
  btn.setAttribute('data-i18n-title', key);
}

/* --- Sliders --- */

const SLIDER_CFG = [
  { id: 's-tkp', val: 'v-tkp', fmt: v => v.toFixed(0) },
  { id: 's-tki', val: 'v-tki', fmt: v => v.toFixed(2) },
  { id: 's-tkd', val: 'v-tkd', fmt: v => v.toFixed(1) },
  { id: 's-ckp', val: 'v-ckp', fmt: v => v.toFixed(1) },
  { id: 's-cki', val: 'v-cki', fmt: v => v.toFixed(2) },
  { id: 's-ckd', val: 'v-ckd', fmt: v => v.toFixed(1) },
];

function applyGainsFromSliders() {
  pidTheta.setGains(
    parseFloat(document.getElementById('s-tkp').value),
    parseFloat(document.getElementById('s-tki').value),
    parseFloat(document.getElementById('s-tkd').value),
  );
  pidCart.setGains(
    parseFloat(document.getElementById('s-ckp').value),
    parseFloat(document.getElementById('s-cki').value),
    parseFloat(document.getElementById('s-ckd').value),
  );
}

function setSliderValues(theta, cart) {
  const all = [...theta, ...cart];
  SLIDER_CFG.forEach((s, i) => {
    document.getElementById(s.id).value = all[i];
    document.getElementById(s.val).textContent = s.fmt(all[i]);
  });
}

function clearActivePreset() {
  document.querySelectorAll('.preset-row button').forEach(b => b.classList.remove('active'));
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  setSliderValues(p.theta, p.cart);
  pidTheta.setGains(...p.theta);
  pidCart.setGains(...p.cart);
  document.querySelectorAll('.preset-row button').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === name);
  });
}

/* --- Init --- */

export function initUI() {
  // Sliders
  SLIDER_CFG.forEach(s => {
    document.getElementById(s.id).addEventListener('input', e => {
      document.getElementById(s.val).textContent = s.fmt(parseFloat(e.target.value));
      applyGainsFromSliders();
      clearActivePreset();
    });
  });

  // Presets
  document.querySelectorAll('.preset-row button').forEach(b => {
    b.addEventListener('click', () => applyPreset(b.dataset.preset));
  });

  // Language
  const langToggle = document.getElementById('lang-toggle');
  langToggle.addEventListener('click', () => {
    const sel = document.getElementById('lang-select');
    const isOpen = sel.classList.toggle('open');
    langToggle.setAttribute('aria-expanded', String(isOpen));
  });
  document.addEventListener('click', e => {
    const sel = document.getElementById('lang-select');
    if (!sel.contains(e.target)) {
      sel.classList.remove('open');
      langToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const sel = document.getElementById('lang-select');
      if (sel.classList.contains('open')) {
        sel.classList.remove('open');
        langToggle.setAttribute('aria-expanded', 'false');
        langToggle.focus();
      }
    }
  });
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });

  // Action buttons
  document.getElementById('btn-reset').addEventListener('click', () => {
    resetSim();
    clearHistory();
    updateStatus();
  });
  document.getElementById('btn-pause').addEventListener('click', () => {
    togglePause();
    syncPauseButton();
  });
  document.getElementById('btn-disturb').addEventListener('click', applyDisturbance);

  // Defaults
  applyLang('en');
  applyPreset('tracking');
}
