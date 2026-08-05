from sqlalchemy import Column, Integer, Float, Date
from .database import Base

class Entry(Base):
    __tablename__ = "entries"

    # Mapping your exact SQLite schema
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ordered = Column(Date, nullable=True)
    paid = Column(Float, nullable=True)
    received = Column(Date, nullable=True)
    commission = Column(Float, nullable=True)
    started = Column(Date, nullable=True)
    finished = Column(Date, nullable=True)
