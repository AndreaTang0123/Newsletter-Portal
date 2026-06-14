from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/subscribers", tags=["Subscribers"])

@router.get("/", response_model=List[schemas.SubscriberMaster])
def read_subscribers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.get_subscribers_master(db)
