// Copies static assets into the standalone output after every build.
// The standalone server does NOT bundle these, so without this step
// public files (logos, favicon) and client JS/CSS would 404 in production.
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.log('No standalone output found, skipping asset sync.');
  process.exit(0);
}

const copies = [
  ['public', 'public'],
  [path.join('.next', 'static'), path.join('.next', 'static')],
];

for (const [src, dest] of copies) {
  const srcPath = path.join(projectRoot, src);
  const destPath = path.join(standaloneDir, dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`Skipping ${src}: not found.`);
    continue;
  }

  fs.rmSync(destPath, { recursive: true, force: true });
  fs.cpSync(srcPath, destPath, { recursive: true });
  console.log(`Synced ${src} -> ${path.relative(projectRoot, destPath)}`);
}
