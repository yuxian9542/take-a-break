# Phase 3: Firebase Authentication Setup - Complete Guide

**Status**: In Progress  
**Priority**: HIGH - Needed for protected endpoints  
**Estimated Time**: 2-3 hours

---

## What Phase 3 Aims to Achieve

Phase 3 sets up Firebase Authentication in your project to enable secure, authenticated API endpoints. By the end of this phase, you will have:

1. **Firebase Authentication Enabled**
   - Email/Password authentication
   - Google Sign-In authentication
   - Users can authenticate and receive JWT tokens

2. **Firebase Admin SDK Configured**
   - Initialized with service account credentials
   - Can verify JWT tokens from client applications

3. **Authentication Middleware Created**
   - Extracts tokens from HTTP requests
   - Verifies tokens using Firebase Admin SDK
   - Attaches user information to requests
   - Protects API endpoints

4. **Protected Endpoints Working**
   - Endpoints require valid authentication tokens
   - Invalid or missing tokens return 401 Unauthorized
   - Authenticated requests have user info available

---

## What You Need to Do

### Part 1: Firebase Console Setup (Manual Steps)

These steps must be done in the Firebase Console web interface.

#### Step 1: Create Firebase Project (If Not Done)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name (e.g., `take-a-break`)
4. Click **Continue**
5. (Optional) Enable Google Analytics - you can skip this for now
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

**Verification**: You should see your project dashboard in Firebase Console.

#### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Click on the **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **Enable** to ON
   - Click **Save**
5. Enable **Google Sign-In**:
   - Click on "Google"
   - Toggle **Enable** to ON
   - Enter a project support email (your email)
   - Click **Save**

**Verification**: Both Email/Password and Google should show as "Enabled" in the Sign-in method list.

#### Step 3: Get Service Account Credentials

1. In Firebase Console, click the gear icon ⚙️ next to **Project Overview**
2. Select **Project settings**
3. Go to the **Service accounts** tab
4. Click **Generate new private key**
5. A JSON file will be downloaded - **keep this file secure!**
6. Open the JSON file and extract the following values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

**Verification**: You should have a JSON file with service account credentials.

#### Step 4: Configure Environment Variables

1. Create a `.env` file in the project root:
   ```bash
   touch .env
   ```

2. Add the following environment variables to `.env` (fill in your actual values):
   ```bash
   # Application Environment
   APP_ENV=development
   
   # API Server Port
   PORT=3333
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   
   # Optional Firebase URLs
   FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   
   # Public Features
   PUBLIC_FEATURES=break-planner,map,voice
   
   # Enable Swagger
   ENABLE_SWAGGER=true
   ```

   **Important**: For `FIREBASE_PRIVATE_KEY`, you need to:
   - Extract the `private_key` value from the JSON file downloaded in Step 3
   - Keep all `\n` characters as literal newlines or escape them
   - Wrap the entire value in quotes

**Verification**: Your `.env` file should contain all Firebase credentials.

### Part 2: Complete Authentication Middleware (Code Implementation)

The authentication middleware skeleton already exists at `services/api/src/middleware/auth.ts`, but it needs to be completed.

#### Step 5: Implement Token Verification

Update the `verifyToken` function in `services/api/src/middleware/auth.ts`:

```typescript
import { getFirebaseAuth } from '@take-a-break/firebase';

async function verifyToken(token: string): Promise<{ uid: string; email?: string } | null> {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}
```

**What this does**:
- Uses Firebase Admin SDK to verify the JWT token
- Checks token signature, expiration, and validity
- Extracts user ID and email from the token
- Returns user info if valid, null if invalid

#### Step 6: Register Middleware for Protected Routes

Update the `authPlugin` function to register the middleware:

```typescript
async function authPlugin(fastify: FastifyInstance) {
  // Register as preHandler hook
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    // Skip authentication for public routes
    const publicPaths = ['/health', '/meta'];
    const isPublicRoute = publicPaths.some(path => request.url.startsWith(path));
    
    if (isPublicRoute) {
      return; // Skip authentication
    }
    
    // Apply authentication middleware
    await authMiddleware(request, reply);
  });
}
```

**What this does**:
- Registers authentication as a preHandler hook (runs before route handlers)
- Skips authentication for public routes (`/health`, `/meta`)
- Applies authentication to all other routes
- Attaches user info to request if token is valid

