const fs = require('fs');

// Create a 32x32 32-bit RGBA ICO
const width = 32;
const height = 32;

// We will build a 32x32 pixel array
// Background: #0c0d12 (12, 13, 18, 255)
// Border: #262833 (38, 40, 51, 255)
// Chevron (>): #f4f4f5 (244, 244, 245, 255)
// Cursor line (_): #38bdf8 (56, 189, 248, 255)
// Dot: #10b981 (16, 185, 129, 255)

const pixels = new Uint8Array(width * height * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  // In BMP DIB, rows are stored bottom-to-top!
  const idx = ((height - 1 - y) * width + x) * 4;
  pixels[idx] = b;     // Blue
  pixels[idx + 1] = g; // Green
  pixels[idx + 2] = r; // Red
  pixels[idx + 3] = a; // Alpha
}

// Draw rounded rectangle background (radius 7)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    // Check corner roundness
    let inside = true;
    const r = 6;
    if (x < r && y < r && Math.hypot(x - r, y - r) > r) inside = false;
    if (x >= width - r && y < r && Math.hypot(x - (width - 1 - r), y - r) > r) inside = false;
    if (x < r && y >= height - r && Math.hypot(x - r, y - (height - 1 - r)) > r) inside = false;
    if (x >= width - r && y >= height - r && Math.hypot(x - (width - 1 - r), y - (height - 1 - r)) > r) inside = false;

    if (inside) {
      // Border or fill
      const isBorder = (x === 0 || x === width - 1 || y === 0 || y === height - 1);
      if (isBorder) {
        setPixel(x, y, 38, 40, 51, 255);
      } else {
        setPixel(x, y, 12, 13, 18, 255);
      }
    } else {
      setPixel(x, y, 0, 0, 0, 0); // Transparent
    }
  }
}

// Draw Chevron ">"
// From (8, 10) to (14, 16) to (8, 22)
for (let i = 0; i <= 6; i++) {
  // Top leg
  setPixel(8 + i, 10 + i, 244, 244, 245, 255);
  setPixel(8 + i + 1, 10 + i, 244, 244, 245, 255);
  // Bottom leg
  setPixel(14 - i, 16 + i, 244, 244, 245, 255);
  setPixel(14 - i + 1, 16 + i, 244, 244, 245, 255);
}

// Draw Cursor Line "_"
// From x=16 to 23 at y=21 and 22
for (let x = 17; x <= 23; x++) {
  setPixel(x, 21, 56, 189, 248, 255);
  setPixel(x, 22, 56, 189, 248, 255);
}

// Draw Live Emerald Dot
// Circle at (22, 11) radius 2
for (let dy = -2; dy <= 2; dy++) {
  for (let dx = -2; dx <= 2; dx++) {
    if (dx * dx + dy * dy <= 4) {
      setPixel(22 + dx, 11 + dy, 16, 185, 129, 255);
    }
  }
}

// Now assemble ICO buffer
// 1. ICONDIR (6 bytes)
// 2. ICONDIRENTRY (16 bytes)
// 3. BITMAPINFOHEADER (40 bytes)
// 4. Pixel data (width * height * 4)
// 5. AND mask (1 bit per pixel, padded to 32-bit row): 32 * 4 bytes = 128 bytes

const headerSize = 6 + 16;
const dibHeaderSize = 40;
const pixelDataSize = pixels.length;
const maskRowSize = Math.ceil(width / 32) * 4;
const maskSize = maskRowSize * height;
const imageSize = dibHeaderSize + pixelDataSize + maskSize;
const totalSize = headerSize + imageSize;

const buf = Buffer.alloc(totalSize);

// ICONDIR
buf.writeUInt16LE(0, 0); // reserved
buf.writeUInt16LE(1, 2); // 1 = ICO
buf.writeUInt16LE(1, 4); // 1 image

// ICONDIRENTRY
buf.writeUInt8(width, 6);  // width
buf.writeUInt8(height, 7); // height
buf.writeUInt8(0, 8);       // color count (0 = >=8bpp)
buf.writeUInt8(0, 9);       // reserved
buf.writeUInt16LE(1, 10);   // color planes
buf.writeUInt16LE(32, 12);  // bits per pixel
buf.writeUInt32LE(imageSize, 14); // image size in bytes
buf.writeUInt32LE(headerSize, 18); // offset of DIB header

// BITMAPINFOHEADER
const dibOffset = headerSize;
buf.writeUInt32LE(40, dibOffset);              // biSize
buf.writeInt32LE(width, dibOffset + 4);         // biWidth
buf.writeInt32LE(height * 2, dibOffset + 8);    // biHeight (ICO specifies double height for XOR + AND mask)
buf.writeUInt16LE(1, dibOffset + 12);           // biPlanes
buf.writeUInt16LE(32, dibOffset + 14);          // biBitCount
buf.writeUInt32LE(0, dibOffset + 16);           // biCompression (BI_RGB = 0)
buf.writeUInt32LE(pixelDataSize + maskSize, dibOffset + 20); // biSizeImage
buf.writeInt32LE(0, dibOffset + 24);            // biXPelsPerMeter
buf.writeInt32LE(0, dibOffset + 28);            // biYPelsPerMeter
buf.writeUInt32LE(0, dibOffset + 32);           // biClrUsed
buf.writeUInt32LE(0, dibOffset + 36);           // biClrImportant

// Copy pixel data
Buffer.from(pixels.buffer).copy(buf, dibOffset + dibHeaderSize);

// AND mask (0 for opaque/transparent handled by alpha, all 0s)
buf.fill(0, dibOffset + dibHeaderSize + pixelDataSize, totalSize);

fs.writeFileSync('public/favicon.ico', buf);
console.log('Successfully generated custom public/favicon.ico (size: ' + totalSize + ' bytes)');
