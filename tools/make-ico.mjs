// Generate favicon.ico (16/32/48) from the project's brand colour and glyph.
// Pure Node: builds a BMP-in-ICO container. No dependencies.
// Writes to the project root regardless of the current directory.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SIZES = [16, 32, 48];
// Brand: purple rounded square #6c5ce7 with a white 4-point star.
const PURPLE = [0x6c, 0x5c, 0xe7];
const WHITE = [0xff, 0xff, 0xff];

function renderRGBA(size) {
  const px = Buffer.alloc(size * size * 4);
  const r = Math.max(2, Math.round(size * 0.16)); // corner radius
  const inRoundedSquare = (x, y) => {
    const cx = Math.min(x, size - 1 - x);
    const cy = Math.min(y, size - 1 - y);
    if (cx >= r || cy >= r) return true;
    const dx = r - cx,
      dy = r - cy;
    return dx * dx + dy * dy <= r * r;
  };
  const c = (size - 1) / 2;
  const outer = size * 0.42; // star long radius
  const inner = size * 0.14; // star waist
  const inStar = (x, y) => {
    const dx = x - c,
      dy = y - c;
    // 4-point star: |dx|^0.5 + |dy|^0.5 <= k  (concave diamond)
    const k = Math.pow(outer, 0.5) * 0.92;
    return Math.pow(Math.abs(dx), 0.5) + Math.pow(Math.abs(dy), 0.5) <= k;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!inRoundedSquare(x, y)) {
        px[i + 3] = 0;
        continue;
      }
      const star = inStar(x, y);
      const col = star ? WHITE : PURPLE;
      px[i] = col[2];
      px[i + 1] = col[1];
      px[i + 2] = col[0];
      px[i + 3] = 255; // BGRA
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
