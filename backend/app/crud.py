from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from . import models, schemas, auth

# User CRUD (Kept for Authentication)
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pwd = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# List CRUD
def get_lists(db: Session) -> List[models.List]:
    return db.query(models.List).all()

def get_list_by_id(db: Session, list_id: int) -> Optional[models.List]:
    return db.query(models.List).filter(models.List.id == list_id).first()

def get_list_by_name(db: Session, name: str) -> Optional[models.List]:
    return db.query(models.List).filter(models.List.name == name).first()

def create_list(db: Session, list_in: schemas.ListCreate) -> models.List:
    db_list = models.List(
        name=list_in.name,
        description=list_in.description,
        owner=list_in.owner,
        category=list_in.category
    )
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list

def get_list_stats(db: Session, list_id: int) -> dict:
    results = db.query(
        models.Subscription.status,
        func.count(models.Subscription.id)
    ).filter(models.Subscription.list_id == list_id).group_by(models.Subscription.status).all()

    stats = {"Total": 0, "Active": 0, "Paused": 0, "Unsubscribed": 0, "Bounced": 0}
    for status, count in results:
        stats["Total"] += count
        if status in stats:
            stats[status] = count
    return stats

def get_lists_with_stats(db: Session) -> List[dict]:
    lists = db.query(models.List).all()
    out = []
    for lst in lists:
        stats = get_list_stats(db, lst.id)
        out.append({
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
        })
    return out


# Subscriber CRUD
def get_subscribers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Subscriber]:
    return db.query(models.Subscriber).offset(skip).limit(limit).all()

def get_subscriber_by_id(db: Session, subscriber_id: int) -> Optional[models.Subscriber]:
    return db.query(models.Subscriber).filter(models.Subscriber.id == subscriber_id).first()

def get_subscriber_by_email(db: Session, email: str) -> Optional[models.Subscriber]:
    return db.query(models.Subscriber).filter(models.Subscriber.email == email).first()

