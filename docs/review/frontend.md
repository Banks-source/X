# Frontend Review Checklist (Twenty10)

## What to check

### UX / Product
- User flow makes sense end-to-end (where do they land, what’s next)
- Clear navigation + back/escape routes
- Loading, empty, error states present and readable
- Copy is concise and consistent

### Accessibility (baseline)
- Buttons/inputs have labels
- Focus states present
- Keyboard navigation works for primary flows

### Next.js / Architecture
- Avoid unnecessary client components; keep server components where possible
- No leaking server-only code into client bundles
- Routing/redirect behavior correct

### Code quality
- Types are correct (no `any` unless justified)
- Component boundaries clean; avoid prop drilling where possible
- No obvious performance regressions (heavy renders, repeated computations)

## Output format for PR comment
- Verdict: APPROVE / REQUEST CHANGES
- Summary (2–4 bullets)
- Required fixes (bulleted)
- Nice-to-haves (bulleted)
