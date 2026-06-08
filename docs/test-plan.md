# Test Plan

## Objectives
- Verify authentication flow and JWT handling
- Confirm newsletter and subscriber CRUD flows work end-to-end
- Ensure frontend UI pages render correctly and update state
- Validate logout behavior

## Test Scenarios

### Authentication
- [ ] Submit `POST /api/v1/auth/login` with default credentials and receive JWT
- [ ] Submit invalid credentials and receive `401 Unauthorized`
- [ ] Confirm frontend stores token in `localStorage`
- [ ] Confirm logout clears token and returns user to login screen

### Newsletters
- [ ] Create a newsletter draft via frontend UI
- [ ] Edit and save newsletter draft
- [ ] Verify newsletter list/preview updates
- [ ] Confirm sent history page displays expected items from mock data

### Subscribers
- [ ] Load subscriber list successfully as authenticated user
- [ ] Search and filter subscribers on the frontend
- [ ] Import subscribers from CSV should hit the upload endpoint
- [ ] Confirm public unsubscribe endpoint works without auth

### UI / UX
- [ ] Login page renders with product introduction and login card
- [ ] Sidebar navigation switches between dashboard, newsletters, subscribers, send history, and settings
- [ ] Settings page displays logout button
- [ ] Send history search/filter/sort functions work correctly

## Testing Approach

### Manual Testing
1. Start backend and frontend locally
2. Use default login credentials to sign in
3. Navigate through each page and confirm the expected UI state
4. Inspect browser DevTools network traffic for correct API calls and headers

### Automated Testing Recommendations
- Add frontend tests with **Jest** / **React Testing Library** for login, sidebar navigation, and page rendering
- Add backend unit tests with **pytest** for auth, CRUD operations, and route guards
- Add integration tests for key API routes using **requests** or **httpx**
- Consider E2E tests with **Playwright** or **Cypress** for login-to-dashboard flows

## Test Data
- Default admin user: `curator@company.com` / `securepassword123`
- Sample newsletter titles and audiences should be seeded or mocked in frontend history views

## Pass Criteria
- All critical auth and dashboard flows function without JavaScript errors
- UI navigation and filtering behave as expected
- Logout returns user to login screen and removes stored token
- Protected API endpoints reject unauthorized access
