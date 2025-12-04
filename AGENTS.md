# Fizzy (Extended Fork)

This file provides guidance to AI coding agents working with this repository.

> **Note**: This is an extended fork of the [original Fizzy](https://github.com/basecamp/fizzy) project by 37signals/Basecamp. This fork adds several enhanced features including due dates, recurring cards, calendar view, and notification rules.

## What is Fizzy?

Fizzy is a collaborative project management and issue tracking application. It's a kanban-style tool for teams to create and manage cards (tasks/issues) across boards, organize work into columns representing workflow stages, and collaborate via comments, mentions, and assignments.

### Fork-Specific Features

This fork extends the base Fizzy with:

1. **Due Dates** - Cards can have due dates with color-coded urgency indicators
2. **Recurring Cards** - Create cards that automatically regenerate on a schedule (daily/weekly/biweekly/monthly)
3. **Calendar View** - Visual calendar showing all cards by their due dates
4. **Notification Rules** - Custom rules to receive email digests of cards matching specific criteria
5. **Security Enhancements** - CSPRNG for magic links, improved authorization checks

## Development Commands

### Setup and Server
```bash
bin/setup              # Initial setup (installs gems, creates DB, loads schema)
bin/dev                # Start development server (runs on port 3006)
```

Development URL: http://fizzy.localhost:3006
Login with: david@37signals.com (development fixtures), password will appear in the browser console

### Testing
```bash
bin/rails test                    # Run unit tests (fast)
bin/rails test test/path/file_test.rb  # Run single test file
bin/rails test:system             # Run system tests (Capybara + Selenium)
bin/ci                            # Run full CI suite (style, security, tests)

# For Windows or parallel test execution issues, use:
PARALLEL_WORKERS=1 bin/rails test
```

CI pipeline (`bin/ci`) runs:
1. Rubocop (style)
2. Bundler audit (gem security)
3. Importmap audit
4. Brakeman (security scan)
5. Application tests
6. System tests

### Database
```bash
bin/rails db:fixtures:load   # Load fixture data
bin/rails db:migrate          # Run migrations
bin/rails db:reset            # Drop, create, and load schema
```

### Other Utilities
```bash
bin/rails dev:email          # Toggle letter_opener for email preview
bin/jobs                     # Manage Solid Queue jobs
bin/kamal deploy             # Deploy (requires 1Password CLI for secrets)
```

## Architecture Overview

### Multi-Tenancy (URL-Based)

Fizzy uses **URL path-based multi-tenancy**:
- Each Account (tenant) has a unique `external_account_id` (7+ digits)
- URLs are prefixed: `/{account_id}/boards/...`
- Middleware (`AccountSlug::Extractor`) extracts the account ID from the URL and sets `Current.account`
- The slug is moved from `PATH_INFO` to `SCRIPT_NAME`, making Rails think it's "mounted" at that path
- All models include `account_id` for data isolation
- Background jobs automatically serialize and restore account context

**Key insight**: This architecture allows multi-tenancy without subdomains or separate databases, making local development and testing simpler.

### Authentication & Authorization

**Passwordless magic link authentication**:
- Global `Identity` (email-based) can have `Users` in multiple Accounts
- Users belong to an Account and have roles: owner, admin, member, system
- Sessions managed via signed cookies
- Board-level access control via `Access` records
- Magic links use cryptographically secure random codes (SecureRandom)

### Core Domain Models

**Account** → The tenant/organization
- Has users, boards, cards, tags, webhooks
- Has entropy configuration for auto-postponement

**Identity** → Global user (email)
- Can have Users in multiple Accounts
- Session management tied to Identity

**User** → Account membership
- Belongs to Account and Identity
- Has role (owner/admin/member/system)
- Board access via explicit `Access` records
- Has notification rules for custom email digests

**Board** → Primary organizational unit
- Has columns for workflow stages
- Can be "all access" or selective
- Can be published publicly with shareable key

**Card** → Main work item (task/issue)
- Sequential number within each Account
- Rich text description and attachments
- Lifecycle: triage → columns → closed/not_now
- Automatically postpones after inactivity ("entropy")
- **Due dates** with color-coded urgency (overdue/today/soon/later)
- **Recurrence** settings for automatic regeneration

**Card::Recurrence** → Recurring card configuration
- Frequency: daily, weekly, biweekly, monthly
- Day of week/month selection
- Active/paused state
- Creates new cards from template automatically

**NotificationRule** → Custom notification criteria
- Filter by boards, tags, due date proximity
- Frequency: daily or weekly digests
- Configurable send time

**Event** → Records all significant actions
- Polymorphic association to changed object
- Drives activity timeline, notifications, webhooks
- Has JSON `particulars` for action-specific data

### Entropy System

Cards automatically "postpone" (move to "not now") after inactivity:
- Account-level default entropy period
- Board-level entropy override
- Prevents endless todo lists from accumulating
- Configurable via Account/Board settings

### UUID Primary Keys

All tables use UUIDs (UUIDv7 format, base36-encoded as 25-char strings):
- Custom fixture UUID generation maintains deterministic ordering for tests
- Fixtures are always "older" than runtime records
- `.first`/`.last` work correctly in tests

### Background Jobs (Solid Queue)

Database-backed job queue (no Redis):
- Custom `FizzyActiveJobExtensions` prepended to ActiveJob
- Jobs automatically capture/restore `Current.account`
- Mission Control::Jobs for monitoring

Key recurring tasks (via `config/recurring.yml`):
- Deliver bundled notifications (every 30 min)
- Auto-postpone stale cards (hourly)
- Process recurring cards (hourly)
- Process notification rules (daily at 9am, weekly on Mondays)
- Cleanup jobs for expired links, deliveries

### Sharded Full-Text Search

16-shard MySQL full-text search instead of Elasticsearch:
- Shards determined by account ID hash (CRC32)
- Search records denormalized for performance
- Models in `app/models/search/`

## Fork-Specific Features in Detail

### Due Dates (`Card::Dueable`)

Cards can have due dates with automatic status tracking:
- **Scopes**: `overdue`, `due_today`, `due_this_week`, `due_soon`, `upcoming`
- **Status colors**: Red (overdue), Orange (today), Yellow (within 7 days), Green (later)
- **Events**: Tracks due date set/changed/removed in activity feed

### Recurring Cards (`Card::Recurring`, `Card::Recurrence`)

Create cards that automatically regenerate:
- **Frequencies**: daily, weekly, biweekly, monthly
- **Template**: New cards copy title, description, steps, and tags
- **Processing**: Background job runs hourly to create due cards
- **UI**: Recurrence icon in card header, configuration popup

### Calendar View (`CalendarsController`)

Visual calendar showing cards by due date:
- Monthly view with day cells
- Cards grouped by due date
- Overdue cards highlighted
- Navigation between months
- Accessible from main menu (keyboard shortcut: 2)

### Notification Rules (`NotificationRule`)

Custom email digest rules:
- **Filters**: Boards, tags, due date proximity
- **Frequency**: Daily or weekly
- **Test**: Send test email to preview matching cards
- **UI**: Settings → Notification Rules

## File Structure for New Features

```
app/
├── controllers/
│   ├── calendars_controller.rb          # Calendar view
│   ├── cards/
│   │   ├── due_dates_controller.rb       # Due date management
│   │   └── recurrences_controller.rb     # Recurrence settings
│   └── notifications/
│       └── rules_controller.rb           # Notification rules CRUD
├── models/
│   ├── card/
│   │   ├── dueable.rb                    # Due date concern
│   │   ├── recurrence.rb                 # Recurrence model
│   │   ├── recurrence/processor.rb       # Creates cards from templates
│   │   └── recurring.rb                  # Card concern for recurrence
│   └── notification_rule.rb              # Notification rule model
├── jobs/
│   ├── card/
│   │   └── recurrence/process_job.rb     # Hourly recurrence processing
│   └── notification_rule/process_job.rb  # Daily/weekly rule processing
├── mailers/
│   └── notification_rule/mailer.rb       # Rule notification emails
└── views/
    ├── calendars/                        # Calendar view templates
    ├── cards/due_dates/                  # Due date popups
    ├── cards/recurrences/                # Recurrence configuration
    └── notifications/rules/              # Notification rules UI
```

## Tools

### Chrome MCP (Local Dev)

URL: `http://fizzy.localhost:3006`
Login: david@37signals.com (passwordless magic link auth - check rails console for link)

Use Chrome MCP tools to interact with the running dev app for UI testing and debugging.

## Coding Style

Please read the separate files:
- `STYLE.md` - Ruby coding conventions
- `DESIGN.md` - UI/UX design guidelines and patterns
