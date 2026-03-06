# Security Policy

## Reporting a Vulnerability

If you discover a security issue, do not open a public issue with exploit details.
Please report it privately to the maintainer/owner of this repository with:

- affected component and version/commit
- reproduction steps
- impact assessment
- suggested fix (optional)

## Secret Management Rules

- Never commit secrets (database password, JWT secret, API keys, private tokens).
- Use environment variables for runtime secrets:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `JWT_SECRET`
- Use `.env.local` for frontend local development and keep it untracked.
- Keep runtime user-uploaded files (for example `backend/uploads/`) out of git.

## If Secrets Were Exposed

1. Rotate credentials immediately (DB password, JWT secret, API keys).
2. Revoke/expire affected sessions or tokens.
3. Optionally clean git history with `git filter-repo`:
   - remove sensitive files from history
   - replace leaked strings
4. Force-push rewritten history and notify collaborators to re-clone.

History rewrite does not replace credential rotation.
