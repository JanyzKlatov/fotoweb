// Add a content hash to every local image URL used by the site's HTML and CSS.
// Run after regenerating images; --check fails if any URL is missing or stale.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const imagesRoot = path.join(root, 'images');
const checkOnly = process.argv.includes('--check');
const versionLength = 16;
const imageUrl = /(?:https:\/\/michaela-janousova\.cz\/|\.\.\/)?images\/[^\s"'<>),;]+/g;
const files = [
  ...fs.readdirSync(root).filter(name => name.endsWith('.html')).map(name => path.join(root, name)),
  ...['css', 'js'].flatMap(directory => fs.readdirSync(path.join(root, directory))
    .filter(name => /\.(?:css|js)$/.test(name))
    .map(name => path.join(root, directory, name)))
];
const hashes = new Map();
const updates = [];
let references = 0;
let changed = 0;
const problems = [];

function versionUrl(raw, file) {
  references++;
  const match = raw.match(/^(.*?)(?:\?v=([a-f0-9]{16}))?$/);
  if (!match || match[1].includes('?') || match[1].includes('#')) {
    throw new Error(`Unsupported image URL in ${path.relative(root, file)}: ${raw}`);
  }
  const [, base, oldHash] = match;
  const relative = base.replace(/^https:\/\/michaela-janousova\.cz\//, '').replace(/^\.\.\//, '');
  const imageFile = path.resolve(root, decodeURIComponent(relative));
  if (!imageFile.startsWith(imagesRoot + path.sep) || !fs.existsSync(imageFile) || !fs.statSync(imageFile).isFile()) {
    throw new Error(`Invalid image path in ${path.relative(root, file)}: ${raw}`);
  }
  let hash = hashes.get(imageFile);
  if (!hash) {
    hash = crypto.createHash('sha256').update(fs.readFileSync(imageFile)).digest('hex').slice(0, versionLength);
    hashes.set(imageFile, hash);
  }
  if (oldHash === hash) return raw;
  if (checkOnly) {
    problems.push(`${path.relative(root, file)}: ${raw} -> ?v=${hash}`);
    return raw;
  }
  changed++;
  return `${base}?v=${hash}`;
}

for (const file of files) {
  const htmlOrCss = fs.readFileSync(file, 'utf8');
  const updated = htmlOrCss.replace(imageUrl, raw => versionUrl(raw, file));
  if (updated !== htmlOrCss) updates.push([file, updated]);
}

if (!references) throw new Error('No image URLs found');
if (problems.length) {
  console.error(problems.slice(0, 10).join('\n'));
  console.error(`${problems.length} image URLs need updating. Run npm run images:version from tools/.`);
  process.exitCode = 1;
} else {
  for (const [file, updated] of updates) fs.writeFileSync(file, updated);
  console.log(`${checkOnly ? 'Checked' : 'Versioned'} ${references} image URLs for ${hashes.size} files; ${changed} changed.`);
}
