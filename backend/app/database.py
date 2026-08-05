from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text

# Pointing to your existing database file
DATABASE_URL = "sqlite+aiosqlite:///util_data.db"

# Create the async engine
engine = create_async_engine(DATABASE_URL, echo=False)

# Base class for our models
Base = declarative_base()

# Session maker for FastAPI dependency injection
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with async_session() as session:
        # Enable WAL mode for better concurrent read/writes
        await session.execute(text("PRAGMA journal_mode=WAL;"))
        yield session
