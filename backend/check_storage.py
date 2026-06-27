"""Quick check: list ALL blobs in the configured container."""
import asyncio
from app.core.config import get_settings
from azure.storage.blob.aio import BlobServiceClient

settings = get_settings()

async def main():
    if not settings.azure_storage_connection_string:
        print("No storage connection string configured.")
        return

    svc = BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)
    try:
        print(f"Container: {settings.azure_storage_container_name}")
        print("-" * 60)
        container = svc.get_container_client(settings.azure_storage_container_name)
        count = 0
        async for blob in container.list_blobs():
            print(f"  {blob.name}  ({blob.size} bytes)")
            count += 1
        print("-" * 60)
        print(f"Total blobs: {count}")
        if count == 0:
            print("\nContainer is empty. Upload PDF/DOCX/MD/TXT files to start ingestion.")

        # Also list all containers
        print("\nAll containers in this storage account:")
        async for c in svc.list_containers():
            print(f"  {c['name']}")
    finally:
        await svc.close()

asyncio.run(main())
