# Church Services for Claude Code

Service plans, volunteer schedules, song history and follow-up in a database you own. MIT licensed code by Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free code. Install and operate it. Hosting and agent costs remain yours. | Your fields, rules, screens and Planning Center export mapping. [Discuss your version](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=planning-center&utm_medium=github). | Omni by Enterprise DNA installs and operates it for one setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/planning-center?utm_source=github&utm_medium=readme&utm_campaign=planning-center). |

## Start with fictional data

```bash
git clone https://github.com/Enterprise-DNA-OS/church-services-for-claude-code.git
cd church-services-for-claude-code
npm install
npm run demo
npm test
npm run church -- roster-gaps
npm run view
npm run docs
```

Node 20 or newer. No database installation is needed for local PGlite. For PostgreSQL 15 or newer use DATABASE_URL through your environment and npm run migrate. Never seed a real church database. Dates in reports are UTC; supply explicit time offsets for local service times.

## What works today

Eleven record types and four SQL views cover people, teams, membership, services, required roles, assignments, blockouts, songs, running-order items, follow-ups and notes. Assignment writes reject overlaps, blockouts, inactive volunteers, missing membership and missing screening evidence where the team requires it. Replies record what a volunteer actually said. Notes cannot be rewritten. Later policy/date changes surface in the conflict and evidence reports.

22 read commands cover the weekly desk. 37 slash recipes include the Monday review, private drafts, importing and customisation. Three branded document families produce service sheets, team rosters and internal follow-up briefs. They never send.

Planning Center already offers a free People database and free Services for five team members. [Pricing](https://www.planningcenter.com/pricing), checked 7 October 2026. This base is for churches that want to own and change their operating rules. No claim of an expensive church bill or guaranteed savings is made.

## Questions across your own records

These are working queries, not a claim that Planning Center cannot build comparable reports.

- Which upcoming roles still lack confirmed people? Run /roster-gaps.
- Who has not replied to an upcoming assignment? Run /pending-replies.
- Who has overdue follow-ups and upcoming assignments? Run /busy-with-followups.
- Which child-facing roles still need confirmed volunteers? Run /unfilled-screened-roles.
- Which planned songs need their permission evidence reviewed? Run /music-review.
- Who has the heaviest roster over the next four weeks? Run /volunteer-load.
- How much of each service remains unallocated? Run /plan-length.
- Which campuses have the largest confirmed-person gaps? Run /campus-coverage.
- Which assignments now conflict with a blockout or screening review? Run /schedule-conflicts.
- How often have songs been used, and what is planned next? Run /song-history.

## Your first hour: ten things to ask for

1. Show missing people for the next service.
2. Show unanswered assignments.
3. List the busiest volunteers.
4. Show overdue follow-up.
5. Add the actual reply from a volunteer.
6. Review the next service running order.
7. Produce a team roster in our brand.
8. Show song permission reviews.
9. Import a copy of our people export.
10. Add our campus field or a local policy through /customise.

## Migration and operation

[Import guide](docs/replace-planning-center.md): one command imports exported people with stable IDs, atomic validation, dry run and safe repeat import. It does not import a complete Planning Center account. Team membership, song files, service plans, check-in history, giving and messages require separate work. [CLI](docs/cli.md) documents every field. [Evidence checks](docs/compliance.md) separates law from church policy.

This is a trusted coordinator tool. Row security has no public access policies. Shared operation needs staff identity, explicit database grants/policies, encrypted storage/backups and a tested restore procedure. The database owner connection bypasses row security and must not be handed to general volunteers. Generated reports contain personal records; keep them private. Local PGlite supports one process at a time.

No child check-in kiosk, pickup authority, mobile self-service, music media library, giving ledger or payment processing ships here. [Why no front end](docs/why-no-front-end.md) describes what an interface adds. A real deployment needs the church's safeguarding lead and privacy officer to validate its scope.

## Verification

The smoke test creates a temporary local database, repeats seed/migration, checks every read and mutation family, import rollback/idempotence, ambiguity, scheduling failures, row security and HTML output. GitHub Actions runs on Linux and Windows with Node 20 and 22. PostgreSQL-compatible SQL is used; local validation uses PGlite unless a separate PostgreSQL test is recorded.
