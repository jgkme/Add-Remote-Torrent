const { zip } = require('zip-a-folder');
const path = require('path');
const fs = require('fs');

const packageJson = require('../package.json'); // Go up one level to project root
const version = packageJson.version;
const extensionName = packageJson.name || 'extension';

const distFolder = path.resolve(__dirname, '../dist');
const outputZipFile = path.resolve(__dirname, `../${extensionName}-v${version}.zip`);

async function createZip() {
  try {
    if (!fs.existsSync(distFolder)) {
      console.error(`Error: 'dist' folder not found at ${distFolder}. Run the build first.`);
      process.exit(1);
    }
    console.log(`Zipping contents of ${distFolder} to ${outputZipFile}...`);
    await zip(distFolder, outputZipFile);
    console.log(`Successfully created ${outputZipFile}`);
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    process.exit(1);
  }
}

createZip();
