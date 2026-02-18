---
name: hubspot-bulk-upload
description: HubSpot bulk contact and company imports with association mapping, validation, and partner portal integration.
agents: [hspot-ops, upwork-bd]
---

# HubSpot Bulk Upload Skill

## When to use
When asked about bulk importing contacts, companies, or deals into HubSpot, especially for partner portal setups.

## Worker v7 architecture (production system)
- Node.js worker processes XLSX and CSV files
- Reads file, validates headers, maps columns to HubSpot properties
- Batches records (100/batch) to respect HubSpot API rate limits
- Creates contacts, companies, and associations in correct order
- Returns detailed per-row error report

## 14 critical issues resolved in v7
1. XLSX file support (previously CSV only)
2. Batch processing for large files (100 records/batch)
3. Association type 86 for Channel Partner relationships
4. Channel Partner auto-population from company lookup
5. Installer Email validation (format check + uniqueness)
6. Duplicate detection by email before insert
7. Per-row error reporting with line numbers
8. Retry logic for transient API failures (429, 500)
9. Progress tracking with percentage complete
10. Rollback on batch failure (delete created records)
11. Header mapping flexibility (case-insensitive, alias support)
12. Empty row handling (skip gracefully)
13. Special character encoding (UTF-8 normalization)
14. Rate limit backoff (exponential delay on 429)

## HubSpot association types
- Type 86: Channel Partner -> Contact (custom)
- Type 1: Company -> Contact (primary, standard)
- Type 2: Deal -> Contact (standard)
- Custom types: Installer -> Project, Partner -> Deal

## API rate limits
- Private apps: 100 requests per 10 seconds
- Batch endpoints: 100 records per request
- Search API: 4 requests per second
- Association API: 500 associations per request

## Common issues
- 429 Too Many Requests: reduce batch size or add delay between batches
- Association failures: verify association type ID in HubSpot settings
- Duplicate contacts: always check by email before create
- Missing required fields: validate firstname, lastname, email before API call
- Property doesn't exist: create custom properties before import

## Dashboard and reporting
- HubSpot dashboards can lag 15-30 min after bulk imports
- Custom reports need property creation before they can filter on new fields
- Workflow triggers fire on bulk-created records (can cause email storms)
- Use suppression lists when bulk importing to avoid unwanted emails
