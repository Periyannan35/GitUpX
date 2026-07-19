import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# SQLite setup with check_same_thread=False for FastAPI/Daemon background threads
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models import db_models
    from app.core.logger import logger
    from app.core.security import get_password_hash
    from pathlib import Path
    
    logger.info("Initializing database schema...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if not existing_tables:
        logger.info("No existing tables found. Creating database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    else:
        logger.info(f"Database tables already exist: {existing_tables}")
        # Ensure all tables defined in models are present
        Base.metadata.create_all(bind=engine)

    # Seed default user and test repository for immediate live scanning capability
    db = SessionLocal()
    try:
        user = db.query(db_models.User).first()
        if not user:
            user = db_models.User(
                email="admin@gitupx.local",
                hashed_password=get_password_hash("supersecret123"),
                github_token="ghp_demo_secret_token_1234567890"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Seeded default user: {user.email}")

        test_repo_path = str(settings.get_root_dir() / "test_repo")
        if Path(test_repo_path).exists():
            repo = db.query(db_models.Repository).filter(db_models.Repository.local_path == test_repo_path).first()
            if not repo:
                repo = db_models.Repository(
                    user_id=user.id,
                    local_path=test_repo_path,
                    name="gitupx-test-repo",
                    is_active=True
                )
                db.add(repo)
                db.commit()
                logger.info(f"Seeded default test repository: {test_repo_path}")
    except Exception as e:
        logger.error(f"Error seeding initial database state: {e}")
    finally:
        db.close()
