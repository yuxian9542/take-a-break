#!/usr/bin/env tsx
/**
 * OpenAPI Spec Validation Script
 * 
 * Validates the OpenAPI specification file for syntax errors,
 * missing required fields, invalid references, and schema errors.
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const openApiPath = resolve(rootDir, 'docs/api/openapi.yaml');

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

async function validateOpenAPI(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: []
  };

  try {
    // Read and parse the OpenAPI spec
    console.log(`Validating OpenAPI spec: ${openApiPath}`);
    
    const api = await SwaggerParser.validate(openApiPath, {
      validate: {
        spec: true,
        schema: true
      },
      dereference: {
        circular: 'ignore'
      }
    });

    // Check for required OpenAPI fields
    if (!api.openapi) {
      result.errors.push('Missing required field: openapi');
      result.success = false;
    } else {
      console.log(`✓ OpenAPI version: ${api.openapi}`);
    }

    if (!api.info) {
      result.errors.push('Missing required field: info');
      result.success = false;
    } else {
      console.log(`✓ API Info: ${api.info.title} v${api.info.version}`);
    }

    if (!api.paths || Object.keys(api.paths).length === 0) {
      result.warnings.push('No paths defined in OpenAPI spec');
    } else {
      console.log(`✓ Found ${Object.keys(api.paths).length} paths`);
    }

    if (!api.components) {
      result.warnings.push('No components defined in OpenAPI spec');
    } else {
      const schemasCount = api.components.schemas ? Object.keys(api.components.schemas).length : 0;
      console.log(`✓ Found ${schemasCount} component schemas`);
    }

    // Validate all paths have at least one operation
    if (api.paths) {
      for (const [path, pathItem] of Object.entries(api.paths)) {
        if (!pathItem || typeof pathItem !== 'object') continue;
        
        const operations = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
        const hasOperation = operations.some(op => pathItem[op]);
        
        if (!hasOperation) {
          result.warnings.push(`Path ${path} has no operations defined`);
        }
      }
    }

    // Check for security schemes if security is defined
    if (api.security && api.security.length > 0) {
      if (!api.components?.securitySchemes || Object.keys(api.components.securitySchemes).length === 0) {
        result.errors.push('Security is defined but no security schemes are provided');
        result.success = false;
      }
    }

    console.log('\n✓ OpenAPI spec is valid!');
    
  } catch (error: any) {
    result.success = false;
    
    if (error.details) {
      // SwaggerParser provides detailed error information
      result.errors.push(`Validation error: ${error.message}`);
      if (error.details) {
        result.errors.push(`Details: ${JSON.stringify(error.details, null, 2)}`);
      }
    } else if (error.message) {
      result.errors.push(`Error: ${error.message}`);
    } else {
      result.errors.push(`Unknown error: ${String(error)}`);
    }

    // Try to provide file location if available
    if (error.path) {
      result.errors.push(`Location: ${error.path}`);
    }
  }

  return result;
}

// Main execution
async function main() {
  const result = await validateOpenAPI();

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
    console.log('\n✅ All validations passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

