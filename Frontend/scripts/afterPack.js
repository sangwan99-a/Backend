/**
 * Post-build hook for electron-builder
 * Validates the packaged app and generates metadata
 */

const fs = require('fs');
const path = require('path');

const getAppMetadata = () => {
  const packageJson = require('../package.json');
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    author: packageJson.author,
    homepage: packageJson.homepage,
    buildTime: new Date().toISOString(),
    nodeVersion: process.versions.node,
    electronVersion: packageJson.devDependencies.electron,
  };
};

const generateAppMetadata = () => {
  const metadata = getAppMetadata();
  const metadataPath = path.join(__dirname, '../release/app-metadata.json');

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('✅ App metadata generated:', metadataPath);

  return metadata;
};

const validatePackage = (context) => {
  const { appOutDir } = context;
  console.log('📦 Validating packaged app...');

  if (!fs.existsSync(appOutDir)) {
    throw new Error(`Output directory not found: ${appOutDir}`);
  }

  const files = fs.readdirSync(appOutDir);
  console.log(`   Found ${files.length} installer file(s):`);
  files.forEach((file) => {
    const fullPath = path.join(appOutDir, file);
    const stat = fs.statSync(fullPath);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
    console.log(`   ✓ ${file} (${sizeMB} MB)`);
  });

  return true;
};

const generateChecksums = (context) => {
  const crypto = require('crypto');
  const { appOutDir } = context;

  console.log('\n🔐 Generating checksums...');

  const checksums = {};
  const files = fs.readdirSync(appOutDir);

  files.forEach((file) => {
    const fullPath = path.join(appOutDir, file);
    const fileData = fs.readFileSync(fullPath);
    checksums[file] = {
      sha256: crypto.createHash('sha256').update(fileData).digest('hex'),
      sha512: crypto.createHash('sha512').update(fileData).digest('hex'),
      size: fileData.length,
    };
    console.log(`   ✓ ${file}`);
  });

  const checksumsPath = path.join(__dirname, '../release/CHECKSUMS.json');
  fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));
  console.log(`\n✅ Checksums saved to: ${checksumsPath}`);

  return checksums;
};

const main = async (context) => {
  try {
    console.log('\n🏁 Post-build optimization started...\n');

    // Generate app metadata
    const metadata = generateAppMetadata();

    // Validate package
    validatePackage(context);

    // Generate checksums
    generateChecksums(context);

    console.log('\n✅ Post-build optimization completed successfully!');
    console.log('\n📋 Release Information:');
    console.log(`   App Name: ${metadata.name}`);
    console.log(`   Version: ${metadata.version}`);
    console.log(`   Build Time: ${metadata.buildTime}`);
    console.log(`   Electron Version: ${metadata.electronVersion}`);

    return true;
  } catch (error) {
    console.error('❌ Post-build optimization failed:', error.message);
    throw error;
  }
};

module.exports = main;
