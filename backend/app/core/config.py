from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_env: str = "development"
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Database
    database_url: str = "postgresql+asyncpg://cloudlabs:cloudlabs_pass@localhost:5432/cloudlabs_chat"

    # Azure OpenAI
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment_name: str = "gpt-4o"
    azure_openai_embedding_deployment: str = "text-embedding-3-large"
    azure_openai_api_version: str = "2024-08-01-preview"
    azure_openai_summary_deployment: str = "gpt-4o"

    # Azure AI Search
    azure_search_endpoint: str = ""
    azure_search_api_key: str = ""
    azure_search_index_name: str = "cloudlabs-knowledge"

    # Azure Storage
    azure_storage_connection_string: str = ""
    azure_storage_container_name: str = "uploads"

    # Azure Key Vault
    azure_key_vault_url: str = ""

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Redis
    redis_url: str = "redis://localhost:6379"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    get_settings.cache_clear()
