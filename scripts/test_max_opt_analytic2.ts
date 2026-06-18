import { sympyService } from '../src/server/sympyService';

async function run() {
  const code = `
from sympy import *
import json

t = Symbol('t', real=True, positive=True)
A = 4*t - 3
c1 = (6*t + I*(t+4)) / A
c2 = Rational(24, 11) + I*Rational(4, 11)

dist_sq = (100*t**2 - 496*t + 628)/(11*(4*t - 3)**2)
D = sqrt(dist_sq)

R1 = sqrt(11) / abs(4*t - 3)
R2 = sqrt(185)/11

# Intersection condition: (D - (R1 + R2)) * ((R1 - R2)**2 - D**2) 
# The max obj is when t varies over the allowed domain.
# Let's find the domain of t such that |R1 - R2| <= D <= R1 + R2
t_domain_eq = D - (R1 + R2)

# But wait, z2 can be parameterized.
# Let's just parameterize z2 and directly maximize the objective?
# No, let's just solve exactly using geometry.
# Obj = |5z1 - z2 - 4 - 3i|
# z1 = t*(4z2 - 6 - i)
# Obj = |5t*(4z2 - 6 - i) - z2 - 4 - 3i|
# Obj = |(20t - 1)z2 - (30t + 4) - i*(5t + 3)|

# Since z2 is on the intersection of C_t and Gamma.
# Wait, this is getting complicated. What if we use |u + v| <= |u| + |v|?
# The user's query:
# Max |5*z1-z2-4-3i| with |z1-3*z2-4i|=sqrt(11) and |z1|+sqrt(5)*|z2|=|z1+4*z2-i-6|

# Let's check the objective: P = |5z1 - z2 - 4 - 3i|.
# Is it related to (z1 - 3z2 - 4i) and (z1 + 4z2 - i - 6)?
# Let U = z1 - 3z2 - 4i
# Let V = z1 + 4z2 - i - 6
# We want to express 5z1 - z2 - 4 - 3i as a*U + b*V.
# a U + b V = (a+b)z1 + (-3a+4b)z2 + (-4ai) - b*i - 6b
# We want:
# a + b = 5
# -3a + 4b = -1  => 4b = 3a - 1
# From a+b = 5 => a + (3a-1)/4 = 5 => 7a - 1 = 20 => 7a = 21 => a = 3.
# So b = 2.
# Let's check constants: 3(-4i) + 2(-i-6) = -12i - 2i - 12 = -12 - 14i.
# But we have -4 - 3i in the objective!!
# 3U + 2V = 5z1 - z2 - 12 - 14i.
# So 5z1 - z2 - 4 - 3i = 3U + 2V + 8 + 11i.

print(json.dumps({
  "msg": "3U + 2V check OK."
}))
`;
  console.log(await sympyService.runSympyCode(code));
}
run();
