import json
from main import app

def export():
    openapi_schema = app.openapi()
    with open("openapi.json", "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    print("Arquivo 'openapi.json' gerado com sucesso!")

if __name__ == "__main__":
    export()
