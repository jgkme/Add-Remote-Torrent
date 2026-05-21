# Security Policy

## Supported Versions

We are committed to ensuring the security of our extension. Security updates will be applied to the most recent version available on the Chrome Web Store.

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |

## Reporting a Vulnerability

The security of our users is a top priority. If you discover a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

Please report security vulnerabilities privately through **GitHub's private vulnerability reporting feature**. You can do this by navigating to the "Security" tab of the repository and clicking "Report a vulnerability".

This will ensure that your finding is disclosed privately and allows us time to address the issue before it becomes public. We will make every effort to respond to your report as quickly as possible.

**Please do not report security vulnerabilities through public GitHub issues.**

We thank you for your cooperation and your efforts to keep Add Remote Torrent secure.

## Automated scanning

- **Code scanning** uses `.github/workflows/codeql.yml` (JavaScript/TypeScript only). Do not re-enable **default CodeQL setup** in the repo settings at the same time—it adds a separate **actions** analysis that fails on workflow-only files.
- **Dependabot** opens weekly npm update PRs (see `.github/dependabot.yml`). Security advisories appear under the repository **Security** tab.
