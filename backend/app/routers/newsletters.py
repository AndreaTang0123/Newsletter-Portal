from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud, auth, models
from ..services.email_service import send_email, inject_tracking_pixel
import datetime

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
    
    # Get all subscribers
    subscribers = crud.get_subscribers(db)
    
    # Get categories for the newsletter
    category_names = [cat.name for cat in db_newsletter.categories]
    category_str = ", ".join(category_names) if category_names else "General"
    
    # Send email to each subscriber and create send history records
    for subscriber in subscribers:
        if not subscriber.is_subscribed:
            continue
            
        # Create send history record first (need ID for tracking pixel)
        send_history = crud.create_send_history(
            db,
            newsletter_id=db_newsletter.id,
            recipient_email=subscriber.email,
            category=category_str,
            status="pending"
        )
        
        # Inject tracking pixel into content
        html_with_tracking = inject_tracking_pixel(db_newsletter.content_html, send_history.id)
        
        # Send email
        try:
            success = send_email(
                to_email=subscriber.email,
                subject=db_newsletter.title,
                html_content=html_with_tracking
            )
            
            # Update send history status
            send_history.status = "success" if success else "failed"
            if not success:
                send_history.error_message = "Email service returned false"
        except Exception as e:
            send_history.status = "failed"
            send_history.error_message = str(e)
        
        db.commit()
    
    # Update newsletter status
    db_newsletter.status = "sent"
    db_newsletter.sent_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(db_newsletter)
    
    return db_newsletter
