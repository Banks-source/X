# Twenty10 – Data Model (Firestore) v1

Goal: a simple, **user-owned** data model that supports:
- strategies (Personal + SMSF)
- allocation buckets + targets (Safe/Growth/Asymmetric)
- assets + holdings (incl. property)
- CSV imports (Kubera)
- research vault items
- weekly reports

This doc describes collections, IDs, relationships, and the query patterns we expect.

---

## Conventions

### Ownership
Every user-owned document includes:
- `userId` (string) — Firebase Auth uid (required)

For production, security rules must enforce:
- only authenticated users
- reads/writes only allowed when `request.auth.uid == resource.data.userId`

> Note: current dev rules are intentionally permissive (auth-only). Tighten rules before prod.

### Timestamps
- `createdAt`: `serverTimestamp()`
- `updatedAt`: `serverTimestamp()`

### IDs
- Prefer auto IDs for top-level docs.
- For “sub-objects” inside a doc (e.g. buckets array), use client UUIDs.

---

## Collections

### `users`
Document id: `userId` (Auth uid)

Fields:
- `email` (string)
- `displayName` (string)
- `photoURL` (string)
- `createdAt`, `updatedAt`
- `lastLoginAt`

Query patterns:
- fetch self profile: `doc('users', uid)`

---

### `strategies`
Document id: auto

Fields:
- `userId` (string, required)
- `name` (string, required)
- `type` (string, optional for MVP) — `"Personal" | "SMSF"`
- `goal` (string, optional) — e.g. `"$10M in 20y"`
- `description` / `notes` (string, optional)
- `createdAt`, `updatedAt`

Query patterns:
- list: `where('userId','==',uid).orderBy('updatedAt','desc')`

Index notes:
- composite index on `(userId, updatedAt desc)`.

---

### `strategyBuckets`
(If/when buckets move out of the strategy doc.)

Document id: auto

Fields:
- `userId` (string, required)
- `strategyId` (string, required)
- `name` (string, required)
- `targetPercent` (number, required) — 0..100
- `createdAt`, `updatedAt`

Validation rule:
- sum of `targetPercent` for a given `strategyId` must equal 100.
  - enforce in app logic for MVP.
  - can enforce with Cloud Functions later.

---

### `assets`
Represents an “asset container” (property, bank account, brokerage account, crypto wallet, etc.).

Document id: auto

Fields:
- `userId` (string, required)
- `name` (string, required)
- `category` (string, required) — `property | cash | brokerage | crypto | other`
- `currency` (string, optional) — e.g. `AUD`
- `notes` (string, optional)
- `createdAt`, `updatedAt`

Query patterns:
- list by category: `where('userId','==',uid).where('category','==','property')`

Index notes:
- composite index on `(userId, category)`.

---

### `holdings`
A holding/value line that can be mapped to a strategy bucket.

Document id: auto

Fields:
- `userId` (string, required)
- `assetId` (string, required)
- `strategyId` (string, optional)
- `bucket` (string, optional) — bucket name for MVP (or `bucketId` later)
- `label` (string, required) — e.g. ticker/name
- `value` (number, required)
- `asOfDate` (string, required) — `YYYY-MM-DD`
- `source` (string, optional) — `manual | kubera`
- `createdAt`, `updatedAt`

Query patterns:
- holdings for a strategy: `where('userId','==',uid).where('strategyId','==',strategyId)`

Index notes:
- composite index on `(userId, strategyId)`.

---

### `importRuns`
Tracks a CSV import (e.g., Kubera export).

Document id: auto

Fields:
- `userId` (string, required)
- `source` (string, required) — `kubera`
- `fileName` (string, optional)
- `fileHash` (string, optional) — for idempotency
- `rowCount` (number, optional)
- `createdAt`

Query patterns:
- list imports: `where('userId','==',uid).orderBy('createdAt','desc')`

Index notes:
- `(userId, createdAt desc)`.

---

### `researchItems`
Links/notes tagged and associated to assets and/or strategies.

Document id: auto

Fields:
- `userId` (string, required)
- `title` (string, required)
- `url` (string, optional)
- `notes` (string, optional)
- `tags` (array<string>, optional)
- `strategyIds` (array<string>, optional)
- `assetIds` (array<string>, optional)
- `createdAt`, `updatedAt`

Query patterns:
- list by tag: `where('userId','==',uid).where('tags','array-contains','rate-cuts')`

---

### `reports`
Weekly report snapshots for a strategy.

Document id: auto

Fields:
- `userId` (string, required)
- `strategyId` (string, required)
- `startDate` (string, required) — `YYYY-MM-DD`
- `endDate` (string, required) — `YYYY-MM-DD`
- `netWorthStart` (number, optional)
- `netWorthEnd` (number, optional)
- `allocationSummary` (object, optional)
- `driftSummary` (object, optional)
- `notes` (string, optional)
- `createdAt`

Query patterns:
- list reports: `where('userId','==',uid).where('strategyId','==',strategyId).orderBy('createdAt','desc')`

Index notes:
- composite index on `(userId, strategyId, createdAt desc)`.

---

## Auth & Rules (dev)

Dev runs against **Firebase emulators**.

Current Firestore rules (`firestore.rules`) require authentication for all reads/writes:
- `allow read, write: if request.auth != null;`

Before prod:
- enforce ownership (`userId`) per collection
- add indexes as query patterns settle
