import os
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.models import TransacaoEntrada, TransacaoResposta, SaldoResposta
import backend.database as database

# Inicializa o banco SQLite de segurança se necessário
database.init_db()

app = FastAPI(
    title="Assistente de Controle Financeiro",
    description="API para gerenciar transações financeiras pessoais com suporte a Web Dashboard, Custom GPTs do ChatGPT e Supabase.",
    version="2.0.0"
)

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretórios estáticos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/health", summary="Health Check")
def health_check():
    """Verifica se o servidor e o banco de dados estão ativos."""
    db_mode = database.db_mode_description()
    return {"status": "ok", "mensagem": "API do Controle Financeiro está ativa!", "banco_dados": db_mode}

@app.post("/api/transacoes", response_model=TransacaoResposta, summary="Adicionar nova transação (receita ou despesa)")
def adicionar_transacao(transacao: TransacaoEntrada):
    """Registra uma nova receita ou despesa financeira no banco de dados ativo (Supabase ou SQLite)."""
    tipo = transacao.tipo.lower().strip()
    if tipo not in ["receita", "despesa"]:
        raise HTTPException(status_code=400, detail="O tipo deve ser 'receita' ou 'despesa'.")

    data_transacao = transacao.data if transacao.data else datetime.now().strftime("%Y-%m-%d")

    item = database.adicionar_transacao(
        tipo=tipo,
        valor=transacao.valor,
        descricao=transacao.descricao.strip(),
        categoria=transacao.categoria.strip(),
        data_transacao=data_transacao
    )
    return item

@app.get("/api/transacoes", response_model=List[TransacaoResposta], summary="Listar transações")
def listar_transacoes(
    tipo: Optional[str] = Query(None, description="Filtrar por 'receita' ou 'despesa'"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria específica"),
    limite: int = Query(50, description="Quantidade máxima de itens retornados")
):
    """Retorna uma lista das transações mais recentes cadastradas."""
    return database.listar_transacoes(tipo=tipo, categoria=categoria, limite=limite)

@app.get("/api/atividade-mensal", summary="Atividade financeira por mês")
def atividade_mensal():
    """Retorna totais de receitas e despesas agrupados por mês (últimos 12 meses)."""
    return database.obter_atividade_mensal()


@app.get("/api/saldo", response_model=SaldoResposta, summary="Consultar saldo e totais acumulados")
def consultar_saldo():
    """Retorna o total de receitas, total de despesas e o saldo líquido atual."""
    return database.obter_saldo()

@app.delete("/api/transacoes/{transacao_id}", summary="Remover uma transação pelo ID")
def excluir_transacao(transacao_id: int):
    """Exclui uma transação existente pelo seu ID."""
    sucesso = database.excluir_transacao(transacao_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")
    return {"status": "sucesso", "mensagem": f"Transação #{transacao_id} removida com sucesso."}

@app.get("/", summary="Dashboard Web")
def serve_index():
    """Serve a interface Web interativa."""
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse({"mensagem": "Interface Web em construção."})
