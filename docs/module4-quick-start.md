# Module 4: Quick Start Guide

## Overview

This is a quick reference guide for implementing Module 4 (Backend & Data Platform). For detailed information, see:
- [Full Implementation Plan](./implementation-plan-module4.md)
- [Testing Guide](./testing-guide.md)

---

## Implementation Order

### ✅ Phase 1: API Contract (Partially Done)
- Types exist in `packages/types/src/`
- OpenAPI spec exists in `docs/api/openapi.yaml`
- **Action**: Review and finalize

### 🔄 Phase 2: Firestore Schema Design
**Priority**: HIGH - Needed before endpoints

**Tasks**:
1. Design collections: `break_plans`, `history`, `users`, `voice_conversations`
2. Define indexes
3. Create schema files in `infra/firestore-schema/`

**Time**: 1-2 hours

### 🔄 Phase 3: Firebase Authentication Setup
**Priority**: HIGH - Needed for protected endpoints

**Tasks**:
1. Set up Firebase project
2. Enable Email/Password and Google Sign-In
3. Create auth middleware
4. Test token verification

**Time**: 2-3 hours

### 🔄 Phase 4: Middleware Implementation
**Priority**: MEDIUM - Can be done in parallel with endpoints

**Tasks**:
1. Authentication middleware
2. Logging middleware
3. Rate limiting middleware

**Time**: 3-4 hours

### 🔄 Phase 5: Break Plans Endpoints
**Priority**: HIGH - Core functionality

**Tasks**:
1. GET `/break/plans` - List plans
2. POST `/break/plans` - Create plans (with reverse geocoding)
3. PATCH `/break/plans/:id/chosen` - Mark plan as chosen

**Time**: 4-6 hours

### 🔄 Phase 6: History Endpoint
**Priority**: MEDIUM - Can be done after break plans

**Tasks**:
1. GET `/history` - Paginated history with cursor

**Time**: 2-3 hours

### 🔄 Phase 7: Error Handling
**Priority**: MEDIUM - Can be done incrementally

**Tasks**:
1. Standardize error responses
2. Add error codes
3. Add request ID tracking

**Time**: 2-3 hours

### 🔄 Phase 8: Testing Infrastructure
**Priority**: MEDIUM - Set up early, add tests incrementally

**Tasks**:
1. Set up Vitest
2. Set up Firestore emulator
3. Create test utilities
4. Write example tests

**Time**: 2-3 hours

### 🔄 Phase 9: CI/CD Pipeline
**Priority**: LOW - Can be done last

**Tasks**:
1. Set up GitHub Actions
2. Configure deployment
3. Set up environments

**Time**: 3-4 hours

---

## Quick Reference: What to Do First

### Week 1: Foundation
1. **Day 1**: Design Firestore schema (Phase 2)
2. **Day 2**: Set up Firebase Authentication (Phase 3)
3. **Day 3**: Implement authentication middleware (Phase 4.1)
4. **Day 4**: Set up testing infrastructure (Phase 8)
5. **Day 5**: Implement logging middleware (Phase 4.2)

### Week 2: Core Features
1. **Day 1-2**: Implement POST `/break/plans` (Phase 5.2)
2. **Day 3**: Implement GET `/break/plans` (Phase 5.1)
3. **Day 4**: Implement PATCH `/break/plans/:id/chosen` (Phase 5.3)
4. **Day 5**: Implement GET `/history` (Phase 6)

### Week 3: Polish
1. **Day 1**: Implement rate limiting (Phase 4.3)
2. **Day 2**: Standardize error handling (Phase 7)
3. **Day 3**: Write comprehensive tests
4. **Day 4**: Set up CI/CD (Phase 9)
5. **Day 5**: Documentation and review

---

## Key Decisions Needed

### 1. Reverse Geocoding Service
**Options**:
- Google Maps Geocoding API (paid, accurate)
- OpenStreetMap Nominatim (free, rate-limited)
- Mapbox Geocoding API (paid, good accuracy)

**Recommendation**: Start with OpenStreetMap for development, switch to Google Maps for production

### 2. Rate Limiting Storage
**Options**:
- In-memory (simple, single server)
- Redis (distributed, production-ready)

**Recommendation**: Start with in-memory, add Redis later if needed

### 3. Logging Destination
**Options**:
- Console (development)
- File (small deployments)
- Cloud Logging (production)

**Recommendation**: Console for dev, Cloud Logging for production

### 4. Deployment Target
**Options**:
- Cloud Run (Google Cloud)
- App Engine (Google Cloud)
- Railway
- Heroku

**Recommendation**: Cloud Run (scalable, cost-effective)

---

## Testing Quick Reference

### Run Tests
```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# Watch mode
pnpm test:watch
```

### Manual Testing
```bash
# Start server
pnpm dev:api

# Test endpoint (in another terminal)
curl http://localhost:3333/health
```

### Test with Postman
1. Import OpenAPI spec from `docs/api/openapi.yaml`
2. Set up environment variables (base URL, token)
3. Test each endpoint

---

## Common Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:api

# Build
pnpm build

# Lint
pnpm lint

# Run tests
pnpm test

# Start Firestore emulator (for testing)
firebase emulators:start --only firestore
```

---

## File Structure Reference

```
services/break/
├── routes/
│   ├── plans.ts          # GET, POST, PATCH /break/plans
│   └── history.ts        # GET /history
├── services/
│   ├── plan-service.ts   # Business logic for plans
│   ├── geocoding.ts      # Reverse geocoding
│   └── plan-generator.ts # LLM plan generation (mock)
└── README.md

infra/
├── firebase/             # ✅ Already exists
├── middleware/
│   ├── auth.ts          # JWT verification
│   ├── logging.ts       # Request/response logging
│   ├── rate-limit.ts    # Rate limiting
│   └── error-handler.ts # Error handling
├── firestore-schema/
│   ├── schema.ts        # TypeScript schema definitions
│   └── indexes.json     # Firestore indexes
└── security-rules/
    └── rules.rules      # Firestore security rules

packages/types/src/
├── break.ts             # ✅ Already exists
├── error.ts             # ✅ Already exists
├── public.ts            # ✅ Already exists
└── auth.ts              # ⏳ To be created (auth types)

tests/
├── unit/
├── integration/
└── helpers/
```

---

## Questions to Ask Yourself

Before starting each phase, ask:

1. **Do I understand what this phase does?**
   - Read the detailed plan
   - Review existing code
   - Ask questions if unclear

2. **Do I have the prerequisites?**
   - Firebase project set up?
   - Dependencies installed?
   - Test environment ready?

3. **How will I test this?**
   - Unit tests?
   - Integration tests?
   - Manual testing?

4. **What could go wrong?**
   - Error scenarios?
   - Edge cases?
   - Performance issues?

---

## Getting Help

1. **Read the detailed plan**: `docs/implementation-plan-module4.md`
2. **Check testing guide**: `docs/testing-guide.md`
3. **Review existing code**: Look at `services/api/src/routes/public.ts` as example
4. **Check Firebase docs**: https://firebase.google.com/docs
5. **Check Fastify docs**: https://www.fastify.io/

---

## Next Steps

1. **Read the full implementation plan**: `docs/implementation-plan-module4.md`
2. **Start with Phase 2**: Design Firestore schema
3. **Set up Firebase project** (if not done)
4. **Begin implementation** following the phases

Good luck! 🚀


