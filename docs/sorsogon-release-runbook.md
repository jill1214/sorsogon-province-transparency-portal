# Sorsogon portal release runbook

This is the controlled, low-cost release process for the independent Sorsogon Province Budget Transparency Portal. It uses the existing GitHub repository, its validation workflow, the protected Vercel Preview and the same Vercel project for Production. **There is no automatic Production deployment.**

## Environments and release ownership

| Environment | Source | Protection | Release method |
| --- | --- | --- | --- |
| Development | Feature branch or local copy | Local | No hosting changes |
| Preview | Exact feature-branch commit | Vercel Authentication | Explicitly approved Preview deployment |
| Production | Approved merge commit on `main` | Public | Explicitly approved Production deployment from exact `main` SHA |

Current Vercel project ID: `prj_a6GKbOUIM2tjxTMdLphgRKycFwKE`; Vercel project name: `sorsogon-province-transparency-portal`. The Git repository is **not automatically linked for deploy-on-push**. Do not turn on Vercel automatic Production deployments or create GitHub deployment tokens without a separate approval.

## Release sequence

1. Create a feature branch from the current `main`. Do not develop directly on `main`.
2. Open a pull request back into **this fork's** `main`; never create an upstream BetterGov.PH PR unless separately approved.
3. Wait for GitHub Actions to pass. It checks Node.js 22, locked dependency installation, CSV security tests, live API scope reconciliation, ESLint, TypeScript/Vite build and production dependency audit. The full-tree dependency audit is diagnostic and may report vulnerabilities in build tools; the **production-dependency-gate** fails on moderate-or-higher known production dependency advisories.
4. Review the diff for source attribution, protected data provenance, currency/appropriation wording, geographical limitations, CSV download safety and any dependency changes. Check whether any secrets or hosted configuration changes are proposed.
5. Obtain explicit Preview deployment approval, deploy the exact PR commit to the existing Vercel project with **Preview target only**, and verify Vercel reports `target: null` / Preview (never `production`). Confirm Preview Authentication remains enabled. Test home, budget history, project detail, mobile, CSV downloads, links and error states.
6. Obtain explicit merge approval. Merge only the reviewed PR and verify the resulting exact `main` commit and CI result.
7. Obtain explicit Production release approval. Deploy that exact `main` commit to the existing Vercel project with `target: production`. Verify `READY`, correct SHA and assigned Production domain.
8. Run read-only Production smoke checks on the **canonical project Production domain**, not merely the unique hash URL: `/`, `/gaa`, `/about`, JavaScript/static assets, public HTTP response, domain redirects, robots indexing header, CSV usability and external BetterGov API data loading. Record release link, commit, outcome, warnings and rollback candidate.
9. If a release fails, do not retry blindly, change credentials or force-deploy a different commit. Inspect logs. With approval, roll back by restoring the previous known-good Production deployment/alias.

## Production URL and indexing

Vercel gives each release an immutable hash URL such as `<project>-<hash>-amabini.vercel.app`; do not use that as the long-term public website link. The alias ending `sorsogon-province-transparency-portal-amabini.vercel.app` is stable between releases, but it currently returns `X-Robots-Tag: noindex` and is not listed as a configured project domain.

The public project domain `sorsogon-province-transparency-portal.vercel.app` was verified in Vercel on 2026-11-08. Use it as the canonical Production host. Other historical aliases may exist, but should not be assigned canonical status. Check response indexing headers on each release and ensure protected Preview URLs are not indexed. Domain or hosted settings changes need separate approval.

## Guardrails and constraints

- Never automatically merge, promote, deploy or change environment variables. Require explicit approval for each consequential action.
- Keep Production variables separate from Preview and Development. Do not copy credentials or display secret values. The portal currently requires no dedicated database or secrets.
- Preserve the BetterGov.PH source attribution and budget disclaimers. Proposed FY2027 NEP and House versions are not actual spending and must not be added.
- Municipal or barangay locations must not be asserted merely from office assignment or place-name matching.
- Avoid new paid services and unnecessary rebuilds. Monitor Vercel Hobby usage and noncommercial eligibility.
- If GitHub's branch protection or required status checks are unavailable, **passing CI alone does not technically prevent an unauthorized direct push or merge**. Enforce the manual review sequence and investigate account-supported branch rules before claiming hard enforcement.

## References

- [Vercel generated deployment URLs](https://vercel.com/docs/deployments/generated-urls)
- [Vercel response headers](https://vercel.com/docs/headers/response-headers)
- [Vercel deployments](https://vercel.com/docs/deployments)
- [BetterGov.PH upstream project](https://github.com/bettergovph/transparency-portal)
