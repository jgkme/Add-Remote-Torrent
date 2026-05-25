/**
 * Fail the build if the MV3 service worker still uses lazy chunk loading.
 */
const fs = require('fs');
const path = require('path');

const backgroundPath = path.resolve(__dirname, '../dist/background.js');

if (!fs.existsSync(backgroundPath)) {
  console.error('verify-dist-background: dist/background.js not found. Run webpack first.');
  process.exit(1);
}

const background = fs.readFileSync(backgroundPath, 'utf8');
const errors = [];

if (/importScripts\s*\(/.test(background)) {
  errors.push('background.js must not call importScripts() (lazy chunks break MV3 SW).');
}

if (/\b\d{2,4}\.js\b/.test(background)) {
  errors.push('background.js must not reference numeric chunk files (e.g. 231.js).');
}

if (background.length < 150_000) {
  errors.push(
    `background.js looks too small (${background.length} bytes); handlers may not be bundled.`
  );
}

const optionsPath = path.resolve(__dirname, '../dist/options/options.js');
if (fs.existsSync(optionsPath)) {
  const optionsJs = fs.readFileSync(optionsPath, 'utf8');
  if (optionsJs.length < 50_000) {
    errors.push(
      `options/options.js is too small (${optionsJs.length} bytes); likely a broken chunk stub.`
    );
  }
  if (/\[970\]/.test(optionsJs)) {
    errors.push('options/options.js must not reference webpack chunk 970.');
  }
}

if (errors.length) {
  console.error('verify-dist-background failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log('verify-dist-background: OK');
