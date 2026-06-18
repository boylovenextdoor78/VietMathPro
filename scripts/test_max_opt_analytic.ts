import { complex, abs, subtract, add, multiply } from 'mathjs';

// Let's print out exact theoretical max.
// obj = |5z1 - z2 - 4 - 3i|
// = |5(t*B) - z2 - 4 - 3i| where B = 4z2 - 6 - i.
// We can find exact analytic maximum.
async function run() {
  const code = `
from sympy import *
import json

# Gamma is the circle of z2: center 24/11 + 4/11 i, R = sqrt(185)/11.

# Is there an easier way? Let's check D(t) + R(t) perhaps.
# We had |z1 - 3z2 - 4i| = sqrt(11)
# With z1 = t*(4z2 - 6 - i), this is | (4t-3)z2 - (6t + (t+4)*I) | = sqrt(11)
# z2 = center of Gamma + R_gamma * e^{i*phi}
# We know the circle of z2 from condition 1:
# C_t center = (6t + (t+4)*I) / (4t-3)
# C_t radius = sqrt(11) / |4t-3|

# Distance between C_t center and Gamma center:
t = Symbol('t', real=True, positive=True)
A = 4*t - 3
# center 1 = (6t + I*(t+4)) / A
c1 = (6*t + I*(t+4)) / A
c2 = Rational(24, 11) + I*Rational(4, 11)

dist_sq = abs(c1 - c2)**2
# simplify dist_sq
dist_sq = simplify(dist_sq)

# R1 = sqrt(11) / |A|
# R2 = sqrt(185)/11

# To intersect, we must have |R1 - R2| <= dist <= R1 + R2.
# Let's write dist_sq
D2 = 4*(25*t**2 - 124*t + 157) / (11 * (4*t-3)**2)

# Wait... in the previous problem, dist = R1 + R2 for minimum, or something?
# Let's calculate D2, R1, R2

print(json.dumps({
  "D2": str(D2)
}))
`;
  const { sympyService } = await import('../src/server/sympyService');
  console.log(await sympyService.runSympyCode(code));
}
run();
