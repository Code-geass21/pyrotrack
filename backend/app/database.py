import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text

# Create a protected folder for the database inside the container
os.makedirs("/app/data", exist_ok=True)
DATABASE_URL = "sqlite+aiosqlite:////app/data/pyrotrack.db"

engine = create_async_engine(DATABASE_URL, echo=False)
Base = declarative_base()
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        await session.execute(text("PRAGMA journal_mode=WAL;"))
        yield session
