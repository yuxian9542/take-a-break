#!/usr/bin/env tsx
/**
 * Development-time Validation Watcher
 * 
 * Watches for changes to OpenAPI spec, types, or documentation
 * and automatically runs validation checks.
 */

import { watch, statSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const watchPaths = [
  resolve(rootDir, 'docs/api/openapi.yaml'),
  resolve(rootDir, 'packages/types/src'),
  resolve(rootDir, 'docs/api/README.md')
];

let validationTimeout: NodeJS.Timeout | null = null;

function runValidation() {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }

  // Debounce validation - wait 500ms after last change
  validationTimeout = setTimeout(() => {
    console.log('\n🔍 Running validation checks...\n');
    try {
      execSync('pnpm validate:all', {
        cwd: rootDir,
        stdio: 'inherit'
      });
      console.log('\n✅ Validation passed!\n');
    } catch (error) {
      console.error('\n❌ Validation failed!\n');
    }
  }, 500);
}

function startWatching() {
  console.log('👀 Watching for changes to API contract files...');
  console.log('Watching:');
  watchPaths.forEach(path => console.log(`  - ${path}`));
  console.log('\nPress Ctrl+C to stop watching.\n');

  watchPaths.forEach(watchPath => {
    try {
      const stats = statSync(watchPath);
      if (stats.isDirectory()) {
        // Watch directory recursively
        watch(
          watchPath,
          { recursive: true },
          (eventType, filename) => {
            if (filename) {
              console.log(`📝 File changed: ${filename}`);
              runValidation();
            }
          }
        );
      } else {
        // Watch single file
        watch(
          watchPath,
          (eventType, filename) => {
            if (filename) {
              console.log(`📝 File changed: ${filename}`);
              runValidation();
            }
          }
        );
      }
    } catch (error: any) {
      console.warn(`⚠️  Could not watch ${watchPath}: ${error.message}`);
    }
  });

  // Run initial validation
  runValidation();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping validation watcher...');
  process.exit(0);
});

startWatching();

