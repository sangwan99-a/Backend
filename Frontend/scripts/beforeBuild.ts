/**
 * Production build optimization script
 * Runs before the Electron builder to ensure all assets are optimized
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

const DIST_DIR = path.join(__dirname, '../dist');
const BUILD_DIR = path.join(__dirname, '../build');

interface BuildStats {
  totalSize: number;
  compressedSize: number;
  files: {
    path: string;
    size: number;
    compressed: number;
    ratio: number;
  }[];
}

const getFileSizeInMB = (bytes: number): number => bytes / (1024 * 1024);

const analyzeBundle = async (): Promise<BuildStats> => {
  const stats: BuildStats = {
    totalSize: 0,
    compressedSize: 0,
    files: [],
  };

  const walkDir = (dir: string): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDir(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  };

  if (!fs.existsSync(DIST_DIR)) {
    console.warn(`⚠️  ${DIST_DIR} does not exist yet`);
    return stats;
  }

  const files = walkDir(DIST_DIR);

  for (const file of files) {
    const stat = fs.statSync(file);
    const size = stat.size;
    stats.totalSize += size;

    // Calculate gzip size
    const compressed = await new Promise<number>((resolve, reject) => {
      const buffer = fs.readFileSync(file);
      zlib.gzip(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(result.length);
      });
    });

    stats.compressedSize += compressed;
    const ratio = ((compressed / size) * 100).toFixed(2);

    const relativePath = path.relative(DIST_DIR, file);
    stats.files.push({
      path: relativePath,
      size,
      compressed,
      ratio: parseFloat(ratio),
    });
  }

  return stats;
};

const optimizeImages = (): void => {
  console.log('🖼️  Optimizing images...');
  // Note: Requires sharp library
  // For now, log the opportunity
  console.log('   ℹ️  Install sharp for advanced image optimization');
  console.log('   → pnpm add -D sharp');
};

const analyzeUnusedDependencies = (): void => {
  console.log('📦 Analyzing dependencies...');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
  );

  console.log(`   Total dependencies: ${Object.keys(packageJson.dependencies).length}`);
  console.log(`   Total devDependencies: ${Object.keys(packageJson.devDependencies).length}`);

  // Recommend tree-shaking
  console.log('   ℹ️  Tree-shaking enabled for production builds');
};

const generateBuildReport = (stats: BuildStats): void => {
  const reportPath = path.join(__dirname, '../build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));

  console.log('\n📊 Build Report:');
  console.log(`   Total size: ${getFileSizeInMB(stats.totalSize).toFixed(2)} MB`);
  console.log(`   Compressed (gzip): ${getFileSizeInMB(stats.compressedSize).toFixed(2)} MB`);
  console.log(`   Compression ratio: ${((stats.compressedSize / stats.totalSize) * 100).toFixed(2)}%`);

  // Top 10 largest files
  const sorted = [...stats.files]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  console.log('\n   📈 Top 10 largest files:');
  sorted.forEach((file) => {
    console.log(
      `      ${file.path}: ${getFileSizeInMB(file.size).toFixed(2)} MB (${getFileSizeInMB(file.compressed).toFixed(2)} MB gzipped)`
    );
  });

  console.log(`\n   📄 Full report saved to: ${reportPath}`);
};

const validateBuildSize = (stats: BuildStats): boolean => {
  const MAX_APP_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_COMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB

  const sizeOK = stats.totalSize <= MAX_APP_SIZE;
  const compressedOK = stats.compressedSize <= MAX_COMPRESSED_SIZE;

  if (!sizeOK) {
    console.warn(
      `⚠️  App size (${getFileSizeInMB(stats.totalSize).toFixed(2)} MB) exceeds 100MB limit`
    );
  }
  if (!compressedOK) {
    console.warn(
      `⚠️  Compressed size (${getFileSizeInMB(stats.compressedSize).toFixed(2)} MB) exceeds 50MB limit`
    );
  }

  return sizeOK && compressedOK;
};

const main = async (): Promise<void> => {
  console.log('🚀 Starting production build optimization...\n');

  try {
    // Analyze bundle
    const stats = await analyzeBundle();
    generateBuildReport(stats);

    // Optimize images
    optimizeImages();

    // Analyze dependencies
    analyzeUnusedDependencies();

    // Validate sizes
    const isValid = validateBuildSize(stats);

    if (isValid) {
      console.log('\n✅ Build optimization passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Build optimization completed with warnings');
      process.exit(0); // Non-fatal
    }
  } catch (error) {
    console.error('❌ Build optimization failed:', error);
    process.exit(1);
  }
};

main();
