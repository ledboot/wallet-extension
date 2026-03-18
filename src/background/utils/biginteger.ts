/*
 * ES6/TypeScript module rewrite of jsbn BigInteger (Tom Wu et al.)
 * Source adapted from legacy biginteger.js included in ANEX/www/js.
 * Minimal typing (any) is used to keep parity with prototype-based API.
 */

 

declare const navigator: any;

// Encapsulate original IIFE content and export constructors
// We avoid assigning to window and instead export the symbols

// BEGIN: Ported jsbn implementation (lightly adapted)

// (function () { ... })(); → inline scope

// Constructor function of Global BigInteger object
const BigInteger: any = function BigInteger(
  this: any,
  a?: any,
  b?: any,
  c?: any
) {
  if (!(this instanceof BigInteger)) 
    {
      return new (BigInteger as any)(a, b, c);
    }
  if (a != null)
    if (typeof a === 'number') {
      (this as any).fromNumber(a, b, c);
    }
    else if (b == null && typeof a !== 'string')
      {
        (this as any).fromString(a, 256);
      }
    else {
      (this as any).fromString(a, b);
    }
} as any;

// Bits per digit
let dbits: any;

// JavaScript engine analysis
const canary = 0xdeadbeefcafe;
const j_lm = (canary & 0xffffff) === 0xefcafe;

function nbi(): any {
  return new (BigInteger as any)(null);
}

// am1
function am1(this: any, i: any, x: any, w: any, j: any, c: any, n: any) {
  while (--n >= 0) {
    const v = x * this[i++] + w[j] + c;
    c = Math.floor(v / 0x4000000);
    w[j++] = v & 0x3ffffff;
  }
  return c;
}
// am2
function am2(this: any, i: any, x: any, w: any, j: any, c: any, n: any) {
  const xl = x & 0x7fff,
    xh = x >> 15;
  while (--n >= 0) {
    let l = this[i] & 0x7fff;
    const h = this[i++] >> 15;
    const m = xh * l + h * xl;
    l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
    c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
    w[j++] = l & 0x3fffffff;
  }
  return c;
}
// am3
function am3(this: any, i: any, x: any, w: any, j: any, c: any, n: any) {
  const xl = x & 0x3fff,
    xh = x >> 14;
  while (--n >= 0) {
    let l = this[i] & 0x3fff;
    const h = this[i++] >> 14;
    const m = xh * l + h * xl;
    l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
    c = (l >> 28) + (m >> 14) + xh * h;
    w[j++] = l & 0xfffffff;
  }
  return c;
}

// Choose best am implementation (guard navigator)
if (
  j_lm &&
  typeof navigator !== 'undefined' &&
  navigator.appName === 'Microsoft Internet Explorer'
) {
  (BigInteger as any).prototype.am = am2;
  dbits = 30;
} else if (
  j_lm &&
  typeof navigator !== 'undefined' &&
  navigator.appName !== 'Netscape'
) {
  (BigInteger as any).prototype.am = am1;
  dbits = 26;
} else {
  (BigInteger as any).prototype.am = am3;
  dbits = 28;
}

(BigInteger as any).prototype.DB = dbits;
(BigInteger as any).prototype.DM = (1 << dbits) - 1;
(BigInteger as any).prototype.DV = 1 << dbits;

const BI_FP = 52;
(BigInteger as any).prototype.FV = Math.pow(2, BI_FP);
(BigInteger as any).prototype.F1 = BI_FP - dbits;
(BigInteger as any).prototype.F2 = 2 * dbits - BI_FP;

// Digit conversions
const BI_RM = '0123456789abcdefghijklmnopqrstuvwxyz';
const BI_RC: any[] = [];
let rr: any, vv: any;
rr = '0'.charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = 'a'.charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = 'A'.charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n: any) {
  return BI_RM.charAt(n);
}
function intAt(s: any, i: any) {
  const c = BI_RC[s.charCodeAt(i)];
  return c == null ? -1 : c;
}

function nbv(i: any) {
  const r = nbi();
  r.fromInt(i);
  return r;
}

function nbits(x: any) {
  let r = 1,
    t;
  if ((t = x >>> 16) !== 0) {
    x = t;
    r += 16;
  }
  if ((t = x >> 8) !== 0) {
    x = t;
    r += 8;
  }
  if ((t = x >> 4) !== 0) {
    x = t;
    r += 4;
  }
  if ((t = x >> 2) !== 0) {
    x = t;
    r += 2;
  }
  if ((t = x >> 1) !== 0) {
    x = t;
    r += 1;
  }
  return r;
}

