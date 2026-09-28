document.addEventListener('DOMContentLoaded', () => {
    // Referências DOM
    const dbIndicator = document.getElementById('db-indicator');
    const dbStatusText = document.getElementById('db-status-text');
    
    const valSaldoAtual = document.getElementById('val-saldo-atual');
    const valTotalReceitas = document.getElementById('val-total-receitas');
    const valTotalDespesas = document.getElementById('val-total-despesas');
    const valQtdTransacoes = document.getElementById('val-qtd-transacoes');
    const saldoStatusText = document.getElementById('saldo-status-text');

    const barReceita = document.getElementById('bar-receita');
    const barDespesa = document.getElementById('bar-despesa');
    const ratioPercent = document.getElementById('ratio-percent');

    const transactionList = document.getElementById('transaction-list');
    const emptyState = document.getElementById('empty-state');

    const searchInput = document.getElementById('search-input');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Modal Referências
    const modalTransacao = document.getElementById('modal-transacao');
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const btnEmptyAdd = document.getElementById('btn-empty-add');
    const btnRefresh = document.getElementById('btn-refresh');
    const formTransacao = document.getElementById('form-transacao');

    const optDespesa = document.getElementById('opt-despesa');
    const optReceita = document.getElementById('opt-receita');

    // Estado da Aplicação
    let currentFilterType = 'todos';
    let currentSearchQuery = '';
    let transacoesData = [];

    // Preenche a data de hoje por padrão no formulário
    const inputData = document.getElementById('data');
    if (inputData) {
        inputData.value = new Date().toISOString().split('T')[0];
    }

    // Inicialização
    carregarDados();

    // Event Listeners
    if (btnRefresh) btnRefresh.addEventListener('click', carregarDados);
    if (btnOpenModal) btnOpenModal.addEventListener('click', abrirModal);
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', abrirModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', fecharModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', fecharModal);

    // Fechar modal clicando fora
    modalTransacao.addEventListener('click', (e) => {
        if (e.target === modalTransacao) fecharModal();
    });

    // Seletor do Tipo (Receita / Despesa)
    optDespesa.addEventListener('click', () => {
        optDespesa.classList.add('selected');
        optReceita.classList.remove('selected');
        optDespesa.querySelector('input').checked = true;
    });

    optReceita.addEventListener('click', () => {
        optReceita.classList.add('selected');
        optDespesa.classList.remove('selected');
        optReceita.querySelector('input').checked = true;
    });

    // Submissão do Formulário
    formTransacao.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const tipo = formTransacao.querySelector('input[name="tipo"]:checked').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const descricao = document.getElementById('descricao').value;
        const categoria = document.getElementById('categoria').value;
        const data = document.getElementById('data').value;

        if (!valor || valor <= 0) {
            mostrarToast('Informe um valor válido maior que zero!', 'error');
            return;
        }

        try {
            const resp = await fetch('/api/transacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo, valor, descricao, categoria, data })
            });

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.detail || 'Erro ao registrar transação.');
            }

            mostrarToast('Transação cadastrada com sucesso!', 'success');
            fecharModal();
            formTransacao.reset();
            if (inputData) inputData.value = new Date().toISOString().split('T')[0];
            
            carregarDados();
        } catch (err) {
            mostrarToast(err.message, 'error');
        }
    });

    // Pesquisa Dinâmica
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase().trim();
            renderizarTabela();
        });
    }

    // Abas de Filtro
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilterType = btn.dataset.type;
            renderizarTabela();
        });
    });

    // Função Principal de Carregamento
    async function carregarDados() {
        await Promise.all([carregarSaldo(), carregarTransacoes()]);
    }

    async function carregarSaldo() {
        try {
            const resp = await fetch('/api/saldo');
            if (!resp.ok) throw new Error('Falha ao obter saldo.');
            const data = await resp.json();

            // Atualiza KPIs
            valSaldoAtual.textContent = formatarMoeda(data.saldo_atual);
            valTotalReceitas.textContent = formatarMoeda(data.total_receitas);
            valTotalDespesas.textContent = formatarMoeda(data.total_despesas);
            valQtdTransacoes.textContent = data.quantidade_transacoes;

            // Badge do Banco de Dados
            const isSupabase = data.banco_dados.includes('Supabase');
            dbStatusText.textContent = data.banco_dados;
            const dot = dbIndicator.querySelector('.dot');
            if (dot) {
                dot.className = `dot ${isSupabase ? 'green' : 'yellow'}`;
            }

            // Atualiza Barra Proporcional
            const total = data.total_receitas + data.total_despesas;
            if (total > 0) {
                const recPct = (data.total_receitas / total) * 100;
                const despPct = (data.total_despesas / total) * 100;
                barReceita.style.width = `${recPct}%`;
                barDespesa.style.width = `${despPct}%`;
                ratioPercent.textContent = `${despPct.toFixed(1)}% despendido das movimentações`;
            } else {
                barReceita.style.width = '50%';
                barDespesa.style.width = '50%';
                ratioPercent.textContent = 'Sem movimentações ativas';
            }

            // Status do Saldo
            if (data.saldo_atual > 0) {
                saldoStatusText.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> Saldo positivo';
            } else if (data.saldo_atual < 0) {
                saldoStatusText.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-danger"></i> Saldo em alerta negativo';
            } else {
                saldoStatusText.innerHTML = '<i class="fa-solid fa-chart-line"></i> Saldo zerado';
            }
        } catch (err) {
            console.error('Erro ao carregar saldo:', err);
            dbStatusText.textContent = 'Offline';
        }
    }

    async function carregarTransacoes() {
        try {
            const resp = await fetch('/api/transacoes?limite=100');
            if (!resp.ok) throw new Error('Falha ao carregar transações.');
            transacoesData = await resp.json();
            renderizarTabela();
        } catch (err) {
            console.error('Erro ao carregar transações:', err);
            mostrarToast('Erro ao atualizar lista de transações', 'error');
        }
    }

    function renderizarTabela() {
        let filtrados = transacoesData;

        // Filtro por Tipo
        if (currentFilterType !== 'todos') {
            filtrados = filtrados.filter(t => t.tipo.toLowerCase() === currentFilterType);
        }

        // Filtro por Busca
        if (currentSearchQuery) {
            filtrados = filtrados.filter(t => 
                t.descricao.toLowerCase().includes(currentSearchQuery) ||
                t.categoria.toLowerCase().includes(currentSearchQuery)
            );
        }

        if (filtrados.length === 0) {
            transactionList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        transactionList.innerHTML = filtrados.map(t => {
            const isReceita = t.tipo.toLowerCase() === 'receita';
            const iconClass = getCategoryIcon(t.categoria);
            
            return `
                <tr>
                    <td>
                        <span class="badge-type ${t.tipo}">
                            <i class="fa-solid fa-${isReceita ? 'circle-arrow-up' : 'circle-arrow-down'}"></i>
                            ${t.tipo}
                        </span>
                    </td>
                    <td>
                        <strong>${escapeHtml(t.descricao)}</strong>
                    </td>
                    <td>
                        <span class="category-tag">
                            <i class="${iconClass}"></i> ${escapeHtml(t.categoria)}
                        </span>
                    </td>
                    <td style="color: var(--text-muted); font-size: 13px;">
                        ${formatarData(t.data)}
                    </td>
                    <td>
                        <span class="val-txt ${isReceita ? 'text-success' : 'text-danger'}">
                            ${isReceita ? '+' : '-'} ${formatarMoeda(t.valor)}
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn-delete" data-id="${t.id}" title="Excluir Transação">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Binda botões de exclusão
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => confirmarExclusao(btn.dataset.id));
        });
    }

    async function confirmarExclusao(id) {
        if (!confirm(`Tem certeza que deseja excluir a transação #${id}?`)) return;

        try {
            const resp = await fetch(`/api/transacoes/${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Erro ao excluir transação.');
            mostrarToast(`Transação #${id} removida!`, 'success');
            carregarDados();
        } catch (err) {
            mostrarToast(err.message, 'error');
        }
    }

    // Modal Helpers
    function abrirModal() {
        modalTransacao.classList.remove('hidden');
    }

    function fecharModal() {
        modalTransacao.classList.add('hidden');
    }

    // Helper Functions
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    }

    function formatarData(dataStr) {
        if (!dataStr) return '-';
        const partes = dataStr.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataStr;
    }

    function getCategoryIcon(categoria) {
        const cat = (categoria || '').toLowerCase();
        if (cat.includes('alimenta')) return 'fa-solid fa-utensils';
        if (cat.includes('transporte')) return 'fa-solid fa-car';
        if (cat.includes('moradia')) return 'fa-solid fa-house';
        if (cat.includes('lazer')) return 'fa-solid fa-gamepad';
        if (cat.includes('saúde') || cat.includes('saude')) return 'fa-solid fa-heart-pulse';
        if (cat.includes('educa')) return 'fa-solid fa-graduation-cap';
        if (cat.includes('salário') || cat.includes('salario')) return 'fa-solid fa-money-bill-wave';
        if (cat.includes('investimento')) return 'fa-solid fa-chart-line';
        return 'fa-solid fa-tag';
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function mostrarToast(mensagem, tipo = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `<span>${mensagem}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
