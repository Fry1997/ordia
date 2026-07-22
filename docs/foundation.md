# Ordia foundation

The first build establishes the security and tenancy boundary before product modules are added.

## Identity and access

- Convex Auth owns authenticated identities.
- `profiles` stores Ordia-specific display information separately from auth credentials.
- A user may belong to multiple households through `householdMemberships`.
- Every household-owned query and mutation must verify active membership server-side.
- Roles are `owner`, `admin` and `member`.

## Invitations

- Invitations are bound to a normalized email address.
- Raw invitation tokens are returned once and only a SHA-256 hash is stored.
- Invitations expire after seven days and can be revoked.
- Acceptance requires the authenticated account email to match the invited email.

## Deployment

Production environment-variable changes must be validated through a fresh deployment from the `main` branch rather than by rebuilding an obsolete branch deployment.

## Next relational layers

All shared domain records will include `householdId`. The next tables will cover people and relationships, structured knowledge, routines, responsibilities and key dates before practical modules such as meals and lists are introduced.
