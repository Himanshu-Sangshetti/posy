# Security policy

## Supported versions

We fix security problems in the latest release only.

| Version | Supported |
|---|---|
| 2.x | Yes |
| 1.x | No |

If you self-host, update to the latest release to get fixes.

## Report a vulnerability

Please do not open a public issue.

1. **GitHub:** use [private vulnerability reporting](https://github.com/Himanshu-Sangshetti/posy/security/advisories/new) on this repository.
2. **Email:** write to hello@posy.page with "Security" in the subject.

Tell us what you found, how to reproduce it, and what it could let someone do. A short proof of concept helps.

## What to expect

- We acknowledge your report within **72 hours**.
- We tell you if we can reproduce it, and keep you updated while we fix it.
- We release a fix, then credit you in the advisory if you want that.

Please give us a reasonable time to fix the problem before you share it publicly.

## Scope

In scope:

- The code in this repository: sign-in and sessions, API keys, the REST API, the MCP server, uploads, the link unfurler, and the public page renderer.
- The hosted service at [posy.page](https://posy.page), including its API and MCP server.
- The Docker image built from this repository.

Out of scope:

- Problems that need a user's own device or account to be already compromised.
- Denial of service by sending a very large amount of traffic.
- Missing security headers with no real impact, and reports from automated scanners with no proof.
- Social engineering of maintainers or users.
- Third-party services (Vercel, Turso, GitHub). Report those to the vendor.
- Self-hosted instances you do not own. Do not test against other people's servers.

Please test only against your own account and your own data, and do not read or change other people's pages.
We will not take legal action against research done in good faith under this policy.
