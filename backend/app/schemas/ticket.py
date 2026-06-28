from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.ticket import TicketStatus


class TicketRead(BaseModel):
    id: str
    session_id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    summary: Optional[str] = None
    message_count: Optional[int] = None
    last_message: Optional[str] = None
    deployment_id: Optional[str] = None
    lab_name: Optional[str] = None
    issue_summary: Optional[str] = None
    detailed_description: Optional[str] = None
    subject: Optional[str] = None

    model_config = {"from_attributes": True}


class EscalateRequest(BaseModel):
    deployment_id: str
    lab_name: str
    issue_summary: str
    detailed_description: Optional[str] = None


class TicketListResponse(BaseModel):
    tickets: list[TicketRead]
    total: int


class AdminMetrics(BaseModel):
    total_sessions: int
    active_sessions: int
    tickets_resolved_by_ai: int
    open_tickets: int
    transferred_tickets: int
    resolution_rate: float
    avg_satisfaction: float
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    knowledge_articles: int
    search_success_rate: float
    connected_sources: int
    resolved_queries: int


class ActivityItem(BaseModel):
    id: str
    user_name: str
    user_initials: str
    action: str
    detail: str
    timestamp: str


class TokenUsagePoint(BaseModel):
    date: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
