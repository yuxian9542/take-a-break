import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../../../');
const openApiPath = resolve(rootDir, 'docs/api/openapi.yaml');

/**
 * Runtime validation plugin for Fastify
 * 
 * This plugin:
 * 1. Loads the OpenAPI spec
 * 2. Registers Swagger UI for development
 * 3. Enables request/response schema validation
 */
async function validationPlugin(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  try {
    // Load OpenAPI spec
    const openApiContent = readFileSync(openApiPath, 'utf-8');
    const openApiSpec = parse(openApiContent);

    // Load config
    const { loadConfig } = await import('@take-a-break/config');
    const config = loadConfig();

    // Configure AJV with formats support
    const ajv = new Ajv({
      allErrors: true,
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
      strict: false
    });
    addFormats(ajv);

    // Register Swagger documentation
    await fastify.register(fastifySwagger, {
      openapi: openApiSpec,
      refResolver: {
        buildLocalReference(json, baseUri, fragment, i) {
          return json.$id || `def-${i}`;
        }
      }
    });

    // Register Swagger UI (only in development)
    if (config.ENABLE_SWAGGER) {
      await fastify.register(fastifySwaggerUI, {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: true
        },
        staticCSP: true,
        transformStaticCSP: (header) => header
      });

      fastify.log.info('Swagger UI available at /docs');
    }

    // Add schema validation helper
    fastify.decorate('validateSchema', function(schemaName: string, data: any) {
      const schema = getSchemaFromOpenAPI(openApiSpec, schemaName);
      if (!schema) {
        throw new Error(`Schema ${schemaName} not found in OpenAPI spec`);
      }

      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        const errors = validate.errors || [];
        throw new Error(
          `Schema validation failed for ${schemaName}: ${JSON.stringify(errors, null, 2)}`
        );
      }

      return true;
    });

    // Add request validation helper
    fastify.decorate('validateRequest', function(
      path: string,
      method: string,
      data: any
    ) {
      const requestSchema = getRequestSchemaFromOpenAPI(openApiSpec, path, method);
      if (!requestSchema) {
        // No schema defined, skip validation
        return true;
      }

      const validate = ajv.compile(requestSchema);
      const valid = validate(data);

      if (!valid) {
        const errors = validate.errors || [];
        throw new Error(
          `Request validation failed for ${method} ${path}: ${JSON.stringify(errors, null, 2)}`
        );
      }

      return true;
    });

    // Add response validation helper (for development)
    fastify.decorate('validateResponse', function(
      path: string,
      method: string,
      statusCode: number,
      data: any
    ) {
      // Only validate in development
      if (config.APP_ENV !== 'development') {
        return true;
      }

      const responseSchema = getResponseSchemaFromOpenAPI(
        openApiSpec,
        path,
        method,
        statusCode
      );
      if (!responseSchema) {
        // No schema defined, skip validation
        return true;
      }

      const validate = ajv.compile(responseSchema);
      const valid = validate(data);

      if (!valid) {
        const errors = validate.errors || [];
        fastify.log.warn(
          `Response validation failed for ${method} ${path} (${statusCode}): ${JSON.stringify(errors, null, 2)}`
        );
        // Don't throw in development, just log
      }

      return true;
    });

    fastify.log.info('Validation plugin registered');
  } catch (error: any) {
    fastify.log.error(`Failed to register validation plugin: ${error.message}`);
    throw error;
  }
}

/**
 * Get schema from OpenAPI spec by name
 */
function getSchemaFromOpenAPI(spec: any, schemaName: string): any {
  if (!spec.components?.schemas) {
    return null;
  }

  return spec.components.schemas[schemaName] || null;
}

/**
 * Get request schema from OpenAPI spec
 */
function getRequestSchemaFromOpenAPI(
  spec: any,
  path: string,
  method: string
): any {
  const pathItem = spec.paths?.[path];
  if (!pathItem) {
    return null;
  }

  const operation = pathItem[method.toLowerCase()];
  if (!operation) {
    return null;
  }

  const requestBody = operation.requestBody;
  if (!requestBody?.content?.['application/json']?.schema) {
    return null;
  }

  return requestBody.content['application/json'].schema;
}

/**
 * Get response schema from OpenAPI spec
 */
function getResponseSchemaFromOpenAPI(
  spec: any,
  path: string,
  method: string,
  statusCode: number
): any {
  const pathItem = spec.paths?.[path];
  if (!pathItem) {
    return null;
  }

  const operation = pathItem[method.toLowerCase()];
  if (!operation) {
    return null;
  }

  const response = operation.responses?.[String(statusCode)];
  if (!response?.content?.['application/json']?.schema) {
    return null;
  }

  return response.content['application/json'].schema;
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    validateSchema(schemaName: string, data: any): boolean;
    validateRequest(path: string, method: string, data: any): boolean;
    validateResponse(
      path: string,
      method: string,
      statusCode: number,
      data: any
    ): boolean;
  }
}

export default fp(validationPlugin, {
  name: 'validation-plugin'
});

