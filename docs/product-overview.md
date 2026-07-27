# Product Overview

## What this is

The Newsletter Subscriber Portal is BioCryst's internal tool for managing employee newsletter distribution lists. It replaces ad-hoc spreadsheets and manual mailing-list edits with a single web application that lets curators and administrators maintain subscriber audiences, bulk-import contacts, track every change, and monitor list health — while giving individual employees a self-service way to manage or cancel their own subscriptions.

## Who uses it

| Audience | What they do |
|---|---|
| **Curators** | Day-to-day list management: add/edit/remove subscribers, run CSV imports, review the audit trail. Signs in with their `@biocryst.com` Microsoft account. |
| **Admins** | Everything a Curator can do, plus creating and deleting distribution lists. |
| **Employees (subscribers)** | Never log in. They manage their own subscription preferences or unsubscribe entirely through a public link in every newsletter's email footer. |

## Core capabilities

- **Distribution list management** — create, edit, and delete newsletter channels (e.g. *Weekly Newsletter*, *HAE*, *CMD*, *NS*), each with its own subscriber roster and health stats.
- **Subscriber management** — add, edit, and remove individual subscribers within a list, with search and status filtering.
- **CSV bulk import** — upload a spreadsheet of contacts, preview validation results (valid / duplicate / invalid), and commit only the clean rows.
- **Master subscriber directory** — a single cross-list view of every subscriber and which lists/statuses they're in.
- **Audit trail** — every add, edit, removal, and import is logged with who did it and when.
- **Dashboard** — at-a-glance totals for lists, subscribers, active/bounced/unsubscribed counts, and recent activity.
- **Public self-service** — any recipient can look themselves up by email and toggle individual list subscriptions, or unsubscribe from everything at once, without an account.
- **Single sign-on** — access is gated by Microsoft Entra ID and restricted to `@biocryst.com` accounts; there is no separate password to manage.

## What this product does *not* do

- It does not compose or send the newsletter emails themselves — that happens in whatever tool your team already uses to author and mail newsletters. This portal only manages **who is subscribed to what**, and provides the self-service links that go in the email footer (see [`email-footer.html`](../email-footer.html)).
- It has no AI drafting, automated email dispatch, or analytics-on-opens features. Earlier drafts of this project's documentation described those as planned — none of that code exists in the current application.

## How it's built and hosted

A two-tier web app, fully hosted on Azure:

- **Frontend** — Next.js, statically exported, served by Azure Static Web Apps.
- **Backend** — FastAPI (Python) REST API on Azure App Service.
- **Database** — Azure Database for PostgreSQL Flexible Server, on a private network.
- **Identity** — Microsoft Entra ID (Azure AD), single sign-on only.

See [Architecture Overview](architecture-overview.md) for the technical breakdown, and [Deployment Guide](deployment-guide.md) for exactly what's provisioned where.

## Where to go next

| I want to... | Read |
|---|---|
| Learn how to use the portal day-to-day | [User Guide](user-guide.md) |
| Find an answer to a specific question | [FAQ](faq.md) |
| Understand the system design | [Architecture Overview](architecture-overview.md) |
| Deploy or reconfigure the Azure infrastructure | [Deployment Guide](deployment-guide.md) |
| Call the API directly | [API Reference](api-reference.md) |
| Look up the data model | [Database Schema](database-schema.md) |
| Fix something that's broken | [Troubleshooting](troubleshooting.md) |
| See what's changed over time | [Release Notes](release-notes.md) |