---

## How to Test Phase 3 Completion

Follow these tests in order to verify everything is working correctly.

### Test 1: Verify Firebase Admin SDK Initialization

**Purpose**: Ensure Firebase is properly configured and can initialize.

1. Start the API server:
   ```bash
   pnpm dev:api
   ```

2. Check the console output:
   - ✅ No Firebase initialization errors
   - ✅ Server starts successfully
   - ✅ Logs show Firebase is initialized

3. **Expected Result**: Server starts without any Firebase-related errors.

**If this fails**:
- Check that all environment variables in `.env` are set correctly
- Verify `FIREBASE_PRIVATE_KEY` includes the full key with `\n` characters
- Ensure `FIREBASE_PROJECT_ID` matches your Firebase project ID

### Test 2: Test Public Endpoint (No Auth Required)

**Purpose**: Verify public endpoints work without authentication.

1. Make a request to a public endpoint:
   ```bash
   curl http://localhost:3333/health
   ```

2. **Expected Result**: 200 OK
   ```json
   {
     "success": true,
     "data": {
       "status": "ok"
     }
   }
   ```

**If this fails**: Check that the public route is properly excluded from authentication.

### Test 3: Test Protected Endpoint Without Token (Should Fail)

**Purpose**: Verify protected endpoints reject unauthenticated requests.

1. Make a request to a protected endpoint without a token:
   ```bash
   curl http://localhost:3333/break/plans
   ```

2. **Expected Result**: 401 Unauthorized
   ```json
   {
     "success": false,
     "error": {
       "code": "UNAUTHORIZED",
       "message": "Authentication required. Please provide a valid Firebase JWT token."
     }
   }
   ```

**If this fails**: The authentication middleware may not be properly registered or applied.

### Test 4: Create a Test User and Get Token

**Purpose**: Get a valid JWT token for testing.

#### Option A: Using Firebase Emulators (Recommended for Development)

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Start Firebase emulators:
   ```bash
   pnpm firebase:emulators
   ```

3. Create a test user:
   - Go to `http://localhost:4000` (Emulator UI)
   - Navigate to **Authentication** tab
   - Click **Add user**
   - Enter email and password
   - Click **Add**

4. Get a token using Firebase Client SDK or create a test script:
   ```typescript
   // test-token.ts
   import { initializeApp } from 'firebase/app';
   import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
   
   const app = initializeApp({
     apiKey: "demo-key",
     authDomain: "localhost",
   });
   
   const auth = getAuth(app);
   auth.useEmulator('http://localhost:9099');
   
   const userCredential = await signInWithEmailAndPassword(
     auth,
     'test@example.com',
     'password123'
   );
   
   const token = await userCredential.user.getIdToken();
   console.log('Token:', token);
   ```

#### Option B: Using Production Firebase

1. Use Firebase Client SDK in your mobile app or a test client
2. Sign in with email/password or Google
3. Get the ID token from the authenticated user

### Test 5: Test Protected Endpoint With Valid Token (Should Succeed)

**Purpose**: Verify protected endpoints accept valid tokens.

1. Make a request with a valid token:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
        http://localhost:3333/break/plans
   ```

2. **Expected Result**: 
   - 200 OK (or appropriate response based on endpoint implementation)
   - Request should proceed to the route handler

**If this fails**:
- Verify the token is valid and not expired
- Check that the token format is correct: `Bearer <token>`
- Ensure Firebase Admin SDK can verify the token

### Test 6: Test Protected Endpoint With Invalid Token (Should Fail)

**Purpose**: Verify protected endpoints reject invalid tokens.

1. Make a request with an invalid token:
   ```bash
   curl -H "Authorization: Bearer invalid-token-123" \
        http://localhost:3333/break/plans
   ```

2. **Expected Result**: 401 Unauthorized
   ```json
   {
     "success": false,
     "error": {
       "code": "UNAUTHORIZED",
       "message": "Invalid or expired authentication token."
     }
   }
   ```

**If this fails**: The token verification may not be working correctly.

### Test 7: Verify User Info is Attached to Request

**Purpose**: Ensure authenticated requests have user information available.

1. Add a test endpoint that returns user info (temporary, for testing):
   ```typescript
   // In a test route file
   fastify.get('/test-auth', async (request: AuthenticatedRequest, reply) => {
     return {
       success: true,
       data: {
         user: request.user
       }
     };
   });
   ```

2. Make a request with a valid token:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
        http://localhost:3333/test-auth
   ```

