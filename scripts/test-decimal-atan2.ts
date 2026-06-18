import Decimal from 'decimal.js';
try {
  console.log(Decimal.atan2(1, 1).toString());
} catch (e) {
  console.log("Error:", e.message);
}
