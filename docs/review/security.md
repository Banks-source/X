# Security Review Checklist (Twenty10)

## Threat model (MVP)
- Multi-user isolation MUST be correct even if "single-user" MVP.
- Firestore reads/writes must be scoped to authenticated user.
- No secrets in repo, logs, or client bundles.

## What to check

### Auth
- Protected routes really require auth (no UI-only gating)
- Sign-in/out flows don’t leak user data
- Session persistence behavior reasonable

### Firestore
- Rules are not overly broad (avoid `allow read, write: if request.auth != null` for prod)
- Data model includes `userId`/owner uid where appropriate
- Queries always include ownership filter

### Secrets & config
- No tokens/keys committed
- Env var usage: only `NEXT_PUBLIC_*` on client

### Dependencies
- New deps are justified and pinned via lockfile

## Output format for PR comment
- Risk: LOW / MED / HIGH
- Summary (2–4 bullets)
- Required fixes before merge
- Hardening suggestions (optional)
