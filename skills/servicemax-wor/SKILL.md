---
name: servicemax-wor
description: ServiceMax Work Order and Return Order management. Covers WO generation, scheduling, SharinPix integration, and status flows.
agents: [sfdc-ops]
---

# ServiceMax Work Order Skill

## When to use
When asked about ServiceMax Work Orders, Return Material Orders, scheduling, or field service operations.

## Work Order lifecycle
- Work Orders (WO) generated monthly from Service Plans (SP)
- Each SP generates 12 monthly WOs (Jan-Dec)
- WO statuses: Open -> To Be Scheduled -> Scheduled -> In Progress -> Complete
- Return Material Orders (RMO) track equipment returns
- Installed Products (IP) link equipment to locations and service contracts

## SharinPix Integration
- SharinPix flow v4 active with Signed status guard
- Photos captured during field service stored via SharinPix
- Flow triggers on WO status change to capture required documentation
- Guard prevents duplicate photo capture on already-signed WOs

## Force Approve flow
- Allows supervisors to bypass standard approval chain
- Used for emergency work orders or scheduling overrides
- Must validate all required fields before force approval
- Audit trail maintained in approval history

## Common issues and fixes
- WO generation failure: check SP effective dates and billing schedule
- Status stuck at wrong stage: verify Force Approve flow and transition rules
- Missing WOs: check IP (Installed Product) assignment and coverage dates
- SharinPix not triggering: confirm Signed status guard in flow v4
- Governor limits on WO generation: batch processing needed for 12+ WOs
- WOR sorting: verify sort order on related list and custom sorting logic
- Production Status field: ensure picklist values match flow decision criteria

## Real fixes reference
- SP-06718: All 12 monthly WOs confirmed (174309-174320, Jan-Dec 2026)
- WO-174306 status corrected to "To Be Scheduled"
- Q-5136 VA fix deployed successfully
- Force Approve debugging resolved trigger conflict
- IP flow work: 3 hours debugging installed product assignment logic

## Experience Cloud considerations
- Field technicians access WOs through Experience Cloud portal
- Limited component availability vs internal Lightning
- Permission sets required for external user WO access
- SharinPix must be configured for community user context
