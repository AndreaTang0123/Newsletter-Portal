from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("/", response_model=List[schemas.AuditLogResponse])
def read_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    logs = crud.get_audit_logs(db)
    
    out = []
    for log in logs:
        out.append({
            "id": log.id,
            "actor": log.actor,
            "action": log.action,
            "list_id": log.list_id,
            "list_name": log.list.name if log.list else None,
            "subscriber_id": log.subscriber_id,
            "subscriber_email": log.subscriber.email if log.subscriber else None,
            "timestamp": log.timestamp,
            "details": log.details
        })
    return out
