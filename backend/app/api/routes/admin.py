from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
from ...core.database import get_db
from ...models.user import User
from ...models.chat import Session, ChatMessage, SessionStatus, MessageRole
from ...models.ticket import Ticket, TicketStatus, TokenUsageLog, SatisfactionFeedback
from ...schemas.ticket import AdminMetrics, ActivityItem, TicketRead, TicketListResponse, TokenUsagePoint
from ...schemas.chat import MessageRead, SessionRead
from ..dependencies import get_admin_user
from sqlalchemy.orm import selectinload
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics", response_model=AdminMetrics)
async def get_metrics(
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_sessions = (await db.execute(select(func.count(Session.id)))).scalar_one()
    active_sessions = (
        await db.execute(select(func.count(Session.id)).where(Session.status == SessionStatus.active))
    ).scalar_one()

    resolved_ai = (
        await db.execute(
            select(func.count(Ticket.id)).where(
                Ticket.status.in_([TicketStatus.resolved_by_ai, TicketStatus.closed])
            )
        )
    ).scalar_one()

    open_tickets = (
        await db.execute(select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.open))
    ).scalar_one()

    transferred = (
        await db.execute(
            select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.transferred_to_support)
        )
    ).scalar_one()

    total_tickets = (await db.execute(select(func.count(Ticket.id)))).scalar_one()
    resolution_rate = (resolved_ai / total_tickets * 100) if total_tickets else 0.0

    avg_sat = (
        await db.execute(select(func.avg(SatisfactionFeedback.rating)))
    ).scalar_one() or 0.0

    prompt_t = (await db.execute(select(func.sum(TokenUsageLog.prompt_tokens)))).scalar_one() or 0
    comp_t = (await db.execute(select(func.sum(TokenUsageLog.completion_tokens)))).scalar_one() or 0

    return AdminMetrics(
        total_sessions=total_sessions,
        active_sessions=active_sessions,
        tickets_resolved_by_ai=resolved_ai,
        open_tickets=open_tickets,
        transferred_tickets=transferred,
        resolution_rate=round(resolution_rate, 1),
        avg_satisfaction=round(float(avg_sat), 2),
        total_tokens=prompt_t + comp_t,
        prompt_tokens=prompt_t,
        completion_tokens=comp_t,
        knowledge_articles=1248,
        search_success_rate=92.0,
        connected_sources=14,
        resolved_queries=resolved_ai,
    )


@router.get("/tickets", response_model=TicketListResponse)
async def get_tickets(
    status: str | None = None,
    page: int = 1,
    limit: int = 20,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Ticket).options(selectinload(Ticket.user))
    if status:
        try:
            q = q.where(Ticket.status == TicketStatus(status))
        except ValueError:
            pass
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    tickets_res = await db.execute(q.order_by(Ticket.created_at.desc()).offset((page - 1) * limit).limit(limit))
    tickets = tickets_res.scalars().all()

    ticket_reads = []
    for t in tickets:
        # Get last message
        msg_res = await db.execute(
            select(ChatMessage).where(ChatMessage.session_id == t.session_id).order_by(ChatMessage.created_at.desc()).limit(1)
        )
        last = msg_res.scalar_one_or_none()
        count_res = await db.execute(select(func.count(ChatMessage.id)).where(ChatMessage.session_id == t.session_id))
        count = count_res.scalar_one()

        ticket_reads.append(
            TicketRead(
                id=t.id,
                session_id=t.session_id,
                user_id=t.user_id,
                user_name=t.user.name if t.user else None,
                user_email=t.user.email if t.user else None,
                status=t.status,
                created_at=t.created_at,
                updated_at=t.updated_at,
                message_count=count,
                last_message=last.content[:100] if last else None,
            )
        )
    return TicketListResponse(tickets=ticket_reads, total=total)


