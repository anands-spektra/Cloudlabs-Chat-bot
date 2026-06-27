from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...models.user import User
from ...models.chat import Session
from ...models.attachment import Attachment
from ...services.storage_service import upload_blob
from ...services.ingestion_service import extract_text
from ..dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/files", tags=["files"])

ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/jpg", "image/bmp", "image/webp",
    "text/markdown", "text/x-markdown",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".webp", ".md", ".doc", ".docx", ".pdf"}
MAX_SIZE_MB = 20


class UploadResponse(BaseModel):
    id: str
    filename: str
    blob_url: str


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate session ownership
    res = await db.execute(
        select(Session).where(Session.id == session_id, Session.user_id == current_user.id)
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    # Validate file
    if file.content_type not in ALLOWED_TYPES:
        import os
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_SIZE_MB} MB limit")

    # Upload to Azure Blob Storage
    blob_url = await upload_blob(
        content=content,
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        session_id=session_id,
    )

    # Extract text for supported doc types
    extracted_text = None
    if file.content_type in {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/markdown",
        "text/x-markdown",
    }:
        extracted_text = await extract_text(
            content=content,
            filename=file.filename or "",
            content_type=file.content_type or "",
        )

    attachment = Attachment(
        session_id=session_id,
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
        blob_url=blob_url,
        extracted_text=extracted_text,
    )
    db.add(attachment)
    await db.flush()

    return UploadResponse(id=attachment.id, filename=attachment.filename, blob_url=blob_url)
