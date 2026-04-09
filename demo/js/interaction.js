import { ROD_VIS, WALL, PHYSICS_DT } from './physics.js';
import { sim } from './simulation.js';
import { getWorldPos } from './renderer.js';

export function initInteraction() {
  const canvas = document.getElementById('canvas');

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const [wx, wy] = getWorldPos(e);

    const th = sim.state[2];
    const bobWx = sim.state[0] - ROD_VIS * Math.sin(th);
    const bobWy = ROD_VIS * Math.cos(th);
    const dist = Math.hypot(wx - bobWx, wy - bobWy);

    if (dist < 0.35) {
      sim.dragging = true;
      sim.dragPrevAngle = th;
    } else {
      sim.xcTarget = Math.max(-WALL, Math.min(WALL, wx));
    }
  });

  canvas.addEventListener('pointermove', e => {
    if (!sim.dragging) return;
    const [wx, wy] = getWorldPos(e);
    const dx = wx - sim.state[0];
    const dy = wy;
    sim.dragPrevAngle = sim.state[2];
    sim.state[2] = Math.atan2(-dx, dy);
  });

  function endDrag() {
    if (sim.dragging) {
      sim.state[3] = (sim.state[2] - sim.dragPrevAngle) / PHYSICS_DT * 0.3;
      sim.dragging = false;
    }
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}
