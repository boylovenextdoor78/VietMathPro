import * as math from 'mathjs';

const bigMath = math.create(math.all, {
  number: 'BigNumber',
  precision: 60
});

bigMath.import({
  G: bigMath.bignumber('0.9159655941772190150546035149323841107741493742816721342664981196'),
  ln: bigMath.log
});

try {
  const expr = "(sqrt(3)*(2*ln(8+3*sqrt(3)) - ln(37)))/12";
  const val = bigMath.evaluate(expr);
  console.log("Value:", val.toString());
  
  // Truncate to 25 decimal places
  const strVal = bigMath.format(val, { notation: 'fixed', precision: 30 });
  const parts = strVal.split('.');
  if (parts.length === 2) {
    console.log("Truncated:", parts[0] + '.' + parts[1].substring(0, 25));
  }
} catch (e) {
  console.error(e);
}
