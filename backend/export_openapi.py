import json
from backend.main import app

def export_spec():
    spec = app.openapi()
    with open("openapi.json", "w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2, ensure_ascii=False)
    print("openapi.json exportado com sucesso!")

if __name__ == "__main__":
    export_spec()
