# API Validation and Testing Implementation

## Overview

This document summarizes the implementation of a comprehensive API contract validation system that ensures consistency between the OpenAPI specification, TypeScript types, documentation, and runtime implementation.

The validation system includes:
- **Static validation**: OpenAPI spec syntax and structure validation
- **Type consistency**: TypeScript types matching OpenAPI schemas
- **Documentation consistency**: API documentation matching OpenAPI spec
- **Runtime validation**: Request/response validation against OpenAPI schemas
- **CI/CD integration**: Automated validation in GitHub Actions
- **Development tools**: Watch mode for automatic validation during development

## Files Created

### Validation Scripts

1. **`scripts/validate-openapi.ts`**
   - Validates OpenAPI specification syntax and structure
   - Checks for missing required fields, invalid references, and schema errors
   - Uses `@apidevtools/swagger-parser` for validation

2. **`scripts/validate-types.ts`**
   - Generates TypeScript types from OpenAPI spec using `openapi-typescript`
   - Compares generated types with existing types in `packages/types/src/`
   - Reports mismatches in field names, types, and required fields

3. **`scripts/validate-docs.ts`**
   - Compares OpenAPI spec with documentation in `docs/api/README.md`
   - Identifies missing or extra endpoint documentation
   - Validates that all endpoints are properly documented

4. **`scripts/validate-all.ts`**
   - Master validation script that runs all validation checks
   - Aggregates results and provides summary
   - Exits with appropriate status codes

5. **`scripts/watch-validate.ts`**
   - Development-time watch mode for automatic validation
   - Watches for changes to OpenAPI spec, types, and documentation
   - Automatically runs validation on file changes (debounced)

### Runtime Validation Plugin

6. **`services/api/src/plugins/validation.ts`**
   - Fastify plugin for runtime request/response validation
   - Integrates Swagger UI for interactive API documentation
   - Provides validation helpers:
     - `fastify.validateSchema(schemaName, data)` - Validate against a schema
     - `fastify.validateRequest(path, method, data)` - Validate request body
     - `fastify.validateResponse(path, method, statusCode, data)` - Validate response (dev only)

### CI/CD Integration

7. **`.github/workflows/validate-api-contract.yml`**
   - GitHub Actions workflow for automated validation
   - Runs on push/PR to `main` or `develop` branches
   - Validates OpenAPI spec, types, documentation, and runtime

## Files Modified

### Package Configuration

1. **`package.json`** (root)
   - Added validation scripts:
     - `validate:openapi` - Validate OpenAPI spec
     - `validate:types` - Check type consistency
     - `validate:docs` - Check documentation consistency
     - `validate:all` - Run all validations
     - `validate:watch` - Watch mode for development
   - Added dev dependencies:
     - `@apidevtools/swagger-parser` - OpenAPI validation
     - `openapi-typescript` - Type generation from OpenAPI
     - `yaml` - YAML parsing

2. **`services/api/package.json`**
   - Added `validate:runtime` script for server validation
   - Added dependencies:
     - `@fastify/swagger-ui` - Swagger UI integration
     - `ajv` - JSON schema validation
     - `ajv-formats` - Additional format validators
     - `yaml` - YAML parsing

### Server Integration

3. **`services/api/src/server.ts`**
   - Registered validation plugin
   - Removed duplicate Swagger registration (now handled by plugin)

### Configuration

4. **`.gitignore`**
   - Added `scripts/.temp-generated-types.ts` to ignore temporary type files

## Dependencies Added

### Root Package (`package.json`)
```json
{
  "@apidevtools/swagger-parser": "^10.1.0",
  "openapi-typescript": "^6.7.4",
  "yaml": "^2.3.4"
}
```

### API Service (`services/api/package.json`)
```json
{
  "@fastify/swagger-ui": "^1.10.0",
  "ajv": "^8.12.0",
  "ajv-formats": "^2.1.1",
  "yaml": "^2.3.4"
}
```

## How to Run API Tests

### Prerequisites

First, ensure all dependencies are installed:
```bash
pnpm install
```

### Running Individual Validation Scripts

#### 1. Validate OpenAPI Specification
Validates the OpenAPI spec for syntax errors and structural issues:
```bash
pnpm validate:openapi
```

