from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/dashboard", tags=["Dashboard Statistics"])

@router.get("/stats", response_model=schemas.DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    stats = crud.get_dashboard_stats(db)
    
    # Map the recent audit logs to the schemas.AuditLogResponse
    recent_changes_mapped = []
    for log in stats["recent_changes"]:
        recent_changes_mapped.append({
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
        
    return {
        "total_lists": stats["total_lists"],
        "total_subscribers": stats["total_subscribers"],
        "active_subscribers": stats["active_subscribers"],
        "unsubscribed_subscribers": stats["unsubscribed_subscribers"],
        "bounced_subscribers": stats["bounced_subscribers"],
        "last_updated": stats["last_updated"],
        "recent_changes": recent_changes_mapped
    }
