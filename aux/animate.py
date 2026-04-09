from matplotlib.animation import FuncAnimation
from IPython.display import HTML
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

def showAnimation(t, xc, theta, fps=30):
    L = 1.0
    dt = 1.0 / fps

    # ---- Resample to EXACTLY fps ----
    duration = t[-1] - t[0]
    n_frames = int(np.ceil(duration * fps))
    t_frames = t[0] + np.arange(n_frames) * dt

    xc_frames = np.interp(t_frames, t, xc)
    theta_frames = np.interp(t_frames, t, theta)

    # ---- Plot setup ----
    fig, ax = plt.subplots()
    ax.set_aspect('equal')
    ax.grid(True)
    ax.set_xlim([-3, 3])
    ax.set_ylim([-2, 2])

    yl = ax.get_ylim()

    # Left region (x < -2)
    left_patch = Rectangle(
        (-3, yl[0]),   # (x, y)
        1,             # width: from -3 to -2
        yl[1] - yl[0], # full height
        facecolor='red',
        alpha=0.5,
        edgecolor='none'
    )
    ax.add_patch(left_patch)
    
    # Right region (x > 2)
    right_patch = Rectangle(
        (2, yl[0]),    # start at x = 2
        1,             # width: from 2 to 3
        yl[1] - yl[0],
        facecolor='red',
        alpha=0.5,
        edgecolor='none'
    )
    ax.add_patch(right_patch)

    ax.set_xlim([-3, 3])
    ax.set_ylim([-2, 2])
    
    # Ground
    ax.plot([-3, 3], [0, 0], 'k', zorder=2)

    # Cart
    cart = Rectangle(
        (0, -0.1), 
        0.4, 
        0.2,
        facecolor=(0, 150/255, 130/255),
        zorder=3
    )
    ax.add_patch(cart)

    # Rod + bob
    rod_line, = ax.plot([], [], 'k-', linewidth=2, zorder=4)
    mass_point, = ax.plot([], [], 'o', markersize=10,
                         color=(70/255, 100/255, 170/255), zorder=5)

    # ---- Update function ----
    def update(i):
        cartPosition = xc_frames[i]
        mass_x = cartPosition - L * np.sin(theta_frames[i])
        mass_y = L * np.cos(theta_frames[i])

        cart.set_xy((cartPosition - 0.2, -0.1))
        rod_line.set_data([cartPosition, mass_x], [0, mass_y])
        mass_point.set_data([mass_x], [mass_y])

        ax.set_title(f"Time = {t_frames[i]:.2f} sec")
        return cart, rod_line, mass_point

    # ---- Animation ----
    ani = FuncAnimation(
        fig,
        update,
        frames=n_frames,
        interval=1000 / fps,
        blit=True
    )
    
    plt.close(fig)
    return HTML(ani.to_jshtml())