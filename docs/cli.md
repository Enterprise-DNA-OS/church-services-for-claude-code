# CLI

Use npm run church -- <command> [arguments] [--json]. Dates are UTC in storage and reports; supply explicit timestamp offsets when adding services or blockouts. All reads return JSON with --json or aligned text by default. Unknown commands/options fail. Ambiguous references list candidates and exit 1.

## Reads

people, teams, memberships, service-plans, service-order, roster, roster-gaps, pending-replies, call-cycle, followups-due, blockouts, songs, song-history, volunteer-load, plan-length, screening-due, compliance, schedule-conflicts, unfilled-screened-roles, busy-with-followups, music-review, campus-coverage. Also person <reference>, service <reference>, attention, weekly-review, help.

## Add records

Run npm run church -- add <type> --data=imports/record.json. The file contains one object. References in fields ending _id accept an exact code, case-insensitive name prefix or UUID prefix. Use an unambiguous code. Dates use YYYY-MM-DD, timestamps include a timezone.

- people: code, name, email, active, screening_reference, screening_review_on, privacy_review_on
- teams: code, name, requires_screening
- memberships: code, person_id, team_id
- services: code, name, starts_at, ends_at, campus, status
- roles: code, service_id, team_id, name, needed
- assignments: code, role_id, person_id, status
- blockouts: code, person_id, starts_at, ends_at, reason
- songs: code, name, author, licence_reference, licence_review_on
- items: code, service_id, song_id, name, position, minutes, musical_key
- followups: code, person_id, name, owner, due_on, status, purpose
- notes: code, person_id, author, body

Assignment statuses: pending, accepted, declined. Service statuses: planned, complete, cancelled. Follow-up statuses: open, done. Required fields and constraints live in supabase/migrations/0001_church.sql.

## Changes

reply <assignment> --status=accepted|pending|declined records a real reply. screening <person> --reference=<ref> --until=YYYY-MM-DD records verified screening review evidence. privacy-review <person> --until=YYYY-MM-DD records the next review. complete-followup <code> closes the task. log <person> --author=<name> --text=<event> appends a note. draft-roster writes an internal draft. No command sends anything.

## Import and backup

import planning-center --file=<people.csv> [--dry-run] imports people only. export [--out=<new-file.json>] exports every record type in one consistent snapshot. Protect the output. JSON backup restoration is an operator task; there is no automatic restore command.