// (protected) copy this to r
(BigInteger as any).prototype.copyTo = function (r: any) {
  for (let i = this.t - 1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
};

// (protected) set from integer value x, -DV <= x < DV
(BigInteger as any).prototype.fromInt = function (x: any) {
  this.t = 1;
  this.s = x < 0 ? -1 : 0;
  if (x > 0) this[0] = x;
  else if (x < -1) this[0] = x + this.DV;
  else this.t = 0;
};

// (protected) set from string and radix
(BigInteger as any).prototype.fromString = function (s: any, b: any) {
  let k;
  if (b === 16) k = 4;
  else if (b === 8) k = 3;
  else if (b === 256)k = 8; // byte array
  else if (b === 2) k = 1;
  else if (b === 32) k = 5;
  else if (b === 4) k = 2;
  else {
    this.fromRadix(s, b);
    return;
  }
  this.t = 0;
  this.s = 0;
  let i = s.length,
    mi = false,
    sh = 0;
  while (--i >= 0) {
    const x = k === 8 ? s[i] & 0xff : intAt(s, i);
    if (x < 0) {
      if (s.charAt(i) === '-') mi = true;
      continue;
    }
    mi = false;
    if (sh === 0) this[this.t++] = x;
    else if (sh + k > this.DB) {
      this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
      this[this.t++] = x >> (this.DB - sh);
    } else this[this.t - 1] |= x << sh;
    sh += k;
    if (sh >= this.DB) sh -= this.DB;
  }
  if (k === 8 && (s[0] & 0x80) !== 0) {
    this.s = -1;
    if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
  }
  this.clamp();
  if (mi) (BigInteger as any).ZERO.subTo(this, this);
};

// (protected) clamp off excess high words
(BigInteger as any).prototype.clamp = function () {
  const c = this.s & this.DM;
  while (this.t > 0 && this[this.t - 1] === c) --this.t;
};

// (protected) r = this << n*DB
(BigInteger as any).prototype.dlShiftTo = function (n: any, r: any) {
  let i;
  for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
  for (i = n - 1; i >= 0; --i) r[i] = 0;
  r.t = this.t + n;
  r.s = this.s;
};

// (protected) r = this >> n*DB
(BigInteger as any).prototype.drShiftTo = function (n: any, r: any) {
  for (let i = n; i < this.t; ++i) r[i - n] = this[i];
  r.t = Math.max(this.t - n, 0);
  r.s = this.s;
};

// (protected) r = this << n
(BigInteger as any).prototype.lShiftTo = function (n: any, r: any) {
  const bs = n % this.DB;
  const cbs = this.DB - bs;
  const bm = (1 << cbs) - 1;
  const ds = Math.floor(n / this.DB);
  let c = (this.s << bs) & this.DM,
    i;
  for (i = this.t - 1; i >= 0; --i) {
    r[i + ds + 1] = (this[i] >> cbs) | c;
    c = (this[i] & bm) << bs;
  }
  for (i = ds - 1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t + ds + 1;
  r.s = this.s;
  r.clamp();
};

// (protected) r = this >> n
(BigInteger as any).prototype.rShiftTo = function (n: any, r: any) {
  r.s = this.s;
  const ds = Math.floor(n / this.DB);
  if (ds >= this.t) {
    r.t = 0;
    return;
  }
  const bs = n % this.DB;
  const cbs = this.DB - bs;
  const bm = (1 << bs) - 1;
  r[0] = this[ds] >> bs;
  for (let i = ds + 1; i < this.t; ++i) {
    r[i - ds - 1] |= (this[i] & bm) << cbs;
    r[i - ds] = this[i] >> bs;
  }
  if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
  r.t = this.t - ds;
  r.clamp();
};

// (protected) r = this - a
(BigInteger as any).prototype.subTo = function (a: any, r: any) {
  let i = 0,
    c = 0;
  const m = Math.min(a.t, this.t);
  while (i < m) {
    c += this[i] - a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
  }
  if (a.t < this.t) {
    c -= a.s;
    while (i < this.t) {
      c += this[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c += this.s;
  } else {
    c += this.s;
    while (i < a.t) {
      c -= a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = c < 0 ? -1 : 0;
  if (c < -1) r[i++] = this.DV + c;
  else if (c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
};

// (protected) r = this * a
(BigInteger as any).prototype.multiplyTo = function (a: any, r: any) {
  const x = this.abs(),
    y = a.abs();
  let i = x.t;
  r.t = i + y.t;
  while (--i >= 0) r[i] = 0;
  for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
  r.s = 0;
  r.clamp();
  if (this.s !== a.s) (BigInteger as any).ZERO.subTo(r, r);
};

// (protected) r = this^2
(BigInteger as any).prototype.squareTo = function (r: any) {
  const x = this.abs();
  let i = (r.t = 2 * x.t);
  while (--i >= 0) r[i] = 0;
  for (i = 0; i < x.t - 1; ++i) {
    const c = x.am(i, x[i], r, 2 * i, 0, 1);
    if (
      (r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >=
      x.DV
    ) {
      r[i + x.t] -= x.DV;
      r[i + x.t + 1] = 1;
    }
  }
  if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
  r.s = 0;
  r.clamp();
};

// (protected) divide this by m, quotient and remainder to q, r
(BigInteger as any).prototype.divRemTo = function (m: any, q: any, r: any) {
  const pm = m.abs();
  if (pm.t <= 0) return;
  const pt = this.abs();
  if (pt.t < pm.t) {
    if (q != null) q.fromInt(0);
    if (r != null) this.copyTo(r);
    return;
  }
  if (r == null) r = nbi();
  const y = nbi(),
    ts = this.s,
    ms = m.s;
  const nsh = this.DB - nbits(pm[pm.t - 1]);
  if (nsh > 0) {
    pm.lShiftTo(nsh, y);
    pt.lShiftTo(nsh, r);
  } else {
    pm.copyTo(y);
    pt.copyTo(r);
  }
  const ys = y.t;
  const y0 = y[ys - 1];
  if (y0 === 0) return;
  const yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
  const d1 = this.FV / yt,
    d2 = (1 << this.F1) / yt,
    e = 1 << this.F2;
  let i = r.t,
    j = i - ys;
  const t = q == null ? nbi() : q;
  y.dlShiftTo(j, t);
  if (r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t, r);
  }
  (BigInteger as any).ONE.dlShiftTo(ys, t);
  t.subTo(y, y);
  while (y.t < ys) y[y.t++] = 0;
  while (--j >= 0) {
    let qd =
      r[--i] === y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
    if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
      y.dlShiftTo(j, t);
      r.subTo(t, r);
      while (r[i] < --qd) r.subTo(t, r);
    }
  }
  if (q != null) {
    r.drShiftTo(ys, q);
    if (ts !== ms) (BigInteger as any).ZERO.subTo(q, q);
  }
  r.t = ys;
  r.clamp();
  if (nsh > 0) r.rShiftTo(nsh, r);
  if (ts < 0) (BigInteger as any).ZERO.subTo(r, r);
};

// (protected)
(BigInteger as any).prototype.invDigit = function () {
  if (this.t < 1) return 0;
  const x = this[0];
  if ((x & 1) === 0) return 0;
  let y = x & 3;
  y = (y * (2 - (x & 0xf) * y)) & 0xf;
  y = (y * (2 - (x & 0xff) * y)) & 0xff;
  y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff;
  y = (y * (2 - ((x * y) % this.DV))) % this.DV;
  return y > 0 ? this.DV - y : -y;
};

(BigInteger as any).prototype.isEven = function () {
  return (this.t > 0 ? this[0] & 1 : this.s) === 0;
};

// (protected) this^e, e < 2^32
(BigInteger as any).prototype.exp = function (e: any, z: any) {
  if (e > 0xffffffff || e < 1) return (BigInteger as any).ONE;
  let r = nbi(),
    r2 = nbi();
  const g = z.convert(this);
  let i = nbits(e) - 1;
  g.copyTo(r);
  while (--i >= 0) {
    z.sqrTo(r, r2);
    if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
    else {
      const t = r;
      r = r2;
      r2 = t;
    }
  }
  return z.revert(r);
};

// (public)
(BigInteger as any).prototype.toString = function (b: any) {
  if (this.s < 0) return '-' + this.negate().toString(b);
  let k;
  if (b === 16) k = 4;
  else if (b === 8) k = 3;
  else if (b === 2) k = 1;
  else if (b === 32) k = 5;
  else if (b === 4) k = 2;
  else return this.toRadix(b);
  const km = (1 << k) - 1;
  let d,
    m = false,
    r = '',
    i = this.t;
  let p = this.DB - ((i * this.DB) % k);
  if (i-- > 0) {
    if (p < this.DB && (d = this[i] >> p) > 0) {
      m = true;
      r = int2char(d);
    }
    while (i >= 0) {
      if (p < k) {
        d = (this[i] & ((1 << p) - 1)) << (k - p);
        d |= this[--i] >> (p += this.DB - k);
      } else {
        d = (this[i] >> (p -= k)) & km;
        if (p <= 0) {
          p += this.DB;
          --i;
        }
      }
      if (d > 0) m = true;
      if (m) r += int2char(d);
    }
  }
  return m ? r : '0';
};

(BigInteger as any).prototype.negate = function () {
  const r = nbi();
  (BigInteger as any).ZERO.subTo(this, r);
  return r;
};
(BigInteger as any).prototype.abs = function () {
  return this.s < 0 ? this.negate() : this;
};
(BigInteger as any).prototype.compareTo = function (a: any) {
  let r = this.s - a.s;
  if (r !== 0) return r;
  let i = this.t;
  r = i - a.t;
  if (r !== 0) return this.s < 0 ? -r : r;
  while (--i >= 0) if ((r = this[i] - a[i]) !== 0) return r;
  return 0;
};
(BigInteger as any).prototype.bitLength = function () {
  if (this.t <= 0) return 0;
  return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
};
(BigInteger as any).prototype.mod = function (a: any) {
  const r = nbi();
  this.abs().divRemTo(a, null, r);
  if (this.s < 0 && r.compareTo((BigInteger as any).ZERO) > 0) a.subTo(r, r);
  return r;
};
(BigInteger as any).prototype.modPowInt = function (e: any, m: any) {
  let z;
  if (e < 256 || m.isEven()) z = new Classic(m);
  else z = new Montgomery(m);
  return this.exp(e, z);
};

(BigInteger as any).ZERO = nbv(0);
(BigInteger as any).ONE = nbv(1);
(BigInteger as any).TWO = nbv(2);

function lbit(x: any) {
  if (x === 0) return -1;
  let r = 0;
  if ((x & 0xffff) === 0) {
    x >>= 16;
    r += 16;
  }
  if ((x & 0xff) === 0) {
    x >>= 8;
    r += 8;
  }
  if ((x & 0xf) === 0) {
    x >>= 4;
    r += 4;
  }
  if ((x & 3) === 0) {
    x >>= 2;
    r += 2;
  }
  if ((x & 1) === 0) ++r;
  return r;
}
function cbit(x: any) {
  let r = 0;
  while (x !== 0) {
    x &= x - 1;
    ++r;
  }
  return r;
}

const lowprimes = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
  239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
  331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
  421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503,
  509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607,
  613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701,
  709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811,
  821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
  919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997,
];
const lplim = (1 << 26) / lowprimes[lowprimes.length - 1];

(BigInteger as any).prototype.chunkSize = function (r: any) {
  return Math.floor((Math.LN2 * this.DB) / Math.log(r));
};
(BigInteger as any).prototype.toRadix = function (b: any) {
  if (b == null) b = 10;
  if (this.signum() === 0 || b < 2 || b > 36) return '0';
  const cs = this.chunkSize(b);
  const a = Math.pow(b, cs);
  const d = nbv(a),
    y = nbi(),
    z = nbi();
  let r = '';
  this.divRemTo(d, y, z);
  while (y.signum() > 0) {
    r = (a + z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d, y, z);
  }
  return z.intValue().toString(b) + r;
};
(BigInteger as any).prototype.fromRadix = function (s: any, b: any) {
  this.fromInt(0);
  if (b == null) b = 10;
  const cs = this.chunkSize(b);
  const d = Math.pow(b, cs);
  let mi = false,
    j = 0,
    w = 0;
  for (let i = 0; i < s.length; ++i) {
    const x = intAt(s, i);
    if (x < 0) {
      if (s.charAt(i) === '-' && this.signum() === 0) mi = true;
      continue;
    }
    w = b * w + x;
    if (++j >= cs) {
      this.dMultiply(d);
      this.dAddOffset(w, 0);
      j = 0;
      w = 0;
    }
  }
  if (j > 0) {
    this.dMultiply(Math.pow(b, j));
    this.dAddOffset(w, 0);
  }
  if (mi) (BigInteger as any).ZERO.subTo(this, this);
};
(BigInteger as any).prototype.fromNumber = function (a: any, b: any, c: any) {
  if (typeof b === 'number') {
    if (a < 2) this.fromInt(1);
    else {
      this.fromNumber(a, c);
      if (!this.testBit(a - 1))
        this.bitwiseTo((BigInteger as any).ONE.shiftLeft(a - 1), op_or, this);
      if (this.isEven()) this.dAddOffset(1, 0);
      while (!this.isProbablePrime(b)) {
        this.dAddOffset(2, 0);
        if (this.bitLength() > a)
          this.subTo((BigInteger as any).ONE.shiftLeft(a - 1), this);
      }
    }
  } else {
    const x: any[] = [];
    const t = a & 7;
    x.length = (a >> 3) + 1;
    c.nextBytes(x);
    if (t > 0) x[0] &= (1 << t) - 1;
    else x[0] = 0;
    this.fromString(x, 256);
  }
};
(BigInteger as any).prototype.bitwiseTo = function (a: any, op: any, r: any) {
  let i,
    f;
  const m = Math.min(a.t, this.t);
  for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
  if (a.t < this.t) {
    f = a.s & this.DM;
    for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
    r.t = this.t;
  } else {
    f = this.s & this.DM;
    for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
    r.t = a.t;
  }
  r.s = op(this.s, a.s);
  r.clamp();
};
(BigInteger as any).prototype.changeBit = function (n: any, op: any) {
  const r = (BigInteger as any).ONE.shiftLeft(n);
  this.bitwiseTo(r, op, r);
  return r;
};
(BigInteger as any).prototype.addTo = function (a: any, r: any) {
  let i = 0,
    c = 0;
  const m = Math.min(a.t, this.t);
  while (i < m) {
    c += this[i] + a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
  }
  if (a.t < this.t) {
    c += a.s;
    while (i < this.t) {
      c += this[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c += this.s;
  } else {
    c += this.s;
    while (i < a.t) {
      c += a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c += a.s;
  }
  r.s = c < 0 ? -1 : 0;
  if (c > 0) r[i++] = c;
  else if (c < -1) r[i++] = this.DV + c;
  r.t = i;
  r.clamp();
};
(BigInteger as any).prototype.dMultiply = function (n: any) {
  this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
  ++this.t;
  this.clamp();
};
(BigInteger as any).prototype.dAddOffset = function (n: any, w: any) {
  if (n === 0) return;
  while (this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while (this[w] >= this.DV) {
    this[w] -= this.DV;
    if (++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
};
(BigInteger as any).prototype.multiplyLowerTo = function (
  a: any,
  n: any,
  r: any
) {
  let i = Math.min(this.t + a.t, n);
  r.s = 0;
  r.t = i;
  while (i > 0) r[--i] = 0;
  let j;
  for (j = r.t - this.t; i < j; ++i)
    r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
  for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
  r.clamp();
};
(BigInteger as any).prototype.multiplyUpperTo = function (
  a: any,
  n: any,
  r: any
) {
  --n;
  let i = (r.t = this.t + a.t - n);
  r.s = 0;
  while (--i >= 0) r[i] = 0;
  for (i = Math.max(n - this.t, 0); i < a.t; ++i)
    r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
  r.clamp();
  r.drShiftTo(1, r);
};
(BigInteger as any).prototype.modInt = function (n: any) {
  if (n <= 0) return 0;
  const d = this.DV % n;
  let r = this.s < 0 ? n - 1 : 0;
  if (this.t > 0)
    if (d === 0) r = this[0] % n;
    else for (let i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
  return r;
};
(BigInteger as any).prototype.millerRabin = function (t: any) {
  const n1 = this.subtract((BigInteger as any).ONE);
  const k = n1.getLowestSetBit();
  if (k <= 0) return false;
  const r = n1.shiftRight(k);
  t = (t + 1) >> 1;
  if (t > lowprimes.length) t = lowprimes.length;
  const a = nbi();
  for (let i = 0; i < t; ++i) {
    a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
    let y = a.modPow(r, this);
    if (y.compareTo((BigInteger as any).ONE) !== 0 && y.compareTo(n1) !== 0) {
      let j = 1;
      while (j++ < k && y.compareTo(n1) !== 0) {
        y = y.modPowInt(2, this);
        if (y.compareTo((BigInteger as any).ONE) === 0) return false;
      }
      if (y.compareTo(n1) !== 0) return false;
    }
  }
  return true;
};

(BigInteger as any).prototype.clone = function () {
  const r = nbi();
  this.copyTo(r);
  return r;
};
(BigInteger as any).prototype.intValue = function () {
  if (this.s < 0) {
    if (this.t === 1) return this[0] - this.DV;
    else if (this.t === 0) return -1;
  } else if (this.t === 1) return this[0];
  else if (this.t === 0) return 0;
  return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
};
(BigInteger as any).prototype.byteValue = function () {
  return this.t === 0 ? this.s : (this[0] << 24) >> 24;
};
(BigInteger as any).prototype.shortValue = function () {
  return this.t === 0 ? this.s : (this[0] << 16) >> 16;
};
(BigInteger as any).prototype.signum = function () {
  if (this.s < 0) return -1;
  else if (this.t <= 0 || (this.t === 1 && this[0] <= 0)) return 0;
  else return 1;
};
(BigInteger as any).prototype.isZero = function () {
  return this.signum() === 0;
};
(BigInteger as any).prototype.modInv = function (m: any) {
  return this.modInverse(m);
};
(BigInteger as any).prototype.toArray = function () {
  return { value: this.toByteArray() };
};
(BigInteger as any).prototype.isNegative = function () {
  return this.s < 0;
};
(BigInteger as any).prototype.toByteArray = function () {
  let i = this.t;
  const r: any[] = [];
  r[0] = this.s;
  let p = this.DB - ((i * this.DB) % 8),
    d,
    k = 0;
  if (i-- > 0) {
    if (p < this.DB && (d = this[i] >> p) !== (this.s & this.DM) >> p)
      r[k++] = d | (this.s << (this.DB - p));
    while (i >= 0) {
      if (p < 8) {
        d = (this[i] & ((1 << p) - 1)) << (8 - p);
        d |= this[--i] >> (p += this.DB - 8);
      } else {
        d = (this[i] >> (p -= 8)) & 0xff;
        if (p <= 0) {
          p += this.DB;
          --i;
        }
      }
      if ((d & 0x80) !== 0) d |= -256;
      if (k === 0 && (this.s & 0x80) !== (d & 0x80)) ++k;
      if (k > 0 || d !== this.s) r[k++] = d;
    }
  }
  return r;
};
(BigInteger as any).prototype.equals = function (a: any) {
  return this.compareTo(a) === 0;
};
(BigInteger as any).prototype.min = function (a: any) {
  return this.compareTo(a) < 0 ? this : a;
};
(BigInteger as any).prototype.max = function (a: any) {
  return this.compareTo(a) > 0 ? this : a;
};
function op_and(x: any, y: any) {
  return x & y;
}
(BigInteger as any).prototype.and = function (a: any) {
  const r = nbi();
  this.bitwiseTo(a, op_and, r);
  return r;
};
function op_or(x: any, y: any) {
  return x | y;
}
(BigInteger as any).prototype.or = function (a: any) {
  const r = nbi();
  this.bitwiseTo(a, op_or, r);
  return r;
};
function op_xor(x: any, y: any) {
  return x ^ y;
}
(BigInteger as any).prototype.xor = function (a: any) {
  const r = nbi();
  this.bitwiseTo(a, op_xor, r);
  return r;
};
function op_andnot(x: any, y: any) {
  return x & ~y;
}
(BigInteger as any).prototype.andNot = function (a: any) {
  const r = nbi();
  this.bitwiseTo(a, op_andnot, r);
  return r;
};
(BigInteger as any).prototype.not = function () {
  const r = nbi();
  for (let i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
};
(BigInteger as any).prototype.shiftLeft = function (n: any) {
  const r = nbi();
  if (n < 0) this.rShiftTo(-n, r);
  else this.lShiftTo(n, r);
  return r;
};
(BigInteger as any).prototype.shiftRight = function (n: any) {
  const r = nbi();
  if (n < 0) this.lShiftTo(-n, r);
  else this.rShiftTo(n, r);
  return r;
};
(BigInteger as any).prototype.getLowestSetBit = function () {
  for (let i = 0; i < this.t; ++i)
    if (this[i] !== 0) return i * this.DB + lbit(this[i]);
  if (this.s < 0) return this.t * this.DB;
  return -1;
};
(BigInteger as any).prototype.bitCount = function () {
  let r = 0;
  const x = this.s & this.DM;
  for (let i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
  return r;
};
(BigInteger as any).prototype.testBit = function (n: any) {
  const j = Math.floor(n / this.DB);
  if (j >= this.t) return this.s !== 0;
  return (this[j] & (1 << n % this.DB)) !== 0;
};
(BigInteger as any).prototype.setBit = function (n: any) {
  return this.changeBit(n, op_or);
};
(BigInteger as any).prototype.clearBit = function (n: any) {
  return this.changeBit(n, op_andnot);
};
(BigInteger as any).prototype.flipBit = function (n: any) {
  return this.changeBit(n, op_xor);
};
(BigInteger as any).prototype.add = function (a: any) {
  const r = nbi();
  this.addTo(a, r);
  return r;
};
(BigInteger as any).prototype.subtract = function (a: any) {
  const r = nbi();
  this.subTo(a, r);
  return r;
};
(BigInteger as any).prototype.multiply = function (a: any) {
  const r = nbi();
  this.multiplyTo(a, r);
  return r;
};
(BigInteger as any).prototype.divide = function (a: any) {
  const r = nbi();
  this.divRemTo(a, r, null);
  return r;
};
(BigInteger as any).prototype.remainder = function (a: any) {
  const r = nbi();
  this.divRemTo(a, null, r);
  return r;
};
(BigInteger as any).prototype.divideAndRemainder = function (a: any) {
  const q = nbi(),
    r = nbi();
  this.divRemTo(a, q, r);
  return [q, r];
};
(BigInteger as any).prototype.modPow = function (e: any, m: any) {
  let i = e.bitLength(),
    k,
    r = nbv(1),
    z;
  if (i <= 0) return r;
  else if (i < 18) k = 1;
  else if (i < 48) k = 3;
  else if (i < 144) k = 4;
  else if (i < 768) k = 5;
  else k = 6;
  if (i < 8) z = new Classic(m);
  else if (m.isEven()) z = new Barrett(m);
  else z = new Montgomery(m);
  const g: any[] = [];
  let n = 3;
  const k1 = k - 1;
  const km = (1 << k) - 1;
  g[1] = z.convert(this);
  if (k > 1) {
    const g2 = nbi();
    z.sqrTo(g[1], g2);
    while (n <= km) {
      g[n] = nbi();
      z.mulTo(g2, g[n - 2], g[n]);
      n += 2;
    }
  }
  let j = e.t - 1,
    w,
    is1 = true,
    r2 = nbi(),
    t;
  i = nbits(e[j]) - 1;
  while (j >= 0) {
    if (i >= k1) w = (e[j] >> (i - k1)) & km;
    else {
      w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
      if (j > 0) w |= e[j - 1] >> (this.DB + i - k1);
    }
    n = k;
    while ((w & 1) === 0) {
      w >>= 1;
      --n;
    }
    if ((i -= n) < 0) {
      i += this.DB;
      --j;
    }
    if (is1) {
      g[w].copyTo(r);
      is1 = false;
    } else {
      while (n > 1) {
        z.sqrTo(r, r2);
        z.sqrTo(r2, r);
        n -= 2;
      }
      if (n > 0) z.sqrTo(r, r2);
      else {
        t = r;
        r = r2;
        r2 = t;
      }
      z.mulTo(r2, g[w], r);
    }
    while (j >= 0 && (e[j] & (1 << i)) === 0) {
      z.sqrTo(r, r2);
      t = r;
      r = r2;
      r2 = t;
      if (--i < 0) {
        i = this.DB - 1;
        --j;
      }
    }
  }
  return z.revert(r);
};
(BigInteger as any).prototype.modInverse = function (m: any) {
  const ac = m.isEven();
  if (this.signum() === 0) throw new Error('division by zero');
  if ((this.isEven() && ac) || m.signum() === 0)
    return (BigInteger as any).ZERO;
  const u = m.clone(),
    v = this.clone();
  const a = nbv(1),
    b = nbv(0),
    c = nbv(0),
    d = nbv(1);
  while (u.signum() !== 0) {
    while (u.isEven()) {
      u.rShiftTo(1, u);
      if (ac) {
        if (!a.isEven() || !b.isEven()) {
          a.addTo(this, a);
          b.subTo(m, b);
        }
        a.rShiftTo(1, a);
      } else if (!b.isEven()) b.subTo(m, b);
      b.rShiftTo(1, b);
    }
    while (v.isEven()) {
      v.rShiftTo(1, v);
      if (ac) {
        if (!c.isEven() || !d.isEven()) {
          c.addTo(this, c);
          d.subTo(m, d);
        }
        c.rShiftTo(1, c);
      } else if (!d.isEven()) d.subTo(m, d);
      d.rShiftTo(1, d);
    }
    if (u.compareTo(v) >= 0) {
      u.subTo(v, u);
      if (ac) a.subTo(c, a);
      b.subTo(d, b);
    } else {
      v.subTo(u, v);
      if (ac) c.subTo(a, c);
      d.subTo(b, d);
    }
  }
  if (v.compareTo((BigInteger as any).ONE) !== 0)
    return (BigInteger as any).ZERO;
  while (d.compareTo(m) >= 0) d.subTo(m, d);
  while (d.signum() < 0) d.addTo(m, d);
  return d;
};
(BigInteger as any).prototype.pow = function (e: any) {
  return this.exp(e, new NullExp());
};
(BigInteger as any).prototype.gcd = function (a: any) {
  let x = this.s < 0 ? this.negate() : this.clone();
  let y = a.s < 0 ? a.negate() : a.clone();
  if (x.compareTo(y) < 0) {
    const t = x;
    x = y;
    y = t;
  }
  let i = x.getLowestSetBit(),
    g = y.getLowestSetBit();
  if (g < 0) return x;
  if (i < g) g = i;
  if (g > 0) {
    x.rShiftTo(g, x);
    y.rShiftTo(g, y);
  }
  while (x.signum() > 0) {
    if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
    if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
    if (x.compareTo(y) >= 0) {
      x.subTo(y, x);
      x.rShiftTo(1, x);
    } else {
      y.subTo(x, y);
      y.rShiftTo(1, y);
    }
  }
  if (g > 0) y.lShiftTo(g, y);
  return y;
};
(BigInteger as any).prototype.isProbablePrime = function (t: any) {
  let i;
  const x = this.abs();
  if (x.t === 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
    for (i = 0; i < lowprimes.length; ++i)
      if (x[0] === lowprimes[i]) return true;
    return false;
  }
  if (x.isEven()) return false;
  i = 1;
  while (i < lowprimes.length) {
    let m = lowprimes[i],
      j = i + 1;
    while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
    m = x.modInt(m);
    while (i < j) if (m % lowprimes[i++] === 0) return false;
  }
  return x.millerRabin(t);
};
(BigInteger as any).prototype.square = function () {
  const r = nbi();
  this.squareTo(r);
  return r;
};

// Extensions (bitcoinjs) - valueOf and byte array helpers
(BigInteger as any).valueOf = nbv;
(BigInteger as any).prototype.toByteArrayUnsigned = function () {
  let ba = this.abs().toByteArray();
  if (ba.length) {
    if (ba[0] === 0) {
      ba = ba.slice(1);
    }
    return ba.map(function (v: any) {
      return v < 0 ? v + 256 : v;
    });
  } else {
    return ba;
  }
};
(BigInteger as any).fromByteArrayUnsigned = function (ba: any[]) {
  if (!ba.length) {
    return (BigInteger as any).valueOf(0);
  } else if (ba[0] & 0x80) {
    return new (BigInteger as any)([0].concat(ba));
  } else {
    console.log('fromByteArrayUnsigned ba444:', ba);
    console.log('fromByteArrayUnsigned ba444 new BigInteger:', new (BigInteger as any)(ba));
    return new (BigInteger as any)(ba);
  }
};
(BigInteger as any).prototype.toByteArraySigned = function () {
  const val = this.abs().toByteArrayUnsigned();
  const neg = this.compareTo((BigInteger as any).ZERO) < 0;
  if (neg) {
    if (val[0] & 0x80) {
      val.unshift(0x80);
    } else {
      val[0] |= 0x80;
    }
  } else {
    if (val[0] & 0x80) {
      val.unshift(0x00);
    }
  }
  return val;
};
(BigInteger as any).fromByteArraySigned = function (ba: any[]) {
  if (ba[0] & 0x80) {
    ba[0] &= 0x7f;
    return (BigInteger as any).fromByteArrayUnsigned(ba).negate();
  } else {
    return (BigInteger as any).fromByteArrayUnsigned(ba);
  }
};

// ****** REDUCTION ******* //

const Classic: any = function Classic(this: any, m: any) {
  this.m = m;
} as any;
Classic.prototype.convert = function (x: any) {
  if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
};
Classic.prototype.revert = function (x: any) {
  return x;
};
Classic.prototype.reduce = function (x: any) {
  x.divRemTo(this.m, null, x);
};
Classic.prototype.mulTo = function (x: any, y: any, r: any) {
  x.multiplyTo(y, r);
  this.reduce(r);
};
Classic.prototype.sqrTo = function (x: any, r: any) {
  x.squareTo(r);
  this.reduce(r);
};

const Montgomery: any = function Montgomery(this: any, m: any) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp & 0x7fff;
  this.mph = this.mp >> 15;
  this.um = (1 << (m.DB - 15)) - 1;
  this.mt2 = 2 * m.t;
} as any;
Montgomery.prototype.convert = function (x: any) {
  const r = nbi();
  x.abs().dlShiftTo(this.m.t, r);
  r.divRemTo(this.m, null, r);
  if (x.s < 0 && r.compareTo((BigInteger as any).ZERO) > 0) this.m.subTo(r, r);
  return r;
};
Montgomery.prototype.revert = function (x: any) {
  const r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
};
Montgomery.prototype.reduce = function (x: any) {
  while (x.t <= this.mt2) x[x.t++] = 0;
  for (let i = 0; i < this.m.t; ++i) {
    let j = x[i] & 0x7fff;
    const u0 =
      (j * this.mpl +
        (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) &
      x.DM;
    j = i + this.m.t;
    x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
    while (x[j] >= x.DV) {
      x[j] -= x.DV;
      x[++j]++;
    }
  }
  x.clamp();
  x.drShiftTo(this.m.t, x);
  if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
};
Montgomery.prototype.mulTo = function (x: any, y: any, r: any) {
  x.multiplyTo(y, r);
  this.reduce(r);
};
Montgomery.prototype.sqrTo = function (x: any, r: any) {
  x.squareTo(r);
  this.reduce(r);
};

const NullExp: any = function NullExp(this: any) {} as any;
NullExp.prototype.convert = function (x: any) {
  return x;
};
NullExp.prototype.revert = function (x: any) {
  return x;
};
NullExp.prototype.mulTo = function (x: any, y: any, r: any) {
  x.multiplyTo(y, r);
};
NullExp.prototype.sqrTo = function (x: any, r: any) {
  x.squareTo(r);
};

const Barrett: any = function Barrett(this: any, m: any) {
  this.r2 = nbi();
  this.q3 = nbi();
  (BigInteger as any).ONE.dlShiftTo(2 * m.t, this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
} as any;
Barrett.prototype.convert = function (x: any) {
  if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
  else if (x.compareTo(this.m) < 0) return x;
  else {
    const r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
};
Barrett.prototype.revert = function (x: any) {
  return x;
};
Barrett.prototype.reduce = function (x: any) {
  x.drShiftTo(this.m.t - 1, this.r2);
  if (x.t > this.m.t + 1) {
    x.t = this.m.t + 1;
    x.clamp();
  }
  this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
  this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
  while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
  x.subTo(this.r2, x);
  while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
};
Barrett.prototype.mulTo = function (x: any, y: any, r: any) {
  x.multiplyTo(y, r);
  this.reduce(r);
};
Barrett.prototype.sqrTo = function (x: any, r: any) {
  x.squareTo(r);
  this.reduce(r);
};

// END: Ported jsbn implementation

export { BigInteger, Classic, Montgomery, NullExp, Barrett };
export default BigInteger;
