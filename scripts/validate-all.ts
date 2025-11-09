#!/usr/bin/env tsx
/**
 * Master Validation Script
 * 
 * Runs all validation checks and aggregates results.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

interface ValidationResult {
  name: string;
  success: boolean;
  output: string;
}

async function runValidation(scriptName: string): Promise<ValidationResult> {
  try {
    const scriptPath = resolve(__dirname, scriptName);
    const output = execSync(`tsx ${scriptPath}`, {
      encoding: 'utf-8',
      cwd: rootDir,
      stdio: 'pipe'
    });
    
    return {
      name: scriptName,
      success: true,
      output
    };
  } catch (error: any) {
    return {
      name: scriptName,
      success: false,
      output: error.stdout || error.message || String(error)
    };
  }
}

async function main() {
  console.log('🔍 Running all API contract validations...\n');
  
  const validations = [
    'validate-openapi.ts',
    'validate-types.ts',
    'validate-docs.ts'
  ];
  
  const results: ValidationResult[] = [];
  
  for (const validation of validations) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${validation}`);
    console.log('='.repeat(60));
    
    const result = await runValidation(validation);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${validation} passed`);
    } else {
      console.log(`❌ ${validation} failed`);
      console.log(result.output);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed validations:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.name}`));
    process.exit(1);
  }
  
  console.log('\n🎉 All validations passed!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

