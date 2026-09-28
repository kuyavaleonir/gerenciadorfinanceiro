import os
import json
import urllib.request
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "banco_dados" in data

def test_serve_index_html():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "Controle Financeiro Pro" in response.text

def test_html_auth_elements_present():
    response = client.get("/")
    html = response.text

    # Verifica os elementos chave da nova interface de autenticação
    assert 'id="auth-screen"' in html
    assert 'id="tab-btn-login"' in html
    assert 'id="tab-btn-register"' in html
    assert 'id="auth-alert"' in html
    assert 'id="auth-view-login"' in html
    assert 'id="auth-view-register"' in html
    assert 'id="auth-view-forgot"' in html
    assert 'id="form-login"' in html
    assert 'id="form-register"' in html
    assert 'id="form-forgot-password"' in html
    assert 'id="btn-google-login"' in html
    assert 'id="btn-demo-login"' in html
    assert 'btn-toggle-password' in html

def test_no_hardcoded_user_credentials_in_html():
    response = client.get("/")
    html = response.text

    # Verifica se os inputs de login não possuem mais valores hardcoded embutidos
    assert 'value="kuyavaleonir@gmail.com"' not in html
    assert 'value="123456"' not in html

def test_supabase_auth_live_endpoint():
    """Valida se as credenciais do Supabase configuradas no frontend respondem corretamente."""
    supabase_url = "https://hjqvinukknoqdrdymish.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcXZpbnVra25vcWRyZHltaXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTIzNjEsImV4cCI6MjEwNjE4ODM2MX0.AEmBW0xamV0hl2rXgVEGOu0DaYvfeXnnU4XIr-8qYXs"
    
    req = urllib.request.Request(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        headers={
            "apikey": anon_key,
            "Content-Type": "application/json"
        },
        data=json.dumps({
            "email": "invalido@teste.com",
            "password": "senha_incorreta_123"
        }).encode("utf-8")
    )

    try:
        urllib.request.urlopen(req)
        assert False, "Deveria ter retornado erro 400 para credenciais inválidas"
    except urllib.error.HTTPError as err:
        # Supabase retorna HTTP 400 com "Invalid login credentials"
        assert err.code == 400
        body = json.loads(err.read().decode())
        assert "error_description" in body or "msg" in body
        msg = body.get("error_description") or body.get("msg")
        assert "Invalid login credentials" in msg

def test_transacoes_api():
    # Testa consulta de saldo e listagem
    response = client.get("/api/saldo")
    assert response.status_code == 200
    saldo = response.json()
    assert "saldo_atual" in saldo
    assert "total_receitas" in saldo
    assert "total_despesas" in saldo
