# Testing Guide - Quick Reference

## Testing Types Explained

### 1. Unit Tests
**Purpose**: Test individual functions in isolation

**Example Scenario**: Testing a function that validates break plan duration

```typescript
// Function to test
function validateDuration(duration: number): boolean {
  return duration > 0 && duration <= 120;
}

// Unit test
describe('validateDuration', () => {
  it('should return true for valid duration', () => {
    expect(validateDuration(15)).toBe(true);
  });
  
  it('should return false for negative duration', () => {
    expect(validateDuration(-5)).toBe(false);
  });
  
  it('should return false for duration over 120', () => {
    expect(validateDuration(150)).toBe(false);
  });
});
```

**When to use**: Test business logic, validation, utility functions

**Tools**: Vitest, Jest

---

### 2. Integration Tests
**Purpose**: Test how multiple components work together

**Example Scenario**: Testing POST `/break/plans` endpoint

```typescript
// Integration test
describe('POST /break/plans', () => {
  it('should create a break plan in Firestore', async () => {
    // 1. Setup: Start server, connect to Firestore emulator
    const server = await buildTestServer();
    
    // 2. Action: Make HTTP request
    const response = await server.inject({
      method: 'POST',
      url: '/break/plans',
      headers: {
        'Authorization': `Bearer ${testToken}`
      },
      payload: {
        duration: 15,
        location: { lat: 37.7749, lng: -122.4194 },
        feeling: 'stressed',
        request_time: new Date().toISOString(),
        user_id: 'test-user-id'
      }
    });
    
    // 3. Assert: Check response
    expect(response.statusCode).toBe(201);
    const data = JSON.parse(response.body);
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    
    // 4. Assert: Check Firestore
    const db = getFirebaseFirestore();
    const doc = await db.collection('break_plans').doc(data.data.id).get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.duration).toBe(15);
  });
});
```

**When to use**: Test API endpoints, database operations, external service calls

**Tools**: Supertest, Fastify test utilities, Firestore Emulator

---

### 3. Manual Testing
**Purpose**: Test by hand to verify user experience

**Example Scenario**: Testing the full flow of creating a break plan

**Steps**:
1. Start the server: `pnpm dev:api`
2. Get authentication token (from Firebase Auth)
3. Use Postman or curl to send request:

```bash
# Get token first (from Firebase Auth)
TOKEN="your-jwt-token-here"

# Create break plan
curl -X POST http://localhost:3333/break/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 15,
    "location": {
      "lat": 37.7749,
      "lng": -122.4194
    },
    "feeling": "stressed",
    "request_time": "2024-01-15T10:30:00Z",
    "user_id": "test-user-id"
  }'
```

4. Check response in terminal
5. Check Firestore console to verify data was saved
6. Test edge cases (invalid data, missing fields, etc.)

**When to use**: 
- Before committing code
- To verify user experience
- To test error scenarios
- To demonstrate functionality

**Tools**: Postman, curl, Swagger UI, Firebase Console

---

## Testing Workflow

### For Each Feature:

1. **Write Unit Tests First** (TDD - Test Driven Development)
   - Write test for function
   - Write function to pass test
   - Refactor

2. **Write Integration Tests**
   - Test endpoint with real database
   - Test error scenarios
   - Test authentication

3. **Manual Testing**
   - Test in Postman/curl
   - Verify in Firebase Console
   - Test edge cases

4. **Run All Tests**
   ```bash
   pnpm test
   ```

---

## Example: Testing Break Plans Endpoint

### Step 1: Unit Test - Validation Function

