# Ordia

Ordia is a shared household context app. This first foundation implements secure accounts, household membership, role-based access and invitation links before any preferences, routines or planning modules are added.

## Current foundation

- Email and password authentication through Convex Auth
- Authenticated Ordia profile linked to the Convex Auth user
- Multiple households per user
- Household roles: owner, admin and member
- Email-bound invitation links with seven-day expiry
- Backend membership checks on every household read and write
- Mobile-first Next.js interface ready to become a native client later

## Run locally

```bash
npm install
npx convex dev
```

In another terminal, configure Convex Auth for the local web origin:

```bash
npx @convex-dev/auth --skip-git-check --web-server-url http://localhost:3000
```

Confirm the Convex deployment has `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL`, then run:

```bash
npm run dev:frontend
```

## Vercel and Convex

`vercel.json` sets the Vercel build command to:

```bash
npx convex deploy --cmd 'npm run build'
```

The Vercel project must have a `CONVEX_DEPLOY_KEY` for the intended production deployment. Convex Auth environment variables are deployment-specific, so configure `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL` on production as well as development. `SITE_URL` must match the final Vercel or custom-domain origin.

## Access model

Authentication answers **who is this user?** Household membership answers **which shared data may they access?** Every future household-owned table should include `householdId`, and every public query or mutation must verify active membership before reading or writing it.

The current relational root is:

```text
Auth user
  └─ Ordia profile
  └─ Household membership ── Household
                              └─ Invitations
```

Next domain layers will hang from `householdId`: people, knowledge records, routines, responsibilities, key dates and practical companion modules.
