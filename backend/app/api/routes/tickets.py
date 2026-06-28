from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...models.user import User
from ...models.ticket import Ticket, TicketStatus
from ...schemas.ticket import TicketRead, EscalateRequest
from ..dependencies import get_current_user

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/{ticket_id}", response_model=TicketRead)
async def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket).where(Ticket.id == ticket_id, Ticket.user_id == current_user.id)
    )
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketRead(
        id=ticket.id,
        session_id=ticket.session_id,
        user_id=ticket.user_id,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.post("/{ticket_id}/escalate", response_model=TicketRead)
async def escalate_ticket(
    ticket_id: str,
    payload: EscalateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket).where(Ticket.id == ticket_id, Ticket.user_id == current_user.id)
    )
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.deployment_id = payload.deployment_id
    ticket.lab_name = payload.lab_name
    ticket.issue_summary = payload.issue_summary
    ticket.detailed_description = payload.detailed_description
    ticket.subject = f"{payload.lab_name} - {payload.issue_summary} - {payload.deployment_id}"
    ticket.status = TicketStatus.transferred_to_support
    await db.flush()

    return TicketRead(
        id=ticket.id,
        session_id=ticket.session_id,
        user_id=ticket.user_id,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        deployment_id=ticket.deployment_id,
        lab_name=ticket.lab_name,
        issue_summary=ticket.issue_summary,
        detailed_description=ticket.detailed_description,
        subject=ticket.subject,
    )


@router.post("/{ticket_id}/resolve", status_code=200)
async def mark_resolved(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket).where(Ticket.id == ticket_id, Ticket.user_id == current_user.id)
    )
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = TicketStatus.resolved_by_ai
    return {"status": "resolved"}
