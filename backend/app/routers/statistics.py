from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, models
import io

router = APIRouter(tags=["Statistics"])

@router.get("/statistics/dashboard")
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """
    Get dashboard statistics including total newsletters, success rate, and open rate.
    """
    stats = crud.get_dashboard_statistics(db)
    return stats

@router.get("/track/open/{send_history_id}")
def track_email_open(send_history_id: int, db: Session = Depends(get_db)):
    """
    Track email open event and return a 1x1 transparent pixel image.
    No authentication required so it works in email clients.
    """
    # Get the send history record
    send_history = crud.get_send_history(db, send_history_id)
    if not send_history:
        # Return pixel anyway to not break email clients
        pass
    else:
        # Create an open event
        crud.create_email_open_event(db, send_history_id)
    
    # Return 1x1 transparent PNG pixel
    # Minimal 1x1 transparent PNG
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 size
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,  # 8-bit RGBA
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,  # compressed data
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  # IEND chunk
        0x42, 0x60, 0x82
    ])
    
    return Response(content=png_data, media_type="image/png")
