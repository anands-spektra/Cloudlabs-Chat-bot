from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.ticket import TokenUsageLog


async def log_token_usage(
    db: AsyncSession,
    session_id: str,
    message_id: str | None,
    prompt_tokens: int,
    completion_tokens: int,
    model_deployment: str | None = None,
) -> None:
    from ..core.config import get_settings
    settings = get_settings()

    log = TokenUsageLog(
        session_id=session_id,
        message_id=message_id,
        model_deployment=model_deployment or settings.azure_openai_deployment_name,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )
    db.add(log)
