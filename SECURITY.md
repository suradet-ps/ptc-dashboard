# Security Policy

## Supported Versions

We currently support the latest major version of the PTC Monitor Dashboard for security updates.

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within the PTC Monitor Dashboard, please DO NOT open a public issue. We appreciate your efforts to responsibly disclose your findings.

Please report any security issues or vulnerabilities by reaching out via email directly to the repository owners. Include the following details in your report:

- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact and an exploit scenario.

You should receive a prompt response acknowledging receipt of your report.

## Data Sensitivity and Privacy Note

- **Data Sensitivity:** This application is strictly intended for tracking operational processes and policy implementation. **Do not** store Protected Health Information (PHI), patient identifiers, or highly confidential institutional data in this system.
- **Endpoint Protection:** Treat your GAS Web App URL as a sensitive credential. Do not commit it to public version control. Utilize proper secret management (e.g., Vercel Environment Variables).
- **Access Control:** Restrict the sharing permissions of the backend Google Sheet to authorized personnel only.
