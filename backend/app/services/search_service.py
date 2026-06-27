from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential
from ..core.config import get_settings
from .openai_service import get_embedding

settings = get_settings()

_search_client: SearchClient | None = None


def _get_client() -> SearchClient | None:
    global _search_client
    if not settings.azure_search_endpoint:
        return None
    if _search_client is None:
        _search_client = SearchClient(
            endpoint=settings.azure_search_endpoint,
            index_name=settings.azure_search_index_name,
            credential=AzureKeyCredential(settings.azure_search_api_key),
        )
    return _search_client


async def retrieve_chunks(query: str, top_k: int = 5) -> list[dict]:
    client = _get_client()
    if not client:
        return []

    try:
        embedding = await get_embedding(query)

        vector_query = VectorizedQuery(
            vector=embedding,
            k_nearest_neighbors=top_k,
            fields="content_vector",
        )

        results = await client.search(
            search_text=query,
            vector_queries=[vector_query],
            select=["id", "content", "source_title", "source_url", "metadata"],
            top=top_k,
        )

        chunks = []
        async for r in results:
            chunks.append({
                "id": r.get("id", ""),
                "content": r.get("content", ""),
                "source_title": r.get("source_title", "Knowledge Article"),
                "source_url": r.get("source_url"),
                "score": r.get("@search.score", 0.0),
            })
        return chunks
    except Exception:
        return []
