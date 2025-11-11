# Firebase Bootstrap

Utility helpers for initialising the Firebase Admin SDK.

## Overview

This package provides Firebase Admin SDK initialization and helper functions for accessing Firebase services (Auth, Firestore, Storage).

## Setup

Before using this package, you need to set up Firebase. See [SETUP.md](./SETUP.md) for detailed instructions.

### Quick Setup

1. Create a Firebase project in [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google Sign-In)
3. Create Firestore database
4. Get service account credentials
5. Configure environment variables (see `.env.example` in project root)

## Usage

### Initialize Firebase

The Firebase Admin SDK is automatically initialized when you import and use the helper functions:

```typescript
import { getFirebaseFirestore } from '@take-a-break/firebase';

const db = getFirebaseFirestore();
```

### Get Firebase Services

```typescript
import {
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
  ensureFirebaseApp
} from '@take-a-break/firebase';

// Get Firebase Auth
const auth = getFirebaseAuth();

// Get Firestore
const db = getFirebaseFirestore();

// Get Storage
const storage = getFirebaseStorage();

// Get Firebase App instance
const app = ensureFirebaseApp();
```

### Example: Using Firestore

```typescript
import { getFirebaseFirestore } from '@take-a-break/firebase';
import { COLLECTIONS } from '@take-a-break/firestore-schema';

const db = getFirebaseFirestore();
const breakPlansRef = db.collection(COLLECTIONS.BREAK_PLANS);

// Create a document
await breakPlansRef.add({
  user_id: 'user123',
  title: 'Take a walk',
  // ... other fields
});
```

### Example: Using Auth

```typescript
import { getFirebaseAuth } from '@take-a-break/firebase';

const auth = getFirebaseAuth();

// Verify ID token
const decodedToken = await auth.verifyIdToken(idToken);
const uid = decodedToken.uid;
```

## Configuration

Firebase is configured via environment variables. See `.env.example` in the project root for all available options.

Required variables:
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key

Optional variables:
- `FIREBASE_DATABASE_URL` - Realtime Database URL (if using)
- `FIREBASE_STORAGE_BUCKET` - Storage bucket name (if using)

## Local Development with Emulators

For local development, you can use Firebase emulators:

1. Start emulators:
   ```bash
   pnpm firebase:emulators
   ```

2. Set environment variable:
   ```bash
   export FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

3. The Firebase Admin SDK will automatically connect to emulators when `FIRESTORE_EMULATOR_HOST` is set.

## Related Documentation

- [Firebase Setup Guide](./SETUP.md) - Complete setup instructions
- [Firestore Schema](../firestore-schema/README.md) - Firestore collections and indexes
- [Security Rules](../security-rules/README.md) - Firestore security rules

## Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Emulators](https://firebase.google.com/docs/emulator-suite)
