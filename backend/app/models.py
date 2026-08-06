from sqlalchemy import Column, Integer, Float, Date
from .database import Base

class Entry(Base):
    __tablename__ = "entries"

    # MAGIC TRICK: Map SQLite's hidden 'rowid' to our SQLAlchemy 'id'
    id = Column("rowid", Integer, primary_key=True)
    ordered = Column(Date, nullable=True)
    paid = Column(Float, nullable=True)
    received = Column(Date, nullable=True)
    commission = Column(Float, nullable=True)
    started = Column(Date, nullable=True)
    finished = Column(Date, nullable=True)
