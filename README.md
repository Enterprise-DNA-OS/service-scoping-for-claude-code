<h1 align="center">Service Scoping for Claude Code</h1>

<p align="center"><strong>The open-source service scoping system that is just a database and Claude Code.</strong></p>

Built by [Enterprise DNA](https://enterprisedna.co). MIT licensed. Runs with Claude Code, Codex, OpenCode or Cursor.

<!-- three-doors -->
| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free base. Clone, install and run it. | Your services, rates and approval rules. Your ScopeStack data mapped and brought across. | Installed, connected and operated through Omni by Enterprise DNA. Setup fee, then a retainer. |
| [Quick start](#quick-start) | [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=scopestack&utm_source=github&utm_medium=readme) | [How it works](https://enterprisedna.co/omni/instead-of/scopestack) |

## What this holds

For a service estimator preparing work for technical and commercial review. Keep the service work breakdown, labour assumptions, price basis and sign-offs together. This is a focused professional-service estimate workflow. It does not claim feature parity with ScopeStack's managed services, products, surveys, signatures or integrations.

ScopeStack's own pricing calculator displayed a $12,800 annual-project example on 10 November 2026. That is a vendor example, not a verified NZ or AU customer invoice. The page shows dollars without a currency code; confirm the billing currency with the vendor. The current model uses credits and includes unlimited users. [Vendor pricing](https://scopestack.io/pricing).

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/service-scoping-for-claude-code.git
cd service-scoping-for-claude-code
npm install
npm run demo
npm run scope -- attention
```

Node 20 or later. The embedded PGlite database needs no separate database install. For Postgres, set DATABASE_URL in .env, then npm run migrate. Only seed a disposable shared database, using npm run seed -- --demo-database. All seeded records are fictional.

The demo has an overdue migration estimate with unknown rates, an unresolved backup assumption, a stale catalogue rate and a complete recovery estimate. No unknown cost is treated as zero.

## Commands

| Command | Purpose |
|---|---|
| `/clients` | Review client contacts and retention review dates |
| `/services` | Review the service catalogue and hourly rates |
| `/scopes` | Review the current scope pipeline |
| `/attention` | Read overdue scopes, unresolved assumptions and incomplete estimates |
| `/margin-watch` | Compare priced scope margins and unpriced work |
| `/assumptions-due` | Review scope dependencies and their owners |
| `/approvals-due` | Find submitted scopes still waiting for reviewers |
| `/catalogue-drift` | Find estimate lines that differ from current service standards |
| `/rates-review` | Find unpriced services and rate reviews older than 90 days |
| `/effort-by-role` | Review labour by scope, phase and resource |
| `/compliance` | Check selected pricing-record and privacy-review conditions |
| `/activity` | Read recent changes and operator labels |
| `/stats` | Count work by currency and stage |
| `/scope` | Read one scope and every estimate line |
| `/history` | Read the immutable submission and approval history |
| `/scenario` | Test extra delivery effort against the current estimate |
| `/add-client` | Record a client and a contact-retention purpose |
| `/review-client` | Record the next contact-retention review |
| `/add-service` | Create a reusable professional service |
| `/set-rate` | Review and activate a service with cost and sell rates |
| `/create-scope` | Start a client-specific labour estimate |
| `/add-line` | Copy a service and its subservices into a draft estimate |
| `/set-line` | Change draft effort, rates, evidence or acceptance criteria |
| `/add-assumption` | Record a dependency that must be resolved |
| `/resolve-assumption` | Record evidence that resolves a dependency |
| `/submit` | Freeze the current revision for review |
| `/approve` | Record technical or commercial sign-off |
| `/revise` | Open a new draft revision while retaining prior approvals |
| `/close` | Record the approved scope handover |
| `/log` | Append a scope note |
| `/draft-sow` | Draft a statement of work without sending it |
| `/weekly-review` | Draft the Monday review from three live reads |
| `/import` | Import native ScopeStack professional-service CSV rows |
| `/export` | Write a full private administrative snapshot |
| `/help` | List the CLI verbs |
| /customise | Add fields or change a policy through migrations and tests |
| /new-view | Add a private read-only report |

Every CLI read supports --json. Codes, case-insensitive name fragments and UUID prefixes resolve records. Ambiguity lists candidates and exits with status 1. Writes require --actor=. See .claude/commands for concrete examples.

## A weekly scoping cycle

1. Review attention, margin-watch and approvals-due.
2. Check rates-review before copying a service into an estimate.
3. Resolve assumptions with evidence and record acceptance criteria.
4. Submit the revision. Independent technical and commercial reviewers sign off.
5. Draft the statement of work and internal handover, then give them to a person to check.

Only draft estimates can be edited. Submitted revisions retain full snapshots. Changing a submitted scope requires revise, which starts a new approval cycle. Parent service hours and each subservice's hours are counted independently, as in the documented vendor model. Rate snapshots protect existing estimates from silent catalogue repricing.

## Instead of ScopeStack

```bash
npm run scope -- import scopestack --file=./fixtures/scopestack-services.csv --currency=NZD --actor="Estimator" --dry-run
```

Export your Professional Services catalogue in ScopeStack, run this command with its CSV, check the results, then remove --dry-run. Parent services and subservices are matched by their source path. Custom language fields are retained. All imported services need review before use, since the documented export does not supply hourly cost and sell rates.

This imports the service catalogue, not complete project history. Project-list exports, signed documents, managed services, products and approvals need a separate agreed migration. Keep the old system until one real estimate reconciles. A one-day catalogue switch depends on usable exports and rate review. [The full mapping](docs/replace-scopestack.md).

## Ten questions for your own scoping records

These are real analyses supported today. They combine your rules and records. ScopeStack also has pricing and approval reporting; we have not claimed it cannot build equivalent reports.

1. Which scopes look priced but still have missing cost rates? (`margin-watch`)
2. Which overdue estimates also have unresolved client assumptions? (`attention`)
3. How much margin remains after two extra delivery hours? (`scenario Q-102 --extra-hours=2 --cost-cents=11000`)
4. Which labour lines have drifted from their catalogue standard? (`catalogue-drift`)
5. Which submitted revision still lacks a commercial reviewer? (`approvals-due`)
6. Which service rates have not been reviewed for 90 days? (`rates-review`)
7. How much delivery effort sits in each role and phase? (`effort-by-role`)
8. Which estimate lines lack an acceptance criterion or evidence? (`compliance`)
9. Who approved the previous scope revision and on what evidence? (`history Q-101`)
10. Which client contacts need a retention-purpose review? (`compliance`)

## Your first hour: ten things to ask for

1. Show the migration estimate and explain its unknown prices.
2. Find assumptions that need a client answer.
3. Compare role effort across open scopes.
4. Test two extra recovery hours against the current price.
5. Show catalogue rates due for review.
6. Import the example catalogue without writing.
7. Draft the recovery statement of work.
8. Put our name and colours in brand.json and render the reports.
9. Change our margin policy through a migration and tests.
10. Add a report for effort by client and resource.

## Documents and read-only views

`npm run docs` creates a statement of work and internal handover per scope. `npm run view` creates weekly exceptions, margins and record-check reports. brand.json sets business name, logo and colours. Draft SOWs exclude cost rates and commercial-review evidence. Generated files are private, ignored by Git, and never sent. These are static snapshots, not an editing application. [Why no front end](docs/why-no-front-end.md).

## Operational boundaries

Selected [compliance record checks](docs/compliance.md) link to official NZ guidance. They do not decide legal compliance. An actor label is not authentication. This base is for a trusted operator; review shared database permissions and individual identities before production use. RLS starts with no public access policies. Direct database owners can override workflow controls. Protect exports, drafts and backups as business records.

Rates use integer cents, hours and quantities use two decimal places, and line totals round once. No foreign-exchange conversion, tax calculation, invoicing, payment processing or electronic signatures are performed. The export command writes a complete administrative JSON snapshot, including history; it is not a native-vendor CSV and there is no one-command restore promise.

## Verification

`npm test` exercises every CLI verb in an isolated database, approval revisions, missing-rate handling, atomic import rollback, parent/subservice totals, custom language, ambiguous names, private drafts and escaped HTML. CI runs the same checks on Linux, Windows and PostgreSQL 17. TEST_DATABASE_URL must name an empty disposable database; the test ignores DATABASE_URL by default.

## Want it installed and run for you?

Enterprise DNA builds your version, brings the agreed ScopeStack records across and operates it through **Omni by Enterprise DNA**. Your fields, your rules, a web front end or another stack when required. One setup fee, then a monthly retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=scopestack).

## Licence

MIT. Copyright 2026 Enterprise DNA.
