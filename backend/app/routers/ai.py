from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, auth, models
from ..services.ai_service import generate_newsletter_draft

router = APIRouter(prefix="/ai", tags=["AI Integration"])

@router.post("/generate-draft", response_model=schemas.AIDraftResponse)
async def generate_draft(
    request: schemas.AIDraftRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        title, html_content = await generate_newsletter_draft(
            prompt=request.prompt,
            tone=request.tone
        )
        return schemas.AIDraftResponse(title=title, content_html=html_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")
