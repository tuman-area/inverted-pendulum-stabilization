import { PHYSICS_DT } from './physics.js';

export class PID {
  constructor(kp, ki, kd) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.integral = 0;
    this.prev = 0;
    this.first = true;
  }

  compute(err) {
    const P = this.kp * err;
    this.integral += err * PHYSICS_DT;
    const I = this.ki * this.integral;
    let D = 0;
    if (this.first) this.first = false;
    else D = this.kd * (err - this.prev) / PHYSICS_DT;
    this.prev = err;
    return P + I + D;
  }

  reset() {
    this.integral = 0;
    this.prev = 0;
    this.first = true;
  }

  setGains(kp, ki, kd) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.reset();
  }
}
