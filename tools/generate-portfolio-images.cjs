// Run `npm install` and `npm run portfolio:images` from the tools directory.
// Original JPEGs stay in place as the fallback for browsers without AVIF or WebP.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'portfolio.html');
const widths = [320, 400, 480, 640, 800, 1024];
const formats = [
  { name: 'avif', mime: 'image/avif', quality: 65 },
  { name: 'webp', mime: 'image/webp', quality: 82 }
];

function imagePaths(url, format) {
  const relative = decodeURIComponent(url.slice('images/thumbs/'.length));
  const segments = relative.split('/');
  const source = path.join(root, 'images', ...(segments.length > 1 ? ['portfolio'] : []), ...segments);
  const stem = segments.at(-1).replace(/\.(?:jpe?g)$/i, '');
  const outputDirectory = path.join(root, 'images', `thumbs-${format}`, ...segments.slice(0, -1));
  const urlPrefix = `images/thumbs-${format}/${[...segments.slice(0, -1), stem].map(encodeURIComponent).join('/')}`;
  return { source, outputDirectory, stem, urlPrefix };
}

function removeUnusedVariants(directory, rootDirectory, usedFiles, extension) {
  let removed = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.resolve(directory, entry.name);
    const relative = path.relative(rootDirectory, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Outside generated image directory: ${file}`);
    if (entry.isDirectory()) {
      removed += removeUnusedVariants(file, rootDirectory, usedFiles, extension);
    } else if (entry.isFile() && entry.name.endsWith(`.${extension}`) && /-\d+\./.test(entry.name) && !usedFiles.has(file)) {
      fs.unlinkSync(file);
      removed++;
    }
  }
  return removed;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function writeReviewPage(images, variants) {
  const cards = images.map(([img, url]) => {
    const jpegSrcset = img.match(/\bsrcset="([^\"]+)"/)[1];
    const jpegUrl = jpegSrcset.split(',').at(-1).trim().split(' ')[0].replace(/\?v=[a-f0-9]{16}$/, '');
    const name = escapeHtml(decodeURIComponent(url.slice('images/thumbs/'.length)));
    const files = [
      { label: 'JPEG', url: jpegUrl },
      ...formats.map(format => ({ label: format.name.toUpperCase(), url: variants.get(url)[format.name].at(-1).url }))
    ];
    const cells = files.map(({ label, url }) => {
      const file = path.resolve(root, decodeURIComponent(url));
      const fileUrl = pathToFileURL(file).href;
      const kiB = Math.round(fs.statSync(file).size / 1024);
      return `<div><p>${label} · ${kiB} KiB</p><a href="${fileUrl}" target="_blank"><img loading="lazy" src="${fileUrl}" alt="${label} náhled"></a></div>`;
    });
    return `<article><h2>${name}</h2><div class="pair">${cells.join('')}</div></article>`;
  });
  const page = `<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kontrola fotografií portfolia</title><style>body{font:16px system-ui,sans-serif;max-width:1500px;margin:auto;padding:24px;color:#222;background:#faf8f5}h1{font-size:28px}h2{font-size:16px;overflow-wrap:anywhere}p{margin:6px 0}.gallery{display:grid;gap:16px}article{background:#fff;border:1px solid #ddd;border-radius:8px;padding:14px}.pair{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}img{display:block;width:100%;height:320px;object-fit:contain;background:#eee}a{display:block}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>Kontrola náhledů portfolia</h1><p>Vedle sebe jsou původní JPEG, nový AVIF a nový WebP v největší dostupné šířce. Kliknutím otevřete obrázek v plné velikosti. Tento soubor je jen pro místní kontrolu.</p><div class="gallery">${cards.join('')}</div></html>`;
  const reviewPath = path.join(os.tmpdir(), 'fotoweb-portfolio-image-review.html');
  fs.writeFileSync(reviewPath, page);
  return reviewPath;
}

async function main() {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const images = [...html.matchAll(/<img\b[^>]*\bsrc="(images\/thumbs\/[^\"?]+)(?:\?v=[a-f0-9]{16})?"[^>]*>/g)];
  if (!images.length) throw new Error('No portfolio images found');

  const variants = new Map();
  const outputBytes = Object.fromEntries(formats.map(format => [format.name, 0]));
  for (const [img, url] of images) {
    const { source } = imagePaths(url, 'webp');
    if (!fs.existsSync(source)) throw new Error(`Source image missing: ${source}`);
    const { width: sourceWidth } = await sharp(source).metadata();
    if (!sourceWidth) throw new Error(`Unable to read image width: ${source}`);
    const jpegSrcset = img.match(/\bsrcset="([^\"]+)"/)?.[1];
    if (!jpegSrcset) throw new Error(`Missing JPEG srcset: ${url}`);
    const jpegMaxWidth = Math.max(...[...jpegSrcset.matchAll(/(\d+)w/g)].map(match => Number(match[1])));
    if (!Number.isFinite(jpegMaxWidth)) throw new Error(`Invalid JPEG srcset: ${url}`);
    const imageVariants = {};
    // Keep modern variants no wider than the existing JPEG fallback.
    const imageWidths = [...new Set(widths.map(width => Math.min(width, sourceWidth, jpegMaxWidth)))];
    for (const format of formats) {
      const { outputDirectory, stem, urlPrefix } = imagePaths(url, format.name);
      fs.mkdirSync(outputDirectory, { recursive: true });
      const entries = [];
      for (const width of imageWidths) {
        const file = path.join(outputDirectory, `${stem}-${width}.${format.name}`);
        const pipeline = sharp(source).rotate().resize({ width, withoutEnlargement: true });
        const info = await pipeline[format.name]({ quality: format.quality, effort: 5 }).toFile(file);
        if (info.width !== width) throw new Error(`Unexpected width for ${file}: ${info.width}`);
        entries.push({ url: `${urlPrefix}-${width}.${format.name}`, width, bytes: info.size });
        outputBytes[format.name] += info.size;
      }
      imageVariants[format.name] = entries;
    }
    variants.set(url, imageVariants);
  }

  let replacements = 0;
  const updated = html.replace(/<picture>[\s\S]*?<\/picture>|<img\b[^>]*>/g, block => {
    const match = block.match(/<img\b[^>]*\bsrc="(images\/thumbs\/[^\"?]+)(?:\?v=[a-f0-9]{16})?"[^>]*>/);
    if (!match) return block;
    const [img, url] = match;
    const sizes = img.match(/\bsizes="([^\"]+)"/)?.[1];
    if (!sizes) throw new Error(`Missing sizes attribute: ${url}`);
    const sourceSizes = sizes.replace(/^auto,\s*/, '');
    const sources = formats.map(format => {
      const srcset = variants.get(url)[format.name].map(({ url, width }) => `${url} ${width}w`).join(', ');
      return `<source type="${format.mime}" srcset="${srcset}" sizes="${sourceSizes}">`;
    });
    replacements++;
    return `<picture>${sources.join('')}${img}</picture>`;
  });
  if (replacements !== images.length) throw new Error(`Replaced ${replacements} of ${images.length} images`);
  if (updated !== html) fs.writeFileSync(htmlPath, updated);
  for (const format of formats) {
    const directory = path.join(root, 'images', `thumbs-${format.name}`);
    const usedFiles = new Set([...variants.values()].flatMap(image => image[format.name]).map(({ url }) => path.resolve(root, decodeURIComponent(url))));
    const removed = removeUnusedVariants(directory, directory, usedFiles, format.name);
    console.log(`${format.name.toUpperCase()}: ${usedFiles.size} files, ${(outputBytes[format.name] / 1048576).toFixed(2)} MiB total; removed ${removed} unused variants.`);
  }
  const reviewPath = writeReviewPage(images, variants);
  console.log(`Review page for ${images.length} photos: ${reviewPath}`);
  require('./version-images.cjs');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
