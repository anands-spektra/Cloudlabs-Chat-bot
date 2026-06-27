import uuid
from azure.storage.blob.aio import BlobServiceClient
from azure.core.exceptions import AzureError
from ..core.config import get_settings

settings = get_settings()

_blob_client: BlobServiceClient | None = None


def _get_client() -> BlobServiceClient | None:
    global _blob_client
    if not settings.azure_storage_connection_string:
        return None
    if _blob_client is None:
        _blob_client = BlobServiceClient.from_connection_string(
            settings.azure_storage_connection_string
        )
    return _blob_client


async def upload_blob(
    content: bytes,
    filename: str,
    content_type: str,
    session_id: str,
) -> str:
    client = _get_client()
    if not client:
        return f"mock://storage/{session_id}/{filename}"

    blob_name = f"{session_id}/{uuid.uuid4()}/{filename}"
    try:
        container = client.get_container_client(settings.azure_storage_container_name)
        blob = container.get_blob_client(blob_name)
        await blob.upload_blob(
            content,
            content_settings={"content_type": content_type},
            overwrite=True,
        )
        return blob.url
    except AzureError:
        return f"error://storage/{blob_name}"


async def delete_blob(blob_url: str) -> None:
    client = _get_client()
    if not client or not blob_url.startswith("https://"):
        return
    try:
        from urllib.parse import urlparse
        parsed = urlparse(blob_url)
        path_parts = parsed.path.lstrip("/").split("/", 1)
        if len(path_parts) == 2:
            container_name, blob_name = path_parts
            container = client.get_container_client(container_name)
            await container.delete_blob(blob_name)
    except AzureError:
        pass
