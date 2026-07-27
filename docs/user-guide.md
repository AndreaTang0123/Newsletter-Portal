# User Guide

This guide walks through every screen in the portal. For account/role questions, see the [FAQ](faq.md).

## Signing in

1. Open the portal.
2. Click **Sign in with Microsoft**.
3. Sign in with your `@biocryst.com` Microsoft account. Accounts outside that domain are rejected.
4. The first time you sign in, your account is created automatically with the **Curator** role. If you need to create or delete distribution lists, ask an existing Admin to promote your account (see [FAQ](faq.md)).

## Dashboard

The landing page after sign-in.

- Four metric cards: **Total Lists**, **Total Subscribers**, **Active Subscribers**, **Bounced/Unsubscribed**.
- "Database Last Updated" timestamp with a refresh (↻) button.
- **Recent Subscriber Changes** — a preview of the latest audit log entries, with a **View Full Audit Trail** button.

## Distribution Lists

Go to **Distribution Lists** in the sidebar to see every newsletter channel as a card, showing owner, description, subscriber counts (Total/Active/Unsubscribed/Bounced), and last-updated date.

- **Create a list** *(Admin only)* — click **Add New List**, fill in Name (required), Description, and Owner, then **Create List**.
- **Open a list** — click **Manage List** on any card to go to its subscriber roster.
- **Delete a list** *(Admin only)* — click the trash icon on a card and confirm. This permanently removes the list and all of its subscriber associations — it cannot be undone.

## Managing a list's subscribers

Inside a list (via **Manage List**):

- **Edit the owner** — click the pencil icon next to Owner, type the new name, press Enter (or the checkmark) to save, Escape (or ✕) to cancel.
- **Search** — the search box filters by subscriber name or email.
- **Filter by status** — the dropdown filters to All / Active / Paused / Unsubscribed / Bounced.
- **Add a subscriber** — click **Add Subscriber** and fill in Email (required), Full Name, Status, Source, Department, Role Title, and Internal Notes.
- **Edit a subscriber** — click the pencil icon on their row; the same fields open pre-filled.
- **Remove a subscriber** — click the trash icon on their row and confirm. This removes them from *this list only*, not the whole system.
- **Copy their personal links** — click the clipboard icon on a row to copy that subscriber's personal Unsubscribe and Manage Preferences links (useful if you need to send someone their link directly).
- **Export the roster** — click **Export CSV** to download the current list (name, email, status, source, dates, notes, department, role title, and each subscriber's personal footer links) as a spreadsheet.

## Master Subscribers directory

Go to **Master Subscribers** to see every unique subscriber across all lists in one table, with a chip per list they belong to (color-coded by status: green = Active, yellow = Paused, red = Bounced, gray = Unsubscribed). Use the search box to find someone by name, email, department, or role — this is read-only; edit their subscriptions from inside the relevant list instead.

## Importing subscribers from a CSV

Go to **Import CSV**:

1. **Pick the target list** from the dropdown.
2. **Upload your file** — drag-and-drop or click to browse. Supported formats:
   - Combined: `John Doe <john@company.com>`
   - Separate columns with `name` and `email` headers
   - Email-only, one address per line
3. Click **Parse & Preview CSV**. You'll see summary tiles (Total Rows, Valid & Ready, Duplicates, Invalid) and a row-by-row table marking each row **Ready**, **File Duplicate**, **List Duplicate**, or **Invalid**.
4. Review the table, then click **Commit Import**. Only rows marked **Ready** are inserted — duplicates and invalid rows are skipped automatically, no need to remove them yourself.

## Audit Logs

Go to **Audit Logs** (or **View Full Audit Trail** from the dashboard) to see every change ever made: timestamp, action, target subscriber, list, operator (or "System"), and details. Use the search box to filter across all of those fields — there's no date-range picker, so search by email, list name, or action text to narrow things down.

## Settings

- Shows the two roles (Curator / Admin) and what each can do.
- **Sign out** — ends your session in the portal and your underlying Microsoft session.

## Managing your own newsletter subscriptions (no account needed)

Every newsletter sent by BioCryst includes footer links (see [`email-footer.html`](../email-footer.html)) to two public pages — no sign-in required:

- **Manage Preferences** — enter your email to look yourself up (or arrive via a personal link with your details pre-filled), then toggle individual newsletters on/off and click **Save Preferences**.
- **Unsubscribe** — the same lookup, with a single **Unsubscribe from all** button. If you change your mind, there's a link back to Manage Preferences to resubscribe to specific lists.
