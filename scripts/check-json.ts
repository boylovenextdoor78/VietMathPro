import fs from 'node:fs';

try {
  const data = fs.readFileSync('data/primes_store.json', 'utf-8');
  const json = JSON.parse(data);
  console.log('data/primes_store.json is valid JSON.');
  console.log('Total primes:', json.primes.length);
  console.log('Last prime:', json.primes[json.primes.length - 1]);
} catch (error) {
  console.error('Error reading/parsing data/primes_store.json:', error);
}

try {
  const data = fs.readFileSync('data/prime_store.json', 'utf-8');
  console.log('data/prime_store.json read success (unexpected).');
} catch (error) {
  console.error('Error reading data/prime_store.json:', error);
}
