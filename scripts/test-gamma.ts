import * as math from 'mathjs';

const bigMath = math.create(math.all, {
  number: 'BigNumber',
  precision: 60
});

try {
  const val = bigMath.evaluate('gamma(5.08999)');
  console.log("Gamma:", val.toString());
} catch (e) {
  console.error("Error:", e);
}
