from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, auth, models

router = APIRouter(prefix="/email", tags=["Email Metrics"])

@router.get("/history", response_model=List[schemas.CampaignHistory])
def read_sending_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return db.query(models.CampaignHistory).all()
