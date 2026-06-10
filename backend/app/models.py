from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table
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
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="curator")  # admin or curator
    is_active = Column(Boolean, default=True)

    newsletters = relationship("Newsletter", back_populates="curator")

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    is_subscribed = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    categories = relationship("Category", secondary=subscriber_category, back_populates="subscribers")
    delivery_logs = relationship("CampaignHistory", back_populates="subscriber")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    subscribers = relationship("Subscriber", secondary=subscriber_category, back_populates="categories")
    newsletters = relationship("Newsletter", secondary=newsletter_category, back_populates="categories")

class Newsletter(Base):
    __tablename__ = "newsletters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content_html = Column(String, nullable=False)
    content_text = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, scheduled, sent
    curator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    curator = relationship("User", back_populates="newsletters")
    categories = relationship("Category", secondary=newsletter_category, back_populates="newsletters")
    delivery_logs = relationship("CampaignHistory", back_populates="newsletter")
    send_history = relationship("SendHistory", back_populates="newsletter", cascade="all, delete-orphan")

class CampaignHistory(Base):
    __tablename__ = "campaign_history"

    id = Column(Integer, primary_key=True, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id", ondelete="CASCADE"), nullable=False)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="sent")  # sent, delivered, bounced, opened
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    newsletter = relationship("Newsletter", back_populates="delivery_logs")
    subscriber = relationship("Subscriber", back_populates="delivery_logs")

class SendHistory(Base):
    __tablename__ = "send_history"

    id = Column(Integer, primary_key=True, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id", ondelete="CASCADE"), nullable=False)
    recipient_email = Column(String, nullable=False)
    category = Column(String, nullable=True)
    status = Column(String, default="pending")  # success, failed, pending
    error_message = Column(String, nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    newsletter = relationship("Newsletter", back_populates="send_history")
    open_events = relationship("EmailOpenEvent", back_populates="send_history", cascade="all, delete-orphan")

class EmailOpenEvent(Base):
    __tablename__ = "email_open_events"

    id = Column(Integer, primary_key=True, index=True)
    send_history_id = Column(Integer, ForeignKey("send_history.id", ondelete="CASCADE"), nullable=False)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())

    send_history = relationship("SendHistory", back_populates="open_events")
