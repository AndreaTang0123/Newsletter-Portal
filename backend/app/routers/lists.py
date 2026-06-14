from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/lists", tags=["Lists"])

@router.get("/", response_model=List[schemas.ListWithStats])
def read_lists(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_lists_with_stats(db)

@router.post("/", response_model=schemas.List, status_code=status.HTTP_201_CREATED)
def create_list(list_in: schemas.ListCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    existing = crud.get_list_by_name(db, name=list_in.name)
    if existing:
        raise HTTPException(status_code=400, detail="List with this name already exists")
    return crud.create_list(db, list_in)

@router.get("/{list_id}", response_model=schemas.ListWithStats)
def read_list(list_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    lst = crud.get_list_by_id(db, list_id)
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    stats = crud.get_list_stats(db, list_id)
    return {
        "id": lst.id,
        "name": lst.name,
        "description": lst.description,
        "owner": lst.owner,
        "category": lst.category,
        "created_at": lst.created_at,
        "updated_at": lst.updated_at,
        "subscriber_count": stats["Total"],
        "active_count": stats["Active"],
        "unsubscribed_count": stats["Unsubscribed"],
        "bounced_count": stats["Bounced"]
    }

@router.get("/{list_id}/subscribers", response_model=List[schemas.SubscriberWithSubscription])
def read_list_subscribers(
    list_id: int, 
    search: Optional[str] = None, 
    status: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    lst = crud.get_list_by_id(db, list_id)
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    return crud.get_subscribers_by_list(db, list_id, search=search, status=status)

@router.post("/{list_id}/subscribers", response_model=schemas.Subscription, status_code=status.HTTP_201_CREATED)
def add_subscriber_to_list(
    list_id: int, 
    subscriber: schemas.SubscriptionCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    lst = crud.get_list_by_id(db, list_id)
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    try:
        return crud.add_subscriber_to_list(db, list_id, subscriber, actor=current_user.email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
