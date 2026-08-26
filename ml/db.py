"""
Database connection utility for TrueSpec ML pipeline.
Connects to local MySQL database by default using credentials from environment variables.
Supports SQLite fallback for local developer preview when MySQL server is not running.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables from root or backend
root_env = Path(__file__).resolve().parent.parent / '.env'
backend_env = Path(__file__).resolve().parent.parent / 'backend' / '.env'
if root_env.exists():
    load_dotenv(root_env)
elif backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "truespec")

def get_db_engine(force_sqlite=False):
    """
    Returns an SQLAlchemy engine for database operations.
    Defaults to MySQL localhost:3306.
    """
    if force_sqlite or os.getenv("USE_SQLITE", "false").lower() == "true":
        db_path = Path(__file__).resolve().parent.parent / 'data' / 'truespec.db'
        os.makedirs(db_path.parent, exist_ok=True)
        return create_engine(f"sqlite:///{db_path}")

    # MySQL connection string
    password_part = f":{DB_PASSWORD}" if DB_PASSWORD else ""
    mysql_uri = f"mysql+mysqlconnector://{DB_USER}{password_part}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    try:
        engine = create_engine(mysql_uri, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return engine
    except Exception as e:
        # Fallback to local SQLite file in data/ if MySQL server is not running locally
        print(f"[TrueSpec DB] Notice: Local MySQL ({mysql_uri}) not reachable ({e}).")
        print("[TrueSpec DB] Using local data/truespec.db SQLite fallback so pipeline runs uninterrupted.")
        db_path = Path(__file__).resolve().parent.parent / 'data' / 'truespec.db'
        os.makedirs(db_path.parent, exist_ok=True)
        return create_engine(f"sqlite:///{db_path}")

def init_tables_if_needed(engine):
    """
    Ensures the exact schema tables exist in the target database
    matching backend migrations:
    1. laptops
    2. reviews
    3. laptop_scores
    """
    is_sqlite = "sqlite" in str(engine.url)
    
    with engine.begin() as conn:
        if is_sqlite:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS laptops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand VARCHAR(100) NOT NULL,
                model_name VARCHAR(255) NOT NULL,
                cpu_name VARCHAR(255) NOT NULL,
                cpu_score INTEGER NOT NULL,
                gpu_name VARCHAR(255) NOT NULL,
                gpu_score INTEGER NOT NULL,
                ram_gb INTEGER NOT NULL,
                storage_type VARCHAR(50) NOT NULL,
                storage_gb INTEGER NOT NULL,
                display_size FLOAT NOT NULL,
                refresh_rate INTEGER NOT NULL,
                battery_wh FLOAT NOT NULL,
                weight_kg FLOAT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                os VARCHAR(100) NOT NULL,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """))

            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                laptop_id INTEGER NOT NULL,
                source VARCHAR(100) NOT NULL,
                review_text TEXT NOT NULL,
                rating FLOAT NOT NULL,
                verified_purchase BOOLEAN NOT NULL DEFAULT 1,
                review_date VARCHAR(50) DEFAULT NULL,
                is_flagged BOOLEAN NOT NULL DEFAULT 0,
                sentiment_label VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (laptop_id) REFERENCES laptops(id) ON DELETE CASCADE
            );
            """))

            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS laptop_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                laptop_id INTEGER NOT NULL UNIQUE,
                confidence_score FLOAT NOT NULL,
                wilson_lower_bound FLOAT NOT NULL,
                positive_ratio FLOAT NOT NULL,
                review_count INTEGER NOT NULL,
                clean_review_count INTEGER NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (laptop_id) REFERENCES laptops(id) ON DELETE CASCADE
            );
            """))
        else:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS laptops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                brand VARCHAR(100) NOT NULL,
                model_name VARCHAR(255) NOT NULL,
                cpu_name VARCHAR(255) NOT NULL,
                cpu_score INT NOT NULL,
                gpu_name VARCHAR(255) NOT NULL,
                gpu_score INT NOT NULL,
                ram_gb INT NOT NULL,
                storage_type VARCHAR(50) NOT NULL,
                storage_gb INT NOT NULL,
                display_size FLOAT NOT NULL,
                refresh_rate INT NOT NULL,
                battery_wh FLOAT NOT NULL,
                weight_kg FLOAT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                os VARCHAR(100) NOT NULL,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """))

            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                laptop_id INT NOT NULL,
                source VARCHAR(100) NOT NULL,
                review_text TEXT NOT NULL,
                rating FLOAT NOT NULL,
                verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
                review_date VARCHAR(50) DEFAULT NULL,
                is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
                sentiment_label VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (laptop_id) REFERENCES laptops(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """))

            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS laptop_scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                laptop_id INT NOT NULL UNIQUE,
                confidence_score FLOAT NOT NULL,
                wilson_lower_bound FLOAT NOT NULL,
                positive_ratio FLOAT NOT NULL,
                review_count INT NOT NULL,
                clean_review_count INT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (laptop_id) REFERENCES laptops(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """))
