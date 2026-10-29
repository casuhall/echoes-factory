import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dist = path.join(root, 'dist');

// Clean dist
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true });
}
fs.mkdirSync(dist, { recursive: true });

// Copy static assets
const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

copyDir(path.join(root, 'style'), path.join(dist, 'style'));
copyDir(path.join(root, 'locales'), path.join(dist, 'locales'));

// Copy HTML files
for (const file of fs.readdirSync(root)) {
  if (file.endsWith('.html')) {
    fs.copyFileSync(path.join(root, file), path.join(dist, file));
  }
}

// Minify JS
const jsFiles = [];
for (const file of fs.readdirSync(path.join(root, 'app'))) {
  if (file.endsWith('.js')) {
    jsFiles.push(path.join(root, 'app', file));
  }
}

if (jsFiles.length > 0) {
  await esbuild.build({
    entryPoints: jsFiles,
    bundle: false,
    minify: true,
    outdir: path.join(dist, 'app'),
    format: 'esm',
    target: 'es2020',
  });
}

console.log('Build complete: dist/ ready for production');
