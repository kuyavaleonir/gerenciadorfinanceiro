import os
import uvicorn
from backend.main import app as asgi_app
from a2wsgi import ASGIMiddleware

_wsgi_app = ASGIMiddleware(asgi_app)

class UniversalApp:
    def __call__(self, *args, **kwargs):
        if len(args) == 2:
            return _wsgi_app(*args, **kwargs)
        return asgi_app(*args, **kwargs)

app = UniversalApp()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Iniciando o Controle Financeiro Web em http://127.0.0.1:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
