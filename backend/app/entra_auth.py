import os
import secrets
import time

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import models

TENANT_ID = os.getenv("AZURE_AD_TENANT_ID")
CLIENT_ID = os.getenv("AZURE_AD_CLIENT_ID")
ALLOWED_DOMAIN = os.getenv("AZURE_AD_ALLOWED_DOMAIN", "biocryst.com").lower()

ISSUER = f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"
JWKS_URL = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"
JWKS_CACHE_TTL_SECONDS = 3600

_jwks_cache = {"keys": None, "fetched_at": 0.0}

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _fetch_jwks() -> list[dict]:
    response = httpx.get(JWKS_URL, timeout=10)
    response.raise_for_status()
    return response.json()["keys"]


def _get_signing_key(kid: str) -> dict | None:
    now = time.time()
    if _jwks_cache["keys"] is None or now - _jwks_cache["fetched_at"] > JWKS_CACHE_TTL_SECONDS:
        _jwks_cache["keys"] = _fetch_jwks()
        _jwks_cache["fetched_at"] = now

    key = next((k for k in _jwks_cache["keys"] if k["kid"] == kid), None)
    if key is None:
        # kid not found — keys may have rotated, force one refresh before giving up
        _jwks_cache["keys"] = _fetch_jwks()
        _jwks_cache["fetched_at"] = now
        key = next((k for k in _jwks_cache["keys"] if k["kid"] == kid), None)
    return key


def validate_entra_token(token: str) -> dict:
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise credentials_exception

    kid = unverified_header.get("kid")
    key = _get_signing_key(kid) if kid else None
    if key is None:
        raise credentials_exception

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=[CLIENT_ID, f"api://{CLIENT_ID}"],
            issuer=ISSUER,
        )
    except JWTError:
        raise credentials_exception

    email = (claims.get("preferred_username") or claims.get("email") or "").lower()
    if not email.endswith(f"@{ALLOWED_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access restricted to {ALLOWED_DOMAIN} accounts",
        )

    claims["email"] = email
    return claims


def get_or_create_sso_user(db: Session, email: str, full_name: str | None) -> models.User:
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is not None:
        return user

    from . import auth  # local import: auth.py imports this module, avoid a cycle

    user = models.User(
        email=email,
        full_name=full_name,
        hashed_password=auth.get_password_hash(secrets.token_urlsafe(32)),
        role="curator",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
