# Bring your Planning Center people across

Checked 7 October 2026. Planning Center documents a people CSV export in Services: open People, choose your selection, then Export CSV. Scheduler permission or higher is required. [Official steps](https://help.planningcenter.com/en/142857-export-a-csv-file.html). Its [field guide](https://help.planningcenter.com/en/138557-prepare-a-csv-file-for-import.html) confirms Person ID in exports and first/last name fields.

## One-command import

Create a private imports folder, save the export as people.csv, and run:

```bash
npm run church -- import planning-center --file=imports/people.csv --dry-run
npm run church -- import planning-center --file=imports/people.csv
```

Required columns: Person ID (ID and remote_id accepted), First Name, Last Name. Optional: Email (Email Address or Primary Email accepted). Columns are case-insensitive. IDs must be digits. Extra columns are ignored; minimise the export to these fields. The example file is a synthetic mapping fixture, not a real vendor export. Confirm your account's headings and adjust them if needed.

A Person ID becomes PC-<id>. Reimport updates name and supplied email, preserving screening, active status and privacy-review dates. A missing email does not erase an existing one. Duplicate IDs or malformed rows roll back the whole file. Dry run writes nothing. New imports have no screening or privacy approval. Names never merge people.

Service plans, membership, blockouts, songs, attachments, messages, giving and check-in history do not arrive in a people export. Planning Center also documents [service reports](https://help.planningcenter.com/en/139392-create-service-type-reports.html); those require separate mapping and are not accepted by this importer. Enterprise DNA scopes that work with the coordinator.

Start with a blank migrated database, not the demo. Compare person counts and sample names/emails before scheduling anyone. Rebuild teams and permissions, verify evidence, reconcile upcoming plans alongside Planning Center, then decide which subscriptions can end. The one-command promise covers people, not a complete account migration.
