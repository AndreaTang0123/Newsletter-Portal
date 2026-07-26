from fastapi import APIRouter, Depends
from .. import schemas, auth, models

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user
