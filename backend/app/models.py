import uuid
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

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


class List(Base):
    __tablename__ = "lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    owner = Column(String(255), nullable=True)
    category = Column(String(50), nullable=True)  # Weekly / HAE / CMD / NS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    subscriptions = relationship("Subscription", back_populates="list", cascade="all, delete-orphan")


class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    department = Column(String(255), nullable=True)
    role_title = Column(String(255), nullable=True)
    subscription_token = Column(String(36), unique=True, index=True, nullable=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    subscriptions = relationship("Subscription", back_populates="subscriber", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("lists.id", ondelete="CASCADE"), nullable=False)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="Active", nullable=False)  # Active / Paused / Unsubscribed / Bounced
    source = Column(String(50), default="Bulk Import", nullable=False)  # Bulk Import / Curator Added / Self-Service
    opt_in_date = Column(DateTime(timezone=True), server_default=func.now())
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    list = relationship("List", back_populates="subscriptions")
    subscriber = relationship("Subscriber", back_populates="subscriptions")

    __table_args__ = (
        UniqueConstraint("list_id", "subscriber_id", name="uq_list_subscriber"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(255), nullable=True)  # Email of the user who made the change
    action = Column(String(255), nullable=False)  # Subscriber added, Subscriber removed, etc.
    list_id = Column(Integer, ForeignKey("lists.id", ondelete="SET NULL"), nullable=True)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    details = Column(Text, nullable=True)

    list = relationship("List")
    subscriber = relationship("Subscriber")
