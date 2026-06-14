from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
import re
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/imports", tags=["Imports"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def parse_csv_line(text: str):
    """
    Parses a single line or cell for name and email.
    Supports:
      - 'Andrea Tang <curator@company.com>'
      - 'curator@company.com'
    """
    text = text.strip()
    # Match 'Name <email>'
    match = re.search(r"^([^<]*)\s*<([^>]+)>$", text)
    if match:
        name = match.group(1).strip().strip('"\'')
        email = match.group(2).strip().strip('"\'')
        return name, email
    
    # Check if just email
    if "@" in text and not "<" in text:
        email = text.strip('"\' ')
        return "", email
    
    return "", ""

@router.post("/preview", response_model=schemas.ImportPreviewResponse)
def preview_import(
    list_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    lst = crud.get_list_by_id(db, list_id)
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
        
    try:
        content = file.file.read().decode("utf-8-sig")  # utf-8-sig handles BOM
        file.file.seek(0)  # reset file pointer for future safety
        
        # Read lines
        csv_reader = csv.reader(io.StringIO(content))
        rows = list(csv_reader)
        
        if not rows:
            return {
                "rows": [],
                "total_rows": 0,
                "valid_count": 0,
                "duplicate_count": 0,
                "invalid_count": 0
            }
            
        # Determine headers if any
        first_row = rows[0]
        has_header = False
        email_col_idx = -1
        name_col_idx = -1
        
        header_indicators = ["email", "mail", "addr", "contact"]
        name_indicators = ["name", "full", "first", "last", "recipient"]
        
        # Check if first row is a header
        is_header_row = False
        for cell in first_row:
            cell_lower = cell.lower()
            if any(ind in cell_lower for ind in header_indicators + name_indicators):
                is_header_row = True
                break
                
        if is_header_row:
            has_header = True
            for idx, cell in enumerate(first_row):
                cell_lower = cell.lower()
                if any(ind in cell_lower for ind in header_indicators) and email_col_idx == -1:
                    email_col_idx = idx
                elif any(ind in cell_lower for ind in name_indicators) and name_col_idx == -1:
                    name_col_idx = idx
                    
        # If headers were found but we couldn't find columns, fallback to parsing cells
        start_idx = 1 if has_header else 0
        
        preview_rows = []
        seen_emails = set()
        
        # Find existing emails in this list to detect database duplicates
        existing_subscriptions = db.query(models.Subscription).filter(
            models.Subscription.list_id == list_id
        ).all()
        existing_emails = {s.subscriber.email.lower() for s in existing_subscriptions if s.subscriber}
        
        for idx in range(start_idx, len(rows)):
            row = rows[idx]
            if not row or not any(cell.strip() for cell in row):
                continue
                
            name, email = "", ""
            
            # Extract fields based on columns
            if has_header and email_col_idx != -1:
                # We have mapped column headers
                email_val = row[email_col_idx].strip()
                name_val = row[name_col_idx].strip() if name_col_idx != -1 and name_col_idx < len(row) else ""
                
                # Check if email_val is formatted as "Name <email>"
                p_name, p_email = parse_csv_line(email_val)
                if p_email:
                    email = p_email
                    name = p_name if p_name else name_val
                else:
                    email = email_val
                    name = name_val
            else:
                # No headers or columns, try to search the cells
                if len(row) == 1:
                    name, email = parse_csv_line(row[0])
                else:
                    # Let's inspect columns. Find first that looks like email.
                    email_found = False
                    for cell in row:
                        p_name, p_email = parse_csv_line(cell)
                        if p_email:
                            name, email = p_name, p_email
                            email_found = True
                            break
                    if not email_found:
                        # Fallback: find cell with "@"
                        for idx_cell, cell in enumerate(row):
                            if "@" in cell:
                                email = cell.strip()
                                # Assume other column might be name
                                other_cell = row[0] if idx_cell != 0 else row[1]
                                name = other_cell.strip()
                                break
                                
            # Final validation
            email = email.strip()
            name = name.strip().strip('"\'')
            
            if not email or not EMAIL_REGEX.match(email):
                preview_rows.append({
                    "name": name if name else None,
                    "email": email if email else "Invalid Row Content",
                    "status": "invalid",
                    "details": "Invalid email formatting."
                })
            elif email.lower() in seen_emails:
                preview_rows.append({
                    "name": name if name else None,
                    "email": email,
                    "status": "duplicate_file",
                    "details": "Duplicate email in uploaded CSV."
                })
            elif email.lower() in existing_emails:
                preview_rows.append({
                    "name": name if name else None,
                    "email": email,
                    "status": "duplicate_db",
                    "details": "Already subscribed to this list."
                })
                seen_emails.add(email.lower())
            else:
                preview_rows.append({
                    "name": name if name else None,
                    "email": email,
                    "status": "valid",
                    "details": "Ready to import."
                })
                seen_emails.add(email.lower())
                
        # Count statistics
        total = len(preview_rows)
        valid = sum(1 for r in preview_rows if r["status"] == "valid")
        dups = sum(1 for r in preview_rows if r["status"] in ["duplicate_file", "duplicate_db"])
        invalids = sum(1 for r in preview_rows if r["status"] == "invalid")
        
        return {
            "rows": preview_rows,
            "total_rows": total,
            "valid_count": valid,
            "duplicate_count": dups,
            "invalid_count": invalids
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {str(e)}")

@router.post("/commit", status_code=status.HTTP_201_CREATED)
def commit_import(
    request: schemas.ImportCommitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    lst = crud.get_list_by_id(db, request.list_id)
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
        
    imported_count = 0
    for entry in request.entries:
        try:
            crud.add_subscriber_to_list(
                db,
                list_id=request.list_id,
                sub_data=schemas.SubscriptionCreate(
                    email=entry.email,
                    name=entry.name,
                    status="Active",
                    source="Bulk Import",
                    notes="Imported via bulk CSV upload"
                ),
                actor=current_user.email
            )
            imported_count += 1
        except Exception as e:
            # Continue importing other rows on failure
            pass
            
    # Write a summary log
    crud.create_audit_log(
        db,
        actor=current_user.email,
        action="List imported",
        list_id=request.list_id,
        details=f"Bulk imported {imported_count} subscribers from CSV."
    )
    
    return {"detail": f"Successfully imported {imported_count} subscribers."}
