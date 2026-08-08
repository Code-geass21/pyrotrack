import os
import json
import shutil
import zipfile
import io
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime

from .database import get_db, engine, Base
from .models import Entry, AuditLog

DATA_DIR = "/app/data"
RECEIPTS_DIR = os.path.join(DATA_DIR, "receipts")
os.makedirs(RECEIPTS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE entries ADD COLUMN receipt_path VARCHAR"))
        except Exception:
            pass 
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
    receipt_path: Optional[str] = None

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

@app.post("/api/v1/entries/{entry_id}/receipt")
async def upload_receipt(entry_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entry).filter(Entry.id == entry_id))
    db_entry = result.scalars().first()
    if not db_entry: raise HTTPException(status_code=404, detail="Entry not found")

    file_ext = file.filename.split(".")[-1]
    safe_filename = f"receipt_{entry_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
    file_path = os.path.join(RECEIPTS_DIR, safe_filename)
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
        
    old_path = db_entry.receipt_path
    db_entry.receipt_path = f"/api/v1/receipts/{safe_filename}"
    await db.commit()
    await db.refresh(db_entry)
    
    db.add(AuditLog(action="UPDATE", entry_id=entry_id, details=json.dumps({"receipt_path": {"old": old_path, "new": db_entry.receipt_path}})))
    await db.commit()
    return db_entry

# 🗄️ NEW: SYSTEM BACKUP ENDPOINT (.ZIP)
@app.get("/api/v1/backup")
async def download_backup():
    # 🛑 THE FIX: Force WAL checkpoint using an independent autocommit connection!
    # If we use a normal Session, SQLAlchemy opens a transaction which blocks the checkpoint.
    async with engine.connect() as conn:
        await conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("PRAGMA wal_checkpoint(TRUNCATE);"))
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        db_path = os.path.join(DATA_DIR, "util_data.db")
        if os.path.exists(db_path): 
            zip_file.write(db_path, "util_data.db")
        for root, _, files in os.walk(RECEIPTS_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, DATA_DIR)
                zip_file.write(file_path, arcname)
    zip_buffer.seek(0)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment; filename=pyrotrack_backup_{datetime.now().strftime('%Y%m%d')}.zip"}
    )

async def reboot_container():
    await asyncio.sleep(1.5)
    os._exit(0)

# 🔄 NEW: SMART-PARSING RESTORE ENDPOINT
@app.post("/api/v1/restore")
async def restore_backup(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith('.zip'): raise HTTPException(status_code=400, detail="Must be a .zip file")
    temp_zip_path = os.path.join(DATA_DIR, "temp_restore.zip")
    
    contents = await file.read()
    with open(temp_zip_path, "wb") as f:
        f.write(contents)
        
    try:
        # 1. Forcefully disconnect SQLAlchemy
        await engine.dispose()

        # 2. 🛑 NUKE LINGERING FILES BEFORE EXTRACTING
        for old_file in ["util_data.db", "util_data.db-wal", "util_data.db-shm"]:
            old_path = os.path.join(DATA_DIR, old_file)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass

        # 3. Extract fresh data
        with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
            for member in zip_ref.namelist():
                filename = os.path.basename(member)
                if not filename: continue

                if member.endswith("util_data.db"):
                    target_path = os.path.join(DATA_DIR, "util_data.db")
                    with zip_ref.open(member) as source, open(target_path, "wb") as target:
                        shutil.copyfileobj(source, target)
                
                elif "receipt_" in member or "receipts/" in member:
                    target_path = os.path.join(RECEIPTS_DIR, filename)
                    with zip_ref.open(member) as source, open(target_path, "wb") as target:
                        shutil.copyfileobj(source, target)
                        
        os.remove(temp_zip_path)
        
        background_tasks.add_task(reboot_container)
        return {"status": "success"}
        
    except Exception as e:
        if os.path.exists(temp_zip_path): os.remove(temp_zip_path)
        raise HTTPException(status_code=500, detail=str(e))

### ─── SERVE REACT FRONTEND & RECEIPTS ──────────────────────
app.mount("/api/v1/receipts", StaticFiles(directory=RECEIPTS_DIR), name="receipts")

static_dir = "/frontend_build"
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    @app.exception_handler(404)
    async def fallback_to_index(request, exc): return FileResponse(os.path.join(static_dir, "index.html"))
