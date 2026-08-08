from sqlalchemy import Column, Integer, Float, Date, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    # 📋 ONE-TIME GAS CONNECTION INFO
    brand = Column(String, nullable=True)
    agency = Column(String, nullable=True)
    cylinder_number = Column(String, nullable=True)
    registered_name = Column(String, nullable=True)
    agency_location = Column(String, nullable=True)
    agency_number = Column(String, nullable=True)
    delivery_boy_name = Column(String, nullable=True)
    delivery_boy_number = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    
    # Dates & Finances
    ordered = Column(Date, nullable=True)
    paid = Column(Float, nullable=True)
    commission = Column(Float, default=0.0)
    received = Column(Date, nullable=True)
    started = Column(Date, nullable=True)
    finished = Column(Date, nullable=True)
    receipt_path = Column(String, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Changed from datetime.utcnow to datetime.now
    timestamp = Column(DateTime, default=datetime.now)
    action = Column(String, nullable=False)
    entry_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
