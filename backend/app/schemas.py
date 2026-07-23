from pydantic import BaseModel, EmailStr
from typing import List as TypingList, Optional, Any
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


# List Schemas
class ListBase(BaseModel):
    name: str
    description: Optional[str] = None
    owner: Optional[str] = None

class ListCreate(ListBase):
    pass

class ListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None

class List(ListBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ListWithStats(List):
    subscriber_count: int
    active_count: int
    unsubscribed_count: int
    bounced_count: int

    class Config:
        from_attributes = True


# Subscriber Schemas
class SubscriberBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    department: Optional[str] = None
    role_title: Optional[str] = None

class SubscriberCreate(SubscriberBase):
    pass

class SubscriberUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    department: Optional[str] = None
    role_title: Optional[str] = None

class Subscriber(SubscriberBase):
    id: int
    subscription_token: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Subscription Schemas
class SubscriptionBase(BaseModel):
    list_id: int
    subscriber_id: int
    status: str = "Active"  # Active / Paused / Unsubscribed / Bounced
    source: str = "Bulk Import"  # Bulk Import / Curator Added / Self-Service
    notes: Optional[str] = None

class SubscriptionCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    status: str = "Active"
    source: str = "Curator Added"
    notes: Optional[str] = None
    department: Optional[str] = None
    role_title: Optional[str] = None

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    opt_in_date: Optional[datetime] = None
    unsubscribed_at: Optional[datetime] = None
    # Allow updating subscriber fields inside subscription updates for simpler UI actions
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    role_title: Optional[str] = None

class Subscription(SubscriptionBase):
    id: int
    opt_in_date: datetime
    unsubscribed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Combined Subscriber Subscription details inside a List
class SubscriberWithSubscription(BaseModel):
    id: int  # subscriber_id
    subscription_id: int
    name: Optional[str] = None
    email: EmailStr
    department: Optional[str] = None
    role_title: Optional[str] = None
    subscription_token: Optional[str] = None
    status: str
    source: str
    opt_in_date: datetime
    unsubscribed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime  # subscription created_at
    updated_at: datetime  # subscription updated_at

    class Config:
        from_attributes = True


# Master Subscriber details across all lists
class SubscriberSubscriptionSummary(BaseModel):
    list_id: int
    list_name: str
    status: str

class SubscriberMaster(BaseModel):
    id: int
    name: Optional[str] = None
    email: EmailStr
    department: Optional[str] = None
    role_title: Optional[str] = None
    updated_at: datetime
    subscriptions: TypingList[SubscriberSubscriptionSummary]

    class Config:
        from_attributes = True


# Import Schemas
class ImportPreviewRow(BaseModel):
    name: Optional[str] = None
    email: str
    status: str  # valid, invalid, duplicate_file, duplicate_db
    details: Optional[str] = None

class ImportPreviewResponse(BaseModel):
    rows: TypingList[ImportPreviewRow]
    total_rows: int
    valid_count: int
    duplicate_count: int
    invalid_count: int

class ImportCommitEntry(BaseModel):
    name: Optional[str] = None
    email: EmailStr

class ImportCommitRequest(BaseModel):
    list_id: int
    entries: TypingList[ImportCommitEntry]


# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    actor: Optional[str] = None
    action: str
    list_id: Optional[int] = None
    list_name: Optional[str] = None
    subscriber_id: Optional[int] = None
    subscriber_email: Optional[str] = None
    timestamp: datetime
    details: Optional[str] = None

    class Config:
        from_attributes = True


# Self-Service Schemas
class SelfServiceListItem(BaseModel):
    list_id: int
    list_name: str
    is_subscribed: bool

class SelfServiceSubscriberResponse(BaseModel):
    subscriber_id: int
    email: str
    name: Optional[str] = None
    lists: TypingList[SelfServiceListItem]

class SelfServiceLookupResponse(SelfServiceSubscriberResponse):
    token: str

class PreferenceUpdate(BaseModel):
    list_id: int
    subscribed: bool

class PreferencesUpdateRequest(BaseModel):
    subscriptions: TypingList[PreferenceUpdate]


# Statistics Schemas
class DashboardStatsResponse(BaseModel):
    total_lists: int
    total_subscribers: int
    active_subscribers: int
    unsubscribed_subscribers: int
    bounced_subscribers: int
    last_updated: Optional[datetime] = None
    recent_changes: TypingList[AuditLogResponse]
