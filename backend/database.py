import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
import backend.config as config

# Supabase Client Singleton
_supabase_client = None

def get_supabase_client():
    global _supabase_client
    if _supabase_client is None and config.IS_SUPABASE_ACTIVE:
        try:
            from supabase import create_client
            _supabase_client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
        except Exception as e:
            print(f"[AVISO] Erro ao conectar ao Supabase: {e}. Usando SQLite local.")
            _supabase_client = None
    return _supabase_client

# SQLite connection helper
def get_sqlite_connection():
    conn = sqlite3.connect(config.DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa as tabelas no SQLite local."""
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
        valor REAL NOT NULL,
        descricao TEXT NOT NULL,
        categoria TEXT NOT NULL,
        data TEXT NOT NULL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()

def db_mode_description() -> str:
    client = get_supabase_client()
    return "Supabase (Cloud)" if client else "SQLite (Local)"

def adicionar_transacao(tipo: str, valor: float, descricao: str, categoria: str, data_transacao: str) -> Dict[str, Any]:
    client = get_supabase_client()
    if client:
        payload = {
            "tipo": tipo,
            "valor": valor,
            "descricao": descricao,
            "categoria": categoria,
            "data": data_transacao
        }
        res = client.table("transacoes").insert(payload).execute()
        if res.data and len(res.data) > 0:
            item = res.data[0]
            item["criado_em"] = str(item.get("criado_em", datetime.now().isoformat()))
            return item

    # Fallback to SQLite
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transacoes (tipo, valor, descricao, categoria, data)
        VALUES (?, ?, ?, ?, ?)
    """, (tipo, valor, descricao, categoria, data_transacao))
    conn.commit()
    novo_id = cursor.lastrowid

    cursor.execute("SELECT * FROM transacoes WHERE id = ?", (novo_id,))
    item = dict(cursor.fetchone())
    conn.close()
    return item

def listar_transacoes(tipo: Optional[str] = None, categoria: Optional[str] = None, limite: int = 50) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        query = client.table("transacoes").select("*")
        if tipo:
            query = query.eq("tipo", tipo.lower().strip())
        if categoria:
            query = query.ilike("categoria", f"%{categoria.strip()}%")
        
        query = query.order("data", desc=True).limit(limite)
        res = query.execute()
        items = res.data or []
        for it in items:
            it["criado_em"] = str(it.get("criado_em", ""))
        return items

    # Fallback SQLite
    conn = get_sqlite_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM transacoes WHERE 1=1"
    params = []

    if tipo:
        sql += " AND tipo = ?"
        params.append(tipo.lower().strip())
    if categoria:
        sql += " AND categoria LIKE ?"
        params.append(f"%{categoria.strip()}%")

    sql += " ORDER BY data DESC, id DESC LIMIT ?"
    params.append(limite)

    cursor.execute(sql, params)
    itens = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return itens

def obter_saldo() -> Dict[str, Any]:
    client = get_supabase_client()
    if client:
        res_receitas = client.table("transacoes").select("valor").eq("tipo", "receita").execute()
        total_receitas = sum([item["valor"] for item in (res_receitas.data or [])])

        res_despesas = client.table("transacoes").select("valor").eq("tipo", "despesa").execute()
        total_despesas = sum([item["valor"] for item in (res_despesas.data or [])])

        res_count = client.table("transacoes").select("id", count="exact").execute()
        count = res_count.count if res_count.count is not None else len(res_receitas.data or []) + len(res_despesas.data or [])

        saldo = total_receitas - total_despesas
        return {
            "total_receitas": round(total_receitas, 2),
            "total_despesas": round(total_despesas, 2),
            "saldo_atual": round(saldo, 2),
            "quantidade_transacoes": count,
            "banco_dados": "Supabase (Cloud)"
        }

    # Fallback SQLite
    conn = get_sqlite_connection()
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
        "quantidade_transacoes": quantidade,
        "banco_dados": "SQLite (Local)"
    }

def excluir_transacao(transacao_id: int) -> bool:
    client = get_supabase_client()
    if client:
        # Check if exists
        check = client.table("transacoes").select("id").eq("id", transacao_id).execute()
        if not check.data:
            return False
        client.table("transacoes").delete().eq("id", transacao_id).execute()
        return True

    # Fallback SQLite
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM transacoes WHERE id = ?", (transacao_id,))
    if not cursor.fetchone():
        conn.close()
        return False

    cursor.execute("DELETE FROM transacoes WHERE id = ?", (transacao_id,))
    conn.commit()
    conn.close()
    return True
