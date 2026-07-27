# FAQ

### Who can sign in?

Anyone with a `@biocryst.com` Microsoft (Entra ID) account. There is no separate portal password — sign-in is entirely through Microsoft SSO. Accounts outside the `biocryst.com` tenant/domain are rejected by the backend even if someone obtains a token some other way.

### I signed in for the first time — why can't I create a list?

New accounts default to the **Curator** role, which covers everything except creating and deleting distribution lists. An existing **Admin** needs to promote your account — currently a manual database update (see [Deployment Guide](deployment-guide.md#promoting-a-user-to-admin)). There's no self-service way to request Admin access yet.

### What's the difference between Curator and Admin?

Curators can do everything day-to-day: manage subscriber rosters, run CSV imports, edit list details, read the audit log. Admins can additionally create and delete distribution lists. See [User Guide](user-guide.md).

### Does this tool send the newsletter emails?

No. This portal only manages **who is subscribed to what**. The actual newsletter is composed and sent through whatever tool your team already uses — you just paste the footer snippet from [`email-footer.html`](../email-footer.html) into that email so recipients get working "Manage Preferences" / "Unsubscribe" links.

### A subscriber says they're still getting emails after unsubscribing. What do I check?

Confirm their subscription status in the relevant list (search by email in **Manage List** or look them up in **Master Subscribers**) — if it's shown as **Unsubscribed** here, the portal's own data is correct, and the issue is upstream in whatever system is dispatching the emails using that list's export. Cross-check with the audit log for their email to see the actual unsubscribe event.

### Why did my CSV import skip some rows?

Rows are skipped automatically if the email is malformed, already subscribed to that list ("List Duplicate"), or repeated within the file itself ("File Duplicate"). The preview screen shows exactly which rows were skipped and why before you commit — see [User Guide](user-guide.md#importing-subscribers-from-a-csv).

### Can I filter the audit log by date or type of action?

Not currently — only free-text search across timestamp, action, subscriber, list, operator, and details. See [Known Limitations](product-overview.md#what-this-product-does-not-do) and [Troubleshooting](troubleshooting.md) if this is blocking you.

### Where does subscriber data live, and is it backed up?

In an Azure Database for PostgreSQL Flexible Server, private-network only (not reachable from the public internet). Automated backups are enabled by default at the Azure level. See [Database Schema](database-schema.md) and [Deployment Guide](deployment-guide.md).

### I'm a developer — how do I run this locally?

See the **Local Development** section of the [Deployment Guide](deployment-guide.md#local-development).

### Something's broken — where do I start?

[Troubleshooting](troubleshooting.md) covers the issues that have actually come up (login loops, blank screens, deployment failures). If it's not there, check the backend logs per the same doc.
