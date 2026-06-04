from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/subscribers", tags=["Subscribers"])

@router.get("/", response_model=List[schemas.Subscriber])
def read_subscribers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return crud.get_subscribers(db)

@router.post("/", response_model=schemas.Subscriber)
def create_subscriber(
    subscriber: schemas.SubscriberCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_sub = crud.get_subscriber_by_email(db, email=subscriber.email)
    if db_sub:
        raise HTTPException(status_code=400, detail="Subscriber already exists")
    return crud.create_subscriber(db=db, subscriber=subscriber)

@router.post("/import", status_code=201)
def import_subscribers_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    try:
        content = file.file.read().decode("utf-8")
        csv_reader = csv.reader(io.StringIO(content))
        header = next(csv_reader) # Skip header row
        
        imported_count = 0
        for row in csv_reader:
            if not row or len(row) < 2:
                continue
            email, name = row[0].strip(), row[1].strip()
            db_sub = crud.get_subscriber_by_email(db, email=email)
            if not db_sub:
                crud.create_subscriber(db, schemas.SubscriberCreate(email=email, full_name=name, category_ids=[]))
                imported_count += 1
        return {"detail": f"Successfully imported {imported_count} subscribers."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {str(e)}")

@router.post("/unsubscribe", response_model=schemas.Subscriber)
def unsubscribe_public_route(
    data: schemas.SubscriberUnsubscribePublic,
    db: Session = Depends(get_db)
):
    # Public endpoint allowing user to opt out of categories
    return crud.unsubscribe_public(db, unsub_data=data)
