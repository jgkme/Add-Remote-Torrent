const { zip } = require('zip-a-folder');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const packageJson = require('../package.json');
const version = packageJson.version;
const extensionName = packageJson.name || 'extension';

const distFolder = path.resolve(__dirname, '../dist');
const outputZipFile = path.resolve(
  __dirname,
  `../${extensionName}-v${version}-firefox.zip`
);
const outputHashFile = `${outputZipFile}.sha256`;

async function buildFirefoxZip() {
  if (!fs.existsSync(distFolder)) {
    console.error(
      `Error: 'dist' folder not found at ${distFolder}. Run build:firefox first.`
    );
    process.exit(1);
  }

  const manifestPath = path.join(distFolder, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const geckoId = manifest.browser_specific_settings?.gecko?.id;
  const perms = manifest.permissions || [];

  if (geckoId === 'add-remote-torrent@local' || !geckoId) {
    console.error('Error: Firefox package must use a permanent gecko.id');
    process.exit(1);
  }
  if (perms.includes('offscreen')) {
    console.error(
      'Error: Firefox package must not include the Chromium-only "offscreen" permission'
    );
    process.exit(1);
  }
  if (manifest.background?.service_worker && !manifest.background?.scripts) {
    console.error(
      'Error: Firefox package must use background.scripts (service_worker alone is rejected)'
    );
    process.exit(1);
  }
  if (!manifest.browser_specific_settings?.gecko?.data_collection_permissions) {
    console.error(
      'Error: Firefox package missing gecko.data_collection_permissions'
    );
    process.exit(1);
  }

  console.log(`Zipping Firefox dist to ${outputZipFile}...`);
  await zip(distFolder, outputZipFile);
  console.log(`Successfully created ${outputZipFile}`);

  const zipBuffer = fs.readFileSync(outputZipFile);
  const hexHash = crypto.createHash('sha256').update(zipBuffer).digest('hex');
  fs.writeFileSync(outputHashFile, hexHash);
  console.log(`SHA-256: ${hexHash}`);
  console.log(`Saved hash to ${outputHashFile}`);
}

buildFirefoxZip().catch((error) => {
  console.error('\nFirefox packaging failed:', error);
  process.exit(1);
});