3. **Expected Result**: User info is returned
   ```json
   {
     "success": true,
     "data": {
       "user": {
         "uid": "user-id-123",
         "email": "user@example.com"
       }
     }
   }
   ```

**If this fails**: The user info may not be properly attached to the request object.

---

## Phase 3 Completion Checklist

Use this checklist to verify Phase 3 is complete:

### Firebase Console Setup
- [ ] Firebase project created in Firebase Console
- [ ] Authentication enabled (Email/Password and Google Sign-In)
- [ ] Service account credentials obtained
- [ ] `.env` file created with Firebase credentials

### Code Implementation
- [ ] `verifyToken` function implemented in auth middleware
- [ ] Auth middleware registered for protected routes
- [ ] Public routes excluded from authentication

### Testing
- [ ] Test 1: Server starts without Firebase errors ✅
- [ ] Test 2: Public endpoints work without authentication ✅
- [ ] Test 3: Protected endpoints reject requests without tokens ✅
- [ ] Test 4: Test user created and token obtained ✅
- [ ] Test 5: Protected endpoints accept valid tokens ✅
- [ ] Test 6: Protected endpoints reject invalid tokens ✅
- [ ] Test 7: User info is attached to authenticated requests ✅

---

## Troubleshooting Common Issues

### "Firebase Admin SDK initialization failed"

**Symptoms**: Server fails to start or Firebase errors appear in logs.

**Solutions**:
- Check that all environment variables in `.env` are set correctly
- Verify `FIREBASE_PRIVATE_KEY` includes the full key with `\n` characters
- Ensure `FIREBASE_PROJECT_ID` matches your Firebase project ID
- Check that the service account JSON file was downloaded correctly

### "Invalid token" errors

**Symptoms**: Valid tokens are rejected or return 401.

**Solutions**:
- Verify token is in correct format: `Bearer <token>`
- Check token hasn't expired (tokens expire after 1 hour)
- Ensure Firebase Authentication is enabled in Firebase Console
- Verify service account has proper permissions
- Check that you're using the correct Firebase project

### Middleware not working

**Symptoms**: Protected endpoints don't require authentication or authentication doesn't work.

**Solutions**:
- Check middleware is registered in `server.ts`
- Verify route paths match public route exclusions
- Check middleware hook is registered correctly
- Ensure `authMiddleware` function is properly implemented
- Verify `verifyToken` function is calling Firebase Admin SDK correctly

### Token extraction issues

**Symptoms**: Tokens aren't being extracted from requests.

**Solutions**:
- Verify `Authorization` header format: `Bearer <token>`
- Check that `extractToken` function handles both header and query parameter
- Ensure headers are being sent correctly from client
- Test with curl to verify header format

---

## Next Steps After Phase 3

Once Phase 3 is complete, you can proceed to:

1. **Phase 4: Middleware Implementation**
   - Complete logging middleware
   - Complete rate limiting middleware
   - Apply middleware to appropriate routes

2. **Implement Protected Endpoints**
   - Implement `/break/plans` endpoints
   - Implement `/history` endpoint
   - Use `request.user` to get authenticated user info

3. **Set Up Firestore Security Rules**
   - Create security rules based on authenticated users
   - Test rules with Firebase emulator

4. **Add User Profile Creation**
   - Create user profile in Firestore on first login
   - Sync user data with Firebase Auth

---

## Related Documentation

- [Firebase Setup Guide](../infra/firebase/SETUP.md) - Complete Firebase setup instructions
- [Implementation Plan](./implementation-plan-module4.md) - Full Module 4 implementation plan
- [Module 4 Quick Start](./module4-quick-start.md) - Quick reference guide
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Auth](https://firebase.google.com/docs/auth/admin)
- [JWT Token Verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

---

## Summary

Phase 3 sets up the foundation for authenticated API endpoints. By completing this phase, you'll have:

- ✅ Firebase Authentication enabled and configured
- ✅ Service account credentials set up
- ✅ Authentication middleware working
- ✅ Protected endpoints requiring valid tokens
- ✅ User information available in authenticated requests

Once all tests pass and the checklist is complete, Phase 3 is finished and you can move on to implementing the actual API endpoints that use this authentication system.


