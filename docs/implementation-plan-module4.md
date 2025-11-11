# Module 4: Backend & Data Platform - Implementation Plan

**Owner**: @backend-lead  
**Last Updated**: 2024

## Overview

This document outlines the step-by-step implementation plan for Module 4, covering:
- API contracts & public response format
- Firebase (Auth, Firestore, Security Rules)
- `/break/plans` and `/history` endpoints
- Public middleware (authentication, logging, rate limiting)
- Git Flow, CI/CD, environment management

---

## Table of Contents

1. [Understanding Testing Types](#understanding-testing-types)
2. [Implementation Phases](#implementation-phases)
3. [Firestore Schema Design](#firestore-schema-design)
4. [Middleware Options](#middleware-options)
5. [Error Codes & Standards](#error-codes--standards)
6. [Testing Strategy](#testing-strategy)
7. [CI/CD Strategy](#cicd-strategy)

---

## Understanding Testing Types

### 1. Unit Tests
**What**: Test individual functions/modules in isolation  
**Example**: Test a function that validates break plan data  
**Procedure**:
- Mock external dependencies (Firebase, HTTP requests)
- Test with various inputs (valid, invalid, edge cases)
- Verify expected outputs
- **Tools**: Vitest, Jest

**Example**:
```typescript
// Test: validateBreakPlanRequest()
// Input: { duration: 15, location: { lat: 37.7749, lng: -122.4194 } }
// Expected: Returns valid object
// Input: { duration: -5 } // Invalid
// Expected: Throws validation error
```

### 2. Integration Tests
**What**: Test how multiple components work together  
**Example**: Test API endpoint with real database connection  
**Procedure**:
- Use test database (Firestore emulator)
- Make actual HTTP requests to endpoints
- Verify database changes
- **Tools**: Supertest, Fastify test utilities

**Example**:
```typescript
// Test: POST /break/plans
// 1. Send HTTP POST request with valid data
// 2. Verify response status 201
// 3. Check Firestore has new document
// 4. Verify document structure matches expected
```

### 3. Manual Testing
**What**: Test by hand using tools like Postman, curl, or browser  
**Procedure**:
- Start the server locally
- Use Postman/curl to send requests
- Check responses in UI
- Verify behavior matches requirements
- **Tools**: Postman, curl, Swagger UI

**Example**:
```bash
# Test GET /health
curl http://localhost:3333/health

# Test POST /break/plans (with auth token)
curl -X POST http://localhost:3333/break/plans \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": 15, "location": {"lat": 37.7749, "lng": -122.4194}, ...}'
```

---

## Implementation Phases

### Phase 1: API Contract & Type Definitions ✅ (Partially Done)
**Status**: Types exist, need to finalize API contract

**Tasks**:
1. ✅ Review existing types in `packages/types/src/`
2. ⏳ Update OpenAPI spec to match actual implementation
3. ⏳ Add missing request/response types
4. ⏳ Document API versioning strategy

**Deliverables**:
- Updated `docs/api/openapi.yaml`
- Complete type definitions in `packages/types/src/`

**Testing**:
- Validate OpenAPI spec syntax
- Ensure types match OpenAPI schemas

---

### Phase 2: Firestore Schema Design
**Status**: To be designed together

**Collections Needed**:
1. `break_plans` - User's break plans
2. `history` - Completed break sessions
3. `users` - User profiles
4. `voice_conversations` - Voice session data

#### Collection: `break_plans`
```typescript
interface BreakPlanDocument {
  id: string; // Document ID (UUID)
  user_id: string; // User who created this plan
  title: string;
  description: string;
  duration: number; // minutes
  location: {
    address: string; // Reverse geocoded
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  type: 'breath' | 'walk' | string; // Extensible enum
  feeling: string; // Original user feeling/state
  chosen: boolean; // True when user selects this plan
  order: number; // Order in which plans appear (0, 1, 2, ...)
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes Needed**:
- `user_id` + `created_at` (descending) - For listing user's plans
- `user_id` + `chosen` + `created_at` - For filtering chosen plans
- `user_id` + `order` - For ordering plans

#### Collection: `history`
```typescript
interface HistoryDocument {
  id: string; // Document ID (UUID)
  user_id: string;
  break_plan_id: string; // Reference to break_plans collection
  title: string; // Copied from plan for quick access
  duration: number; // minutes (actual duration, may differ from plan)
  started_at: Timestamp;
  completed_at: Timestamp;
  status: 'completed' | 'cancelled' | 'in_progress';
  created_at: Timestamp;
}
```

**Indexes Needed**:
- `user_id` + `started_at` (descending) - For paginated history
- `user_id` + `status` + `started_at` - For filtering by status

#### Collection: `users`
```typescript
interface UserDocument {
  id: string; // Firebase Auth UID
  email: string;
  display_name?: string;
  photo_url?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_login_at: Timestamp;
}
```

**Indexes Needed**:
- `email` (unique) - For email lookups

#### Collection: `voice_conversations`
```typescript
interface VoiceConversationDocument {
  id: string; // Document ID (UUID)
  user_id: string;
  session_id: string; // WebSocket session identifier
  started_at: Timestamp;
  ended_at?: Timestamp;
  summary?: string; // LLM-generated summary
  transcript?: string; // Full conversation transcript
  created_at: Timestamp;
}
```

**Indexes Needed**:
- `user_id` + `started_at` (descending) - For listing conversations
- `session_id` (unique) - For session lookups

**Tasks**:
1. Create schema definition files in `infra/firestore-schema/`
2. Create migration scripts
3. Document index requirements
4. Create TypeScript types matching Firestore documents

**Deliverables**:
- `infra/firestore-schema/schema.ts` - TypeScript schema definitions
- `infra/firestore-schema/indexes.json` - Firestore index configuration
- `infra/firestore-schema/README.md` - Schema documentation

**Testing**:
- Unit test: Validate schema types
- Integration test: Create test documents in Firestore emulator

---

### Phase 3: Firebase Authentication Setup
**Status**: Not started

**Authentication Methods**:
- Email/Password
- Google Sign-In
- JWT token verification middleware

**Tasks**:
1. Set up Firebase project (if not done)
   - Create Firebase project in Firebase Console
   - Enable Authentication
   - Enable Email/Password provider
   - Enable Google Sign-In provider
   - Get service account credentials
2. Configure Firebase Admin SDK (already partially done)
3. Create authentication middleware
4. Create token verification utility
5. Add authentication routes (if needed for testing)

**Deliverables**:
- `infra/middleware/auth.ts` - JWT verification middleware
- `infra/middleware/README.md` - Auth documentation
- `.env.example` - Firebase configuration template

**Testing**:
- Unit test: Token verification logic
- Integration test: Protected endpoint with valid/invalid tokens
- Manual test: Login flow with Postman

---

### Phase 4: Middleware Implementation

#### 4.1 Authentication Middleware
**Location**: `infra/middleware/auth.ts`

**Functionality**:
- Extract JWT token from `Authorization: Bearer <token>` header
- Verify token with Firebase Admin Auth
- Attach user info to request object
- Return 401 if invalid/missing token

**Options to Consider**:
- ✅ Extract from Authorization header (standard)
- ✅ Support query parameter `?token=...` (for WebSocket)
- ✅ Cache verified tokens (optional, for performance)
- ✅ Support optional auth (some endpoints may be public)

#### 4.2 Logging Middleware
**Location**: `infra/middleware/logging.ts`

**What to Log**:
- ✅ Request: method, path, query params, body (sanitized)
- ✅ Response: status code, response time
- ✅ Errors: full error stack, user ID, trace ID
- ✅ User IDs: for authenticated requests

**Options to Consider**:
- **Log Level**: `info` for requests, `error` for errors, `debug` for detailed
- **Log Format**: JSON (structured) vs text (readable)
- **Log Destination**: Console (dev) vs file/cloud logging (prod)
- **PII Handling**: Mask sensitive data (passwords, tokens)
- **Request ID**: Generate unique trace ID per request

**Recommended**:
- Use structured JSON logging
- Use `pino` (Fastify's default logger) or `winston`
- Log to console in dev, Cloud Logging in prod
- Generate trace_id for each request

#### 4.3 Rate Limiting Middleware
**Location**: `infra/middleware/rate-limit.ts`

**What to Limit**:
- ✅ Number of POST `/break/plans` requests per hour per user
- ✅ Number of requests per minute per IP (general protection)
- ✅ Number of requests per minute per user (authenticated)

**Options to Consider**:
- **Storage**: In-memory (simple) vs Redis (distributed)
- **Algorithm**: Token bucket vs Sliding window
- **Scope**: Per-user, per-IP, per-endpoint, or combination
- **Response**: 429 Too Many Requests with retry-after header

**Recommended Limits**:
- POST `/break/plans`: 10 requests/hour per user
- General API: 100 requests/minute per IP
- Authenticated: 200 requests/minute per user

**Tools**:
- `@fastify/rate-limit` (simple, in-memory)
- `@fastify/rate-limit-redis` (distributed, production-ready)

**Tasks**:
1. Implement authentication middleware
2. Implement logging middleware
3. Implement rate limiting middleware
4. Register middlewares in Fastify server
5. Create middleware configuration

**Deliverables**:
- `infra/middleware/auth.ts`
- `infra/middleware/logging.ts`
- `infra/middleware/rate-limit.ts`
- `infra/middleware/index.ts` - Exports all middlewares
- `infra/middleware/README.md` - Middleware documentation

**Testing**:
- Unit test: Each middleware function
- Integration test: Endpoints with middleware applied
- Manual test: Rate limiting with multiple requests

---

### Phase 5: Break Plans Endpoint Implementation
**Status**: Not started

#### 5.1 GET `/break/plans`
**Functionality**:
- List all break plans for authenticated user
- Return in order (by `order` field)
- Filter by `chosen` status (optional query param)

**Tasks**:
1. Create route handler in `services/break/routes/plans.ts`
2. Implement Firestore query
3. Add authentication middleware
4. Add request validation
5. Add error handling
6. Write tests

**Deliverables**:
- `services/break/routes/plans.ts`
- `services/break/services/plan-service.ts` - Business logic
- Tests

#### 5.2 POST `/break/plans`
**Functionality**:
- Accept: `duration`, `location` (coordinates), `feeling`, `request_time`, `user_id`
- Call LLM agent to generate multiple plans (this is a placeholder - actual LLM integration comes later)
- Perform reverse geocoding (coordinates → address)
- Store all generated plans in Firestore with `order` field
- Return list of created plans

**Reverse Geocoding Options**:
- **Google Maps Geocoding API** (paid, accurate)
- **OpenStreetMap Nominatim** (free, rate-limited)
- **Mapbox Geocoding API** (paid, good accuracy)

**LLM Agent Integration** (Placeholder for now):
- For now, create mock plans
- Later: Integrate with actual LLM service
- Store plans with generated `title` and `description`

**Tasks**:
1. Create route handler
2. Implement reverse geocoding service
3. Implement plan generation logic (mock for now)
4. Implement Firestore write operations
5. Add validation for request body
6. Add rate limiting (10/hour per user)
7. Write tests

**Deliverables**:
- `services/break/routes/plans.ts` (POST handler)
- `services/break/services/geocoding.ts` - Reverse geocoding
- `services/break/services/plan-generator.ts` - Plan generation (mock)
- Tests

**Testing**:
- Unit test: Reverse geocoding function
- Unit test: Plan generation logic
- Integration test: Full POST flow with Firestore
- Manual test: Create plan via Postman

#### 5.3 PATCH `/break/plans/:id/chosen`
**Functionality**:
- Set `chosen: true` for a specific plan
- Verify plan belongs to user
- Update `updated_at` timestamp

**Tasks**:
1. Create route handler
2. Implement Firestore update
3. Add authorization check (user owns plan)
4. Write tests

**Deliverables**:
- `services/break/routes/plans.ts` (PATCH handler)
- Tests

---

### Phase 6: History Endpoint Implementation
**Status**: Not started

#### 6.1 GET `/history`
**Functionality**:
- Get paginated history for authenticated user
- Filter by `chosen: true` (only show plans user selected)
- Cursor-based pagination
- Default limit: 7 items
- Support pull-to-refresh (newest items first)

**Query Parameters**:
- `cursor`: ISO 8601 timestamp or UUID (optional)
- `limit`: Number of items (default: 7, max: 50)

**Tasks**:
1. Create route handler in `services/break/routes/history.ts`
2. Implement Firestore query with pagination
3. Join with `break_plans` collection to get plan details
4. Filter by `chosen: true`
5. Implement cursor logic
6. Add authentication middleware
7. Write tests

**Deliverables**:
- `services/break/routes/history.ts`
- `services/break/services/history-service.ts` - Business logic
- Tests

**Testing**:
- Unit test: Pagination logic
- Integration test: Full GET flow with Firestore
- Manual test: Pagination with different cursors

---

### Phase 7: Error Handling & Response Format
**Status**: Partially done (types exist)

**Tasks**:
1. Create error handler utility
2. Standardize error responses
3. Add error codes (see [Error Codes](#error-codes--standards))
4. Add request ID to all responses
5. Update all endpoints to use standardized format

**Deliverables**:
- `infra/middleware/error-handler.ts`
- `packages/types/src/error.ts` (already exists, may need updates)
- Error handling documentation

**Testing**:
- Unit test: Error formatting
- Integration test: Error responses from endpoints

---

### Phase 8: Testing Infrastructure
**Status**: Not started

**Tasks**:
1. Set up testing framework (Vitest recommended)
2. Set up Firestore emulator for integration tests
3. Create test utilities and helpers
4. Write test examples
5. Add test scripts to package.json

**Deliverables**:
- `vitest.config.ts` - Test configuration
- `tests/helpers/` - Test utilities
- `tests/fixtures/` - Test data
- Test examples for each endpoint

**Testing**:
- Run all tests: `pnpm test`
- Run unit tests: `pnpm test:unit`
- Run integration tests: `pnpm test:integration`

---

### Phase 9: CI/CD Pipeline
**Status**: Not started

#### 9.1 Backend API CI/CD
**Deployment Target**: Cloud Run, App Engine, Railway, or similar

**GitHub Actions Workflow**:
1. **On Push to `main`**:
   - Run tests
   - Build Docker image
   - Deploy to production

2. **On Push to `develop`**:
   - Run tests
   - Deploy to staging

3. **On Pull Request**:
   - Run tests
   - Run linting
   - (Optional) Deploy preview environment

**Environment Strategy**:
- **development**: Local development
- **staging**: Pre-production testing (TestFlight for iOS)
- **production**: Live production environment

**Tasks**:
1. Create GitHub Actions workflow files
2. Set up environment secrets
3. Configure deployment scripts
4. Set up staging environment
5. Document deployment process

**Deliverables**:
- `.github/workflows/ci.yml` - CI pipeline
- `.github/workflows/deploy.yml` - Deployment pipeline
- `infra/ci-cd/README.md` - CI/CD documentation

#### 9.2 iOS App CI/CD (Separate from Backend)
**Note**: iOS app deployment is handled by the FE team, but here's how it works:

**GitHub Actions for iOS**:
1. Build iOS app
2. Run tests
3. Upload to TestFlight (staging)
4. Submit to App Store (production)

**Environments**:
- **Staging**: TestFlight (internal/external testers)
- **Production**: App Store

**Deployment Target**: TestFlight → App Store

**Tasks** (for FE team, but documented here):
1. Set up Xcode Cloud or GitHub Actions for iOS
2. Configure App Store Connect API keys
3. Set up TestFlight distribution
4. Automate App Store submission

---

## Firestore Schema Design

### Complete Schema Definition

See [Phase 2](#phase-2-firestore-schema-design) for detailed schema.

### Indexes Summary

**Collection: `break_plans`**
- Composite index: `user_id` (ASC) + `created_at` (DESC)
- Composite index: `user_id` (ASC) + `chosen` (ASC) + `created_at` (DESC)
- Composite index: `user_id` (ASC) + `order` (ASC)

**Collection: `history`**
- Composite index: `user_id` (ASC) + `started_at` (DESC)
- Composite index: `user_id` (ASC) + `status` (ASC) + `started_at` (DESC)

**Collection: `users`**
- Single field index: `email` (unique)

**Collection: `voice_conversations`**
- Composite index: `user_id` (ASC) + `started_at` (DESC)
- Single field index: `session_id` (unique)

---

## Middleware Options

### Logging Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Console (dev)** | Simple, no setup | Not suitable for production | ✅ Use for development |
| **File logging** | Persistent, searchable | Requires log rotation | Use for small deployments |
| **Cloud Logging** | Scalable, searchable, integrated | Requires cloud setup | ✅ Use for production |
| **Structured JSON** | Machine-readable, searchable | Less human-readable | ✅ Recommended format |

**Recommended**: Use `pino` (Fastify's logger) with structured JSON, console in dev, Cloud Logging in prod.

### Rate Limiting Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **In-memory** | Simple, fast | Not distributed, lost on restart | Use for single server |
| **Redis** | Distributed, persistent | Requires Redis setup | ✅ Use for production |
| **Token bucket** | Smooth rate limiting | More complex | Good for burst handling |
| **Sliding window** | Simple, predictable | Can be less smooth | ✅ Recommended for API |

**Recommended**: Use `@fastify/rate-limit-redis` with sliding window algorithm.

---

## Error Codes & Standards

### Standard HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid request body/parameters |
| 401 | Unauthorized | Missing/invalid authentication token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | External service unavailable |

### Custom Error Codes

**Format**: `ERROR_CATEGORY_SPECIFIC_ERROR`

**Categories**:
- `AUTH_*` - Authentication errors
- `VALIDATION_*` - Request validation errors
- `NOT_FOUND_*` - Resource not found
- `RATE_LIMIT_*` - Rate limiting errors
- `FIREBASE_*` - Firebase service errors
- `GEOCODING_*` - Geocoding service errors

**Examples**:
- `AUTH_TOKEN_MISSING` - No token provided
- `AUTH_TOKEN_INVALID` - Token is invalid/expired
- `VALIDATION_DURATION_INVALID` - Duration must be positive
- `VALIDATION_LOCATION_INVALID` - Invalid coordinates
- `NOT_FOUND_BREAK_PLAN` - Break plan not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `FIREBASE_CONNECTION_ERROR` - Cannot connect to Firestore
- `GEOCODING_SERVICE_ERROR` - Geocoding API failed

**Error Response Format**:
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_DURATION_INVALID",
    message: "Duration must be a positive number",
    details: [
      {
        field: "duration",
        issue: "Must be greater than 0"
      }
    ],
    timestamp: "2024-01-15T10:30:00Z",
    trace_id: "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Testing Strategy

### Test Structure

```
tests/
├── unit/
│   ├── middleware/
│   │   ├── auth.test.ts
│   │   ├── logging.test.ts
│   │   └── rate-limit.test.ts
│   ├── services/
│   │   ├── geocoding.test.ts
│   │   └── plan-generator.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   ├── routes/
│   │   ├── break-plans.test.ts
│   │   └── history.test.ts
│   └── middleware/
│       └── auth-flow.test.ts
└── helpers/
    ├── test-server.ts
    ├── firestore-emulator.ts
    └── fixtures.ts
```

### Test Commands

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: All endpoints covered
- Critical paths: 100% coverage (auth, payment, etc.)

---

## CI/CD Strategy

### Environment Variables

**Development** (local):
- `.env` file (not committed)
- Firebase emulator

**Staging**:
- GitHub Secrets
- Firebase staging project
- TestFlight distribution

**Production**:
- GitHub Secrets
- Firebase production project
- App Store distribution

### Deployment Flow

```
Developer → Push to branch → GitHub Actions
                                    ↓
                            Run tests & lint
                                    ↓
                            Build Docker image
                                    ↓
                            Deploy to environment
                                    ↓
                            Run smoke tests
                                    ↓
                            Notify team
```

### GitHub Actions Workflows

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Run on: push, pull_request
   - Steps: install, lint, test, build

2. **`.github/workflows/deploy-staging.yml`** - Staging Deployment
   - Run on: push to `develop`
   - Steps: test, build, deploy to staging

3. **`.github/workflows/deploy-production.yml`** - Production Deployment
   - Run on: push to `main`, manual trigger
   - Steps: test, build, deploy to production

---

## Next Steps

1. **Start with Phase 2**: Design Firestore schema together
2. **Then Phase 3**: Set up Firebase Authentication
3. **Then Phase 4**: Implement middleware (auth, logging, rate limiting)
4. **Then Phase 5 & 6**: Implement endpoints
5. **Then Phase 7**: Error handling
6. **Then Phase 8**: Testing infrastructure
7. **Finally Phase 9**: CI/CD

---

## Questions to Resolve

1. **Reverse Geocoding**: Which service to use? (Google Maps, OpenStreetMap, Mapbox)
2. **LLM Integration**: When will LLM agent be ready? (For now, use mock)
3. **Rate Limiting Storage**: In-memory for now, or set up Redis?
4. **Logging Destination**: Console for now, or set up Cloud Logging?
5. **Deployment Target**: Which cloud platform? (Cloud Run, App Engine, Railway, etc.)

---

## Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Fastify Documentation](https://www.fastify.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite)
- [GitHub Actions Docs](https://docs.github.com/en/actions)


