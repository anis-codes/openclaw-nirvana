---
name: salesforce-migrations
description: Migrate Workflow Rules and Process Builders to Flow. Handles deactivation sequencing, test coverage, and rollback planning.
agents: [sfdc-ops, upwork-bd]
---

# Salesforce Migration Skill

## When to use
When asked about migrating legacy automation (Workflow Rules, Process Builders) to Flow.

## Knowledge
- Salesforce retired Workflow Rules December 31, 2025
- Process Builders deprecated in favor of Record-Triggered Flows
- Migration must preserve all business logic including field updates, email alerts, outbound messages, and tasks

## Proven approach (from real 53-rule migration at a national nonprofit)
1. Export all Workflow Rules via Metadata API or Hubbl diagnostic tool
2. Group by object (Account, Contact, Opportunity, etc.)
3. Consolidate: multiple WR on same object -> single Record-Triggered Flow
4. Real result: 53 Workflow Rules consolidated into 13 Flows (4:1 ratio)
5. Test each Flow against original WR behavior before deactivation
6. Deactivate WRs only after Flow validation passes in sandbox
7. Keep WRs inactive (not deleted) for 30 days as rollback safety net

## Common pitfalls
- Order of execution changes when moving from WR to Flow
- Evaluation criteria differences (created, created+edited, every time)
- Time-dependent workflow actions need Scheduled Paths in Flow
- Cross-object field updates may need separate flows or subflows
- Governor limits: flows that fire on every record edit need bulkification
- Email alerts in WRs become Send Email actions in Flow (different merge field syntax)

## Hubbl diagnostics integration
- Hubbl scans identify all active WRs, PBs, and their dependencies
- Can identify 19,000+ platform issues across custom objects
- Critical for architectural refactoring planning
- Generates prioritized remediation roadmap

## Pricing guidance for proposals
- Simple migration (< 20 rules, single object): $2,000-5,000
- Medium (20-50 rules, multiple objects): $5,000-15,000
- Complex (50+ rules, cross-object, custom code): $15,000-40,000
- Add 20-30% for test coverage and documentation
