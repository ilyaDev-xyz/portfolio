# Security policy

If you find a security issue in this repository, please report it
**privately** through GitHub's Private Vulnerability Reports:

> [Report a vulnerability](https://github.com/ilyaDev-xyz/portfolio/security/advisories/new)

(Repo → Security tab → "Report a vulnerability".) The thread is private,
visible only to you and the maintainer; please do **not** open a public
issue or pull request for security-relevant findings.

Expect an acknowledgement within 5 working days.

## Scope

- The static portfolio engine (`src/`, `vite.config.ts`).
- The analytics server (`server/`).
- Deployment templates in `deploy/` (note: these are example files; real
  deployment config lives outside the repository).

## Out of scope

- Findings in third-party dependencies — please report upstream.
- Issues that require a malicious local environment (compromised dev machine).
