from sqlalchemy.orm import Session
from . import models, schemas, auth

# User CRUD
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

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

# Category CRUD
def get_categories(db: Session):
    return db.query(models.Category).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name, description=category.description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Subscriber CRUD
def get_subscribers(db: Session):
    return db.query(models.Subscriber).all()

def get_subscriber_by_email(db: Session, email: str):
    return db.query(models.Subscriber).filter(models.Subscriber.email == email).first()

def create_subscriber(db: Session, subscriber: schemas.SubscriberCreate):
    db_sub = models.Subscriber(email=subscriber.email, full_name=subscriber.full_name)
    if subscriber.category_ids:
        categories = db.query(models.Category).filter(models.Category.id.in_(subscriber.category_ids)).all()
        db_sub.categories = categories
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

def unsubscribe_public(db: Session, unsub_data: schemas.SubscriberUnsubscribePublic):
    db_sub = get_subscriber_by_email(db, email=unsub_data.email)
    if not db_sub:
        # Create subscriber if not exists and mark preferences
        db_sub = models.Subscriber(email=unsub_data.email, is_subscribed=len(unsub_data.category_ids) > 0)
        db.add(db_sub)
    
    # Filter categories they want to keep
    if unsub_data.category_ids:
        categories = db.query(models.Category).filter(models.Category.id.in_(unsub_data.category_ids)).all()
        db_sub.categories = categories
        db_sub.is_subscribed = True
    else:
        db_sub.categories = []
        db_sub.is_subscribed = False
        
    db.commit()
    db.refresh(db_sub)
    return db_sub

# Newsletter CRUD
def get_newsletters(db: Session):
    return db.query(models.Newsletter).all()

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
            categories = db.query(models.Category).filter(models.Category.id.in_(value)).all()
            db_newsletter.categories = categories
        else:
            setattr(db_newsletter, key, value)
    db.commit()
    db.refresh(db_newsletter)
    return db_newsletter

# SendHistory CRUD
def create_send_history(db: Session, newsletter_id: int, recipient_email: str, category: str = None, status: str = "success", error_message: str = None):
    db_send_history = models.SendHistory(
        newsletter_id=newsletter_id,
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

# EmailOpenEvent CRUD
def create_email_open_event(db: Session, send_history_id: int):
    db_open_event = models.EmailOpenEvent(send_history_id=send_history_id)
    db.add(db_open_event)
    db.commit()
    db.refresh(db_open_event)
    return db_open_event

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
