# FastAPI Backend Service

This is the Python web backend for the Newsletter Portal. It handles JWT authentication, database interactions, Gemini AI prompt completions, and asynchronous email dispatches.

## Initial Setup

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
4. **Launch Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

The API docs will be available at `http://localhost:8000/docs` (Swagger UI).
