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
