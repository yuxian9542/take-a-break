# API Skeleton Code Overview

This document describes the skeleton code structure for all API endpoints, middleware, and services.

## File Structure

```
services/api/src/
├── routes/
│   ├── public.ts          ✅ (already implemented)
│   ├── break.ts           📝 (skeleton)
│   ├── history.ts         📝 (skeleton)
│   ├── map.ts             📝 (skeleton)
│   └── voice.ts           📝 (skeleton)
├── middleware/
│   ├── auth.ts            📝 (skeleton)
│   ├── error-handler.ts   📝 (skeleton)
│   └── rate-limit.ts      📝 (skeleton)
├── services/
│   ├── firestore.ts       📝 (skeleton)
│   ├── geocoding.ts       📝 (skeleton)
│   ├── llm-agent.ts       📝 (skeleton)
│   ├── map-service.ts     📝 (skeleton)
│   └── voice-service.ts  📝 (skeleton)
├── utils/
│   ├── validation.ts      📝 (skeleton)
│   └── uuid.ts            📝 (skeleton)
├── plugins/
│   └── validation.ts      ✅ (already implemented)
└── server.ts              ✅ (updated to register all routes)
```

## Routes

### 1. `routes/break.ts`
**Endpoints:**
- `GET /break/plans` - Get all break plans for user
- `POST /break/plans` - Create multiple break plans (LLM generated)
- `PATCH /break/plans/:id/chosen` - Mark plan as chosen

**Input/Output Types:**
- Uses `BreakPlanResponse`, `CreateBreakPlanRequest`, `CreateBreakPlanResponse`, `UpdateBreakPlanChosenResponse`
- Returns `SuccessResponse<T>` format

### 2. `routes/history.ts`
**Endpoints:**
- `GET /history` - Get paginated history (cursor-based)

**Input/Output Types:**
- Query params: `cursor?`, `limit?` (default: 7)
- Returns `SuccessResponse<HistoryResponse>` with pagination metadata

### 3. `routes/map.ts`
**Endpoints:**
- `GET /map/nearby` - Find nearby locations
- `GET /map/route` - Calculate route (query params)
- `POST /map/route` - Calculate route (request body)

**Input/Output Types:**
- Uses `NearbyRequest`, `NearbyResponse`, `RouteRequest`, `RouteResponse`
- Returns `SuccessResponse<T>` format

### 4. `routes/voice.ts`
**Endpoints:**
- `WebSocket /voice/session` - Real-time voice interaction

**Input/Output Types:**
- WebSocket messages: `VoiceMessagePayload` (AudioMessage, TextMessage, StatusMessage, ErrorMessage)
- Handles authentication via query param or header

## Middleware

### 1. `middleware/auth.ts`
**Functions:**
- `extractToken(request)` - Extract JWT from header or query
- `verifyToken(token)` - Verify Firebase JWT token
- `authMiddleware(request, reply)` - Main auth middleware

**Purpose:** Verify Firebase JWT tokens and attach user info to request

### 2. `middleware/error-handler.ts`
**Functions:**
- `generateTraceId()` - Generate UUID for error tracking
- `formatValidationErrors(error)` - Format Fastify validation errors
- `errorHandler(error, request, reply)` - Global error handler

**Purpose:** Standardize error responses with proper codes and trace IDs

### 3. `middleware/rate-limit.ts`
**Functions:**
- `checkRateLimit(key, limit, windowMs)` - Check if limit exceeded
- `getRateLimitHeaders(key, limit, windowMs)` - Get rate limit headers
- `rateLimitMiddleware(request, reply, limit, windowMs)` - Rate limit middleware

**Configuration:**
- `/break/plans`: 10 requests/hour
- `/history`: 100 requests/minute
- `/map/*`: 60 requests/minute

## Services

### 1. `services/firestore.ts`
**Functions:**
- `getBreakPlans(userId)` - Get all plans for user
- `createBreakPlans(plans)` - Batch create plans
- `getBreakPlanById(planId, userId)` - Get single plan with auth check
- `updateBreakPlanChosen(planId, userId, chosen)` - Update chosen status
- `getHistory(userId, cursor?, limit)` - Get paginated history
- `createVoiceSession(sessionId, userId)` - Create voice session
- `updateVoiceSessionStatus(sessionId, status)` - Update session status
- `addVoiceSessionMessage(sessionId, message)` - Add message to session

### 2. `services/geocoding.ts`
**Functions:**
- `reverseGeocode(coordinates)` - Convert coordinates to address
- `geocode(address)` - Convert address to coordinates
- `createLocation(coordinates)` - Create Location object with address

### 3. `services/llm-agent.ts`
**Functions:**
- `generateBreakPlans(duration, location, feeling)` - Generate plan suggestions

**Output:** Array of `BreakPlanSuggestion` with title, description, type

### 4. `services/map-service.ts`
**Functions:**
- `findNearby(request)` - Find nearby locations
- `calculateRoute(request)` - Calculate route with waypoints

### 5. `services/voice-service.ts`
**Functions:**
- `transcribeAudio(audioData, format)` - Transcribe audio to text
- `processTextWithLLM(text, sessionId)` - Process text with LLM
- `textToSpeech(text)` - Convert text to speech audio

## Utils

### 1. `utils/validation.ts`
**Functions:**
- `validateBreakPlanRequest(request)` - Validate break plan request
- `validateRouteRequest(request)` - Validate route request
- `validateNearbyRequest(request)` - Validate nearby request
- `isValidUUID(uuid)` - Validate UUID format
- `isValidISO8601(timestamp)` - Validate ISO 8601 timestamp

### 2. `utils/uuid.ts`
**Functions:**
- `generateUUID()` - Generate UUID v4

## Implementation Notes

### All Functions Include:
1. ✅ **Correct TypeScript types** - All inputs/outputs properly typed
2. ✅ **TODO comments** - Clear implementation guidance
3. ✅ **Error handling structure** - Proper error response format
4. ✅ **Return type annotations** - Explicit return types

### Next Steps for Implementation:
1. Implement Firestore queries in `services/firestore.ts`
2. Integrate Firebase Admin SDK for authentication in `middleware/auth.ts`
3. Implement geocoding service (Google Maps/OpenStreetMap) in `services/geocoding.ts`
4. Integrate LLM API (OpenAI/Anthropic) in `services/llm-agent.ts`
5. Implement map services (Google Maps/Mapbox) in `services/map-service.ts`
6. Integrate voice services (OpenAI Whisper/TTS) in `services/voice-service.ts`
7. Add validation logic in `utils/validation.ts`
8. Implement rate limiting storage (in-memory or Redis) in `middleware/rate-limit.ts`
9. Wire up authentication middleware to protected routes in `server.ts`
10. Add request validation using OpenAPI schemas

### Testing:
- All functions have clear input/output contracts
- Error cases are documented
- Validation points are identified
- Integration points are marked