@router.get("/sessions", response_model=dict)
async def get_sessions(
    page: int = 1,
    limit: int = 20,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(Session.id)))).scalar_one()
    res = await db.execute(
        select(Session).order_by(Session.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    sessions = res.scalars().all()
    return {
        "sessions": [SessionRead.model_validate(s) for s in sessions],
        "total": total,
    }


@router.get("/sessions/{session_id}/messages", response_model=list[MessageRead])
async def get_session_messages(
    session_id: str,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.citations), selectinload(ChatMessage.attachments))
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    return res.scalars().all()


@router.get("/tickets/{ticket_id}", response_model=dict)
async def get_ticket_detail(
    ticket_id: str,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Ticket).options(selectinload(Ticket.user)).where(Ticket.id == ticket_id))
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg_res = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.citations), selectinload(ChatMessage.attachments))
        .where(ChatMessage.session_id == ticket.session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = msg_res.scalars().all()

    return {
        "ticket": TicketRead(
            id=ticket.id,
            session_id=ticket.session_id,
            user_id=ticket.user_id,
            user_name=ticket.user.name if ticket.user else None,
            user_email=ticket.user.email if ticket.user else None,
            status=ticket.status,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            deployment_id=ticket.deployment_id,
            lab_name=ticket.lab_name,
            issue_summary=ticket.issue_summary,
            detailed_description=ticket.detailed_description,
            subject=ticket.subject,
        ),
        "messages": [MessageRead.model_validate(m) for m in messages],
    }


@router.post("/tickets/{ticket_id}/transfer", status_code=200)
async def transfer_ticket(
    ticket_id: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    from ...models.ticket import TicketTransfer
    res = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = res.scalar_one_or_none()
    if not ticket:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = TicketStatus.transferred_to_support
    transfer = TicketTransfer(ticket_id=ticket_id, transferred_by=current_user.id)
    db.add(transfer)
    return {"status": "transferred"}


@router.get("/activity", response_model=list[ActivityItem])
async def get_activity(
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(ChatMessage, User)
        .join(Session, ChatMessage.session_id == Session.id)
        .join(User, Session.user_id == User.id)
        .where(ChatMessage.role == MessageRole.user)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    rows = res.all()
    items = []
    for msg, user in rows:
        initials = "".join(p[0] for p in user.name.split()[:2]).upper()
        items.append(
            ActivityItem(
                id=msg.id,
                user_name=user.name,
                user_initials=initials,
                action="asked agent",
                detail=f'"{msg.content[:60]}{"..." if len(msg.content) > 60 else ""}"',
                timestamp=msg.created_at.isoformat(),
            )
        )
    return items


@router.get("/token-usage", response_model=list[TokenUsagePoint])
async def get_token_usage(
    days: int = 30,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    res = await db.execute(
        select(
            func.date(TokenUsageLog.created_at).label("date"),
            func.sum(TokenUsageLog.prompt_tokens).label("prompt_tokens"),
            func.sum(TokenUsageLog.completion_tokens).label("completion_tokens"),
        )
        .where(TokenUsageLog.created_at >= since)
        .group_by(func.date(TokenUsageLog.created_at))
        .order_by(func.date(TokenUsageLog.created_at))
    )
    rows = res.all()
    return [
        TokenUsagePoint(
            date=str(r.date),
            prompt_tokens=r.prompt_tokens or 0,
            completion_tokens=r.completion_tokens or 0,
            total_tokens=(r.prompt_tokens or 0) + (r.completion_tokens or 0),
        )
        for r in rows
    ]


# ── Knowledge Base ────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    blob_name: str | None = None


@router.get("/knowledge/blobs")
async def list_knowledge_blobs(_: User = Depends(get_admin_user)):
    from ...services.knowledge_service import list_blobs, get_indexed_chunk_counts
    blobs = await list_blobs()
    counts = await get_indexed_chunk_counts()
    for b in blobs:
        b["chunks"] = counts.get(b["blob_name"], 0)
        b["indexed"] = b["blob_name"] in counts
    return blobs


@router.post("/knowledge/ingest")
async def ingest_knowledge(
    payload: IngestRequest = IngestRequest(),
    _: User = Depends(get_admin_user),
):
    from ...services.knowledge_service import ingest_blob, ingest_all, ensure_search_index
    await ensure_search_index()
    if payload.blob_name:
        return await ingest_blob(payload.blob_name)
    return await ingest_all()


@router.delete("/knowledge/blobs/{blob_name:path}")
async def delete_knowledge_blob(
    blob_name: str,
    _: User = Depends(get_admin_user),
):
    from ...services.knowledge_service import delete_blob_chunks
    deleted = await delete_blob_chunks(blob_name)
    return {"deleted_chunks": deleted}


@router.post("/knowledge/upload")
async def upload_knowledge_file(
    file: UploadFile = File(...),
    auto_ingest: bool = True,
    _: User = Depends(get_admin_user),
):
    import pathlib
    from ...services.knowledge_service import (
        SUPPORTED_EXTENSIONS,
        ensure_search_index,
        ingest_blob,
        _blob_svc,
    )
    from ...core.config import get_settings as _settings

    ext = pathlib.Path(file.filename or "").suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    cfg = _settings()
    svc = _blob_svc()
    if not svc:
        raise HTTPException(status_code=503, detail="Azure Storage is not configured")

    data = await file.read()
    blob_name = file.filename

    async with svc:
        container = svc.get_container_client(cfg.azure_storage_container_name)
        blob_client = container.get_blob_client(blob_name)
        await blob_client.upload_blob(data, overwrite=True)

    result: dict = {"blob_name": blob_name, "size": len(data), "ingested": False, "chunks": 0}

    if auto_ingest:
        await ensure_search_index()
        ingestion = await ingest_blob(blob_name)
        result["ingested"] = True
        result["chunks"] = ingestion.get("chunks", 0)

    return result
