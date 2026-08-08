import os
import json
import shutil
import zipfile
import io
import asyncio
import jwt
import bcrypt
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime, timedelta

from .database import get_db, engine, Base, async_session
from .models import Entry, AuditLog, User

DATA_DIR = "/app/data"
RECEIPTS_DIR = os.path.join(DATA_DIR, "receipts")
os.makedirs(RECEIPTS_DIR, exist_ok=True)

SECRET_KEY = "pyrotrack-local-secure-key-change-this-to-something-longer-32bytes"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try: return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception: return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # SELF-HEALING DB MIGRATION
        new_user_columns = [
            ("brand", "VARCHAR"), ("agency", "VARCHAR"), ("cylinder_number", "VARCHAR"),
            ("registered_name", "VARCHAR"), ("agency_location", "VARCHAR"),
            ("agency_number", "VARCHAR"), ("delivery_boy_name", "VARCHAR"),
            ("delivery_boy_number", "VARCHAR"), ("notes", "TEXT")
        ]
        for col, col_type in new_user_columns:
            try: await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
            except Exception: pass
            
        new_entry_columns = [("user_id", "INTEGER DEFAULT 1"), ("commission", "FLOAT DEFAULT 0.0"), ("receipt_path", "VARCHAR")]
        for col, col_type in new_entry_columns:
            try: await conn.execute(text(f"ALTER TABLE entries ADD COLUMN {col} {col_type}"))
            except Exception: pass
            
    async with async_session() as db:
        result = await db.execute(select(User).filter(User.id == 1))
        if not result.scalars().first():
            db.add(User(id=1, username="family", password_hash=get_password_hash("password")))
            await db.commit()
    yield

app = FastAPI(title="Pyrotrack API", version="2.0.2", lifespan=lifespan)

