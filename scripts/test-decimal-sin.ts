import Decimal from 'decimal.js';
try {
  console.log(Decimal.sin(1).toString());
} catch (e) {
  console.log("Error:", e.message);
}
