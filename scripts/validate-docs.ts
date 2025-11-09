#!/usr/bin/env tsx
/**
 * Documentation Consistency Validation Script
 * 
 * Compares OpenAPI spec with documentation in README.md
 * to ensure all endpoints are documented consistently.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const openApiPath = resolve(rootDir, 'docs/api/openapi.yaml');
const docsPath = resolve(rootDir, 'docs/api/README.md');

interface EndpointInfo {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags?: string[];
}

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  missingDocs: EndpointInfo[];
  extraDocs: string[];
}

function extractEndpointsFromOpenAPI(openApiContent: string): EndpointInfo[] {
  const spec = parse(openApiContent);
  const endpoints: EndpointInfo[] = [];
  
  if (!spec.paths) {
    return endpoints;
  }
  
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
  
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    
    for (const method of methods) {
      const operation = pathItem[method];
      if (operation) {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: operation.summary,
          description: operation.description,
          tags: operation.tags
        });
      }
    }
  }
  
  return endpoints;
}

function extractEndpointsFromDocs(docsContent: string): string[] {
  const endpoints: string[] = [];
  
  // Look for endpoint documentation patterns
  // Pattern: #### GET /path or #### POST /path
  const endpointRegex = /####\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+([^\s\n]+)/gi;
  let match;
  
  while ((match = endpointRegex.exec(docsContent)) !== null) {
    const method = match[1].toUpperCase();
    const path = match[2];
    endpoints.push(`${method} ${path}`);
  }
  
  // Also look for patterns like "GET /health" in text
  const inlineRegex = /(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+([\/\w\-{}]+)/gi;
  const seen = new Set(endpoints);
  
  while ((match = inlineRegex.exec(docsContent)) !== null) {
    const method = match[1].toUpperCase();
    const path = match[2];
    const endpoint = `${method} ${path}`;
    if (!seen.has(endpoint)) {
      endpoints.push(endpoint);
      seen.add(endpoint);
    }
  }
  
  return endpoints;
}

function normalizePath(path: string): string {
  // Normalize path for comparison (remove trailing slashes, etc.)
  return path.replace(/\/$/, '');
}

async function validateDocs(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    missingDocs: [],
    extraDocs: []
  };

  try {
    console.log('Reading OpenAPI spec...');
    const openApiContent = readFileSync(openApiPath, 'utf-8');
    const openApiEndpoints = extractEndpointsFromOpenAPI(openApiContent);
    console.log(`✓ Found ${openApiEndpoints.length} endpoints in OpenAPI spec`);
    
    console.log('Reading documentation...');
    const docsContent = readFileSync(docsPath, 'utf-8');
    const documentedEndpoints = extractEndpointsFromDocs(docsContent);
    console.log(`✓ Found ${documentedEndpoints.length} endpoints in documentation`);
    
    // Create a set of documented endpoints for quick lookup
    const documentedSet = new Set(documentedEndpoints.map(e => e.toUpperCase()));
    
    // Check for missing documentation
    for (const endpoint of openApiEndpoints) {
      const endpointKey = `${endpoint.method} ${normalizePath(endpoint.path)}`.toUpperCase();
      
      if (!documentedSet.has(endpointKey)) {
        result.missingDocs.push(endpoint);
        result.errors.push(
          `Missing documentation for ${endpoint.method} ${endpoint.path}${endpoint.summary ? ` (${endpoint.summary})` : ''}`
        );
        result.success = false;
      }
    }
    
    // Check for extra documentation (endpoints documented but not in OpenAPI)
    const openApiSet = new Set(
      openApiEndpoints.map(e => `${e.method} ${normalizePath(e.path)}`.toUpperCase())
    );
    
    for (const documented of documentedEndpoints) {
      const normalized = documented.toUpperCase();
      if (!openApiSet.has(normalized)) {
        result.extraDocs.push(documented);
        result.warnings.push(
          `Documentation exists for ${documented} but endpoint not found in OpenAPI spec`
        );
      }
    }
    
    // Check for public endpoints documentation
    const publicEndpoints = openApiEndpoints.filter(e => 
      e.tags?.includes('Public') || e.path === '/health' || e.path === '/meta/config'
    );
    
    const hasPublicSection = docsContent.includes('### Public Endpoints') || 
                            docsContent.includes('## Public Endpoints');
    
    if (publicEndpoints.length > 0 && !hasPublicSection) {
      result.warnings.push('Public endpoints exist but no "Public Endpoints" section found in docs');
    }
    
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('✓ All endpoints are documented!');
    }
    
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Error: ${error.message}`);
    if (error.stack) {
      result.errors.push(`Stack: ${error.stack}`);
    }
  }

  return result;
}

// Main execution
async function main() {
  const result = await validateDocs();

  if (result.warnings.length > 0) {
    console.log('\n⚠ Warnings:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (result.errors.length > 0) {
    console.error('\n❌ Validation Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    
    if (result.missingDocs.length > 0) {
      console.error('\nMissing documentation for:');
      result.missingDocs.forEach(endpoint => {
        console.error(`  - ${endpoint.method} ${endpoint.path}`);
      });
    }
    
    process.exit(1);
  }

  if (result.success) {
    console.log('\n✅ Documentation validation passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

