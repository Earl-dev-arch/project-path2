// Render the generated favicon.ico back to a PNG so it can be visually checked.
// Parses the ICO, picks the 48px image, and writes a PNG (no dependencies).
// Reads and writes relative to the project root, whatever the current directory.
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const ico = readFileSync(resolve(ROOT, "favicon.ico"));
const count = ico.readUInt16LE(4);

let chosen = null;
for (let i = 0; i < count; i++) {
  const off = 6 + i * 16;
  const w = ico.readUInt8(off) || 256;
  const h = ico.readUInt8(off + 1) || 256;
  const size = ico.readUInt32LE(off + 8);
  const dataOff = ico.readUInt32LE(off + 12);
  if (w === 48) chosen = { w, h, dataOff, size };
}
if (!chosen) throw new Error("no 48px image found");
console.log("chosen image:", chosen.w + "x" + chosen.h, chosen.size, "bytes");

// DIB: 40-byte header, then bottom-up BGRA, then AND mask.
const dib = ico.subarray(chosen.dataOff, chosen.dataOff + chosen.size);
const bpp = dib.readUInt16LE(14);
const xorBytes = chosen.w * chosen.h * 4;
const xor = dib.subarray(40, 40 + xorBytes);

// Build PNG RGBA (top-down) from bottom-up BGRA.
const rgba = Buffer.alloc(chosen.w * chosen.h * 4);
for (let y = 0; y < chosen.h; y++) {
  const srcRow = (chosen.h - 1 - y) * chosen.w * 4;
  for (let x = 0; x < chosen.w; x++) {
    const s = srcRow + x * 4;
    const d = (y * chosen.w + x) * 4;
    rgba[d] = xor[s + 2]; // R
    rgba[d + 1] = xor[s + 1]; // G
    rgba[d + 2] = xor[s]; // B
    rgba[d + 3] = xor[s + 3]; // A
  }
}

// Raw scanlines with filter byte 0.
const raw = Buffer.alloc(chosen.h * (chosen.w * 4 + 1));
for (let y = 0; y < chosen.h; y++) {
  raw[y * (chosen.w * 4 + 1)] = 0;
  rgba.copy(
    raw,
    y * (chosen.w * 4 + 1) + 1,
    y * chosen.w * 4,
    (y + 1) * chosen.w * 4,
  );
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}
function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(chosen.w, 0);
ihdr.writeUInt32BE(chosen.h, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(resolve(ROOT, "favicon-preview.png"), png);
console.log("wrote favicon-preview.png", png.length, "bytes");
