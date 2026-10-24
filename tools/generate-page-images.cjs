// Generate responsive images for the voucher and about pages.
// Existing JPEG files remain the fallback and are never modified.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'images', 'optimized');
const photos = [
  { name: 'about-misa', source: 'images/Misa1.jpeg', widths: [300, 600, 1066] },
  { name: 'voucher-front', source: 'images/voucher/darkovy-poukaz-nahled-1.jpg', widths: [400, 720, 900] },
  { name: 'voucher-back', source: 'images/voucher/darkovy-poukaz-nahled-2.jpg', widths: [400, 720, 900] }
];
const formats = [
  { extension: 'avif', quality: 55 },
  { extension: 'webp', quality: 80 }
];

async function main() {
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const photo of photos) {
    const source = path.join(root, ...photo.source.split('/'));
    const { width } = await sharp(source).metadata();
    if (width !== photo.widths.at(-1)) {
      throw new Error(`Source width changed: ${photo.source} (${width}px)`);
    }
    for (const format of formats) {
      for (const targetWidth of photo.widths) {
        const output = path.join(outputDirectory, `${photo.name}-${targetWidth}.${format.extension}`);
        const result = await sharp(source)
          .rotate()
          .resize({ width: targetWidth, withoutEnlargement: true })
          [format.extension]({ quality: format.quality, effort: 5 })
          .toFile(output);
        if (result.width !== targetWidth) throw new Error(`Unexpected width for ${output}`);
      }
    }
    console.log(`${photo.name}: ${photo.widths.join(', ')} px`);
  }
  require('./version-images.cjs');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
