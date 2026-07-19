from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    github_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    repositories = relationship("Repository", back_populates="user", cascade="all, delete-orphan")


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    local_path = Column(String, nullable=False)
    remote_url = Column(String, nullable=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="repositories")
    scans = relationship("Scan", back_populates="repository", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    triggered_by = Column(String, default="manual")  # manual, daemon, git_hook
    status = Column(String, default="running")  # running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    secrets_found = Column(Integer, default=0)
    secrets_sanitized = Column(Integer, default=0)
    secrets_safe = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    repository = relationship("Repository", back_populates="scans")
    secrets = relationship("Secret", back_populates="scan", cascade="all, delete-orphan")


class Secret(Base):
    __tablename__ = "secrets"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    file_path = Column(String, nullable=False)
    line_number = Column(Integer, nullable=False)
    matched_text = Column(String, nullable=False)  # Stored masked/hashed in production
    rule_name = Column(String, nullable=False)
    entropy_score = Column(Float, default=0.0)
    ast_context = Column(JSON, nullable=True)
    ml_classification = Column(String, nullable=True)  # production_context or mock_test_context
    ml_confidence = Column(Float, default=0.0)
    action_taken = Column(String, default="flagged")  # sanitized, bypassed, flagged
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("Scan", back_populates="secrets")


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, default="INFO")
    message = Column(Text, nullable=False)
    source = Column(String, default="system")
    created_at = Column(DateTime, default=datetime.utcnow)
