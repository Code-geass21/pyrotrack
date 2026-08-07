import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text

# Ensure the data vault directory exists
DATA_DIR = "/app/data"
os.makedirs(DATA_DIR, exist_ok=True)

# 4 slashes indicate an absolute path in SQLAlchemy so it saves exactly in our vault
DATABASE_URL = f"sqlite+aiosqlite:///{DATA_DIR}/util_data.db"

engine = create_async_engine(DATABASE_URL, echo=False)
Base = declarative_base()
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        await session.execute(text("PRAGMA journal_mode=WAL;"))
        yield session
