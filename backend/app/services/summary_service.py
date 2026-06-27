from openai import AsyncAzureOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.config import get_settings
from ..models.chat import ChatMessage
from ..models.ticket import ConversationSummary

settings = get_settings()

SUMMARY_PROMPT = """Summarize the following support conversation in 2-4 sentences.
Focus on: the user's issue, the AI's resolution approach, and the outcome.
Be concise and factual."""


async def generate_summary(session_id: str, ticket_id: str, db: AsyncSession) -> str | None:
    if not settings.azure_openai_endpoint:
        return None

    try:
        res = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        messages = res.scalars().all()

        if len(messages) < 2:
            return None

        transcript = "\n".join(
            f"{m.role.value.upper()}: {m.content[:500]}" for m in messages
        )

        client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )

        response = await client.chat.completions.create(
            model=settings.azure_openai_summary_deployment,
            messages=[
                {"role": "system", "content": SUMMARY_PROMPT},
                {"role": "user", "content": transcript},
            ],
            max_tokens=256,
            temperature=0.3,
        )

        summary_text = response.choices[0].message.content or ""

        summary = ConversationSummary(
            ticket_id=ticket_id,
            session_id=session_id,
            summary=summary_text,
        )
        db.add(summary)
        return summary_text

    except Exception:
        return None