```typescript
// tests/unit/services/validation.test.ts
import { validateBreakPlanRequest } from '@/services/break/validation';

describe('validateBreakPlanRequest', () => {
  it('should validate correct request', () => {
    const request = {
      duration: 15,
      location: { lat: 37.7749, lng: -122.4194 },
      feeling: 'stressed',
      request_time: '2024-01-15T10:30:00Z',
      user_id: 'user-123'
    };
    
    const result = validateBreakPlanRequest(request);
    expect(result.valid).toBe(true);
  });
  
  it('should reject invalid duration', () => {
    const request = {
      duration: -5, // Invalid
      location: { lat: 37.7749, lng: -122.4194 },
      feeling: 'stressed',
      request_time: '2024-01-15T10:30:00Z',
      user_id: 'user-123'
    };
    
    const result = validateBreakPlanRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Duration must be positive');
  });
});
```

### Step 2: Integration Test - Endpoint

```typescript
// tests/integration/routes/break-plans.test.ts
import { buildTestServer } from '@/tests/helpers/test-server';
import { getFirebaseFirestore } from '@take-a-break/firebase';

describe('POST /break/plans', () => {
  let server: FastifyInstance;
  let testToken: string;
  
  beforeAll(async () => {
    server = await buildTestServer();
    testToken = await getTestToken(); // Helper to get test token
  });
  
  afterAll(async () => {
    await server.close();
  });
  
  it('should create break plan', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/break/plans',
      headers: { 'Authorization': `Bearer ${testToken}` },
      payload: {
        duration: 15,
        location: { lat: 37.7749, lng: -122.4194 },
        feeling: 'stressed',
        request_time: new Date().toISOString(),
        user_id: 'test-user'
      }
    });
    
    expect(response.statusCode).toBe(201);
    const data = JSON.parse(response.body);
    expect(data.success).toBe(true);
  });
});
```

### Step 3: Manual Test - Postman

1. Open Postman
2. Create new request: `POST http://localhost:3333/break/plans`
3. Add header: `Authorization: Bearer YOUR_TOKEN`
4. Add body (JSON):
   ```json
   {
     "duration": 15,
     "location": {
       "lat": 37.7749,
       "lng": -122.4194
     },
     "feeling": "stressed",
     "request_time": "2024-01-15T10:30:00Z",
     "user_id": "test-user"
   }
   ```
5. Send request
6. Check response
7. Verify in Firebase Console that document was created

---

## Testing Checklist

For each endpoint/feature:

- [ ] Unit tests for validation logic
- [ ] Unit tests for business logic
- [ ] Integration test for happy path
- [ ] Integration test for error cases
- [ ] Integration test for authentication
- [ ] Manual test in Postman
- [ ] Manual test for edge cases
- [ ] Verify in Firebase Console
- [ ] Test rate limiting (if applicable)
- [ ] Test with invalid data

---

## Common Test Patterns

### Testing Authentication

```typescript
it('should return 401 without token', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/break/plans'
  });
  
  expect(response.statusCode).toBe(401);
});

it('should return 401 with invalid token', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/break/plans',
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  
  expect(response.statusCode).toBe(401);
});
```

### Testing Validation

```typescript
it('should return 400 for invalid request', async () => {
  const response = await server.inject({
    method: 'POST',
    url: '/break/plans',
    headers: { 'Authorization': `Bearer ${testToken}` },
    payload: {
      duration: -5 // Invalid
    }
  });
  
  expect(response.statusCode).toBe(400);
  const error = JSON.parse(response.body);
  expect(error.success).toBe(false);
  expect(error.error.code).toBe('VALIDATION_DURATION_INVALID');
});
```

### Testing Rate Limiting

```typescript
it('should rate limit after 10 requests', async () => {
  // Make 10 requests
  for (let i = 0; i < 10; i++) {
    await server.inject({
      method: 'POST',
      url: '/break/plans',
      headers: { 'Authorization': `Bearer ${testToken}` },
      payload: validPayload
    });
  }
  
  // 11th request should be rate limited
  const response = await server.inject({
    method: 'POST',
    url: '/break/plans',
    headers: { 'Authorization': `Bearer ${testToken}` },
    payload: validPayload
  });
  
  expect(response.statusCode).toBe(429);
});
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite/install_and_configure)
- [Postman Documentation](https://learning.postman.com/)


