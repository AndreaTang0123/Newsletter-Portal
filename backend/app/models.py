from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Many-to-many relationship mapping between Subscribers and Categories
subscriber_category = Table(
    "subscriber_category",
    Base.metadata,
    Column("subscriber_id", Integer, ForeignKey("subscribers.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

# Many-to-many relationship mapping between Newsletters and Categories
newsletter_category = Table(
    "newsletter_category",
    Base.metadata,
    Column("newsletter_id", Integer, ForeignKey("newsletters.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="curator")  # admin or curator
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    newsletters = relationship("Newsletter", back_populates="curator", cascade="all, delete-orphan")
    subscription_events = relationship("SubscriptionEvent", back_populates="user", cascade="all, delete-orphan")

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    is_subscribed = Column(Boolean, default=True, index=True)
    is_active = Column(Boolean, default=True)
    subscription_token = Column(String(255), unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    categories = relationship("Category", secondary=subscriber_category, back_populates="subscribers")
    delivery_logs = relationship("CampaignHistory", back_populates="subscriber", cascade="all, delete-orphan")
    subscription_events = relationship("SubscriptionEvent", back_populates="subscriber", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subscribers = relationship("Subscriber", secondary=subscriber_category, back_populates="categories")
    newsletters = relationship("Newsletter", secondary=newsletter_category, back_populates="categories")
    subscription_events = relationship("SubscriptionEvent", back_populates="category", cascade="all, delete-orphan")

class Newsletter(Base):
    __tablename__ = "newsletters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content_html = Column(Text, nullable=False)
    content_text = Column(Text, nullable=True)
    status = Column(String(50), default="draft", index=True)  # draft, scheduled, sent
    curator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    curator = relationship("User", back_populates="newsletters")
    categories = relationship("Category", secondary=newsletter_category, back_populates="newsletters")
    delivery_logs = relationship("CampaignHistory", back_populates="newsletter", cascade="all, delete-orphan")
    send_history = relationship("SendHistory", back_populates="newsletter", cascade="all, delete-orphan")

class CampaignHistory(Base):
    __tablename__ = "campaign_history"

    id = Column(Integer, primary_key=True, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id", ondelete="CASCADE"), nullable=False, index=True)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="sent", index=True)  # sent, delivered, bounced, opened
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    newsletter = relationship("Newsletter", back_populates="delivery_logs")
    subscriber = relationship("Subscriber", back_populates="delivery_logs")

class SendHistory(Base):
    __tablename__ = "send_history"

    id = Column(Integer, primary_key=True, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id", ondelete="CASCADE"), nullable=False, index=True)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=True, index=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    category = Column(String(255), nullable=True)
    status = Column(String(50), default="pending", index=True)  # success, failed, pending
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    newsletter = relationship("Newsletter", back_populates="send_history")
    open_events = relationship("EmailOpenEvent", back_populates="send_history", cascade="all, delete-orphan")

class EmailOpenEvent(Base):
    __tablename__ = "email_open_events"

    id = Column(Integer, primary_key=True, index=True)
    send_history_id = Column(Integer, ForeignKey("send_history.id", ondelete="CASCADE"), nullable=False, index=True)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(50), nullable=True)

    send_history = relationship("SendHistory", back_populates="open_events")

class SubscriptionEvent(Base):
    __tablename__ = "subscription_events"

    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)  # subscribe, unsubscribe, prefer
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subscriber = relationship("Subscriber", back_populates="subscription_events")
    category = relationship("Category", back_populates="subscription_events")
    user = relationship("User", back_populates="subscription_events")