**Expected Output:**
```
Validating OpenAPI spec: /path/to/docs/api/openapi.yaml
✓ OpenAPI version: 3.0.3
✓ API Info: Take a Break API v0.1.0
✓ Found X paths
✓ Found X component schemas

✓ OpenAPI spec is valid!

✅ All validations passed!
```

#### 2. Validate TypeScript Types
Checks if TypeScript types match OpenAPI schemas:
```bash
pnpm validate:types
```

**Expected Output:**
```
Generating TypeScript types from OpenAPI spec...
✓ Generated types written to scripts/.temp-generated-types.ts
Parsing existing TypeScript types...
✓ Parsed break.ts
✓ Parsed error.ts
✓ Parsed public.ts
Comparing types...
✓ All types are consistent!

✅ Type validation passed!
```

#### 3. Validate Documentation
Compares OpenAPI spec with documentation:
```bash
pnpm validate:docs
```

**Expected Output:**
```
Reading OpenAPI spec...
✓ Found X endpoints in OpenAPI spec
Reading documentation...
✓ Found X endpoints in documentation
✓ All endpoints are documented!

✅ Documentation validation passed!
```

#### 4. Run All Validations (Recommended)
Runs all validation checks in sequence:
```bash
pnpm validate:all
```

**Expected Output:**
```
🔍 Running all API contract validations...

============================================================
Running: validate-openapi.ts
============================================================
✅ validate-openapi.ts passed

============================================================
Running: validate-types.ts
============================================================
✅ validate-types.ts passed

============================================================
Running: validate-docs.ts
============================================================
✅ validate-docs.ts passed

============================================================
Summary
============================================================
✅ Passed: 3
❌ Failed: 0

🎉 All validations passed!
```

### Development Tools

#### Watch Mode
Automatically runs validation when API contract files change:
```bash
pnpm validate:watch
```

This watches:
- `docs/api/openapi.yaml`
- `packages/types/src/**`
- `docs/api/README.md`

Press `Ctrl+C` to stop watching.

**Example Output:**
```
👀 Watching for changes to API contract files...
Watching:
  - /path/to/docs/api/openapi.yaml
  - /path/to/packages/types/src
  - /path/to/docs/api/README.md

Press Ctrl+C to stop watching.

🔍 Running validation checks...

✅ Validation passed!
```

#### Runtime Validation
Validates that the server can start and load the validation plugin:
```bash
cd services/api
pnpm validate:runtime
```

Or from the root:
```bash
pnpm --filter @take-a-break/api validate:runtime
```

### Testing the API Server

#### Start the Development Server
```bash
pnpm dev:api
```

The server will:
- Load the validation plugin
- Register Swagger UI at `/docs` (if `ENABLE_SWAGGER` is enabled)
- Enable request/response validation in development mode

#### Access Swagger UI
Once the server is running, visit:
```
http://localhost:3333/docs
```

This provides an interactive interface to:
- Browse all API endpoints
- View request/response schemas
- Test API endpoints directly
- See validation errors in real-time

### Complete Testing Workflow

#### Option 1: Quick Validation
```bash
# Run all validations
pnpm validate:all
```

#### Option 2: Development Workflow
```bash
# Terminal 1: Watch for changes
pnpm validate:watch

# Terminal 2: Run API server
pnpm dev:api

# Terminal 3: Make changes to API contract files
# Watch mode will automatically validate changes
```

#### Option 3: Pre-commit Validation
Add to your pre-commit hook:
```bash
#!/bin/sh
pnpm validate:all
```

## Validation Features

### Static Validation

- **OpenAPI Spec Validation**
  - Syntax validation (YAML parsing)
  - Structure validation (required fields)
  - Reference validation (schema references)
  - Security scheme validation

- **Type Consistency**
  - Generates types from OpenAPI spec
  - Compares with existing TypeScript types
  - Reports missing fields, type mismatches
  - Warns about extra fields (may be intentional)

- **Documentation Consistency**
  - Extracts endpoints from OpenAPI spec
  - Extracts documented endpoints from README
  - Reports missing documentation
  - Warns about extra documentation

### Runtime Validation

