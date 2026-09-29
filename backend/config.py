import os
from dotenv import load_dotenv

load_dotenv()

# Configuração do Supabase (Cloud Database & Auth)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hjqvinukknoqdrdymish.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcXZpbnVra25vcWRyZHltaXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTIzNjEsImV4cCI6MjEwNjE4ODM2MX0.AEmBW0xamV0hl2rXgVEGOu0DaYvfeXnnU4XIr-8qYXs")

IS_SUPABASE_ACTIVE = bool(SUPABASE_URL and SUPABASE_KEY)
DB_NAME = "financeiro.db"
