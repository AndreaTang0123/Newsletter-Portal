from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/newsletters", tags=["Newsletters"])

@router.get("/", response_model=List[schemas.Newsletter])
def read_newsletters(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_newsletters(db)

@router.post("/", response_model=schemas.Newsletter)
def create_newsletter(
    newsletter: schemas.NewsletterCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.create_newsletter(db=db, newsletter=newsletter, curator_id=current_user.id)

@router.get("/{id}", response_model=schemas.Newsletter)
def read_newsletter(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_newsletter = crud.get_newsletter(db, newsletter_id=id)
    if not db_newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    return db_newsletter

@router.put("/{id}", response_model=schemas.Newsletter)
def update_newsletter(
    id: int,
    updates: schemas.NewsletterUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_newsletter = crud.get_newsletter(db, newsletter_id=id)
    if not db_newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    return crud.update_newsletter(db=db, db_newsletter=db_newsletter, updates=updates)

@router.post("/{id}/send", response_model=schemas.Newsletter)
def send_newsletter(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_newsletter = crud.get_newsletter(db, newsletter_id=id)
    if not db_newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
        
    # Trigger send logic (Mocked background task or email dispatch service)
    db_newsletter.status = "sent"
    import datetime
    db_newsletter.sent_at = datetime.datetime.utcnow()
    db.commit()
    
    return db_newsletter
