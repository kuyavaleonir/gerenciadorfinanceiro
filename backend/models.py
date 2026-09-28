from pydantic import BaseModel, Field
from typing import Optional

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
    criado_em: Optional[str] = None

class SaldoResposta(BaseModel):
    total_receitas: float
    total_despesas: float
    saldo_atual: float
    quantidade_transacoes: int
    banco_dados: str  # "Supabase (Online)" ou "SQLite (Local)"
