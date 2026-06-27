from typing import Any
from openai import AsyncAzureOpenAI
from ..core.config import get_settings

settings = get_settings()

_client: AsyncAzureOpenAI | None = None


def _get_client() -> AsyncAzureOpenAI:
    global _client
    if _client is None:
        _client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
    return _client


SYSTEM_PROMPT = """You are the CloudLabs AI Assistant — a helpful support agent for CloudLabs customers.
Answer questions about lab provisioning, deployments, LMS integration, billing, and Azure Lab Services.
Ground your answers in the retrieved knowledge context provided.
If the context does not contain relevant information, say so honestly.
Keep responses concise, clear, and actionable. Format using markdown where helpful.
Do not make up information. If uncertain, recommend contacting the support team."""


async def get_openai_response(
    question: str,
    history: list[Any],
    chunks: list[dict],
    attachment_context: str = "",
) -> dict:
    if not settings.azure_openai_endpoint:
        return {
            "content": (
                f"I received your question: *{question}*\n\n"
                "Azure OpenAI is not configured in this environment. "
                "Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY."
            ),
            "prompt_tokens": 0,
            "completion_tokens": 0,
        }

    client = _get_client()

    # Build context from retrieved chunks
    context_text = ""
    if chunks:
        context_parts = []
        for i, c in enumerate(chunks[:5], 1):
            context_parts.append(f"[{i}] {c.get('source_title', '')}: {c.get('content', '')}")
        context_text = "\n\n".join(context_parts)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if context_text:
        messages.append({
            "role": "system",
            "content": f"Retrieved knowledge context:\n\n{context_text}",
        })

    if attachment_context:
        messages.append({
            "role": "system",
            "content": f"Uploaded document content:{attachment_context}",
        })

    for msg in history[-8:]:
        messages.append({"role": msg.role.value, "content": msg.content})

    response = await client.chat.completions.create(
        model=settings.azure_openai_deployment_name,
        messages=messages,
        temperature=0.3,
        max_tokens=1024,
    )

    choice = response.choices[0]
    return {
        "content": choice.message.content or "",
        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
        "completion_tokens": response.usage.completion_tokens if response.usage else 0,
    }


async def get_embedding(text: str) -> list[float]:
    if not settings.azure_openai_endpoint:
        return [0.0] * 3072

    client = _get_client()
    response = await client.embeddings.create(
        model=settings.azure_openai_embedding_deployment,
        input=text,
    )
    return response.data[0].embedding


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts in a single API call (up to 2048 inputs)."""
    if not settings.azure_openai_endpoint:
        return [[0.0] * 3072 for _ in texts]

    client = _get_client()
    # Azure OpenAI supports batching; split into chunks of 16 to stay within token limits
    BATCH = 16
    all_vectors: list[list[float]] = []
    for i in range(0, len(texts), BATCH):
        batch = texts[i: i + BATCH]
        response = await client.embeddings.create(
            model=settings.azure_openai_embedding_deployment,
            input=batch,
        )
        # Results are returned in order
        all_vectors.extend(item.embedding for item in sorted(response.data, key=lambda x: x.index))
    return all_vectors
