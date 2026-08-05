from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from .database import get_db
from .models import Entry

app = FastAPI(title="Pyrotrack API", version="1.0.0")

class EntryResponse(BaseModel):
    id: int
    ordered: Optional[date]
    paid: Optional[float]
    received: Optional[date]
    commission: Optional[float]
    started: Optional[date]
    finished: Optional[date]

    class Config:
        from_attributes = True

@app.get("/api/v1/entries", response_model=List[EntryResponse])
async def get_all_entries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entry).order_by(Entry.ordered.desc()))
    return result.scalars().all()

@app.get("/health")
async def health_check():
    return {"status": "ok", "system": "Pyrotrack Core Online"}
