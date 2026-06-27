from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.ticket import Ticket, TicketStatus


async def advance_ticket_status(
    session_id: str,
    new_status: TicketStatus,
    db: AsyncSession,
) -> Ticket | None:
    res = await db.execute(select(Ticket).where(Ticket.session_id == session_id))
    ticket = res.scalar_one_or_none()
    if ticket:
        ticket.status = new_status
    return ticket


async def get_ticket_by_session(session_id: str, db: AsyncSession) -> Ticket | None:
    res = await db.execute(select(Ticket).where(Ticket.session_id == session_id))
    return res.scalar_one_or_none()
