# Bring a ScopeStack service catalogue across

Checked 10 November 2026 against [Uploading Services by Spreadsheet](https://docs.scopestack.io/help/scoping-pricing/upload-spreadsheet) and [Project List](https://docs.scopestack.io/help/projects/project-list).

## Export

In ScopeStack, open Settings > Content > Professional Services. Select the services and use Download. Keep the exported file unchanged as your source. Language-field columns vary by account. The vendor says the CSV contains common attributes rather than every importable attribute.

## Import one catalogue

Run `npm run scope -- import scopestack --file=./imports/services.csv --currency=NZD --actor="Actual estimator" --dry-run`. Confirm the counts and names, then remove --dry-run. The whole file commits together or rolls back together. An unknown currency or malformed hours fails the batch. The supplied fixture follows documented headers, with fictional content; it was not exported from a customer account.

| Vendor column | Destination |
|---|---|
| Line of Business, Service Category, Service, Subservice | Stable source path and parent relationship |
| Phase, Resource, Suggested Hours | Phase, resource label and labour hours |
| Service Description | Description |
| Other language columns | Preserved verbatim in the language object |
| State | Original value is not approval authority; imported state is pending |
| Service Type, Billing Frequency | Validated as professional, one-time work if supplied |

A blank Subservice marks a parent row. Following subservice rows must repeat the matching business line, category and service. Each row has its own hours. Repeated imports update matching paths. A renamed path creates a new service: reconcile renames deliberately before importing. No rows are deleted because they are missing from a later file. Empty Suggested Hours becomes zero for language-only parent rows; review those rows before activation.

The public export layout does not document cost and sell rates. New rates stay unknown, and every import resets service state to pending. Use set-rate with reviewed integer hourly cents and a review date. Existing manually entered rates remain on a repeated import, but changing the import currency is refused. Extra columns such as account-specific rates are retained as language rather than silently interpreted as money.

## What this does not import

The command imports professional-service catalogue rows only. ScopeStack supports project-level CSV export, but it does not represent all line-level work, documents, signatures or approval history. Archive project and signed-document exports separately and agree a project migration before cancelling. Managed services, products, travel, governance formulas, survey rules, resource billing logic and live CRM/PSA links require separate modelling. ScopeStack markup and template merge syntax are retained as text, not executed.

## Reconcile before switching

Compare parent and subservice counts, names, phases and effort with the source. Review custom language and all rates. Copy one service into a draft scope, check labour totals and compare the statement of work. Test the two-reviewer workflow. Keep the source account and export until the owner accepts the match. A catalogue can move in a day once the export and reviewed rates are ready; full history migration needs an agreed mapping.

## Leave this system

Run `npm run scope -- export --dir=./exports/archive-2026-11-10`. It creates snapshot.json with all eight business entities, raw amounts, scope snapshots and activity. It refuses to overwrite a populated directory. Protect the export. Database-native backups are the recovery mechanism for a deployed database; test restoration before relying on it.
