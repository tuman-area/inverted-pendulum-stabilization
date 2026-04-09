import { PHYSICS_DT } from './physics.js';
import { sim, physicsStep } from './simulation.js';
import { initRenderer, render } from './renderer.js';
import { initInteraction } from './interaction.js';
import { initUI, updateStatus } from './ui.js';
import { initGraph, recordSample, renderGraph } from './graph.js';

let lastTime = 0;
let accumulator = 0;

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  if (!sim.paused && !sim.dragging) {
    accumulator += dt;
    while (accumulator >= PHYSICS_DT) {
      physicsStep();
      recordSample();
      accumulator -= PHYSICS_DT;
    }
  }

  render();
  renderGraph();
  updateStatus();
  requestAnimationFrame(loop);
}

initRenderer();
initInteraction();
initGraph();
initUI();
requestAnimationFrame(loop);
