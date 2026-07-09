/**
 * Generates the extension icons (public/icon/{16,32,48,96,128}.png) with zero
 * image dependencies: pixels are computed with signed-distance functions and
 * encoded as PNG by hand (zlib is in Node's stdlib).
 *
 * The icon is two GitHub-style label pills on a dark rounded square.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZES = [16, 32, 48, 96, 128];
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icon');

const BG = [13, 17, 23]; // GitHub dark #0d1117
const GREEN = [63, 185, 80]; // #3fb950
const BLUE = [88, 166, 255]; // #58a6ff

/** Signed distance from point (px, py) to a rounded rect centered at (cx, cy). */
function sdRoundRect(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - radius;
}

/** 0..1 coverage from a signed distance, ~1px anti-aliased edge. */
function coverage(d) {
  return Math.min(1, Math.max(0, 0.5 - d));
}

function drawIcon(size) {
  const rgba = new Uint8Array(size * size * 4);
  const s = size;

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const px = x + 0.5;
      const py = y + 0.5;

      // Layers back-to-front: [distance shape, color]
      const layers = [
        [sdRoundRect(px, py, s / 2, s / 2, s / 2, s / 2, s * 0.22), BG],
        [sdRoundRect(px, py, s * 0.5, s * 0.4, s * 0.3, s * 0.09, s * 0.09), GREEN],
        [sdRoundRect(px, py, s * 0.41, s * 0.66, s * 0.21, s * 0.09, s * 0.09), BLUE],
      ];

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (const [d, color] of layers) {
        const alpha = coverage(d);
        if (alpha <= 0) continue;
        // Source-over compositing.
        r = color[0] * alpha + r * (1 - alpha);
        g = color[1] * alpha + g * (1 - alpha);
        b = color[2] * alpha + b * (1 - alpha);
        a = alpha + a * (1 - alpha);
      }

      const i = (y * s + x) * 4;
      rgba[i] = Math.round(r);
      rgba[i + 1] = Math.round(g);
      rgba[i + 2] = Math.round(b);
      rgba[i + 3] = Math.round(a * 255);
    }
  }
  return rgba;
}

// ---------- Minimal PNG encoder ----------

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // Raw scanlines, each prefixed with filter byte 0.
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, rowStart + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = join(OUT_DIR, `${size}.png`);
  writeFileSync(file, encodePng(size, drawIcon(size)));
  console.log(`wrote ${file}`);
}
