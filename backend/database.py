from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./artha.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    mobile = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_resend_count = Column(Integer, default=0)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    capital = Column(Float, default=50000.0)
    risk_percent = Column(Float, default=2.0)
    experience_level = Column(String, default="beginner")
    created_at = Column(DateTime, default=datetime.utcnow)

class UserWatchlist(Base):
    __tablename__ = "watchlists"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    symbol = Column(String, nullable=False)
    exchange = Column(String, default="NSE")

class AlertHistory(Base):
    __tablename__ = "alert_history"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    symbol = Column(String)
    alert_type = Column(String)
    confidence = Column(Float)
    was_correct = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
