import { solveAdvancedMathLocal } from '../src/services/localMath';

async function test() {
  const res1 = await solveAdvancedMathLocal('limit of sum of 1/n^m from n=1 to infinity as m approaches infinity', 'Advanced Symbolic Engine');
  console.log(res1);
  const res2 = await solveAdvancedMathLocal('limit of Sum of 1/n^m from n=1 to infinity, m->infinity', 'Advanced Symbolic Engine');
  console.log(res2);
}
test();
