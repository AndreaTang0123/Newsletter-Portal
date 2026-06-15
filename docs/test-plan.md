# Test Plan

## Objectives

- Verify authentication flow (login, JWT handling, sign-out)
- Confirm all subscriber management CRUD operations work end-to-end
- Validate the CSV import workflow (upload → preview → commit)
- Ensure the audit trail captures all modifications accurately
- Confirm frontend UI renders correctly and responds to user interactions
- Validate the public unsubscribe page works without authentication

## Test Scenarios

### Authentication

- [ ] `POST /api/v1/auth/login` with `curator@company.com` / `securepassword123` returns a valid JWT
- [ ] `POST /api/v1/auth/login` with invalid credentials returns `401 Unauthorized`
- [ ] Frontend stores JWT in `localStorage` under key `token` on successful login
- [ ] All API calls after login include `Authorization: Bearer <token>` header
- [ ] Protected endpoints reject requests without a valid token (return `401`)
- [ ] Admin-only endpoints (e.g., `POST /api/v1/lists/`) reject non-admin users (return `403`)
- [ ] Sign-out clears `localStorage` token and redirects to the login screen

### Dashboard

- [ ] Dashboard loads after login and displays four metric cards: Total Lists, Total Subscribers, Active Subscribers, Bounced/Unsub
- [ ] Metrics match the actual database state (cross-verify with direct DB query)
- [ ] "Database Last Updated" timestamp displays correctly
- [ ] Refresh button reloads metrics from `GET /api/v1/dashboard/stats`
- [ ] Recent Subscriber Changes table shows the latest audit log entries
- [ ] "View Full Audit Trail" button navigates to the Audit Logs page

### Distribution Lists

- [ ] Distribution Lists page loads and displays all 4 seeded lists as cards
- [ ] Each card shows correct subscriber count, active/unsubscribed/bounced breakdown
- [ ] "Manage List" button navigates to the list detail view
- [ ] Refresh button reloads list data

### List Detail View (Subscriber Management)

- [ ] Subscriber table loads with all subscribers for the selected list
- [ ] Search bar filters subscribers by name and email in real-time
- [ ] Status dropdown filters subscribers by Active, Paused, Unsubscribed, Bounced
- [ ] **Add Subscriber:**
  - [ ] Modal opens with email (required), name, status, source, department, role title, notes fields
  - [ ] Submitting creates a new subscriber and subscription
  - [ ] Duplicate email on same list shows an error
  - [ ] Table refreshes after successful add
- [ ] **Edit Subscriber:**
  - [ ] Modal opens pre-populated with existing subscriber data
  - [ ] Changes to status, name, email, department, role title, and notes save correctly
  - [ ] Table refreshes after successful edit
- [ ] **Remove Subscriber:**
  - [ ] Confirmation dialog appears before deletion
  - [ ] Subscription is removed from the list
  - [ ] Table refreshes after successful removal
- [ ] **Export CSV:**
  - [ ] Clicking Export CSV triggers a browser download
  - [ ] Downloaded CSV contains correct headers: Name, Email, Status, Source, Date Added, Last Updated, Notes, Department, Role Title
  - [ ] CSV data matches the current table state
- [ ] Back arrow returns to the Distribution Lists overview

### Master Subscriber Directory

- [ ] Page loads all unique subscribers across all lists
- [ ] Each row shows name, email, department, role, subscription chips, and last modified date
- [ ] Subscription chips display correct list names with color-coded status indicators
- [ ] Search bar filters by name, email, department, and role title

### CSV Bulk Import

- [ ] Target list dropdown populates with all available lists
- [ ] File picker accepts `.csv` files
- [ ] **Preview step:**
  - [ ] Upload parses the CSV and displays a validation table
  - [ ] Summary metrics show Total Rows, Valid & Ready, Duplicates Detected, Invalid Rows
  - [ ] Valid rows show "Ready" status in green
  - [ ] Duplicate emails within the file show "File Duplicate" in yellow
  - [ ] Emails already in the target list show "List Duplicate" in yellow
  - [ ] Malformed emails show "Invalid" in red
- [ ] **Commit step:**
  - [ ] Clicking "Commit Import" inserts only valid rows
  - [ ] Success message shows the count of imported subscribers
  - [ ] Duplicates and invalid rows are skipped silently
  - [ ] Audit log records a "List imported" entry with the count
- [ ] **CSV formats tested:**
  - [ ] Single column: `email@domain.com`
  - [ ] Unified column: `John Doe <email@domain.com>`
  - [ ] Multi-column with headers: `email`, `name`
  - [ ] Files with BOM encoding (UTF-8-SIG)

### Audit Log Trail

- [ ] Page loads all audit log entries in reverse chronological order
- [ ] Table columns: Timestamp, Action, Target Subscriber, List Name, Operator, Details
- [ ] Actions are color-coded: green for "Subscriber added", red for "Subscriber removed", teal for "List imported"
- [ ] Search bar filters by action, email, list name, operator, or details text
- [ ] Refresh button reloads log data
- [ ] Entries reference correct list names and subscriber emails (even if subscriber is later deleted, via SET NULL)

### Settings Page

- [ ] Displays Administrator Access Control section with Admin and Curator role descriptions
- [ ] Displays Centralized Database Configurations section with engine info
- [ ] Sign Out button clears session and returns to login

### Self-Service Unsubscribe Page

- [ ] Page loads at `/unsubscribe` without requiring authentication
- [ ] Email field auto-populates from `?email=` query parameter
- [ ] Category checkboxes are togglable
- [ ] "Save Preferences" submits the form
- [ ] Success confirmation screen displays after saving
- [ ] Page works independently of the admin dashboard

## Testing Approach

### Manual Testing

1. Start backend: `cd backend && python -m uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:3000` and sign in with `curator@company.com` / `securepassword123`
4. Navigate through each sidebar tab and execute the test scenarios above
5. Use browser DevTools Network tab to verify API calls, request headers, and response payloads
6. Open `http://localhost:3000/unsubscribe?email=test@company.com` to test the public page

### Automated Testing Recommendations

| Layer | Framework | Focus Areas |
|-------|-----------|-------------|
| Backend unit tests | **pytest** | Auth token creation/validation, CRUD operations, CSV parsing logic, audit log creation |
| Backend integration tests | **httpx** + pytest | End-to-end API route testing with test database |
| Frontend unit tests | **Jest** + **React Testing Library** | Component rendering, form submissions, state management |
| End-to-end tests | **Playwright** or **Cypress** | Login flow, list management, CSV import, sign-out |

### Recommended pytest Fixtures

```python
# conftest.py
@pytest.fixture
def test_db():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture
def auth_token(test_db):
    """Create a seeded admin user and return a valid JWT."""
    seed_default_admin_user(test_db)
    return create_access_token({"sub": "curator@company.com"})
```

## Test Data

- **Default admin:** `curator@company.com` / `securepassword123`
- **Seeded lists:** Weekly Newsletter, HAE, CMD, NS
- **Sample CSV for import testing:**
  ```csv
  name,email
  John Doe,john@company.com
  Jane Smith,jane@company.com
  Invalid Row,not-an-email
  John Doe,john@company.com
  ```

## Pass Criteria

- All authentication flows work without JavaScript errors
- Dashboard metrics are accurate and refresh correctly
- All subscriber CRUD operations succeed and trigger audit log entries
- CSV import correctly validates, previews, and commits data
- Audit log captures every modification with correct timestamps and actor attribution
- UI navigation between all tabs works without errors
- Public unsubscribe page works independently
- Protected endpoints reject unauthorized requests
- Sign-out clears auth state and prevents access to protected content
