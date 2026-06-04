# Newsletter Portal

An AI-powered email newsletter administration system that lets content curators write, format, edit, schedule, and send newsletters. It provides analytics, subscriber segmentation, and recipient unsubscribe workflows.

## Directory Structure

- **`frontend/`**: Next.js (React) administration interface and public subscriber pages.
- **`backend/`**: FastAPI (Python) web server containing business logic, database migrations, email dispatch, and LLM integrations.
- **`docs/`**: Detailed project design specs, including schema diagrams, deployment, and API contracts.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- SQLite or PostgreSQL

### Frontend Setup
1. Change directory to frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment:
   ```bash
   cp .env.local.example .env.local
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Change directory to backend:
   ```bash
   cd backend
   ```
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment:
   ```bash
   cp .env.example .env
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Detailed Documentation
Refer to files in the `docs/` directory:
- [Project Overview](file:///Users/andreatang/Desktop/Newsletter-Portal/docs/project-overview.md)
- [API Documentation](file:///Users/andreatang/Desktop/Newsletter-Portal/docs/api-documentation.md)
- [Database Schema](file:///Users/andreatang/Desktop/Newsletter-Portal/docs/database-schema.md)
- [Deployment Plan](file:///Users/andreatang/Desktop/Newsletter-Portal/docs/deployment-plan.md)