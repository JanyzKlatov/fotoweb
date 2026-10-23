// Run `npm install` and `npm run home:images` from the tools directory.
// Existing JPEG hero images remain the fallback for browsers without AVIF or WebP.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'images', 'optimized');
const photos = [
  { name: 'hero-ares', source: 'portfolio/mazlicci/ares-v-lese.jpg', mobile: 667, desktop: 1333 },
  { name: 'hero-motorkarsky-par', source: 'portfolio/pary/motorkarsky-par-02.jpg', mobile: 818, desktop: 1635 },
  { name: 'hero-katarinka', source: 'portfolio/portrety/katarinka-14.jpg', mobile: 667, desktop: 1333 },
  { name: 'hero-svicka', source: 'portfolio/ostatni/svicka-fik-a-granat.jpg', mobile: 807, desktop: 1614 }
];
const formats = [
  { extension: 'avif', quality: 65 },
  { extension: 'webp', quality: 82 }
];

async function main() {
  let count = 0;
  for (const photo of photos) {
    const source = path.join(root, 'images', ...photo.source.split('/'));
    const mobileJpeg = path.join(outputDirectory, `${photo.name}-1000.jpeg`);
    const desktopJpeg = path.join(outputDirectory, `${photo.name}.jpeg`);
    for (const [file, expectedWidth] of [[mobileJpeg, photo.mobile], [desktopJpeg, photo.desktop]]) {
      const metadata = await sharp(file).metadata();
      if (metadata.width !== expectedWidth) {
        throw new Error(`JPEG fallback width changed: ${file} (${metadata.width}, expected ${expectedWidth})`);
      }
    }

    const widths = [...new Set([400, 600, 800, 1200, photo.mobile, photo.desktop])]
      .filter(width => width <= photo.desktop && (width === photo.mobile || Math.abs(width - photo.mobile) > 40))
      .sort((a, b) => a - b);
    for (const format of formats) {
      for (const width of widths) {
        const output = path.join(outputDirectory, `${photo.name}-${width}.${format.extension}`);
        const result = await sharp(source)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          [format.extension]({ quality: format.quality, effort: 5 })
          .toFile(output);
        if (result.width !== width) throw new Error(`Unexpected width for ${output}: ${result.width}`);
        count++;
      }
    }
    console.log(`${photo.name}: ${widths.join(', ')} px`);
  }
  console.log(`Created ${count} AVIF/WebP images in ${outputDirectory}`);
  require('./version-images.cjs');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
