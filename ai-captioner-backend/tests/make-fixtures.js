// tests/make-fixtures.js
// Generates image fixtures for the Postman collection (kept out of git).
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const dir = new URL("./fixtures/", import.meta.url);
mkdirSync(dir, { recursive: true });

const crc32 = (buf) => {
  let c, crc = 0xffffffff;
  for (const byte of buf) {
    c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// Simple 256x256 RGB image: blue sky, yellow sun, green ground
const makePng = (size = 256) => {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3); // filter byte + RGB pixels
    for (let x = 0; x < size; x++) {
      const inSun = (x - 190) ** 2 + (y - 60) ** 2 < 30 ** 2;
      const [r, g, b] = inSun ? [255, 214, 0] : y > size * 0.7 ? [40, 150, 60] : [110, 170, 240];
      row.set([r, g, b], 1 + x * 3);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit, truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

writeFileSync(new URL("sample.png", dir), makePng());
writeFileSync(new URL("not-an-image.gif", dir), Buffer.from("GIF89a"));
writeFileSync(new URL("too-large.png", dir), Buffer.alloc(6 * 1024 * 1024));

console.log("Fixtures written to tests/fixtures/");