- **Request Validation**
  - Validates request bodies against OpenAPI schemas
  - Uses AJV for JSON schema validation
  - Supports all OpenAPI formats (date-time, uuid, etc.)

- **Response Validation** (Development Only)
  - Validates responses against OpenAPI schemas
  - Logs warnings for mismatches
  - Does not block responses (development aid)

- **Schema Validation Helpers**
  - `fastify.validateSchema(schemaName, data)` - Validate any schema
  - `fastify.validateRequest(path, method, data)` - Validate request
  - `fastify.validateResponse(path, method, statusCode, data)` - Validate response

## CI/CD Integration

The validation system is integrated into GitHub Actions. The workflow (`.github/workflows/validate-api-contract.yml`) runs automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- When files in these paths change:
  - `docs/api/openapi.yaml`
  - `packages/types/src/**`
  - `docs/api/README.md`
  - `services/api/src/**`
  - `scripts/validate-*.ts`

The CI/CD pipeline:
1. Installs dependencies
2. Runs `validate:openapi`
3. Runs `validate:types`
4. Runs `validate:docs`
5. Runs `validate:all`
6. Attempts `validate:runtime` (may skip if env vars missing)

If any validation fails, the build fails and the PR cannot be merged.

## Error Handling

### Validation Errors

When validation fails, scripts provide:
- Clear error messages with file locations
- Line numbers for syntax errors
- Specific field/type mismatches
- Actionable suggestions

**Example Error Output:**
```
❌ Validation Errors:
  - Error parsing /path/to/openapi.yaml: bad indentation of a mapping entry (532:57)
  - Field duration exists in OpenAPI but not in TypeScript type BreakPlan
  - Missing documentation for POST /break/plans
```

### Exit Codes

- `0` - All validations passed
- `1` - One or more validations failed

This allows scripts to be used in CI/CD pipelines and pre-commit hooks.

## Best Practices

### During Development

1. **Use Watch Mode**
   ```bash
   pnpm validate:watch
   ```
   This automatically validates changes as you work.

2. **Validate Before Committing**
   ```bash
   pnpm validate:all
   ```
   Ensure all validations pass before committing.

3. **Check Swagger UI**
   When the server is running, visit `/docs` to verify:
   - All endpoints are documented
   - Request/response schemas are correct
   - Examples match your implementation

### When Adding New Endpoints

1. Update `docs/api/openapi.yaml` with the new endpoint
2. Add TypeScript types in `packages/types/src/`
3. Update `docs/api/README.md` with documentation
4. Run `pnpm validate:all` to ensure consistency
5. Implement the endpoint in `services/api/src/routes/`

### When Modifying Schemas

1. Update the schema in `docs/api/openapi.yaml`
2. Update corresponding TypeScript types
3. Update documentation if needed
4. Run validations to catch any inconsistencies

## Troubleshooting

### Common Issues

#### "Command not found" errors
- Ensure dependencies are installed: `pnpm install`
- Check you're in the project root directory
- Verify Node.js version >= 18.17.0: `node --version`

#### OpenAPI validation errors
- Check YAML syntax (indentation, quotes)
- Verify all `$ref` references are valid
- Ensure required fields are present

#### Type validation errors
- Ensure TypeScript types match OpenAPI schemas exactly
- Check for optional fields (marked with `?` in TypeScript)
- Verify enum values match

#### Runtime validation not working
- Check that `ENABLE_SWAGGER` is set in environment
- Verify the validation plugin is registered in `server.ts`
- Check server logs for plugin registration errors

#### Watch mode not detecting changes
- Ensure you're watching the correct file paths
- Check file permissions
- Try restarting the watch process

## Summary

The API validation and testing system provides:

✅ **Static validation** - Catch errors before runtime  
✅ **Type safety** - Ensure TypeScript types match OpenAPI  
✅ **Documentation consistency** - Keep docs in sync with API  
✅ **Runtime validation** - Validate requests/responses at runtime  
✅ **CI/CD integration** - Automated validation in pipelines  
✅ **Development tools** - Watch mode for automatic validation  

This comprehensive system ensures that the API contract, implementation, types, and documentation remain consistent throughout the development lifecycle.

