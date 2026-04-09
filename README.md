# Inverted Pendulum Stabilization - PID Control

[![pendulum](https://img.shields.io/badge/pendulum-balanced-brightgreen?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI0IiByPSIyIiBmaWxsPSIjZmZmIi8+PGxpbmUgeDE9IjEyIiB5MT0iNiIgeDI9IjEyIiB5Mj0iMjAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIyMiIgcj0iMyIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==)](https://tuman-area.github.io/inverted-pendulum-stabilization/demo/)

> Two parallel PID controllers stabilize an inverted pendulum on a cart and drive it to
> arbitrary target positions - all without velocity measurements.
>
> **[⚡ Try the interactive demo](https://tuman-area.github.io/inverted-pendulum-stabilization/demo/)**

---

## 📖 Problem

An inverted pendulum on a cart is inherently unstable - any deviation from vertical grows
exponentially under gravity. The controller applies horizontal force to the cart in real time
to keep the pendulum upright.

### State vector

$$
\boldsymbol{x} = \begin{bmatrix} x_c \\\ \dot{x}_c \\\ \theta \\\ \dot{\theta} \end{bmatrix}
$$

- $x_c$ - horizontal position of the cart [m]
- $\dot{x}_c$ - velocity of the cart [m/s]
- $\theta$ - angle of the pendulum from the vertical [rad] ($\theta = 0$ means upright)
- $\dot{\theta}$ - angular velocity of the pendulum [rad/s]

Only $x_c$ and $\theta$ are directly measurable. The velocities remain hidden - a constraint that matters for controller design.

### Sign convention

$\theta$ is measured from the upright vertical. Positive $\theta$ is a counterclockwise rotation - the pendulum leans to the left. $F > 0$ pushes the cart to the right.

### Constraints

Actuator is limited to $\pm 30\text{ N}$, cart must stay within $|x_c| < 2\text{ m}$. Dynamics are derived via Euler-Lagrange and solved numerically with Runge-Kutta methods (fixed-step RK4 in the browser demo, adaptive RK45 via `scipy` in the notebooks).

### System parameters

| Symbol | Description | Value |
|--------|-------------|-------|
| $m_c$ | Cart mass | 4.0 kg |
| $m_p$ | Pendulum mass | 0.36 kg |
| $l_s$ | Rod length (to CoM) | 0.451 m |
| $g$ | Gravity | 9.81 m/s |
| $I_{zz}$ | Moment of inertia | 0.08433 kg m |
| $k_c$ | Cart friction | 0.1 N s/m |
| $k_p$ | Joint friction | 0.01 N m s/rad |
| $F_{\max}$ | Actuator limit | +/-30 N |

---

## 🏗️ Control architecture

### PID in a nutshell

A closed-loop controller measures the output, computes an error $e = r - y$, and feeds a corrective force back into the plant:

$$u(t) \xrightarrow{\text{force}} \boxed{\text{Plant}} \xrightarrow{y} \text{measurement} \xrightarrow{e = r - y} \boxed{\text{Controller}} \xrightarrow{u(t)}$$

The PID control law computes the force as a sum of three terms:

$$u(t) = K_p \, e(t) + K_i \int_0^t e(\tau)\, d\tau + K_d \, \frac{de(t)}{dt}$$

- **P (proportional)** - force proportional to current error. Larger $K_p$ means stronger correction, but too much causes overshoot.
- **I (integral)** - accumulates past errors to eliminate steady-state offset. Too much $K_i$ causes windup.
- **D (derivative)** - reacts to the rate of change. Provides damping and reduces overshoot, but amplifies noise.

Full derivation and discrete-time implementation details in [`solutions/task_1.ipynb`](solutions/task_1.ipynb).

### Why one PID is not enough

A single PID on $\theta$ stabilizes the angle but ignores cart position entirely - the cart drifts toward the rail limits while the pendulum stays upright.

### Parallel PID architecture

The solution: two PID controllers running in parallel, their outputs summed into a single force command.

$$F = \text{PID}_\theta(0 - \theta) + \text{PID}_{x_c}(x_c^{\text{ref}} - x_c)$$

$$
\boxed{\text{Plant}} \xrightarrow{\theta,\, x_c} \begin{cases} (0 - \theta) \to \boxed{\text{Angle PID}} \to F_\theta \\\ (x_c^{\text{ref}} - x_c) \to \boxed{\text{Cart PID}} \to F_x \end{cases} \xrightarrow{F = F_\theta + F_x} \boxed{\text{Plant}}
$$

- **Angle PID** (dominant) - detects tilt and pushes the cart beneath the pendulum to catch it.
- **Cart PID** (corrective) - uses **negative** gains to intentionally tilt the pendulum toward the target. The stronger angle PID compensates by accelerating the cart.
- **Parallel architecture** avoids derivative kick - both setpoints are constant or slow-varying, so D-terms only react to smooth process variables.

---

## 🎯 Task 1 - Stabilization

Keep the pendulum upright from a perturbed initial condition ($\theta_0 = 0.3$ rad, roughly 17 degrees).

| Controller | $K_p$ | $K_i$ | $K_d$ |
|------------|--------|--------|--------|
| Angle PID | 150 | 0.5 | 15 |
| Cart PID | -5 | -0.05 | -5 |

Stabilizes in about 2 seconds. Cart stays well within +/-2 m, force within +/-30 N.

Full analysis: [`solutions/task_1.ipynb`](solutions/task_1.ipynb)

---

## 🎯 Task 2 - Position control

Move the cart to an arbitrary target while keeping the pendulum stable.

Same architecture, just the cart PID reference becomes time-varying. Cart PID gains were bumped up for faster convergence.

| Controller | $K_p$ | $K_i$ | $K_d$ |
|------------|--------|--------|--------|
| Angle PID | 150 | 0.5 | 15 |
| Cart PID | -10 | -0.30 | -8 |

Reaches 1.0 m target in about 11 s (down from 16 s with task 1 gains). Overshoot is around 37% - an inherent PID limitation since there's no velocity feedback. Safe target range is $|x_c^{\text{ref}}| \leq 1.4$ m so the overshoot stays within rail limits. Multi-step trajectories work fine.

Full analysis: [`solutions/task_2.ipynb`](solutions/task_2.ipynb)

---

## 🖥️ Interactive demo

Browser-based simulation with the exact same physics model ported from Python to JavaScript.

- **Real-time physics** - Runge-Kutta 4th order integration, nonlinear 4-DOF ODE, 10 ms timestep
- **Interactive** - click the track to set target, drag the bob to disturb
- **Tunable** - adjust all 6 PID gains via sliders in real time
- **Presets** - Stabilization, Position Tracking, Conservative, PID Off
- **Multilingual** - English, Deutsch, Russian

**[Open demo](https://tuman-area.github.io/inverted-pendulum-stabilization/demo/)**

---

## 🔮 Future work

- **Swing-up controller** - energy-based controller (Astrom/Furuta) that automatically swings the pendulum from any position back to upright, then hands off to PID stabilization. Would make the pendulum "unkillable"
- **LQR controller** - replace PID with a linear-quadratic regulator for optimal state feedback
- **Model predictive control (MPC)** - nonlinear MPC for better constraint handling and trajectory planning

---

## ⚙️ Developer zone

### Project structure

```
inverted-pendulum-stabilization/
├── demo/                        Browser demo (served via GitHub Pages)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── main.js              Game loop (requestAnimationFrame)
│       ├── physics.js           ODE model, RK4 integrator
│       ├── pid.js               PID controller class
│       ├── simulation.js        State management, presets
│       ├── renderer.js          Canvas 2D rendering
│       ├── graph.js             Real-time oscilloscope (theta, x_c)
│       ├── interaction.js       Mouse/touch input
│       ├── ui.js                Sliders, presets, status bar
│       └── i18n.js              Translations (EN/DE/RU)
├── solutions/
│   ├── task_1.ipynb             Stabilization - analysis and PID tuning
│   └── task_2.ipynb             Position control - trajectory tracking
├── model/
│   ├── modelSymbolic.ipynb      Symbolic derivation (SymPy)
│   └── model/
│       └── pendulum.py          Inverted pendulum ODE (Python)
└── aux/
    └── animate.py               Matplotlib animation helper
```

### Running the demo locally

```bash
# Clone and jump to demo
git clone https://github.com/tuman-area/inverted-pendulum-stabilization.git
cd inverted-pendulum-stabilization/demo

# Start local server and open in browser
python3 -m http.server 8000
open http://localhost:8000
```

### Running the notebooks

Requires Python 3.14+ and [uv](https://docs.astral.sh/uv/).

```bash
# create venv and install dependencies
cd inverted-pendulum-stabilization
uv venv --python 3.14
source .venv/bin/activate
uv pip install numpy scipy matplotlib jupyter

# launch jupyter (select the .venv kernel in the notebook UI)
jupyter notebook solutions/
```

---

## 📝 Credits

This project was developed as part of the CDS Hackathon SS26 at Karlsruhe Institute of Technology (KIT), supervised by Dr.-Ing. Pascal Jerono and Lukas Richter, M.Sc.

The Python simulation engine (`model/` and `aux/`) was provided as course infrastructure. PID controller design, gain tuning, and the browser-based interactive demo are original work.
