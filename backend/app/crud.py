from sqlalchemy.orm import Session
from . import models, schemas, auth
import uuid


# User CRUD
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


def update_user(db: Session, user_id: int, updates: dict):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    for key, value in updates.items():
        if key != "password" and hasattr(db_user, key):
            setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# Category CRUD
def get_categories(db: Session):
    return db.query(models.Category).all()


def get_category_by_id(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def get_category_by_name(db: Session, name: str):
    return db.query(models.Category).filter(models.Category.name == name).first()


def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name, description=category.description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, category_id: int, updates: dict):
    db_category = get_category_by_id(db, category_id)
    if not db_category:
        return None
    for key, value in updates.items():
        if hasattr(db_category, key):
            setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: int):
    db_category = get_category_by_id(db, category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False


# Subscriber CRUD
def get_subscribers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Subscriber).offset(skip).limit(limit).all()


def get_subscriber_by_id(db: Session, subscriber_id: int):
    return db.query(models.Subscriber).filter(models.Subscriber.id == subscriber_id).first()


def get_subscriber_by_email(db: Session, email: str):
    return db.query(models.Subscriber).filter(models.Subscriber.email == email).first()


def get_subscriber_by_token(db: Session, token: str):
    return db.query(models.Subscriber).filter(models.Subscriber.subscription_token == token).first()


def create_subscriber(db: Session, subscriber: schemas.SubscriberCreate):
    # Generate unique subscription token
    subscription_token = str(uuid.uuid4())
    
    db_sub = models.Subscriber(
        email=subscriber.email,
        full_name=subscriber.full_name,
        subscription_token=subscription_token,
        is_subscribed=True
    )
    if subscriber.category_ids:
        categories = db.query(models.Category).filter(models.Category.id.in_(subscriber.category_ids)).all()
        db_sub.categories = categories
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub


def update_subscriber(db: Session, subscriber_id: int, updates: schemas.SubscriberUpdate):
    db_sub = get_subscriber_by_id(db, subscriber_id)
    if not db_sub:
        return None
    
    for key, value in updates.model_dump(exclude_unset=True).items():
        if key == "category_ids":
            if value:
                categories = db.query(models.Category).filter(models.Category.id.in_(value)).all()
                db_sub.categories = categories
        else:
            if hasattr(db_sub, key):
                setattr(db_sub, key, value)
    
    db.commit()
    db.refresh(db_sub)
    return db_sub


def update_subscriber_categories(db: Session, subscriber_id: int, category_ids: list):
    """Update subscriber's category preferences."""
    db_sub = get_subscriber_by_id(db, subscriber_id)
    if not db_sub:
        return None
    
    if category_ids:
        categories = db.query(models.Category).filter(models.Category.id.in_(category_ids)).all()
        db_sub.categories = categories
    else:
        db_sub.categories = []
    
    db.commit()
    db.refresh(db_sub)
    return db_sub


def delete_subscriber(db: Session, subscriber_id: int):
    db_sub = get_subscriber_by_id(db, subscriber_id)
    if db_sub:
        db.delete(db_sub)
        db.commit()
        return True
    return False


def unsubscribe_public(db: Session, unsub_data: schemas.SubscriberUnsubscribePublic):
    """
    Public unsubscribe endpoint logic.
    Allows subscribers to manage their category preferences.
    """
    db_sub = get_subscriber_by_email(db, email=unsub_data.email)
    if not db_sub:
        # Create subscriber if not exists and mark preferences
        subscription_token = str(uuid.uuid4())
        db_sub = models.Subscriber(
            email=unsub_data.email,
            subscription_token=subscription_token,
            is_subscribed=len(unsub_data.category_ids) > 0
        )
        db.add(db_sub)
    
    # Filter categories they want to keep
    if unsub_data.category_ids:
        categories = db.query(models.Category).filter(models.Category.id.in_(unsub_data.category_ids)).all()
        db_sub.categories = categories
        db_sub.is_subscribed = True
    else:
        db_sub.categories = []
        db_sub.is_subscribed = False
    
    # Record subscription event
    event = models.SubscriptionEvent(
        subscriber_id=db_sub.id if db_sub.id else None,
        action="prefer"
    )
    db.add(event)
    
    db.commit()
    db.refresh(db_sub)
    return db_sub


# Newsletter CRUD
def get_newsletters(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Newsletter)
    if status:
        query = query.filter(models.Newsletter.status == status)
    return query.offset(skip).limit(limit).all()


def get_newsletter(db: Session, newsletter_id: int):
    return db.query(models.Newsletter).filter(models.Newsletter.id == newsletter_id).first()


def create_newsletter(db: Session, newsletter: schemas.NewsletterCreate, curator_id: int):
    db_newsletter = models.Newsletter(
        title=newsletter.title,
        content_html=newsletter.content_html,
        content_text=newsletter.content_text,
        curator_id=curator_id,
        scheduled_for=newsletter.scheduled_for
    )
    if newsletter.category_ids:
        categories = db.query(models.Category).filter(models.Category.id.in_(newsletter.category_ids)).all()
        db_newsletter.categories = categories
    db.add(db_newsletter)
    db.commit()
    db.refresh(db_newsletter)
    return db_newsletter


