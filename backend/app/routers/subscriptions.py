from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.put("/{subscription_id}", response_model=schemas.Subscription)
def update_subscription(
    subscription_id: int,
    updates: schemas.SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        sub = crud.update_subscription(db, subscription_id, updates, actor=current_user.email)
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return sub
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{subscription_id}", status_code=status.HTTP_200_OK)
def delete_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    success = crud.delete_subscription(db, subscription_id, actor=current_user.email)
    if not success:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"detail": "Subscriber removed from list successfully"}
