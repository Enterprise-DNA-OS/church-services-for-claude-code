# Church Services for Claude Code

For a church coordinator managing service plans, volunteer commitments and follow-up. Configure the business name in brand.json.

Read the matching recipe in .claude/commands before each recurring job. The single CLI is npm run church. Every answer starts with current data. Never invent a response, permission, screening result or record. Drafts stay private and never send. Resolve ambiguous names before writes. Do not delete records without explicit approval.

## Routing

- /people: .claude/commands/people.md
- /teams: .claude/commands/teams.md
- /memberships: .claude/commands/memberships.md
- /service-plans: .claude/commands/service-plans.md
- /service-order: .claude/commands/service-order.md
- /roster: .claude/commands/roster.md
- /roster-gaps: .claude/commands/roster-gaps.md
- /pending-replies: .claude/commands/pending-replies.md
- /call-cycle: .claude/commands/call-cycle.md
- /followups-due: .claude/commands/followups-due.md
- /blockouts: .claude/commands/blockouts.md
- /songs: .claude/commands/songs.md
- /song-history: .claude/commands/song-history.md
- /volunteer-load: .claude/commands/volunteer-load.md
- /plan-length: .claude/commands/plan-length.md
- /screening-due: .claude/commands/screening-due.md
- /compliance: .claude/commands/compliance.md
- /schedule-conflicts: .claude/commands/schedule-conflicts.md
- /unfilled-screened-roles: .claude/commands/unfilled-screened-roles.md
- /busy-with-followups: .claude/commands/busy-with-followups.md
- /music-review: .claude/commands/music-review.md
- /campus-coverage: .claude/commands/campus-coverage.md
- /person: .claude/commands/person.md
- /service: .claude/commands/service.md
- /add: .claude/commands/add.md
- /log: .claude/commands/log.md
- /reply: .claude/commands/reply.md
- /screening: .claude/commands/screening.md
- /privacy-review: .claude/commands/privacy-review.md
- /complete-followup: .claude/commands/complete-followup.md
- /import: .claude/commands/import.md
- /export: .claude/commands/export.md
- /attention: .claude/commands/attention.md
- /weekly-review: .claude/commands/weekly-review.md
- /draft-roster: .claude/commands/draft-roster.md
- /customise: .claude/commands/customise.md
- /new-view: .claude/commands/new-view.md

## Operations

Read docs/cli.md for arguments, docs/compliance.md for rule scope, and docs/replace-planning-center.md before migration. Use npm run demo only in a disposable database. Never run it against real church records. The base is an operator tool, not a child check-in or payment system.

Database: DATABASE_URL for PostgreSQL, otherwise embedded PGlite under .data. One local process at a time. Personal records require controlled access, encrypted storage and backups. Do not upload exports or database contents to public repositories.

Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/planning-center
