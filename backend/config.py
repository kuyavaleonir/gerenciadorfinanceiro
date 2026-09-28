import os
from dotenv import load_dotenv

load_dotenv()

USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() in ["true", "1", "t"]
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Auto-detect Supabase if credentials are present
IS_SUPABASE_ACTIVE = bool(SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "https://seu-projeto.supabase.co") or USE_SUPABASE

DB_NAME = "financeiro.db"
