from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "curator"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Subscriber Schemas
class SubscriberBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None

class SubscriberCreate(SubscriberBase):
    category_ids: List[int] = []

class SubscriberUpdate(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    is_subscribed: Optional[bool] = None
    category_ids: Optional[List[int]] = None

class SubscriberUnsubscribePublic(BaseModel):
    email: EmailStr
    category_ids: List[int]

class Subscriber(SubscriberBase):
    id: int
    is_subscribed: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    categories: List[Category] = []

    class Config:
        from_attributes = True

# Newsletter Schemas
class NewsletterBase(BaseModel):
    title: str
    content_html: str
    content_text: Optional[str] = None
    scheduled_for: Optional[datetime] = None

class NewsletterCreate(NewsletterBase):
    category_ids: List[int] = []

class NewsletterUpdate(BaseModel):
    title: Optional[str] = None
    content_html: Optional[str] = None
    content_text: Optional[str] = None
    status: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    category_ids: Optional[List[int]] = None

class Newsletter(NewsletterBase):
    id: int
    status: str
    curator_id: int
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None
    categories: List[Category] = []

    class Config:
        from_attributes = True

# Campaign History Schema
class CampaignHistory(BaseModel):
    id: int
    newsletter_id: int
    subscriber_id: int
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True

# Send History Schemas
class SendHistoryBase(BaseModel):
    recipient_email: EmailStr
    category: Optional[str] = None
    status: str = "pending"
    error_message: Optional[str] = None

class SendHistory(SendHistoryBase):
    id: int
    newsletter_id: int
    subscriber_id: Optional[int] = None
    sent_at: datetime

    class Config:
        from_attributes = True

# Email Open Event Schemas
class EmailOpenEventBase(BaseModel):
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

class EmailOpenEvent(EmailOpenEventBase):
    id: int
    send_history_id: int
    opened_at: datetime

    class Config:
        from_attributes = True

# Subscription Event Schemas
class SubscriptionEvent(BaseModel):
    id: int
    subscriber_id: int
    category_id: Optional[int] = None
    user_id: Optional[int] = None
    action: str
    created_at: datetime

    class Config:
        from_attributes = True

# Statistics Schemas
class DashboardStatistics(BaseModel):
    total_newsletters: int
    success_rate: float
    open_rate: float

# AI Generation Schemas
class AIDraftRequest(BaseModel):
    prompt: str
    category_id: int
    tone: str

class AIDraftResponse(BaseModel):
    title: str
    content_html: str
