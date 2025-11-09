# Take a Break API - Complete Reference

**Last Updated**: 2025-01-08  
**Version**: 0.1.0  
**Status**: Phase 1 Complete ✅

This document consolidates all API-related documentation including endpoints, types, validation, and testing procedures.

---

## Table of Contents

1. [Overview](#overview)
2. [API Contract & Types](#api-contract--types)
3. [Authentication](#authentication)
4. [Base URLs & Response Format](#base-urls--response-format)
5. [API Endpoints](#api-endpoints)
6. [Validation & Testing](#validation--testing)
7. [Phase 1 Completion Status](#phase-1-completion-status)
8. [Quick Reference](#quick-reference)

---

## Overview

The Take a Break API provides endpoints for managing break plans, viewing history, finding nearby locations, calculating routes, and real-time voice interactions.

**Key Features**:
- RESTful API with OpenAPI 3.0.3 specification
- Firebase JWT authentication
- Standardized success/error response format
- Cursor-based pagination
- WebSocket support for voice sessions
- Comprehensive validation system

**All endpoints (except public endpoints) require Firebase JWT authentication.**

---

## API Contract & Types

### OpenAPI Specification

**Location**: `docs/api/openapi.yaml`

Complete OpenAPI 3.0.3 specification defining:
- All API endpoints
- Request/response schemas
- Error responses
- Security schemes (Firebase Auth)
- Component schemas

### TypeScript Type Definitions

**Location**: `packages/types/src/`

All types are defined in separate modules:

#### Core Types
- **`error.ts`**: `ErrorDetail`, `ErrorResponse`, `SuccessResponse<T>`
- **`public.ts`**: `HealthData`, `HealthResponse`, `MetaConfigData`, `MetaConfigResponse`

#### Break Plans
- **`break.ts`**: 
  - `BreakPlan` - Full break plan object
  - `BreakPlanType` - Plan type enum
  - `Location` - Location with address and coordinates
  - `LocationCoordinates` - Simple coordinates
  - `CreateBreakPlanRequest` - Request body for creating plans
  - `BreakPlanResponse` - Array of break plans
  - `CreateBreakPlanResponse` - POST response (array)
  - `UpdateBreakPlanChosenResponse` - PATCH response (single plan)
  - `HistoryItem` - History entry
  - `HistoryResponse` - Paginated history response

#### Map Services
- **`map.ts`**:
  - `Coordinates` - Geographic coordinates
  - `NearbyLocation` - Nearby location result
  - `NearbyRequest` - Nearby search query
  - `NearbyResponse` - Array of nearby locations
  - `RouteWaypoint` - Route waypoint
  - `RouteRequest` - Route calculation request
  - `RouteResponse` - Route calculation result

#### Voice Sessions
- **`voice.ts`**:
  - `VoiceSessionRequest` - WebSocket connection params
  - `VoiceMessageType` - Message type enum
  - `VoiceMessage` - Base message interface
  - `AudioMessage` - Audio data message
  - `TextMessage` - Text message
  - `StatusMessage` - Status update message
  - `ErrorMessage` - Error message
  - `VoiceMessagePayload` - Union of all message types

### Type Alignment

All types are aligned across:
- **OpenAPI Schema** (`docs/api/openapi.yaml`)
- **TypeScript Types** (`packages/types/src/`)
- **Firestore Schema** (`infra/firestore-schema/`)

---

## Authentication

### Firebase JWT Token

Authenticated endpoints require a Firebase JWT token in the `Authorization` header:

```
Authorization: Bearer <firebase-jwt-token>
```

### Getting a Firebase Token

1. Authenticate with Firebase Auth on the client
2. Get the ID token: `firebase.auth().currentUser.getIdToken()`
3. Include the token in the `Authorization` header for all authenticated requests

### Example

```javascript
const token = await firebase.auth().currentUser.getIdToken();
const response = await fetch('https://api.take-a-break.com/break/plans', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Base URLs & Response Format

### Base URLs

- **Development**: `http://localhost:3333`
- **Production**: `https://api.take-a-break.com`

### Success Response

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cursor": "optional-pagination-cursor",
    "hasMore": true
  }
}
```

### Error Response

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The field 'user_id' is required but missing.",
    "details": [
      {
        "field": "user_id",
        "issue": "missing"
      }
    ],
    "timestamp": "2025-11-08T21:00:00Z",
    "trace_id": "8b2fce18-32a1-4e9a-b8a1-7b6e81b7ac6d"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Error Codes

- `INVALID_REQUEST` - Request validation failed
- `UNAUTHORIZED` - Authentication required or invalid
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error
- `AUTHENTICATION_FAILED` - Invalid or expired token
- `AUDIO_PROCESSING_ERROR` - Failed to process audio
- `SESSION_NOT_FOUND` - Invalid session ID
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## API Endpoints

### Public Endpoints

#### GET /health

Health check endpoint. No authentication required.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-01-08T12:00:00Z",
    "environment": "development"
  }
}
```

#### GET /meta/config

Get public configuration metadata. No authentication required.

**Response:**
```json
{
  "success": true,
  "data": {
    "environment": "development",
    "features": ["break-planner", "map", "voice"],
    "firebase": {
      "projectId": "your-project-id",
      "storageBucket": "your-project.appspot.com"
    }
  }
}
```

### Break Plans

#### GET /break/plans

Get all break plans for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Morning Walk",
      "description": "A refreshing walk in the park",
      "duration": 15,
      "location": {
        "address": "Central Park, New York, NY",
        "coordinates": {
          "lat": 40.785091,
          "lng": -73.968285
        }
      },
      "type": "walk",
      "feeling": "stressed",
      "chosen": false,
      "order": 0,
      "created_at": "2025-01-08T10:00:00Z",
      "updated_at": "2025-01-08T10:00:00Z",
      "user_id": "user123"
    }
  ]
}
```

#### POST /break/plans

Create multiple break plans. The LLM agent generates multiple plans based on the user's feeling and location.

**Authentication:** Required

**Request Body:**
```json
{
  "duration": 15,
  "location": {
    "lat": 40.785091,
    "lng": -73.968285
  },
  "feeling": "stressed",
  "request_time": "2025-01-08T10:00:00Z",
  "user_id": "user123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Morning Walk",
      "description": "A refreshing walk in the park",
      "duration": 15,
      "location": {
        "address": "Central Park, New York, NY",
        "coordinates": {
          "lat": 40.785091,
          "lng": -73.968285
        }
      },
      "type": "walk",
      "feeling": "stressed",
      "chosen": false,
      "order": 0,
      "created_at": "2025-01-08T10:00:00Z",
      "updated_at": "2025-01-08T10:00:00Z",
      "user_id": "user123"
    }
  ]
}
```

**Note**: Server auto-generates `id`, `created_at`, `updated_at`, `chosen` (false), and `order` for each plan. Rate limited: 10 requests/hour per user.

#### PATCH /break/plans/{id}/chosen

Mark a break plan as chosen. Sets the `chosen` field to `true` for a specific break plan.

**Authentication:** Required

**Path Parameters:**
- `id` (required): Break plan ID (UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Morning Walk",
    "description": "A refreshing walk in the park",
    "duration": 15,
    "location": {
      "address": "Central Park, New York, NY",
      "coordinates": {
        "lat": 40.785091,
        "lng": -73.968285
      }
    },
    "type": "walk",
    "feeling": "stressed",
    "chosen": true,
    "order": 0,
    "created_at": "2025-01-08T10:00:00Z",
    "updated_at": "2025-01-08T10:00:00Z",
    "user_id": "user123"
  }
}
```

**Note:** Only the plan owner can mark their own plan as chosen.

### History

#### GET /history

Get paginated list of past break sessions using cursor-based pagination. Only returns items where `chosen: true`.

**Authentication:** Required

**Query Parameters:**
- `cursor` (optional): ISO 8601 timestamp or UUID for pagination
- `limit` (optional): Number of items per page (default: 7, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "time": "2025-01-08T10:00:00Z",
        "title": "Morning Walk",
        "duration": 15
      },
      {
        "time": "2025-01-07T14:30:00Z",
        "title": "Breathing Exercise",
        "duration": 10
      }
    ],
    "cursor": "2025-01-07T14:30:00Z",
    "hasMore": true
  },
  "meta": {
    "cursor": "2025-01-07T14:30:00Z",
    "hasMore": true
  }
}
```

### Map Services

#### GET /map/nearby

Find locations near a given point.

**Query Parameters:**
- `lat` (required): Latitude (WGS84 decimal degrees)
- `lng` (required): Longitude (WGS84 decimal degrees)
- `radius` (required): Search radius in meters
- `category` (optional): Location category filter

**Example:**
```
GET /map/nearby?lat=40.785091&lng=-73.968285&radius=1000&category=coffee
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Starbucks",
      "address": "123 Main St, New York, NY",
      "coordinates": {
        "lat": 40.785091,
        "lng": -73.968285
      },
      "distance": 250,
      "category": "coffee"
    }
  ]
}
```

#### GET /map/route

Calculate route from start to end with optional waypoints (query parameters).

**Query Parameters:**
- `start_lat` (required): Start latitude
- `start_lng` (required): Start longitude
- `end_lat` (required): End latitude
- `end_lng` (required): End longitude
- `waypoints` (optional): JSON array of waypoint coordinates

**Example:**
```
GET /map/route?start_lat=40.785091&start_lng=-73.968285&end_lat=40.758896&end_lng=-73.985130
```

#### POST /map/route

Calculate route from start to end with optional waypoints (request body).

**Request Body:**
```json
{
  "start": {
    "lat": 40.785091,
    "lng": -73.968285
  },
  "end": {
    "lat": 40.758896,
    "lng": -73.985130
  },
  "waypoints": [
    {
      "lat": 40.771133,
      "lng": -73.974187
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "distance": 2500,
    "duration": 1800,
    "polyline": "encoded_polyline_string_here"
  }
}
```

### Voice Session

#### WebSocket /voice/session

Real-time voice interaction via WebSocket.

**Authentication:** Required (Firebase JWT token)

**Connection:**

1. **Query Parameter:**
   ```
   wss://api.take-a-break.com/voice/session?token=<firebase-jwt-token>
   ```

2. **Authorization Header:**
   ```
   Authorization: Bearer <firebase-jwt-token>
   ```

**Message Types:**

- `audio` - Audio data (Base64 encoded)
- `text` - Text message (transcription or LLM response)
- `status` - Connection status updates
- `error` - Error messages

**Example Messages:**

```json
// Audio message
{
  "type": "audio",
  "timestamp": "2025-01-08T12:00:00Z",
  "sessionId": "session123",
  "data": "base64_encoded_audio",
  "format": "pcm"
}

// Text message
{
  "type": "text",
  "timestamp": "2025-01-08T12:00:00Z",
  "sessionId": "session123",
  "content": "Hello, how can I help you?",
  "role": "assistant"
}

// Status message
{
  "type": "status",
  "timestamp": "2025-01-08T12:00:00Z",
  "sessionId": "session123",
  "status": "connected",
  "message": "Session established"
}

// Error message
{
  "type": "error",
  "timestamp": "2025-01-08T12:00:00Z",
  "sessionId": "session123",
  "code": "AUDIO_PROCESSING_ERROR",
  "message": "Failed to process audio data"
}
```

**Example WebSocket Client:**

```javascript
const token = await firebase.auth().currentUser.getIdToken();
const ws = new WebSocket(`wss://api.take-a-break.com/voice/session?token=${token}`);

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'audio':
      // Handle audio data
      break;
    case 'text':
      console.log('Text:', message.content);
      break;
    case 'status':
      console.log('Status:', message.status);
      break;
    case 'error':
      console.error('Error:', message.code, message.message);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};

