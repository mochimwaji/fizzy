# Fizzy (Extended Fork)

This is an extended fork of [Fizzy](https://fizzy.do/), the Kanban tracking tool for issues and ideas by [37signals](https://37signals.com).

## Fork Features

This fork adds several enhanced features to the base Fizzy:

### 📅 Due Dates
- Set due dates on cards with a date picker
- Color-coded urgency indicators:
  - 🔴 **Red** - Overdue
  - 🟠 **Orange** - Due today  
  - 🟡 **Yellow** - Due within 7 days
  - 🟢 **Green** - Due later
- Filter cards by due date status
- Due date changes tracked in activity feed

### 🔄 Recurring Cards
- Create cards that automatically regenerate on a schedule
- Frequencies: Daily, Weekly, Biweekly, Monthly
- New cards copy title, description, steps, and tags from template
- Pause/resume recurrence as needed

### 📆 Calendar View
- Visual monthly calendar showing all cards by due date
- Navigate between months
- Quick access from main menu (keyboard shortcut: 2)
- Overdue cards highlighted

### 📬 Notification Rules
- Create custom rules to receive email digests
- Filter by: Boards, Tags, Due date proximity
- Choose frequency: Daily or Weekly
- Configurable send time
- Test button to preview matching cards

### 🔒 Security Enhancements
- Cryptographically secure magic link codes (SecureRandom)
- Improved column reordering authorization
- Better tag scoping to prevent cross-account access
- Email change error handling improvements

## Development

### Setting up

First, get everything installed and configured with:

```sh
bin/setup
bin/setup --reset # Reset the database and seed it
```

And then run the development server:

```sh
bin/dev
```

You'll be able to access the app in development at http://fizzy.localhost:3006.

To login, enter `david@37signals.com` and grab the verification code from the browser console to sign in.

### Running tests

For fast feedback loops, unit tests can be run with:

    bin/rails test

The full continuous integration tests can be run with:

    bin/ci

For Windows or parallel execution issues:

    PARALLEL_WORKERS=1 bin/rails test

### Database configuration

Fizzy works with SQLite by default and supports MySQL too. You can switch adapters with the `DATABASE_ADAPTER` environment variable. For example, to develop locally against MySQL:

```sh
DATABASE_ADAPTER=mysql bin/setup --reset
DATABASE_ADAPTER=mysql bin/ci
```

The remote CI pipeline will run tests against both SQLite and MySQL.

### Outbound Emails

You can view email previews at http://fizzy.localhost:3006/rails/mailers.

You can enable or disable [`letter_opener`](https://github.com/ryanb/letter_opener) to open sent emails automatically with:

    bin/rails dev:email

Under the hood, this will create or remove `tmp/email-dev.txt`.

## Environment Variables

For production deployment, configure these environment variables:

### Required
- `SECRET_KEY_BASE` - Rails secret key
- `DATABASE_URL` - Database connection string

### Email (SMTP)
- `SMTP_ADDRESS` - SMTP server address
- `SMTP_PORT` - SMTP port (default: 587)
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_DOMAIN` - SMTP domain
- `MAILER_HOST` - Host for email links

### Web Push Notifications
- `VAPID_PRIVATE_KEY` - VAPID private key
- `VAPID_PUBLIC_KEY` - VAPID public key

Generate VAPID keys with:
```ruby
vapid_key = WebPush.generate_key
puts "VAPID_PRIVATE_KEY=#{vapid_key.private_key}"
puts "VAPID_PUBLIC_KEY=#{vapid_key.public_key}"
```

## Deployment

We recommend [Kamal](https://kamal-deploy.org/) for deploying Fizzy. This project comes with a vanilla Rails template. You can find the original production setup in [`fizzy-saas`](https://github.com/basecamp/fizzy-saas).

## Documentation

- [AGENTS.md](AGENTS.md) - AI coding agent guidance
- [STYLE.md](STYLE.md) - Ruby coding conventions
- [DESIGN.md](DESIGN.md) - UI/UX design guidelines

## Upstream

This fork is based on [basecamp/fizzy](https://github.com/basecamp/fizzy). To sync with upstream:

```sh
git remote add upstream https://github.com/basecamp/fizzy.git
git fetch upstream
git merge upstream/main
```

## Contributing

We welcome contributions! Please read our [style guide](STYLE.md) and [design guide](DESIGN.md) before submitting code.

## License

Fizzy is released under the [O'Saasy License](LICENSE.md).

