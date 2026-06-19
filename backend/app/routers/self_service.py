from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/self-service", tags=["Self-Service"])


def _get_subscriber_or_404(token: str, db: Session):
    subscriber = crud.get_subscriber_by_token(db, token)
    if not subscriber:
        raise HTTPException(status_code=404, detail="Invalid or expired subscription token.")
    return subscriber


@router.get("/subscriber", response_model=schemas.SelfServiceSubscriberResponse)
def get_subscriber_by_token(token: str, db: Session = Depends(get_db)):
    subscriber = _get_subscriber_or_404(token, db)
    return crud.get_subscriber_preferences(db, subscriber)


@router.post("/unsubscribe")
def unsubscribe_all(token: str, db: Session = Depends(get_db)):
    subscriber = _get_subscriber_or_404(token, db)
    crud.unsubscribe_all(db, subscriber)
    return {"message": "Successfully unsubscribed from all lists."}


@router.put("/preferences")
def update_preferences(
    token: str,
    updates: schemas.PreferencesUpdateRequest,
    db: Session = Depends(get_db)
):
    subscriber = _get_subscriber_or_404(token, db)
    crud.update_subscriber_preferences(db, subscriber, updates)
    return {"message": "Preferences updated successfully."}
