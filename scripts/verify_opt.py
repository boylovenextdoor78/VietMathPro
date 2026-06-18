import numpy as np
import cmath

# Testing the constraint z1 = t*(2+i)*z2
def test():
    t_vals = np.linspace(0, 5, 50000)
    best_min = float('inf')
    best_z1 = None
    best_z2 = None

    for t in t_vals:
        # |z1 - 3z2 - 4i| = sqrt(13)
        # z1 = t*(2+i)*z2
        # |t(2+i)z2 - 3z2 - 4i| = sqrt(13)
        # |(2t - 3 + t*i)*z2 - 4i| = sqrt(13)
        
        # A = (2t - 3) + t*i
        A_real = 2*t - 3
        A_imag = t
        A = complex(A_real, A_imag)
        B = complex(0, -4)
        
        # |A*z2 + B| = sqrt(13)
        # z2 = (-B + sqrt(13)*exp(i*theta)) / A
        
        r_A = abs(A)
        if r_A < 1e-9:
            continue
            
        center = -B / A
        radius = np.sqrt(13) / r_A
        
        for theta in np.linspace(0, 2*np.pi, 2000):
            z2 = center + radius * cmath.exp(1j * theta)
            z1 = t * (2+1j) * z2
            
            val = abs(z1 + z2 - 4 - 6j)
            if val < best_min:
                best_min = val
                best_z1 = z1
                best_z2 = z2

    print("Best min:", best_min)
    print("z1:", best_z1)
    print("z2:", best_z2)
    
    # compare with answer
    ans_min = np.sqrt((8753 - 2232*np.sqrt(10))/185)
    print("Ans min:", ans_min)

test()
