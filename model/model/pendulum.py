import numpy as np
from scipy.integrate import solve_ivp

class InvertedPendulum:
    def __init__(self, x0, dt=0.01):
        self._x = np.array(x0, dtype=float)  # hidden state
        self.y  = np.array([[x0[0]],[x0[2]]], dtype=float)
        self.dt = dt

    def step(self, u):
        # Actuator Limitation
        uRealized = np.clip(u, -30, 30)
        # Integrate one Time Step
        sol = solve_ivp(
                lambda t,x: invPendulumODE(t,x,uRealized),
                [0, self.dt],
                self._x,
                method='RK45',
                rtol=1e-8
            )
        self._x = sol.y[:, -1]
        self.y  = self._x[[0, 2]]
        return self.y, uRealized

    def reset(self, x0=[0, 0, 0, 0]):
        self._x = np.array(x0, dtype=float)
        self.y  = np.array([[x0[0]],[x0[2]]], dtype=float)

def invPendulumODE(t, x, u): 
    # --- Parameter --- #
    mc_val = 4.0 
    mp_val = 0.36
    ls_val = 0.451
    g_val  = 9.81
    Izz_val= 0.08433
    kc_val = 0.1;     
    kp_val = 0.01;    
    
    # --- State --- #
    xc, dx, theta_val, dtheta_val = x 

    # --- Input --- #
    F_val = u

    # --- Evaluation --- #
    ddx_val = eq1(xc, dx, theta_val, dtheta_val, mc_val, mp_val, ls_val, g_val, Izz_val, kc_val, kp_val, F_val)
    ddtheta_val = eq2(xc, dx, theta_val, dtheta_val, mc_val, mp_val, ls_val, g_val, Izz_val, kc_val, kp_val, F_val)
    
    return [float(dx), ddx_val, float(dtheta_val), ddtheta_val]

def eq1(xc, dx_c, thetaS, dtheta, m_c, m_p, l_s, g, I_zz, kc, kp, F):
    return (F*I_zz + F*l_s**2*m_p - I_zz*dtheta**2*l_s*m_p*np.sin(thetaS) - I_zz*dx_c*kc - dtheta**2*l_s**3*m_p**2*np.sin(thetaS) - dtheta*kp*l_s*m_p*np.cos(thetaS) - dx_c*kc*l_s**2*m_p + (1/2)*g*l_s**2*m_p**2*np.sin(2*thetaS))/(I_zz*m_c + I_zz*m_p + l_s**2*m_c*m_p + l_s**2*m_p**2*np.sin(thetaS)**2)

def eq2(xc, dx_c, thetaS, dtheta, m_c, m_p, l_s, g, I_zz, kc, kp, F):
    return (F*l_s*m_p*np.cos(thetaS) - 1/2*dtheta**2*l_s**2*m_p**2*np.sin(2*thetaS) - dtheta*kp*m_c - dtheta*kp*m_p - dx_c*kc*l_s*m_p*np.cos(thetaS) + g*l_s*m_c*m_p*np.sin(thetaS) + g*l_s*m_p**2*np.sin(thetaS))/(I_zz*m_c + I_zz*m_p + l_s**2*m_c*m_p + l_s**2*m_p**2*np.sin(thetaS)**2)
