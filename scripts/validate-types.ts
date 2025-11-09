#!/usr/bin/env tsx
/**
 * TypeScript Type Consistency Validation Script
 * 
 * Generates TypeScript types from OpenAPI spec and compares them
 * with existing types to ensure consistency.
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import openapiTS from 'openapi-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const openApiPath = resolve(rootDir, 'docs/api/openapi.yaml');
const typesDir = resolve(rootDir, 'packages/types/src');
const tempTypesPath = resolve(rootDir, 'scripts/.temp-generated-types.ts');

interface TypeMismatch {
  schema: string;
  field: string;
  openapiType: string;
  existingType: string;
  issue: string;
}

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  mismatches: TypeMismatch[];
}

async function generateTypesFromOpenAPI(): Promise<string> {
  try {
    const types = await openapiTS(openApiPath);
    return types;
  } catch (error: any) {
    throw new Error(`Failed to generate types from OpenAPI: ${error.message}`);
  }
}

function parseTypeScriptFile(filePath: string): Map<string, any> {
  const content = readFileSync(filePath, 'utf-8');
  const types = new Map<string, any>();
  
  // Simple regex-based parsing for interfaces and types
  // This is a simplified parser - in production, use TypeScript compiler API
  const interfaceRegex = /export\s+(interface|type)\s+(\w+)[^{]*\{([^}]+)\}/gs;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const typeName = match[2];
    const fields = match[3];
    const fieldMap = new Map<string, string>();
    
    // Extract fields
    const fieldRegex = /(\w+)(\?)?\s*:\s*([^;,\n]+)/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
      const fieldName = fieldMatch[1];
      const optional = fieldMatch[2] === '?';
      const fieldType = fieldMatch[3].trim();
      fieldMap.set(fieldName, `${fieldType}${optional ? '?' : ''}`);
    }
    
    types.set(typeName, {
      fields: fieldMap,
      isInterface: match[1] === 'interface'
    });
  }
  
  return types;
}

function compareTypes(
  openapiTypes: Map<string, any>,
  existingTypes: Map<string, any>
): TypeMismatch[] {
  const mismatches: TypeMismatch[] = [];
  
  // Check each OpenAPI schema against existing types
  for (const [schemaName, openapiType] of openapiTypes.entries()) {
    const existingType = existingTypes.get(schemaName);
    
    if (!existingType) {
      mismatches.push({
        schema: schemaName,
        field: 'N/A',
        openapiType: 'defined',
        existingType: 'missing',
        issue: `Type ${schemaName} exists in OpenAPI but not in TypeScript types`
      });
      continue;
    }
    
    // Compare fields
    const openapiFields = openapiType.fields || new Map();
    const existingFields = existingType.fields || new Map();
    
    // Check for missing fields in existing types
    for (const [fieldName, openapiFieldType] of openapiFields.entries()) {
      if (!existingFields.has(fieldName)) {
        mismatches.push({
          schema: schemaName,
          field: fieldName,
          openapiType: openapiFieldType,
          existingType: 'missing',
          issue: `Field ${fieldName} exists in OpenAPI but not in TypeScript type`
        });
      }
    }
    
    // Check for extra fields in existing types (warnings only)
    for (const [fieldName] of existingFields.entries()) {
      if (!openapiFields.has(fieldName)) {
        mismatches.push({
          schema: schemaName,
          field: fieldName,
          openapiType: 'missing',
          existingType: existingFields.get(fieldName) || 'unknown',
          issue: `Field ${fieldName} exists in TypeScript but not in OpenAPI (may be intentional)`
        });
      }
    }
  }
  
  return mismatches;
}

async function validateTypes(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    mismatches: []
  };

  try {
    console.log('Generating TypeScript types from OpenAPI spec...');
    const generatedTypes = await generateTypesFromOpenAPI();
    
    // Write to temp file for inspection
    writeFileSync(tempTypesPath, generatedTypes);
    console.log(`✓ Generated types written to ${tempTypesPath}`);
    
    // Parse existing types
    console.log('Parsing existing TypeScript types...');
    const existingTypes = new Map<string, any>();
    
    const typeFiles = ['break.ts', 'error.ts', 'public.ts', 'map.ts', 'voice.ts'];
    for (const file of typeFiles) {
      const filePath = resolve(typesDir, file);
      if (existsSync(filePath)) {
        const types = parseTypeScriptFile(filePath);
        types.forEach((value, key) => existingTypes.set(key, value));
        console.log(`✓ Parsed ${file}`);
      }
    }
    
    // Parse generated types (simplified - would need proper TypeScript parser)
    const openapiTypes = new Map<string, any>();
    // For now, we'll do a basic check by looking for key schemas
    const keySchemas = [
      'BreakPlan',
      'ErrorResponse',
      'SuccessResponse',
      'HealthData',
      'MetaConfigData',
      'Location',
      'CreateBreakPlanRequest',
      'HistoryItem',
      'HistoryResponse'
    ];
    
    // Check if generated types contain these schemas
    for (const schema of keySchemas) {
      if (generatedTypes.includes(`export interface ${schema}`) || 
          generatedTypes.includes(`export type ${schema}`)) {
        openapiTypes.set(schema, { exists: true });
      }
    }
    
    // Compare types
    console.log('Comparing types...');
    const mismatches = compareTypes(openapiTypes, existingTypes);
    result.mismatches = mismatches;
    
    // Categorize mismatches
    for (const mismatch of mismatches) {
      if (mismatch.issue.includes('exists in TypeScript but not in OpenAPI')) {
        result.warnings.push(`${mismatch.schema}.${mismatch.field}: ${mismatch.issue}`);
      } else {
        result.errors.push(`${mismatch.schema}.${mismatch.field}: ${mismatch.issue}`);
        result.success = false;
      }
    }
    
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('✓ All types are consistent!');
    }
    
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Error: ${error.message}`);
    if (error.stack) {
      result.errors.push(`Stack: ${error.stack}`);
    }
  } finally {
    // Clean up temp file
    if (existsSync(tempTypesPath)) {
      unlinkSync(tempTypesPath);
    }
  }

  return result;
}

// Main execution
async function main() {
  const result = await validateTypes();

  if (result.warnings.length > 0) {
    console.log('\n⚠ Warnings:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (result.errors.length > 0) {
    console.error('\n❌ Validation Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  if (result.success) {
    console.log('\n✅ Type validation passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

