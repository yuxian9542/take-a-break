# Firestore Schema

This directory contains Firestore schema definitions, indexes, and migration tooling.

## Files

- **`schema.ts`** - TypeScript type definitions for all Firestore collections
- **`indexes.json`** - Firestore index configuration
- **`README.md`** - This file

## Collections

### 1. `break_plans`

Stores break plans generated for users. When a user requests a break plan, multiple plans are generated and stored here.

**Key Fields**:
- `user_id` - User who created this plan
- `chosen` - True when user selects this plan
- `order` - Order in which plans appear (0, 1, 2, ...)
- `location.address` - Reverse geocoded address
- `location.coordinates` - Lat/lng coordinates

**Indexes**:
- `user_id` + `created_at` (descending) - For listing user's plans
- `user_id` + `chosen` + `created_at` (descending) - For filtering chosen plans
- `user_id` + `order` (ascending) - For ordering plans

### 2. `history`

Stores completed break sessions. Only plans with `chosen: true` from `break_plans` should create history entries.

**Key Fields**:
- `user_id` - User who completed this break
- `break_plan_id` - Reference to the break_plan that was used
- `status` - 'completed' | 'cancelled' | 'in_progress'
- `started_at` - When the break session started
- `completed_at` - When the break session completed

**Indexes**:
- `user_id` + `started_at` (descending) - For paginated history query
- `user_id` + `status` + `started_at` (descending) - For filtering by status

### 3. `users`

Stores user profile information. This collection is synced with Firebase Auth.

**Key Fields**:
- `id` - Firebase Auth UID (same as document ID)
- `email` - User email address (unique)
- `display_name` - Display name (optional)
- `photo_url` - Profile photo URL (optional)

**Indexes**:
- `email` (unique) - For email lookups

### 4. `voice_conversations`

Stores voice session data and transcripts. This is used by the voice service (Module 3).

**Key Fields**:
- `user_id` - User who had this conversation
- `session_id` - WebSocket session identifier (unique)
- `started_at` - When the conversation started
- `ended_at` - When the conversation ended (null if still active)
- `summary` - LLM-generated summary (optional)
- `transcript` - Full conversation transcript (optional)

**Indexes**:
- `user_id` + `started_at` (descending) - For listing conversations
- `session_id` (unique) - For session lookups

## Usage

### Import Schema Types

```typescript
import type { BreakPlanDocument, HistoryDocument } from '@take-a-break/firestore-schema/schema';
```

### Using Collections

```typescript
import { COLLECTIONS } from '@take-a-break/firestore-schema/schema';
import { getFirebaseFirestore } from '@take-a-break/firebase';

const db = getFirebaseFirestore();
const breakPlansRef = db.collection(COLLECTIONS.BREAK_PLANS);
```

## Indexes

Firestore requires composite indexes for queries that filter or order by multiple fields. The `indexes.json` file defines all required indexes.

### Deploying Indexes

To deploy indexes to Firestore:

```bash
# Using Firebase CLI
firebase deploy --only firestore:indexes

# Or manually create indexes in Firebase Console
# Go to Firestore → Indexes → Create Index
```

### Index Creation

When you run a query that requires an index, Firestore will:
1. Return an error with a link to create the index
2. You can click the link to create it in Firebase Console
3. Or use the Firebase CLI to deploy indexes from `indexes.json`

## Migration

When schema changes are needed:

1. Update `schema.ts` with new fields/types
2. Update `indexes.json` if new indexes are needed
3. Create migration script if data transformation is needed
4. Test migration in development environment
5. Deploy to staging, then production

## Best Practices

1. **Always use TypeScript types** - Import types from `schema.ts` instead of using `any`
2. **Use collection constants** - Use `COLLECTIONS.BREAK_PLANS` instead of string literals
3. **Index queries** - Always create indexes for queries that filter/order by multiple fields
4. **Validate data** - Validate data before writing to Firestore
5. **Handle timestamps** - Use Firestore `Timestamp` type, not JavaScript `Date`

## Related Documentation

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore Security Rules](../security-rules/README.md)