def update_newsletter(db: Session, db_newsletter: models.Newsletter, updates: schemas.NewsletterUpdate):
    for key, value in updates.model_dump(exclude_unset=True).items():
        if key == "category_ids":
            if value:
                categories = db.query(models.Category).filter(models.Category.id.in_(value)).all()
                db_newsletter.categories = categories
        else:
            if hasattr(db_newsletter, key):
                setattr(db_newsletter, key, value)
    db.commit()
    db.refresh(db_newsletter)
    return db_newsletter


def delete_newsletter(db: Session, newsletter_id: int):
    db_newsletter = get_newsletter(db, newsletter_id)
    if db_newsletter:
        db.delete(db_newsletter)
        db.commit()
        return True
    return False


# SendHistory CRUD
def create_send_history(db: Session, newsletter_id: int, recipient_email: str, subscriber_id: int = None, category: str = None, status: str = "success", error_message: str = None):
    db_send_history = models.SendHistory(
        newsletter_id=newsletter_id,
        subscriber_id=subscriber_id,
        recipient_email=recipient_email,
        category=category,
        status=status,
        error_message=error_message
    )
    db.add(db_send_history)
    db.commit()
    db.refresh(db_send_history)
    return db_send_history


def get_send_history(db: Session, send_history_id: int):
    return db.query(models.SendHistory).filter(models.SendHistory.id == send_history_id).first()


def get_send_history_by_newsletter(db: Session, newsletter_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.SendHistory).filter(
        models.SendHistory.newsletter_id == newsletter_id
    ).offset(skip).limit(limit).all()


def get_send_history_by_status(db: Session, status: str, skip: int = 0, limit: int = 100):
    return db.query(models.SendHistory).filter(
        models.SendHistory.status == status
    ).offset(skip).limit(limit).all()


def update_send_history_status(db: Session, send_history_id: int, status: str, error_message: str = None):
    db_send = get_send_history(db, send_history_id)
    if not db_send:
        return None
    db_send.status = status
    if error_message:
        db_send.error_message = error_message
    db.commit()
    db.refresh(db_send)
    return db_send


# EmailOpenEvent CRUD
def create_email_open_event(db: Session, send_history_id: int, user_agent: str = None, ip_address: str = None):
    db_open_event = models.EmailOpenEvent(
        send_history_id=send_history_id,
        user_agent=user_agent,
        ip_address=ip_address
    )
    db.add(db_open_event)
    db.commit()
    db.refresh(db_open_event)
    return db_open_event


def get_open_events_by_send_history(db: Session, send_history_id: int):
    return db.query(models.EmailOpenEvent).filter(
        models.EmailOpenEvent.send_history_id == send_history_id
    ).all()


def get_open_events_by_newsletter(db: Session, newsletter_id: int):
    return db.query(models.EmailOpenEvent).join(
        models.SendHistory,
        models.EmailOpenEvent.send_history_id == models.SendHistory.id
    ).filter(
        models.SendHistory.newsletter_id == newsletter_id
    ).all()


# CampaignHistory CRUD
def create_campaign_history(db: Session, newsletter_id: int, subscriber_id: int, status: str = "sent"):
    db_campaign = models.CampaignHistory(
        newsletter_id=newsletter_id,
        subscriber_id=subscriber_id,
        status=status
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign


# Dashboard Statistics
def get_dashboard_statistics(db: Session):
    from sqlalchemy import func
    
    # Total newsletters (sent status)
    total_newsletters = db.query(func.count(models.Newsletter.id)).filter(
        models.Newsletter.status == "sent"
    ).scalar() or 0
    
    # Success rate
    total_sends = db.query(func.count(models.SendHistory.id)).scalar() or 0
    successful_sends = db.query(func.count(models.SendHistory.id)).filter(
        models.SendHistory.status == "success"
    ).scalar() or 0
    
    success_rate = 0.0
    if total_sends > 0:
        success_rate = (successful_sends / total_sends) * 100
    
    # Open rate
    opened_sends = db.query(func.count(func.distinct(models.EmailOpenEvent.send_history_id))).scalar() or 0
    
    open_rate = 0.0
    if successful_sends > 0:
        open_rate = (opened_sends / successful_sends) * 100
    
    return {
        "total_newsletters": total_newsletters,
        "success_rate": round(success_rate, 1),
        "open_rate": round(open_rate, 1)
    }


def get_subscriber_count(db: Session, is_active: bool = True):
    """Get count of subscribers."""
    return db.query(func.count(models.Subscriber.id)).filter(
        models.Subscriber.is_active == is_active
    ).scalar() or 0


def get_newsletter_count(db: Session, status: str = None):
    """Get count of newsletters by status."""
    query = db.query(func.count(models.Newsletter.id))
    if status:
        query = query.filter(models.Newsletter.status == status)
    return query.scalar() or 0

