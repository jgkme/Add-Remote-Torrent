---
name: issue-triage-and-repro
description: Triage bug reports and reproduce extension issues consistently in this repository. Use when analyzing user-reported failures, validating reproduction steps, collecting debug evidence, and preparing actionable fix notes.
---

# Issue Triage And Reproduction

## Triage Workflow

1. Capture environment details: extension version, browser version, client type/version.
2. Classify impact: data loss, broken core flow, degraded UX, or cosmetic.
3. Identify scope: one client handler, one page, or cross-cutting behavior.
4. Reproduce with minimal steps and deterministic inputs.

## Reproduction Checklist

- Confirm relevant settings in options (server profile, auth, rules).
- Reproduce on one known-good site/link and one failing case.
- Record exact user-visible error message from popup/dashboard.
- Collect console logs from affected surface (options/popup/background).
- Note whether issue is stable, intermittent, or race-dependent.

## Investigation Notes Format

Use short sections:

- **Observed:** What happened.
- **Expected:** What should happen.
- **Likely Area:** File/module candidates.
- **Evidence:** Error text, logs, response snippets.
- **Next Step:** Smallest safe code/test change.

## Done Criteria

- Reproduction steps are clear and repeatable.
- Evidence is sufficient for another developer to implement a fix.
- Priority and user impact are explicitly stated.
