import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, 'public');

// Pure JS Minimal Valid PNG Generator
function createSolidPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // CRC calculation
    const crc = calcCrc(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc >>> 0, 8 + len);
    return buf;
  }

  // CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function calcCrc(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return c ^ 0xffffffff;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw Image data (filter type 0 per scanline)
  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(rowLen * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Gradient background + central white 'P' badge pattern
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      const isInner = dist < width * 0.35;
      
      if (isInner && Math.abs(x - cx * 0.8) < width * 0.08) {
        // P vertical bar
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
      } else if (isInner && y < cy && Math.hypot(x - cx * 0.9, y - cy * 0.75) < width * 0.16) {
        // P loop
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
      } else {
        // Gradient Indigo/Teal
        const t = (x + y) / (width + height);
        rawData[pxOffset] = Math.round(r * (1 - t * 0.5));
        rawData[pxOffset + 1] = Math.round(g + t * 60);
        rawData[pxOffset + 2] = Math.round(b + t * 40);
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pwa192 = createSolidPng(192, 192, 49, 46, 129);
const pwa512 = createSolidPng(512, 512, 49, 46, 129);
const maskable512 = createSolidPng(512, 512, 30, 27, 75);
const appleIcon = createSolidPng(180, 180, 49, 46, 129);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), maskable512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('✅ Standard PNG PWA icons successfully generated in public/');