def create_subscriber(db: Session, sub_in: schemas.SubscriberCreate) -> models.Subscriber:
    db_sub = models.Subscriber(
        email=sub_in.email,
        name=sub_in.name,
        department=sub_in.department,
        role_title=sub_in.role_title
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

def get_subscribers_master(db: Session) -> List[dict]:
    subscribers = db.query(models.Subscriber).all()
    out = []
    for sub in subscribers:
        # Get all subscriptions for this subscriber
        subs = db.query(models.Subscription).filter(models.Subscription.subscriber_id == sub.id).all()
        sub_list = []
        for s in subs:
            sub_list.append({
                "list_id": s.list_id,
                "list_name": s.list.name if s.list else "Unknown List",
                "status": s.status
            })
        
        # Determine last updated
        last_updated = sub.updated_at
        for s in subs:
            if s.updated_at > last_updated:
                last_updated = s.updated_at
                
        out.append({
            "id": sub.id,
            "name": sub.name,
            "email": sub.email,
            "department": sub.department,
            "role_title": sub.role_title,
            "updated_at": last_updated,
            "subscriptions": sub_list
        })
    # Sort by updated_at descending
    out.sort(key=lambda x: x["updated_at"], reverse=True)
    return out


# Subscription CRUD
def get_subscription_by_id(db: Session, subscription_id: int) -> Optional[models.Subscription]:
    return db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()

def get_subscribers_by_list(db: Session, list_id: int, search: Optional[str] = None, status: Optional[str] = None) -> List[dict]:
    query = db.query(models.Subscription).filter(models.Subscription.list_id == list_id)
    
    if status:
        query = query.filter(models.Subscription.status == status)
        
    subscriptions = query.all()
    
    out = []
    for s in subscriptions:
        sub = s.subscriber
        if not sub:
            continue
        
        # Search filter
        if search:
            search_lower = search.lower()
            name_match = sub.name and search_lower in sub.name.lower()
            email_match = search_lower in sub.email.lower()
            if not (name_match or email_match):
                continue
                
        out.append({
            "id": sub.id,
            "subscription_id": s.id,
            "name": sub.name,
            "email": sub.email,
            "department": sub.department,
            "role_title": sub.role_title,
            "status": s.status,
            "source": s.source,
            "opt_in_date": s.opt_in_date,
            "unsubscribed_at": s.unsubscribed_at,
            "notes": s.notes,
            "created_at": s.created_at,
            "updated_at": s.updated_at
        })
    # Sort by subscription updated_at descending
    out.sort(key=lambda x: x["updated_at"], reverse=True)
    return out

def add_subscriber_to_list(db: Session, list_id: int, sub_data: schemas.SubscriptionCreate, actor: Optional[str] = None) -> models.Subscription:
    # Find or create Subscriber
    subscriber = db.query(models.Subscriber).filter(models.Subscriber.email == sub_data.email).first()
    if not subscriber:
        subscriber = models.Subscriber(
            email=sub_data.email,
            name=sub_data.name,
            department=sub_data.department,
            role_title=sub_data.role_title
        )
        db.add(subscriber)
        db.flush()
    else:
        # Update details if provided and non-empty
        if sub_data.name is not None:
            subscriber.name = sub_data.name
        if sub_data.department is not None:
            subscriber.department = sub_data.department
        if sub_data.role_title is not None:
            subscriber.role_title = sub_data.role_title
        db.flush()

    # Find or create Subscription
    subscription = db.query(models.Subscription).filter(
        models.Subscription.list_id == list_id,
        models.Subscription.subscriber_id == subscriber.id
    ).first()
    
    action_type = "Subscriber added"
    details = f"Added subscriber {subscriber.email} to list."
    
    if not subscription:
        subscription = models.Subscription(
            list_id=list_id,
            subscriber_id=subscriber.id,
            status=sub_data.status,
            source=sub_data.source,
            notes=sub_data.notes
        )
        db.add(subscription)
    else:
        # Update status & details
        action_type = "Subscriber status changed"
        details = f"Subscription updated. Status changed from {subscription.status} to {sub_data.status}."
        subscription.status = sub_data.status
        if sub_data.source:
            subscription.source = sub_data.source
        if sub_data.notes is not None:
            subscription.notes = sub_data.notes
        if sub_data.status == "Active":
            subscription.unsubscribed_at = None
        elif sub_data.status == "Unsubscribed":
            subscription.unsubscribed_at = func.now()

    db.commit()
    db.refresh(subscription)
    db.refresh(subscriber)

    # Log action
    create_audit_log(
        db,
        actor=actor,
        action=action_type,
        list_id=list_id,
        subscriber_id=subscriber.id,
        details=details
    )
    
    return subscription

def update_subscription(db: Session, subscription_id: int, updates: schemas.SubscriptionUpdate, actor: Optional[str] = None) -> Optional[models.Subscription]:
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not subscription:
        return None
    
    details_parts = []
    
    # Update subscriber metadata
    subscriber = subscription.subscriber
    if subscriber:
        if updates.name is not None and updates.name != subscriber.name:
            details_parts.append(f"Name: '{subscriber.name}' -> '{updates.name}'")
            subscriber.name = updates.name
        if updates.email is not None and updates.email != subscriber.email:
            # Check uniqueness
            existing_sub = db.query(models.Subscriber).filter(models.Subscriber.email == updates.email).first()
            if existing_sub and existing_sub.id != subscriber.id:
                raise ValueError("Email already in use by another subscriber.")
            details_parts.append(f"Email: '{subscriber.email}' -> '{updates.email}'")
            subscriber.email = updates.email
        if updates.department is not None and updates.department != subscriber.department:
            details_parts.append(f"Department: '{subscriber.department}' -> '{updates.department}'")
            subscriber.department = updates.department
        if updates.role_title is not None and updates.role_title != subscriber.role_title:
            details_parts.append(f"Role title: '{subscriber.role_title}' -> '{updates.role_title}'")
            subscriber.role_title = updates.role_title
        db.flush()
    
    # Update subscription properties
    if updates.status is not None and updates.status != subscription.status:
        details_parts.append(f"Status: '{subscription.status}' -> '{updates.status}'")
        subscription.status = updates.status
        if updates.status == "Unsubscribed":
            subscription.unsubscribed_at = func.now()
        elif updates.status == "Active":
            subscription.unsubscribed_at = None
            
    if updates.source is not None and updates.source != subscription.source:
        details_parts.append(f"Source: '{subscription.source}' -> '{updates.source}'")
        subscription.source = updates.source
        
    if updates.notes is not None and updates.notes != subscription.notes:
        details_parts.append("Notes updated")
        subscription.notes = updates.notes

    if updates.opt_in_date is not None:
        subscription.opt_in_date = updates.opt_in_date
        
    if updates.unsubscribed_at is not None:
        subscription.unsubscribed_at = updates.unsubscribed_at

    db.commit()
    db.refresh(subscription)
    
    if details_parts:
        action_name = "Subscriber edited"
        if len(details_parts) == 1 and "Status:" in details_parts[0]:
            action_name = "Subscriber status changed"
            
        create_audit_log(
            db,
            actor=actor,
            action=action_name,
            list_id=subscription.list_id,
            subscriber_id=subscription.subscriber_id,
            details=f"Updated properties: {'; '.join(details_parts)}"
        )
        
    return subscription

def delete_subscription(db: Session, subscription_id: int, actor: Optional[str] = None) -> bool:
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not subscription:
        return False
    
    list_id = subscription.list_id
    subscriber_id = subscription.subscriber_id
    email = subscription.subscriber.email if subscription.subscriber else "Unknown"
    
    db.delete(subscription)
    db.commit()
    
    create_audit_log(
        db,
        actor=actor,
        action="Subscriber removed",
        list_id=list_id,
        subscriber_id=subscriber_id,
        details=f"Removed subscriber {email} from list."
    )
    return True


# AuditLog CRUD
def create_audit_log(db: Session, actor: Optional[str], action: str, list_id: Optional[int] = None, subscriber_id: Optional[int] = None, details: Optional[str] = None) -> models.AuditLog:
    log = models.AuditLog(
        actor=actor,
        action=action,
        list_id=list_id,
        subscriber_id=subscriber_id,
        details=details
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_audit_logs(db: Session, limit: int = 100) -> List[models.AuditLog]:
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(limit).all()


# Dashboard Statistics CRUD
def get_dashboard_stats(db: Session) -> dict:
    # Total unique lists
    total_lists = db.query(func.count(models.List.id)).scalar() or 0
    
    # Total unique subscribers in db
    total_subscribers = db.query(func.count(models.Subscriber.id)).scalar() or 0
    
    # Unique subscribers with at least one Active subscription
    active_subscribers = db.query(func.count(func.distinct(models.Subscription.subscriber_id))).filter(
        models.Subscription.status == "Active"
    ).scalar() or 0
    
    # Unique subscribers with at least one Unsubscribed subscription
    unsubscribed_subscribers = db.query(func.count(func.distinct(models.Subscription.subscriber_id))).filter(
        models.Subscription.status == "Unsubscribed"
    ).scalar() or 0
    
    # Unique subscribers with at least one Bounced subscription
    bounced_subscribers = db.query(func.count(func.distinct(models.Subscription.subscriber_id))).filter(
        models.Subscription.status == "Bounced"
    ).scalar() or 0
    
    # Last updated subscription/subscriber timestamp
    last_updated_sub = db.query(func.max(models.Subscription.updated_at)).scalar()
    last_updated_list = db.query(func.max(models.List.updated_at)).scalar()
    
    last_updated = last_updated_sub
    if last_updated_list and (not last_updated or last_updated_list > last_updated):
        last_updated = last_updated_list
        
    # Recent changes (5 audit logs)
    recent_logs = get_audit_logs(db, limit=5)
    
    return {
        "total_lists": total_lists,
        "total_subscribers": total_subscribers,
        "active_subscribers": active_subscribers,
        "unsubscribed_subscribers": unsubscribed_subscribers,
        "bounced_subscribers": bounced_subscribers,
        "last_updated": last_updated,
        "recent_changes": recent_logs
    }
