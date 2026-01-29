# Twenty10

Goal-driven investing: net worth, strategy, and research in one place.

## Status
MVP in progress.

## Tech (current)
- Next.js (App Router) + TypeScript + Tailwind
- Firebase (Auth + Firestore) **emulator-first** (no real project required)

## Dev setup

### 1) Install deps

From repo root:
```bash
npm install
```

### 2) Configure env

Copy the example env file:
```bash
cp twenty10/.env.example twenty10/.env.local
```

Defaults are emulator-friendly and do **not** point at a real Firebase project.

### 3) Start Firebase emulators

In one terminal:
```bash
npm run emulators
```

Emulator UI: <http://localhost:4000>

### 4) Start the app (configured for emulators)

In another terminal:
```bash
npm run dev:emulators
```

App: <http://localhost:3000>

## Scripts

From repo root:
- `npm run dev` – Next dev server (no emulator env forced)
- `npm run dev:emulators` – Next dev server with `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1`
- `npm run emulators` – start Auth + Firestore emulators
- `npm run lint`
- `npm run build`

## Data model

See [`docs/data-model.md`](./docs/data-model.md).
