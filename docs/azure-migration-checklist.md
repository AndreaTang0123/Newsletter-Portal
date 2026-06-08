# Azure Migration Checklist

## Preparation
- [ ] Review current backend dependencies and ensure compatibility with Python 3.11 or higher
- [ ] Confirm frontend build runs successfully with `npm run build`
- [ ] Ensure all sensitive configuration is moved to environment variables
- [ ] Remove any hard-coded local paths or console-only dev settings

## Infrastructure
- [ ] Provision Azure App Service or Azure Container Apps for frontend and backend
- [ ] Use **Azure SQL** or **PostgreSQL** for production database instead of SQLite
- [ ] Configure **Azure Key Vault** for secrets such as JWT secret, SMTP credentials, and database URL
- [ ] Enable **Application Insights** for backend monitoring and diagnostics
- [ ] Set up **Azure Storage** / CDN for any static assets or file uploads if needed

## Authentication & Identity
- [ ] Plan Microsoft Entra ID / Azure AD integration for frontend login
- [ ] Register the application in Entra ID and configure redirect URIs
- [ ] Implement OIDC login in the frontend and backend once permissions are available
- [ ] Replace mock login route with real Entra token validation logic
- [ ] Configure managed identity or service principal for backend resource access if required

## Containerization
- [ ] Create production Dockerfiles for frontend and backend
- [ ] Verify backend command: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Verify frontend build and static serving pipeline
- [ ] Store Docker images in Azure Container Registry if using container deployment

## Deployment
- [ ] Deploy backend first and validate API availability
- [ ] Deploy frontend and ensure API URL configuration points to backend service
- [ ] Configure CORS for production origins only
- [ ] Add health probes and readiness checks for both services

## Post-Deployment
- [ ] Validate login flow and token handling
- [ ] Verify subscriber list, newsletter create, and send history pages
- [ ] Confirm logout works and clears auth state
- [ ] Enable alerting on error rates and failed HTTP requests