// Send audio message
ws.send(JSON.stringify({
  type: 'audio',
  sessionId: 'session123',
  data: base64AudioData,
  format: 'pcm'
}));
```

### Pagination

The `/history` endpoint uses cursor-based pagination for efficient data retrieval.

**How It Works:**

1. **First Request:** Don't include a `cursor` parameter
2. **Subsequent Requests:** Use the `cursor` from the previous response's `meta.cursor` field
3. **Check for More:** Use `meta.hasMore` to determine if more data is available

**Example:**

```javascript
let cursor = null;
let hasMore = true;

while (hasMore) {
  const url = cursor 
    ? `/history?cursor=${cursor}&limit=7`
    : '/history?limit=7';
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Process items
    console.log(result.data.items);
    
    // Update cursor and hasMore
    cursor = result.meta.cursor;
    hasMore = result.meta.hasMore;
  }
}
```

---

## Validation & Testing

### Overview

A comprehensive validation system ensures consistency between:
- OpenAPI specification
- TypeScript types
- Documentation
- Runtime implementation

### Validation Scripts

#### 1. Validate OpenAPI Specification
```bash
pnpm validate:openapi
```
Validates OpenAPI spec syntax and structure.

#### 2. Validate TypeScript Types
```bash
pnpm validate:types
```
Checks if TypeScript types match OpenAPI schemas.

#### 3. Validate Documentation
```bash
pnpm validate:docs
```
Compares OpenAPI spec with documentation.

#### 4. Run All Validations (Recommended)
```bash
pnpm validate:all
```
Runs all validation checks in sequence.

#### 5. Watch Mode (Development)
```bash
pnpm validate:watch
```
Automatically runs validation when API contract files change.

#### 6. Runtime Validation
```bash
cd services/api
pnpm validate:runtime
```
Validates that the server can start and load the validation plugin.

### Testing the API Server

#### Start Development Server
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

### Validation Features

#### Static Validation
- **OpenAPI Spec Validation**: Syntax, structure, references, security schemes
- **Type Consistency**: Generates types from OpenAPI and compares with existing types
- **Documentation Consistency**: Ensures all endpoints are documented

#### Runtime Validation
- **Request Validation**: Validates request bodies against OpenAPI schemas
- **Response Validation**: Validates responses (development only, logs warnings)
- **Schema Validation Helpers**: 
  - `fastify.validateSchema(schemaName, data)`
  - `fastify.validateRequest(path, method, data)`
  - `fastify.validateResponse(path, method, statusCode, data)`

### CI/CD Integration

Validation runs automatically in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- When API contract files change

See `.github/workflows/validate-api-contract.yml` for details.

---

## Phase 1 Completion Status

### ✅ Phase 1: API Contract & Type Definitions - COMPLETE

**Deliverables:**
- ✅ Updated `docs/api/openapi.yaml`
- ✅ Complete type definitions in `packages/types/src/`
- ✅ API documentation in `docs/api/README.md`
- ✅ Validation scripts and system

**Files Completed:**

1. **Core API Contract**
   - `docs/api/openapi.yaml` - Complete OpenAPI 3.0.3 specification
   - `docs/api/README.md` - Human-readable API documentation

2. **TypeScript Types**
   - `packages/types/src/index.ts` - Main exports
   - `packages/types/src/error.ts` - Error response types
   - `packages/types/src/public.ts` - Public endpoint types
   - `packages/types/src/break.ts` - Break plan types
   - `packages/types/src/map.ts` - Map service types
   - `packages/types/src/voice.ts` - Voice session types

3. **Validation System**
   - `scripts/validate-openapi.ts` - OpenAPI validation
   - `scripts/validate-types.ts` - Type consistency validation
   - `scripts/validate-docs.ts` - Documentation validation
   - `scripts/validate-all.ts` - Master validation script
   - `scripts/watch-validate.ts` - Watch mode for development
   - `services/api/src/plugins/validation.ts` - Runtime validation plugin

4. **Configuration**
   - `package.json` (root) - Validation scripts and dependencies
   - `services/api/package.json` - Runtime validation dependencies
   - `.github/workflows/validate-api-contract.yml` - CI/CD integration

**Validation Status:**
- ✅ TypeScript types compile without errors
- ✅ OpenAPI spec syntax is valid
- ✅ Types match OpenAPI schemas
- ✅ All required fields are documented
- ✅ Response types match request/response flow

### Next Steps

- ⏳ Phase 2: Firestore Schema Design - COMPLETE
- ⏳ Phase 3: Firebase Authentication Setup - NEXT
- ⏳ Phase 4: Middleware Implementation
- ⏳ Phase 5: Break Plans Endpoints Implementation
- ⏳ Phase 6: History Endpoint Implementation

---

## Quick Reference

### Common Commands

```bash
# Install dependencies
pnpm install

# Run all validations
pnpm validate:all

# Start development server
pnpm dev:api

# Watch mode for validation
pnpm validate:watch

# Access Swagger UI
# http://localhost:3333/docs
```

### Key Files

- **OpenAPI Spec**: `docs/api/openapi.yaml`
- **API Documentation**: `docs/api/README.md`
- **Type Definitions**: `packages/types/src/`
- **Validation Scripts**: `scripts/validate-*.ts`
- **Runtime Validation**: `services/api/src/plugins/validation.ts`

### Important Notes

- The `user_id` field in `CreateBreakPlanRequest` will be extracted from the JWT token in the actual implementation (not from request body)
- The `feeling` field is stored in the plan for reference but is not used in queries
- The `order` field determines the display order in the frontend
- The `chosen` field is used to filter history entries
- Rate limiting: 10 requests/hour per user for POST `/break/plans`

### Support

For complete API specification with all schemas and examples, see:
- OpenAPI Specification: `docs/api/openapi.yaml`
- Use tools like [Swagger UI](https://swagger.io/tools/swagger-ui/) or [Postman](https://www.postman.com/) to import and explore the OpenAPI specification

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-08  
**Maintained By**: Backend Team

