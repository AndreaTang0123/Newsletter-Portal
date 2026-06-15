# Project Overview: Newsletter Subscriber Portal

## Introduction

The Newsletter Subscriber Portal is a centralized administration platform for managing internal email distribution lists. It enables curators and administrators to maintain subscriber audiences across multiple newsletter channels, bulk-import contacts from CSV files, edit individual subscriptions, and track all changes through a tamper-evident audit trail — all from a modern web dashboard.

The system is built as a decoupled frontend/backend application: a **Next.js** (React) frontend communicates with a **FastAPI** (Python) REST backend over HTTP, authenticated via JWT tokens. Data is persisted in SQLite locally, with a documented migration path to Azure SQL Database for production deployment.

## Target Audience

1. **Administrators:** Users with full system access including list creation, subscriber write privileges, manual overrides, and global configuration management. Default role for the seeded admin account.
2. **Curators:** Content managers who can view metadata, manage list memberships, execute CSV imports, and download subscriber reports.
3. **Subscribers (Employees):** Email recipients who can manage their subscription preferences (subscribe/unsubscribe to newsletter categories) through a public-facing self-service page — no admin login required.

## Core Features

- **Secure Authentication:** JWT-based login with role-based access control (Admin / Curator). Microsoft Entra ID (Azure AD) SSO is planned for a future release.
- **Dashboard with Live Metrics:** At-a-glance summary cards showing total lists, total subscribers, active subscribers, bounced/unsubscribed counts, and a recent subscriber changes timeline.
- **Distribution List Management:** Card-based overview of all lists (Weekly Newsletter, HAE, CMD, NS) with per-list subscriber counts, status breakdowns, and drill-in detail views.
- **Full Subscriber CRUD:** Add, edit, search, filter, and remove subscribers within any distribution list. Fields include email, name, status, source, department, role title, and internal notes.
- **Master Subscriber Directory:** Cross-list view showing every unique subscriber and their subscription statuses across all distribution lists.
- **CSV Bulk Import:** Two-step preview-then-commit workflow with row-level validation (duplicate detection in file and database, email format validation).
- **CSV Export:** Download any list's subscriber roster as a CSV file.
- **Audit Log Trail:** Searchable, chronological log of all subscriber modifications, imports, and removals with operator attribution.
- **Self-Service Unsubscribe Page:** Public-facing page for email recipients to manage their category preferences via a direct link.
- **AI Draft Generation (Scaffolded):** Integration with Google Gemini LLM for newsletter content generation — endpoint exists but is not yet mounted in production.
- **Email Dispatch (Scaffolded):** SMTP email sending service — endpoint exists but requires production SMTP configuration.

## Seeded Data

On first startup, the backend automatically seeds:

- **Default admin user:** `curator@company.com` / `securepassword123` (role: `admin`)
- **Four distribution lists:** Weekly Newsletter, HAE, CMD, NS — each with an assigned owner and category
