# Twenty10 – Data Model (Firestore)

This project currently uses a **single Firestore collection** for dev-only iteration.

## Collection: `strategies`

Document id: auto-generated

Fields:
- `name` (string, required)
- `description` (string, optional)
- `buckets` (array of objects)
  - `id` (string, required) – client-generated UUID
  - `name` (string, required)
  - `percent` (number, required) – 0..100, and **all buckets must sum to 100**
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

Example:
```json
{
  "name": "My Strategy",
  "description": "Example strategy",
  "buckets": [
    { "id": "9f1…", "name": "US Stocks", "percent": 60 },
    { "id": "4a2…", "name": "Bonds", "percent": 40 }
  ],
  "createdAt": "(serverTimestamp)",
  "updatedAt": "(serverTimestamp)"
}
```

## Auth & Rules

Dev runs against **Firebase emulators**.

Firestore rules (`firestore.rules`) currently require authentication for all reads/writes:
- `allow read, write: if request.auth != null;`

In dev, authenticate using the **Auth emulator** with email/password.