### ─── AUTH DEPENDENCIES ──────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None: raise HTTPException(status_code=401)
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).filter(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None: raise HTTPException(status_code=401)
    return user

### ─── PYDANTIC SCHEMAS ─────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    brand: Optional[str] = None
    agency: Optional[str] = None
    cylinder_number: Optional[str] = None
    registered_name: Optional[str] = None
    agency_location: Optional[str] = None
    agency_number: Optional[str] = None
    delivery_boy_name: Optional[str] = None
    delivery_boy_number: Optional[str] = None
    notes: Optional[str] = None
    class Config: from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    brand: Optional[str] = None
    agency: Optional[str] = None
    cylinder_number: Optional[str] = None
    registered_name: Optional[str] = None
    agency_location: Optional[str] = None
    agency_number: Optional[str] = None
    delivery_boy_name: Optional[str] = None
    delivery_boy_number: Optional[str] = None
    notes: Optional[str] = None

class EntryBase(BaseModel):
    ordered: Optional[date] = None
    paid: Optional[float] = None
    commission: Optional[float] = 0.0
    received: Optional[date] = None
    started: Optional[date] = None
    finished: Optional[date] = None
    receipt_path: Optional[str] = None

class EntryCreate(EntryBase): pass
class EntryUpdate(EntryBase): pass

class EntryResponse(EntryBase):
    id: int
    user_id: int
    class Config: from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    action: str
    entry_id: Optional[int]
    details: Optional[str]
    class Config: from_attributes = True

### ─── AUTH & PROFILE ROUTES ──────────────────────────────────────────
@app.post("/api/v1/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == user.username))
    if result.scalars().first(): raise HTTPException(status_code=400, detail="Username taken")
    db.add(User(username=user.username, password_hash=get_password_hash(user.password)))
    await db.commit()
    return {"message": "User created successfully"}

@app.post("/api/v1/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == form_data.username))
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = jwt.encode({"sub": str(user.id), "exp": datetime.utcnow() + timedelta(days=30)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/v1/users/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/api/v1/users/me")
async def update_profile(user_update: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    update_data = user_update.dict(exclude_unset=True)
    changes = {}
    
    if "username" in update_data:
        result = await db.execute(select(User).filter(User.username == update_data["username"]))
        existing_user = result.scalars().first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Username is already taken")
        if current_user.username != update_data["username"]:
            changes["username"] = {"old": current_user.username, "new": update_data["username"]}
            current_user.username = update_data["username"]
    
    if "password" in update_data:
        current_user.password_hash = get_password_hash(update_data["password"])
        changes["password"] = {"old": "***", "new": "***"}
        
    for field in ["brand", "agency", "cylinder_number", "registered_name", "agency_location", "agency_number", "delivery_boy_name", "delivery_boy_number", "notes"]:
        if field in update_data:
            old_val = getattr(current_user, field)
            new_val = update_data[field]
            if old_val != new_val:
                changes[field] = {"old": old_val, "new": new_val}
                setattr(current_user, field, new_val)
        
    if changes:
        db.add(AuditLog(action="UPDATE_PROFILE", entry_id=current_user.id, details=json.dumps(changes, default=str)))
        await db.commit()
    else:
        await db.commit()
        
    return {"status": "success", "message": "Profile updated"}

### ─── API ROUTES (PROTECTED) ───────────────────────────────
@app.get("/api/v1/entries", response_model=List[EntryResponse])
async def get_all_entries(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Entry).filter(Entry.user_id == current_user.id).order_by(Entry.ordered.desc()))
    return result.scalars().all()

@app.post("/api/v1/entries", response_model=EntryResponse)
async def create_entry(entry: EntryCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_entry = Entry(**entry.dict(exclude_unset=True), user_id=current_user.id)
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    db.add(AuditLog(action="CREATE", entry_id=new_entry.id, details=json.dumps(entry.dict(exclude_unset=True), default=str)))
    await db.commit()
    return new_entry

@app.put("/api/v1/entries/{entry_id}", response_model=EntryResponse)
async def update_entry(entry_id: int, entry_data: EntryUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Entry).filter(Entry.id == entry_id, Entry.user_id == current_user.id))
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
async def delete_entry(entry_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Entry).filter(Entry.id == entry_id, Entry.user_id == current_user.id))
    db_entry = result.scalars().first()
    if not db_entry: raise HTTPException(status_code=404, detail="Entry not found")
     
    old_data = {c.name: getattr(db_entry, c.name) for c in Entry.__table__.columns}
    await db.delete(db_entry)
    db.add(AuditLog(action="DELETE", entry_id=entry_id, details=json.dumps(old_data, default=str)))
    await db.commit()
    return {"status": "success"}

@app.get("/api/v1/audit", response_model=List[AuditLogResponse])
async def get_audit_logs(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()))
    return result.scalars().all()

@app.post("/api/v1/entries/{entry_id}/receipt")
async def upload_receipt(entry_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Entry).filter(Entry.id == entry_id, Entry.user_id == current_user.id))
    db_entry = result.scalars().first()
    if not db_entry: raise HTTPException(status_code=404)

    file_ext = file.filename.split(".")[-1]
    safe_filename = f"receipt_{entry_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
    file_path = os.path.join(RECEIPTS_DIR, safe_filename)
     
    contents = await file.read()
    with open(file_path, "wb") as f: f.write(contents)
         
    old_path = db_entry.receipt_path
    db_entry.receipt_path = f"/api/v1/receipts/{safe_filename}"
    await db.commit()
     
    db.add(AuditLog(action="UPDATE", entry_id=entry_id, details=json.dumps({"receipt_path": {"old": old_path, "new": db_entry.receipt_path}})))
    await db.commit()
    return db_entry

### ─── SYSTEM OPERATIONS ────────────────────────────────────
@app.get("/api/v1/backup")
async def download_backup():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("PRAGMA wal_checkpoint(TRUNCATE);"))
            await conn.commit()
    except Exception: pass
     
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for db_file in ["util_data.db", "util_data.db-wal", "util_data.db-shm"]:
            db_path = os.path.join(DATA_DIR, db_file)
            if os.path.exists(db_path): zip_file.write(db_path, db_file)
        for root, _, files in os.walk(RECEIPTS_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                zip_file.write(file_path, os.path.relpath(file_path, DATA_DIR))
    zip_buffer.seek(0)
    return Response(content=zip_buffer.getvalue(), media_type="application/x-zip-compressed", headers={"Content-Disposition": f"attachment; filename=pyrotrack_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.zip"})

async def execute_restore_and_reboot(temp_extract_dir: str):
    await asyncio.sleep(1.0)
    try: await engine.dispose()
    except Exception: pass
    await asyncio.sleep(0.5)

    try:
        for old_file in ["util_data.db", "util_data.db-wal", "util_data.db-shm"]:
            old_path, bak_path = os.path.join(DATA_DIR, old_file), os.path.join(DATA_DIR, old_file + ".bak")
            if os.path.exists(old_path):
                if os.path.exists(bak_path):
                    try: os.remove(bak_path)
                    except: pass
                try: os.rename(old_path, bak_path)
                except: pass

        for extracted_file in os.listdir(temp_extract_dir):
            source_path = os.path.join(temp_extract_dir, extracted_file)
            if "util_data.db" in extracted_file: shutil.move(source_path, os.path.join(DATA_DIR, extracted_file))
            else: shutil.move(source_path, os.path.join(RECEIPTS_DIR, extracted_file))
    finally:
        shutil.rmtree(temp_extract_dir, ignore_errors=True)
        os._exit(0)

@app.post("/api/v1/restore")
async def restore_backup(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith('.zip'): raise HTTPException(status_code=400, detail="Must be a .zip file")
    temp_zip_path = os.path.join(DATA_DIR, "temp_restore.zip")
    temp_extract_dir = os.path.join(DATA_DIR, "temp_extract")
    
    if os.path.exists(temp_extract_dir): shutil.rmtree(temp_extract_dir, ignore_errors=True)
    os.makedirs(temp_extract_dir, exist_ok=True)
    
    contents = await file.read()
    with open(temp_zip_path, "wb") as f: f.write(contents)
        
    try:
        valid_db_found = False
        with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
            for member in zip_ref.namelist():
                filename = os.path.basename(member)
                if not filename or filename.startswith("._"): continue
                if "util_data.db" in filename:
                    if filename == "util_data.db": valid_db_found = True
                    with zip_ref.open(member) as source, open(os.path.join(temp_extract_dir, filename), "wb") as target: shutil.copyfileobj(source, target)
                elif "receipt_" in member or "receipts/" in member:
                    with zip_ref.open(member) as source, open(os.path.join(temp_extract_dir, filename), "wb") as target: shutil.copyfileobj(source, target)
                        
        if not valid_db_found: raise Exception("Invalid backup file: util_data.db not found.")
        os.remove(temp_zip_path)
        background_tasks.add_task(execute_restore_and_reboot, temp_extract_dir)
        return {"status": "success"}
    except Exception as e:
        if os.path.exists(temp_zip_path): os.remove(temp_zip_path)
        if os.path.exists(temp_extract_dir): shutil.rmtree(temp_extract_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

### ─── SERVE REACT FRONTEND ──────────────────────────────
app.mount("/api/v1/receipts", StaticFiles(directory=RECEIPTS_DIR), name="receipts")
static_dir = "/frontend_build"
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    @app.exception_handler(404)
    async def fallback_to_index(request, exc): return FileResponse(os.path.join(static_dir, "index.html"))
