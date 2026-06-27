from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import get_settings

settings = get_settings()

# asyncpg requires SSL to be passed as connect_args, not as a URL query param
_db_url = settings.database_url
_connect_args = {}
if "postgresql" in _db_url and "ssl=require" in _db_url:
    _db_url = _db_url.replace("?ssl=require", "").replace("&ssl=require", "")
    _connect_args = {"ssl": True}

engine = create_async_engine(
    _db_url,
    echo=settings.app_env == "development",
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
