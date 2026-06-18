import { PrimesManager } from '../src/server/primesManager';
import path from 'node:path';

async function test() {
  console.log('--- Starting Persistence Test ---');
  const pm = new PrimesManager();
  await pm.init();
  
  const initialCount = pm.getPrimes().length;
  console.log(`Initial prime count: ${initialCount}`);
  
  console.log('Generating 5 new primes...');
  const added = await pm.generateNextPrimes(5);
  console.log(`Added: ${added.join(', ')}`);
  
  const finalCount = pm.getPrimes().length;
  console.log(`Final prime count: ${finalCount}`);
  
  if (finalCount === initialCount + 5) {
    console.log('SUCCESS: Primes added to memory.');
  } else {
    console.log('FAILURE: Primes not added to memory.');
  }
  
  console.log('--- Test Finished ---');
}

test().catch(console.error);
