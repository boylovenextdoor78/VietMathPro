function findExact() {
  // Let U = z1 - 3*z2 - 4i
  // V = z1 + 4*z2 - i - 6
  // Obj = |3U + 2V + 8 + 11i|
  // We know |U| = sqrt(11).
  // What is the max of |2V + 8 + 11i|?
  // V = (t+1)*B where B = 4z2 - 6 - i.
  // Actually, V = (t+1)B. And U = tB + C where C = -3z2 - 4i.
  // This seems very complicated geometrically. Is there a simpler relation?
  // Let's print out the value of |2V + 8 + 11i| + 3*sqrt(11).
  console.log("obj should be exactly |3U| + |2V + 8 + 11i| if they align.");
}
findExact();
