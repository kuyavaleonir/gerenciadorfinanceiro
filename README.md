# 💰 Assistente de Controle Financeiro (Antigravity + ChatGPT + GitHub)

Projeto integrado de controle financeiro pessoal, desenvolvido com **FastAPI** e **SQLite**, integrado ao **GitHub** e preparado para ser controlado por voz ou texto através de um **Custom GPT** no aplicativo oficial do **ChatGPT** (no Celular e no Computador).

---

## 📱 Como funciona a integração no Celular e PC

1. **Você envia uma mensagem no app do ChatGPT** (celular ou computador):
   - *"Gastei R$ 42,90 no almoço"*
   - *"Recebi R$ 3.500 de salário hoje"*
   - *"Qual é o meu saldo atual?"*
   - *"Liste meus últimos gastos com transporte"*
2. **O Custom GPT interpreta em linguagem natural** e aciona as ações da API automaticamente.
3. **Os dados ficam salvos de forma segura** no banco de dados.

---

## 🛠️ Estrutura do Projeto

- `main.py`: Endpoints da API (receitas, despesas, saldo, filtros).
- `database.py`: Conexão e tabelas SQLite (`transacoes`).
- `export_openapi.py`: Gera o arquivo `openapi.json` pronto para colar nas Actions do Custom GPT.
- `requirements.txt`: Dependências do Python (FastAPI, Uvicorn, Pydantic).
- `openapi.json`: Esquema de funções que o ChatGPT lê para executar comandos.

---

## 🚀 Como Iniciar o Servidor Localmente

Abra o terminal na pasta do projeto e execute:

```powershell
uvicorn main:app --reload --port 8000
```

Acesse no navegador:
- Painel interativo: `http://localhost:8000/docs`
- Verificação de status: `http://localhost:8000/`

---

## 🤖 Como Conectar ao Custom GPT (ChatGPT Plus)

1. No navegador do computador, acesse [chatgpt.com/gpts/editor](https://chatgpt.com/gpts/editor) (ou clique em **Explorar GPTs** > **+ Criar**).
2. Na aba **Configure**:
   - **Nome**: *Meu Consultor Financeiro*
   - **Descrição**: *Assistente para gerenciar receitas, despesas e saldo pessoal.*
   - **Instruções**:
     ```text
     Você é o assistente financeiro pessoal do usuário.
     Sempre que ele relatar um gasto ou receita, chame a ação de criar transação.
     Sempre confirme os valores registrados de forma amigável e resumida.
     Quando ele pedir saldo ou resumo, chame as ações correspondentes e apresente tudo formatado em Reais (R$).
     ```
3. Role até o final e clique em **Criar nova ação (Create new action)**.
4. No campo **Schema**, copie e cole todo o conteúdo do arquivo `openapi.json` deste projeto.
5. Em **Server URL** (no schema ou configuração):
   - Enquanto estiver testando no seu computador, você pode expor sua porta 8000 na internet com uma ferramenta gratuita e segura como o **ngrok** (`ngrok http 8000`) ou **cloudflared**.
   - Ou fazer o deploy gratuito do repositório no **Render.com** ou **Railway**.
6. Salve o GPT como **Apenas eu (Only me)**.
7. Pronto! Agora abra o aplicativo do **ChatGPT no seu celular** ou no **computador**, selecione o seu GPT criado e comece a controlar suas finanças por áudio ou texto!
