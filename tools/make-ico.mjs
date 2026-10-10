// Generate favicon.ico (16/32/48/64) for the Your Path brand.
// Artwork: a dark rounded square, a neon pink->violet border ring, and a
// "YP" monogram in the same neon gradient. Pure Node: the shapes are simple
// enough to rasterise here (point-to-segment distance keeps the strokes round),
// and the result is packaged as a BMP-in-ICO container. No dependencies.
// Writes to the project root regardless of the current directory.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SIZES = [16, 32, 48, 64];
const SUPERSAMPLE = 4; // render 4x then box-downsample for smooth edges

// Neon brand gradient: pink -> violet -> blue.
const NEON_PINK = [0xff, 0x2f, 0xd0];
const NEON_VIOLET = [0xb4, 0x29, 0xf9];
const NEON_BLUE = [0x7a, 0x5c, 0xff];
const BG = [0x15, 0x0c, 0x28];

const lerp = (a, b, t) => a + (b - a) * t;

// Gradient runs top-left (pink) -> violet -> bottom-right (blue).
function neon(x, y, w, h) {
  const t = Math.min(1, Math.max(0, (x / w + y / h) / 2));
  return t < 0.55
    ? [0, 1, 2].map((i) => lerp(NEON_PINK[i], NEON_VIOLET[i], t / 0.55))
    : [0, 1, 2].map((i) => lerp(NEON_VIOLET[i], NEON_BLUE[i], (t - 0.55) / 0.45));
}

// Distance from a point to a line segment — gives round stroke caps/joins.
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.min(1, Math.max(0, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// The "YP" monogram, mirroring the polygons used in favicon.svg so both files
// draw the same mark. Y = two diagonals meeting a centre stem. P = a stem plus
// a bowl, built as filled outlines in the same 64x64 design space.
function glyphAreas() {
  const areas = [];

  // --- Y (one filled polygon) ---
  areas.push({
    kind: "poly",
    pts: [
      [13, 18], [19.6, 18], [24.1, 26.2], [28.6, 18], [35, 18],
      [27, 32.3], [27, 46], [21.2, 46], [21.2, 32.3],
    ],
  });

  // --- P: bowl, approximated as a closed capsule outline ---
  const bowl = [];
  const bcx = 47.4, bcy = 26.7, brx = 8.7, bry = 8.9;
  for (let i = 0; i <= 28; i++) {
    const a = -Math.PI / 2 + (i / 28) * Math.PI * 2;
    bowl.push([bcx + brx * Math.cos(a), bcy + bry * Math.sin(a)]);
  }
  areas.push({ kind: "poly", pts: bowl });
  areas.push({
    kind: "poly",
    pts: [[37, 18], [42.8, 18], [42.8, 46], [37, 46]],
  });

  // --- P bowl interior (cut out) ---
  const hole = [];
  const hcx = 47.4, hcy = 26.7, hrx = 4.3, hry = 4.3;
  for (let i = 0; i <= 28; i++) {
    const a = -Math.PI / 2 + (i / 28) * Math.PI * 2;
    hole.push([hcx + hrx * Math.cos(a), hcy + hry * Math.sin(a)]);
  }
  areas.push({ kind: "hole", pts: hole });

  return areas;
}
const AREAS = glyphAreas();

// Standard even-odd point-in-polygon test.
function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inGlyph(gx, gy) {
  let filled = false;
  for (const area of AREAS) {
    if (!inPoly(gx, gy, area.pts)) continue;
    filled = area.kind !== "hole";
  }
  return filled;
}

function renderRGBA(size) {
  const S = size * SUPERSAMPLE;
  const acc = new Float32Array(S * S * 4);
  const radius = S * 0.22;
  const borderInset = S * 0.03;
  const borderW = S * 0.05;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;

      // Rounded-rect signed distance (negative inside).
      const qx = Math.abs(px - S / 2) - (S / 2 - radius);
      const qy = Math.abs(py - S / 2) - (S / 2 - radius);
      const sd =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        radius;

      const a = sd > 0 ? 0 : sd > -1.2 ? Math.min(1, -sd / 1.2 + 0.5) : 1;
      if (a <= 0) continue;

      let col = BG;

      // Neon border ring just inside the edge.
      if (Math.abs(sd + borderInset + borderW / 2) < borderW / 2) {
        col = neon(px, py, S, S);
      }

      // Monogram.
      const gx = (px / S) * 64;
      const gy = (py / S) * 64;
      if (inGlyph(gx, gy)) col = neon(px, py, S, S);

      const o = (y * S + x) * 4;
      acc[o] = col[0];
      acc[o + 1] = col[1];
      acc[o + 2] = col[2];
      acc[o + 3] = 255 * a;
    }
  }

  // Box-downsample to the requested size, into BGRA (ICO byte order).
  const px = Buffer.alloc(size * size * 4);
  const n = SUPERSAMPLE * SUPERSAMPLE;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const o = ((y * SUPERSAMPLE + sy) * S + (x * SUPERSAMPLE + sx)) * 4;
          const av = acc[o + 3] / 255;
          r += acc[o] * av;
          g += acc[o + 1] * av;
          b += acc[o + 2] * av;
          a += av;
        }
      }
      const i = (y * size + x) * 4;
      if (a === 0) {
        px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0;
        continue;
      }
      px[i] = Math.round(b / a); // B
      px[i + 1] = Math.round(g / a); // G
      px[i + 2] = Math.round(r / a); // R
      px[i + 3] = Math.round((a / n) * 255); // A
    }
  }
  return px;
}

// BMP (DIB) payload for one image, bottom-up, 32bpp with an AND mask.
function bmpFor(size, rgba) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // height doubled (XOR + AND)
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(size * size * 4, 20);

  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const src = (size - 1 - y) * size * 4;
    rgba.copy(xor, y * size * 4, src, src + size * 4);
  }
  // AND mask: all zero (alpha channel carries transparency), rows padded to 32 bits.
  const maskRow = Math.ceil(size / 32) * 4;
  const and = Buffer.alloc(maskRow * size);
  return Buffer.concat([header, xor, and]);
}

const images = SIZES.map((s) => ({ size: s, data: bmpFor(s, renderRGBA(s)) }));

const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0);
dir.writeUInt16LE(1, 2);
dir.writeUInt16LE(images.length, 4);

let offset = 6 + images.length * 16;
const entries = [];
for (const img of images) {
  const e = Buffer.alloc(16);
  e.writeUInt8(img.size >= 256 ? 0 : img.size, 0);
  e.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.data.length;
  entries.push(e);
}

const ico = Buffer.concat([dir, ...entries, ...images.map((i) => i.data)]);
writeFileSync(resolve(ROOT, "favicon.ico"), ico);
console.log(
  "favicon.ico written:",
  ico.length,
  "bytes, sizes",
  SIZES.join("/"),
);
