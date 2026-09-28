from backend.main import app
import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Iniciando o Controle Financeiro Web em http://127.0.0.1:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
