# Firebase Setup Guide

This guide walks you through setting up Firebase for the Take a Break project. Follow these steps to configure Firebase Authentication, Firestore, and get the necessary credentials.

## Prerequisites

- A Google account
- Firebase CLI installed (optional, for emulators and deployment)
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name (e.g., `take-a-break`)
4. Click **Continue**
5. (Optional) Enable Google Analytics - you can skip this for now
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

## Step 2: Enable Authentication

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

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode** (we'll add security rules later)
4. Select a location for your database (choose closest to your users)
5. Click **Enable**
6. Wait for database creation

## Step 4: Get Service Account Credentials

1. In Firebase Console, click the gear icon ⚙️ next to **Project Overview**
2. Select **Project settings**
3. Go to the **Service accounts** tab
4. Click **Generate new private key**
5. A JSON file will be downloaded - **keep this file secure!**
6. Open the JSON file and extract the following values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

## Step 5: Configure Environment Variables

1. Create a `.env` file in the project root (copy from the template below):
   ```bash
   # Create .env file
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
   - Extract the `private_key` value from the JSON file downloaded in Step 4
   - Keep all `\n` characters as literal newlines or escape them
   - Wrap the entire value in quotes

## Step 6: Configure Firebase CLI (Optional)

If you want to use Firebase CLI for emulators and deployment:

1. Update `.firebaserc` with your project IDs:
   ```json
   {
     "projects": {
       "default": "your-project-id",
       "development": "your-project-id-dev",
       "staging": "your-project-id-staging",
       "production": "your-project-id-prod"
     }
   }
   ```

2. Set the default project:
   ```bash
   firebase use default
   ```

## Step 7: Deploy Firestore Indexes

After setting up your Firebase project, deploy the Firestore indexes:

1. Using Firebase CLI:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. Or manually in Firebase Console:
   - Go to **Firestore Database** > **Indexes** tab
   - Click **Create Index**
   - Follow the prompts to create each index from `infra/firestore-schema/indexes.json`

## Step 8: Set Up Firebase Emulators (For Local Development)

Firebase emulators allow you to test Firebase features locally without using the production database.

1. Start the emulators:
   ```bash
   pnpm firebase:emulators
   ```

2. The emulators will start on:
   - Firestore: `http://localhost:8080`
   - Auth: `http://localhost:9099`
   - Emulator UI: `http://localhost:4000`

3. To use emulators in your code, set the `FIRESTORE_EMULATOR_HOST` environment variable:
   ```bash
   export FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

4. The Firebase Admin SDK will automatically connect to emulators when this variable is set.

## Step 9: Verify Setup

1. Test Firebase Admin SDK initialization:
   ```bash
   pnpm dev:api
   ```

2. Check that the server starts without Firebase errors

3. Test Firestore connection by making a test query (after implementing endpoints)

## Troubleshooting

### "Firebase Admin SDK initialization failed"

- Check that all environment variables are set correctly
- Verify `FIREBASE_PRIVATE_KEY` includes the full key with `\n` characters
- Ensure `FIREBASE_PROJECT_ID` matches your Firebase project ID

### "Permission denied" errors

- Verify service account has proper permissions
- Check that Firestore is enabled in Firebase Console
- Ensure security rules allow access (for development, you may need to temporarily allow all)

### Emulators not connecting

- Ensure emulators are running (`pnpm firebase:emulators`)
- Check that `FIRESTORE_EMULATOR_HOST` is set correctly
- Verify ports 8080, 9099, and 4000 are not in use

## Security Notes

- **Never commit `.env` file** - it contains sensitive credentials
- **Never commit service account JSON files**
- Use different Firebase projects for development, staging, and production
- Review Firestore security rules before deploying to production
- Rotate service account keys periodically

## Next Steps

After completing this setup:

1. Implement authentication middleware (Phase 4)
2. Set up Firestore security rules
3. Implement API endpoints that use Firestore
4. Set up CI/CD with Firebase deployment

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Emulators](https://firebase.google.com/docs/emulator-suite)

