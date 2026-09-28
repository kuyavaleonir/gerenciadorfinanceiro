from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import database

# Inicializa o banco de dados
database.init_db()

app = FastAPI(
    title="Assistente de Controle Financeiro",
    description="API para gerenciar transações financeiras pessoais (receitas, despesas, saldo e relatórios) com suporte a Custom GPT do ChatGPT.",
    version="1.0.0"
)

# CORS liberado para permitir conexões externas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransacaoEntrada(BaseModel):
    tipo: str = Field(..., description="Tipo da transação: 'receita' ou 'despesa'", example="despesa")
    valor: float = Field(..., gt=0, description="Valor monetário em reais (deve ser maior que zero)", example=45.50)
    descricao: str = Field(..., description="Descrição resumida do gasto ou ganho", example="Almoço no restaurante")
    categoria: str = Field(..., description="Categoria (ex: Alimentação, Transporte, Moradia, Lazer, Salário, Investimentos)", example="Alimentação")
    data: Optional[str] = Field(None, description="Data da transação no formato YYYY-MM-DD. Se omitida, usará a data atual.", example="2026-09-28")

class TransacaoResposta(BaseModel):
    id: int
    tipo: str
    valor: float
    descricao: str
    categoria: str
    data: str
    criado_em: str

class SaldoResposta(BaseModel):
    total_receitas: float
    total_despesas: float
    saldo_atual: float
    quantidade_transacoes: int

@app.get("/", summary="Health Check")
def raiz():
    """Verifica se o servidor está funcionando."""
    return {"status": "ok", "mensagem": "API do Controle Financeiro está ativa!"}

@app.post("/api/transacoes", response_model=TransacaoResposta, summary="Adicionar nova transação (receita ou despesa)")
def adicionar_transacao(transacao: TransacaoEntrada):
    """
    Registra uma nova receita ou despesa financeira.
    O ChatGPT chamará esta ação sempre que o usuário disser que gastou ou recebeu dinheiro.
    """
    tipo = transacao.tipo.lower().strip()
    if tipo not in ["receita", "despesa"]:
        raise HTTPException(status_code=400, detail="O tipo deve ser 'receita' ou 'despesa'.")

    data_transacao = transacao.data if transacao.data else datetime.now().strftime("%Y-%m-%d")

    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transacoes (tipo, valor, descricao, categoria, data)
        VALUES (?, ?, ?, ?, ?)
    """, (tipo, transacao.valor, transacao.descricao.strip(), transacao.categoria.strip(), data_transacao))
    conn.commit()
    novo_id = cursor.lastrowid

    cursor.execute("SELECT * FROM transacoes WHERE id = ?", (novo_id,))
    item = cursor.fetchone()
    conn.close()

    return dict(item)

@app.get("/api/transacoes", response_model=List[TransacaoResposta], summary="Listar transações")
def listar_transacoes(
    tipo: Optional[str] = Query(None, description="Filtrar por 'receita' ou 'despesa'"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria específica"),
    limite: int = Query(20, description="Quantidade máxima de itens retornados")
):
    """Retorna uma lista das transações mais recentes cadastradas."""
    conn = database.get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM transacoes WHERE 1=1"
    params = []

    if tipo:
        query += " AND tipo = ?"
        params.append(tipo.lower().strip())
    if categoria:
        query += " AND categoria LIKE ?"
        params.append(f"%{categoria.strip()}%")

    query += " ORDER BY data DESC, id DESC LIMIT ?"
    params.append(limite)

    cursor.execute(query, params)
    itens = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return itens

@app.get("/api/saldo", response_model=SaldoResposta, summary="Consultar saldo e totais acumulados")
def consultar_saldo():
    """
    Retorna o total de receitas, total de despesas e o saldo líquido atual.
    O ChatGPT chamará esta ação quando o usuário perguntar 'quanto tenho?', 'qual meu saldo?', etc.
    """
    conn = database.get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COALESCE(SUM(valor), 0) FROM transacoes WHERE tipo = 'receita'")
    total_receitas = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(valor), 0) FROM transacoes WHERE tipo = 'despesa'")
    total_despesas = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM transacoes")
    quantidade = cursor.fetchone()[0]

    conn.close()

    saldo = total_receitas - total_despesas
    return {
        "total_receitas": round(total_receitas, 2),
        "total_despesas": round(total_despesas, 2),
        "saldo_atual": round(saldo, 2),
        "quantidade_transacoes": quantidade
    }

@app.delete("/api/transacoes/{transacao_id}", summary="Remover uma transação pelo ID")
def excluir_transacao(transacao_id: int):
    """Exclui uma transação existente caso o usuário tenha registrado por engano."""
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM transacoes WHERE id = ?", (transacao_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Transação não encontrada.")

    cursor.execute("DELETE FROM transacoes WHERE id = ?", (transacao_id,))
    conn.commit()
    conn.close()
    return {"status": "sucesso", "mensagem": f"Transação #{transacao_id} removida com sucesso."}
