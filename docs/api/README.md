# Take a Break API Documentation

Complete API documentation for the Take a Break service.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Public Endpoints](#public-endpoints)
  - [Break Plans](#break-plans)
  - [History](#history)
  - [Map Services](#map-services)
  - [Voice Session](#voice-session)
- [Pagination](#pagination)
- [WebSocket Guide](#websocket-guide)

## Overview

The Take a Break API provides endpoints for managing break plans, viewing history, finding nearby locations, calculating routes, and real-time voice interactions.

All endpoints (except public endpoints) require Firebase JWT authentication.

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

## Base URL

- **Development**: `http://localhost:3333`
- **Production**: `https://api.take-a-break.com`

## Response Format

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

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `500` - Internal Server Error

### Error Codes

Common error codes:

- `INVALID_REQUEST` - Request validation failed
- `UNAUTHORIZED` - Authentication required or invalid
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

### Example Error Handling

```javascript
try {
  const response = await fetch('/break/plans', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  
  if (!result.success) {
    console.error('Error:', result.error.code, result.error.message);
    result.error.details.forEach(detail => {
      console.error(`  ${detail.field}: ${detail.issue}`);
    });
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Endpoints

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
      "created_at": "2025-01-08T10:00:00Z",
      "user_id": "user123"
    }
  ]
}
```

#### POST /break/plans

Create a new break plan. The server auto-generates `id` and `created_at`.

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
    "created_at": "2025-01-08T10:00:00Z",
    "user_id": "user123"
  }
}
```

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
    "created_at": "2025-01-08T10:00:00Z",
    "user_id": "user123",
    "chosen": true
  }
}
```

**Note:** Only the plan owner can mark their own plan as chosen.

### History

#### GET /history

Get paginated list of past break sessions using cursor-based pagination.

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

#### GET /voice/session

WebSocket connection endpoint for real-time voice interaction.

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

## Pagination

The `/history` endpoint uses cursor-based pagination for efficient data retrieval.

### How It Works

1. **First Request:** Don't include a `cursor` parameter
2. **Subsequent Requests:** Use the `cursor` from the previous response's `meta.cursor` field
3. **Check for More:** Use `meta.hasMore` to determine if more data is available

### Example

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

## WebSocket Guide

### Connection Lifecycle

1. **Connect:** Establish WebSocket connection with Firebase JWT token
2. **Authenticate:** Server validates token and sends `status: connected` message
3. **Communicate:** Send/receive audio, text, and status messages
4. **Disconnect:** Close connection gracefully

### Best Practices

- Always handle connection errors and reconnection logic
- Validate message types before processing
- Use `sessionId` to track conversation context
- Handle `status: disconnected` messages for cleanup
- Implement exponential backoff for reconnection attempts

### Error Handling

WebSocket errors are sent as `error` type messages:

```json
{
  "type": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": "2025-01-08T12:00:00Z",
  "sessionId": "session123"
}
```

Common error codes:
- `AUTHENTICATION_FAILED` - Invalid or expired token
- `AUDIO_PROCESSING_ERROR` - Failed to process audio
- `SESSION_NOT_FOUND` - Invalid session ID
- `RATE_LIMIT_EXCEEDED` - Too many requests

## OpenAPI Specification

For complete API specification with all schemas and examples, see [openapi.yaml](./openapi.yaml).

You can use tools like [Swagger UI](https://swagger.io/tools/swagger-ui/) or [Postman](https://www.postman.com/) to import and explore the OpenAPI specification.

