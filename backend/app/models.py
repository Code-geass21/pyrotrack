from sqlalchemy import Column, Integer, Float, Date, String, DateTime, Text
from datetime import datetime
from .database import Base

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ordered = Column(Date, nullable=True)
    paid = Column(Float, nullable=True)
    received = Column(Date, nullable=True)
    commission = Column(Float, nullable=True)
    started = Column(Date, nullable=True)
    finished = Column(Date, nullable=True)
    receipt_path = Column(String, nullable=True) # 📸 NEW: Stores the image filename

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String, nullable=False)
    entry_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
