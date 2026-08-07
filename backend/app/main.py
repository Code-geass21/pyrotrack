import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime

from .database import get_db, engine, Base
from .models import Entry, AuditLog

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Pyrotrack API", version="1.0.0", lifespan=lifespan)

### ─── PYDANTIC SCHEMAS ─────────────────────────────────────
class EntryBase(BaseModel):
    ordered: Optional[date] = None
    paid: Optional[float] = None
    received: Optional[date] = None
    commission: Optional[float] = None
    started: Optional[date] = None
    finished: Optional[date] = None

class EntryCreate(EntryBase): pass
class EntryUpdate(EntryBase): pass

class EntryResponse(EntryBase):
    id: int
    class Config: from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    action: str
    entry_id: Optional[int]
    details: Optional[str]
    class Config: from_attributes = True

### ─── API ROUTES ───────────────────────────────────────────
@app.get("/api/v1/entries", response_model=List[EntryResponse])
async def get_all_entries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entry).order_by(Entry.ordered.desc()))
    return result.scalars().all()

@app.post("/api/v1/entries", response_model=EntryResponse)
async def create_entry(entry: EntryCreate, db: AsyncSession = Depends(get_db)):
    new_entry = Entry(**entry.dict(exclude_unset=True))
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    db.add(AuditLog(action="CREATE", entry_id=new_entry.id, details=json.dumps(entry.dict(exclude_unset=True), default=str)))
    await db.commit()
    return new_entry

@app.put("/api/v1/entries/{entry_id}", response_model=EntryResponse)
async def update_entry(entry_id: int, entry_data: EntryUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entry).filter(Entry.id == entry_id))
    db_entry = result.scalars().first()
    if not db_entry: raise HTTPException(status_code=404, detail="Entry not found")

    old_data = {c.name: getattr(db_entry, c.name) for c in Entry.__table__.columns}
    for key, value in entry_data.dict(exclude_unset=True).items(): setattr(db_entry, key, value)
    await db.commit()
    await db.refresh(db_entry)

    new_data = {c.name: getattr(db_entry, c.name) for c in Entry.__table__.columns}
    changes = {k: {"old": old_data[k], "new": new_data[k]} for k in new_data if old_data[k] != new_data[k] and k != "id"}
    
    if changes:
        db.add(AuditLog(action="UPDATE", entry_id=entry_id, details=json.dumps(changes, default=str)))
        await db.commit()
    return db_entry

@app.delete("/api/v1/entries/{entry_id}")
async def delete_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entry).filter(Entry.id == entry_id))
    db_entry = result.scalars().first()
    if not db_entry: raise HTTPException(status_code=404, detail="Entry not found")
    
    old_data = {c.name: getattr(db_entry, c.name) for c in Entry.__table__.columns}
    await db.delete(db_entry)
    db.add(AuditLog(action="DELETE", entry_id=entry_id, details=json.dumps(old_data, default=str)))
    await db.commit()
    return {"status": "success"}

@app.get("/api/v1/audit", response_model=List[AuditLogResponse])
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()))
    return result.scalars().all()

### ─── SERVE REACT FRONTEND ─────────────────────────────────
static_dir = "/frontend_build"
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    @app.exception_handler(404)
    async def fallback_to_index(request, exc):
        return FileResponse(os.path.join(static_dir, "index.html"))
