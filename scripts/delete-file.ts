import fs from 'node:fs';

try {
  fs.unlinkSync('prime_store.json');
  console.log('prime_store.json deleted successfully.');
} catch (error) {
  console.error('Error deleting prime_store.json:', error);
}
