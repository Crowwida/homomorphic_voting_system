// Simple implementation of Paillier Cryptosystem for educational purposes

export const gcd = (a: bigint, b: bigint): bigint => {
  while (b !== 0n) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
};

export const lcm = (a: bigint, b: bigint): bigint => {
  return (a * b) / gcd(a, b);
};

export const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
};

export const modInv = (a: bigint, m: bigint): bigint => {
  let m0 = m;
  let y = 0n;
  let x = 1n;
  if (m === 1n) return 0n;
  while (a > 1n) {
    let q = a / m;
    let t = m;
    m = a % m;
    a = t;
    t = y;
    y = x - q * y;
    x = t;
  }
  if (x < 0n) x += m0;
  return x;
};

const generateRandomBigInt = (bits: number): bigint => {
  const bytes = Math.ceil(bits / 8);
  const array = new Uint8Array(bytes);
  window.crypto.getRandomValues(array);
  
  let result = 0n;
  for (let i = 0; i < bytes; i++) {
    result = (result << 8n) | BigInt(array[i]);
  }
  
  const extraBits = (bytes * 8) - bits;
  if (extraBits > 0) {
    result = result >> BigInt(extraBits);
  }
  
  // Ensure MSB is 1
  result = result | (1n << BigInt(bits - 1));
  return result;
};

const isProbablePrime = (n: bigint, k = 5): boolean => {
  if (n === 2n || n === 3n) return true;
  if (n <= 1n || n % 2n === 0n) return false;

  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s += 1n;
  }

  for (let i = 0; i < k; i++) {
    // Generate random a in [2, n-2]
    let a = 2n + generateRandomBigInt(32) % (n - 3n);
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    
    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
};

export const generatePrime = (bits: number): bigint => {
  while (true) {
    let p = generateRandomBigInt(bits);
    if (p % 2n === 0n) p += 1n;
    if (isProbablePrime(p)) return p;
  }
};

export class PublicKey {
  n: bigint;
  nSq: bigint;
  g: bigint;

  constructor(n: bigint, g: bigint) {
    this.n = n;
    this.nSq = n * n;
    this.g = g;
  }

  encrypt(m: bigint): bigint {
    let r: bigint;
    do {
      r = generateRandomBigInt(64) % this.n;
    } while (r <= 1n || gcd(r, this.n) !== 1n);
    
    const gm = modPow(this.g, m, this.nSq);
    const rn = modPow(r, this.n, this.nSq);
    return (gm * rn) % this.nSq;
  }

  add(c1: bigint, c2: bigint): bigint {
    return (c1 * c2) % this.nSq;
  }
}

export class PrivateKey {
  lambda: bigint;
  mu: bigint;
  publicKey: PublicKey;

  constructor(lambda: bigint, mu: bigint, publicKey: PublicKey) {
    this.lambda = lambda;
    this.mu = mu;
    this.publicKey = publicKey;
  }

  decrypt(c: bigint): bigint {
    const nSq = this.publicKey.nSq;
    const n = this.publicKey.n;
    const u = modPow(c, this.lambda, nSq);
    const l = (u - 1n) / n;
    return (l * this.mu) % n;
  }
}

export const generateKeyPair = (bits = 128): { publicKey: PublicKey, privateKey: PrivateKey } => {
  const p = generatePrime(bits);
  const q = generatePrime(bits);
  const n = p * q;
  const nSq = n * n;
  const g = n + 1n;
  const lambda = lcm(p - 1n, q - 1n);
  
  const u = modPow(g, lambda, nSq);
  const l = (u - 1n) / n;
  const mu = modInv(l, n);

  const publicKey = new PublicKey(n, g);
  const privateKey = new PrivateKey(lambda, mu, publicKey);

  return { publicKey, privateKey };
};
