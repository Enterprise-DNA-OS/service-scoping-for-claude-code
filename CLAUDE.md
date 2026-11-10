# Service Scoping for Claude Code

For an authorised service estimator at [YOUR BUSINESS]. Set the operator name and agreed review policy here before using real records. The database holds reusable professional services, scoped labour, assumptions and review evidence. Every seeded business is fictional.

## Working rules

Read first, then perform the requested change. Use the CLI below. Always show ambiguity candidates. Never infer a missing rate, acceptance criterion, approval or estimate basis. Never send, sign a contract or publish a document. Drafts stay in drafts/. No payments, payroll or client-system changes.

Actor labels record who operated the CLI. They are not login checks. A shared deployment requires individual database access and permission review. RLS is enabled with no public policies. The database owner is the trusted operator. A direct database owner can bypass application workflow rules.

## Routing

| Job | Command |
|---|---|
| Review client contacts and retention review dates | `/clients` |
| Review the service catalogue and hourly rates | `/services` |
| Review the current scope pipeline | `/scopes` |
| Read overdue scopes, unresolved assumptions and incomplete estimates | `/attention` |
| Compare priced scope margins and unpriced work | `/margin-watch` |
| Review scope dependencies and their owners | `/assumptions-due` |
| Find submitted scopes still waiting for reviewers | `/approvals-due` |
| Find estimate lines that differ from current service standards | `/catalogue-drift` |
| Find unpriced services and rate reviews older than 90 days | `/rates-review` |
| Review labour by scope, phase and resource | `/effort-by-role` |
| Check selected pricing-record and privacy-review conditions | `/compliance` |
| Read recent changes and operator labels | `/activity` |
| Count work by currency and stage | `/stats` |
| Read one scope and every estimate line | `/scope` |
| Read the immutable submission and approval history | `/history` |
| Test extra delivery effort against the current estimate | `/scenario` |
| Record a client and a contact-retention purpose | `/add-client` |
| Record the next contact-retention review | `/review-client` |
| Create a reusable professional service | `/add-service` |
| Review and activate a service with cost and sell rates | `/set-rate` |
| Start a client-specific labour estimate | `/create-scope` |
| Copy a service and its subservices into a draft estimate | `/add-line` |
| Change draft effort, rates, evidence or acceptance criteria | `/set-line` |
| Record a dependency that must be resolved | `/add-assumption` |
| Record evidence that resolves a dependency | `/resolve-assumption` |
| Freeze the current revision for review | `/submit` |
| Record technical or commercial sign-off | `/approve` |
| Open a new draft revision while retaining prior approvals | `/revise` |
| Record the approved scope handover | `/close` |
| Append a scope note | `/log` |
| Draft a statement of work without sending it | `/draft-sow` |
| Draft the Monday review from three live reads | `/weekly-review` |
| Import native ScopeStack professional-service CSV rows | `/import` |
| Write a full private administrative snapshot | `/export` |
| List the CLI verbs | `/help` |
| Change fields or rules | /customise |
| Add a private report | /new-view |

## Data and documents

Run `npm run scope -- help`. Use `--json` for full records. Writes need `--actor=`. Rates are integer minor currency units per hour, hours have two decimals. No automatic tax calculation or currency conversion. Estimated line fees round once after hours times quantity times rate. Missing rates stay null. The 30 percent margin threshold and 90-day rate-review interval are internal demo policies, not laws.

Only drafts can be edited. Submission freezes a snapshot. Two different reviewers approve the submitted revision. Revise to change submitted work. No old sign-off approves the revision. Submissions, approvals and history are append-only. Do not edit them directly.

Run `npm run docs` for statements of work and internal handovers. Run `npm run view` for the week, margin and record checks. Both use brand.json. The SOW excludes internal cost rates. Keep all generated files private. Use docs/compliance.md for the exact meaning of findings and docs/replace-scopestack.md for import boundaries.

Schema: supabase/migrations. One adapter: scripts/lib/db.mjs. One CLI: scripts/scoping.mjs. Add migrations, not a second database adapter. Run npm test after changes.

Built and run for you through Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/scopestack
