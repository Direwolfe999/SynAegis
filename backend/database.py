import sqlite3
import os
import bcrypt
import json
import uuid
import secrets

DB_PATH = os.path.join(os.path.dirname(__file__), "settings.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE,
        bio TEXT,
        password_hash TEXT
    )
    ''')
    
    # API Keys
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        token_hash TEXT,
        token_prefix TEXT,
        created_at TEXT
    )
    ''')
    
    # Integrations
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        provider TEXT,
        token TEXT,
        status TEXT
    )
    ''')

    # Preferences
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS preferences (
        user_id TEXT PRIMARY KEY,
        theme TEXT,
        ui_density TEXT,
        default_ai_model TEXT,
        log_retention TEXT,
        notifications TEXT
    )
    ''')

    # Insert mock user if not exists
    cursor.execute("SELECT * FROM users WHERE email='arivera@synaegis.com'")
    if not cursor.fetchone():
        user_id = str(uuid.uuid4())
        pwd_hash = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode('utf-8')
        cursor.execute("INSERT INTO users (id, first_name, last_name, email, bio, password_hash) VALUES (?, ?, ?, ?, ?, ?)", 
                       (user_id, "Alex", "Rivera", "arivera@synaegis.com", "DevOps Engineer & Platform Architect", pwd_hash))
        
        # default preferences
        cursor.execute("INSERT INTO preferences (user_id, theme, ui_density, default_ai_model, log_retention, notifications) VALUES (?, ?, ?, ?, ?, ?)",
                       (user_id, "dark", "Comfortable (Default)", "Gemini 1.5 Pro (Recommended)", "30 Days", json.dumps({
                           "pipeline_failures": True,
                           "security_threats": True,
                           "weekly_digest": False,
                           "deployment_success": True,
                           "agent_activity": False
                       })))

    conn.commit()
    conn.close()

init_db()

# Ensure onboarding_completed column exists
def apply_migrations():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0")
        conn.commit()
    except sqlite3.OperationalError:
        pass # Column already exists
    conn.close()

apply_migrations()
