const { zip } = require('zip-a-folder');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const packageJson = require('../package.json');
const version = packageJson.version;
const extensionName = packageJson.name || 'extension';

const distFolder = path.resolve(__dirname, '../dist');
const privateKeyPath = path.resolve(__dirname, '../private.pem');

const outputZipFile = path.resolve(__dirname, `../${extensionName}-v${version}.zip`);
const outputCrxFile = path.resolve(__dirname, `../${extensionName}-v${version}.crx`);
const outputHashFile = `${outputZipFile}.sha256`;

async function buildPackages() {
  try {
    // 1. Check if dist folder exists
    if (!fs.existsSync(distFolder)) {
      console.error(`Error: 'dist' folder not found at ${distFolder}. Run the build first.`);
      process.exit(1);
    }

    // 2. Create the standard .zip file for GitHub Releases
    console.log(`Zipping contents of ${distFolder} to ${outputZipFile}...`);
    await zip(distFolder, outputZipFile);
    console.log(`Successfully created ${outputZipFile}`);

    // 3. Create a hash of the .zip file
    console.log(`Generating SHA-256 hash for ${outputZipFile}...`);
    const zipBuffer = fs.readFileSync(outputZipFile);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(zipBuffer);
    const hexHash = hashSum.digest('hex');
    console.log(`SHA-256 Hash: ${hexHash}`);
    fs.writeFileSync(outputHashFile, hexHash);
    console.log(`Successfully saved hash to ${outputHashFile}`);

    // 4. Create the signed .crx file for the Chrome Web Store
    console.log(`\nCreating signed .crx file...`);
    if (!fs.existsSync(privateKeyPath)) {
        console.error(`Error: Private key not found at ${privateKeyPath}.`);
        console.error('A private key is required to sign the extension for the Chrome Web Store.');
        console.error('Please ensure "private.pem" exists in the project root.');
        process.exit(1);
    }

    execSync(`npx crx3 -p "${privateKeyPath}" -o "${outputCrxFile}" "${distFolder}"`, { stdio: 'inherit' });
    console.log(`Successfully created signed package at ${outputCrxFile}`);

  } catch (error) {
    console.error('\nAn error occurred during the packaging process:', error);
    process.exit(1);
  }
}

buildPackages();
