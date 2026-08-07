import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from .database import get_db
from .models import Entry

app = FastAPI(title="Pyrotrack API", version="1.0.0")

### ─── PYDANTIC SCHEMAS ─────────────────────────────────────
class EntryBase(BaseModel):
    ordered: Optional[date] = None
    paid: Optional[float] = None
    received: Optional[date] = None
    commission: Optional[float] = None
    started: Optional[date] = None
    finished: Optional[date] = None

class EntryCreate(EntryBase):
    pass

class EntryUpdate(EntryBase):
    pass

class EntryResponse(EntryBase):
    id: int
    class Config:
        from_attributes = True

### ─── API ROUTES ───────────────────────────────────────────
@app.get("/api/v1/entries", response_model=List[EntryResponse])
async def get_all_entries(db: AsyncSession = Depends(get_db)):
    """Fetch all cylinder log entries, sorted by order date."""
    result = await db.execute(select(Entry).order_by(Entry.ordered.desc()))
    return result.scalars().all()

@app.post("/api/v1/entries", response_model=EntryResponse)
async def create_entry(entry: EntryCreate, db: AsyncSession = Depends(get_db)):
    """Log a new gas cylinder order."""
    new_entry = Entry(**entry.dict(exclude_unset=True))
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    return new_entry

@app.put("/api/v1/entries/{entry_id}", response_model=EntryResponse)
async def update_entry(entry_id: int, entry_data: EntryUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing cylinder log."""
    result = await db.execute(select(Entry).filter(Entry.id == entry_id))
    db_entry = result.scalars().first()
    
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    update_data = entry_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)
        
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@app.get("/health")
async def health_check():
    return {"status": "ok", "system": "Pyrotrack Core Online"}

### ─── SERVE REACT FRONTEND ─────────────────────────────────
# We store the React build in a protected folder inside the container
static_dir = "/frontend_build"

if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

    # Catch-all route to serve React's index.html for unknown paths
    @app.exception_handler(404)
    async def fallback_to_index(request, exc):
        return FileResponse(os.path.join(static_dir, "index.html"))
