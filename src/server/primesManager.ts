import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_PRIMES } from './primesDefault.ts';

const ALT_STORE_NAMES = ["primes_store.json", "prime_store.json"];
const DEFAULT_STORE_NAME = ALT_STORE_NAMES[0]; // primes_store.json

export class PrimesManager {
  private storePath: string;
  private trusted: number[];
  private primes: number[] = [];

  constructor(storePath?: string) {
    this.trusted = DEFAULT_PRIMES.map(p => Math.floor(p));
    
    if (storePath) {
      this.storePath = path.resolve(storePath);
    } else {
      // Use absolute path to project root / data directory
      this.storePath = path.resolve(process.cwd(), 'data', DEFAULT_STORE_NAME);
    }
    console.log(`[PrimesManager] Initialized with storePath: ${this.storePath}`);
  }

  async init() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.storePath);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      console.error(`[PrimesManager] Error creating data directory: ${err}`);
    }
    await this.load();
  }

  private async load() {
    try {
      const exists = await fs.access(this.storePath).then(() => true).catch(() => false);
      if (exists) {
        const data = await fs.readFile(this.storePath, 'utf-8');
        const json = JSON.parse(data);
        const loadedPrimes = (json.primes || []).map((p: any) => Math.floor(Number(p)));
        
        const primesSet = new Set([...loadedPrimes, ...this.trusted]);
        this.primes = Array.from(primesSet).sort((a, b) => a - b);
        console.log(`[PrimesManager] Loaded ${this.primes.length} primes from ${this.storePath}`);
      } else {
        this.primes = [...this.trusted].sort((a, b) => a - b);
        await this.persist(this.primes);
      }
    } catch (error) {
      console.error('Error loading primes:', error);
      this.primes = [...this.trusted].sort((a, b) => a - b);
    }
  }

  private isWriting = false;
  private isGenerating = false;
  private persistTimeout: NodeJS.Timeout | null = null;

  private async persist(primes: number[]) {
    // Debounce writes to avoid hitting rate limits on file system hashing
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    return new Promise<void>((resolve) => {
      this.persistTimeout = setTimeout(async () => {
        this.persistTimeout = null;
        
        // Simple queue-like behavior for writes
        while (this.isWriting) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.isWriting = true;
        const tmpPath = `${this.storePath}.tmp`;
        try {
          console.log(`[PrimesManager] Persisting ${primes.length} primes to ${this.storePath}`);
          // Use compact JSON to reduce file size and hashing overhead
          const data = JSON.stringify({ 
            primes,
            metadata: {
              lastUpdated: new Date().toISOString(),
              count: primes.length
            }
          }); 
          
          await fs.writeFile(tmpPath, data, 'utf-8');
          await fs.rename(tmpPath, this.storePath);
          console.log(`[PrimesManager] Successfully persisted to ${this.storePath}`);
        } catch (error) {
          console.error('[PrimesManager] Error persisting primes:', error);
          try {
            await fs.unlink(tmpPath);
          } catch (unlinkError) {
            // Ignore unlink error
          }
        } finally {
          this.isWriting = false;
          resolve();
        }
      }, 500); // 500ms debounce
    });
  }

  getPrimes(): number[] {
    return [...this.primes];
  }

  async appendPrimes(newPrimes: number[]): Promise<number[]> {
    const added: number[] = [];
    const currentSet = new Set(this.primes);
    
    for (const p of newPrimes) {
      const ip = Math.floor(p);
      if (!currentSet.has(ip)) {
        this.primes.push(ip);
        currentSet.add(ip);
        added.push(ip);
      }
    }
    
    if (added.length > 0) {
      this.primes.sort((a, b) => a - b);
      await this.persist(this.primes);
    }
    return added;
  }

  async generateNextPrimes(count: number = 1): Promise<number[]> {
    while (this.isGenerating) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.isGenerating = true;
    try {
      const isPrimeSimple = (n: number): boolean => {
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        const r = Math.floor(Math.sqrt(n));
        for (let i = 3; i <= r; i += 2) {
          if (n % i === 0) return false;
        }
        return true;
      };

      const last = this.primes.length > 0 ? this.primes[this.primes.length - 1] : 1;
      const found: number[] = [];
      let candidate = last + 1;
      
      while (found.length < count) {
        if (isPrimeSimple(candidate)) {
          found.push(candidate);
        }
        candidate++;
      }

      if (found.length > 0) {
        await this.appendPrimes(found);
      }
      return found;
    } finally {
      this.isGenerating = false;
    }
  }

  async generateUpToCount(targetCount: number): Promise<number[]> {
    while (this.isGenerating) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.isGenerating = true;
    try {
      const isPrimeSimple = (n: number): boolean => {
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        const r = Math.floor(Math.sqrt(n));
        for (let i = 3; i <= r; i += 2) {
          if (n % i === 0) return false;
        }
        return true;
      };

      const found: number[] = [];
      let last = this.primes.length > 0 ? this.primes[this.primes.length - 1] : 1;
      let candidate = last + 1;
      
      const BATCH_SIZE = 1000;
      while (this.primes.length + found.length < targetCount) {
        if (isPrimeSimple(candidate)) {
          found.push(candidate);
          if (found.length >= BATCH_SIZE) {
            await this.appendPrimes(found.splice(0, BATCH_SIZE));
            // Small break to allow other operations
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        candidate++;
      }

      if (found.length > 0) {
        await this.appendPrimes(found);
      }
      return found;
    } finally {
      this.isGenerating = false;
    }
  }
}
