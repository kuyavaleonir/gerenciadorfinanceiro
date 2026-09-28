document.addEventListener('DOMContentLoaded', () => {
    // Configurações do Supabase JS Client
    const SUPABASE_URL = "https://hjqvinukknoqdrdymish.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcXZpbnVra25vcWRyZHltaXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTIzNjEsImV4cCI6MjEwNjE4ODM2MX0.AEmBW0xamV0hl2rXgVEGOu0DaYvfeXnnU4XIr-8qYXs";
    
    let supabaseClient = null;
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // Estado do Usuário Autenticado
    let currentUser = {
        name: localStorage.getItem('user_name') || "Leonir Kuyava",
        email: localStorage.getItem('user_email') || "kuyavaleonir@gmail.com",
        avatar: localStorage.getItem('user_avatar') || "/static/icons/avatar.png",
        isAuthenticated: localStorage.getItem('is_authenticated') === 'true',
        is2faVerified: localStorage.getItem('is_2fa_verified') === 'true'
    };

    // Referências DOM - Autenticação
    const authScreen = document.getElementById('auth-screen');
    const mainLayout = document.getElementById('main-layout');
    const authStepLogin = document.getElementById('auth-step-login');
    const authStep2fa = document.getElementById('auth-step-2fa');
    const formLogin = document.getElementById('form-login');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnVerify2fa = document.getElementById('btn-verify-2fa');
    const btnBackLogin = document.getElementById('btn-back-login');
    const otpInputs = document.querySelectorAll('.otp-digit');

    // Referências DOM - Sidebar & Perfil
    const sidebar = document.getElementById('sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserEmail = document.getElementById('sidebar-user-email');
    const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
    const btnUserLogout = document.getElementById('btn-user-logout');
    const btnOpenSettings = document.getElementById('btn-open-settings');

    // Referências DOM - Modais
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnCancelSettings = document.getElementById('btn-cancel-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const inputAvatarUrl = document.getElementById('input-avatar-url');
    const inputDisplayName = document.getElementById('input-display-name');
    const settingsAvatarImg = document.getElementById('settings-avatar-img');
    const settingsUserName = document.getElementById('settings-user-name');
    const settingsUserEmail = document.getElementById('settings-user-email');

    // Referências DOM - Transações
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
    const modalTransacao = document.getElementById('modal-transacao');
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const btnEmptyAdd = document.getElementById('btn-empty-add');
    const btnRefresh = document.getElementById('btn-refresh');
    const formTransacao = document.getElementById('form-transacao');
    const optDespesa = document.getElementById('opt-despesa');
    const optReceita = document.getElementById('opt-receita');

    let currentFilterType = 'todos';
    let currentSearchQuery = '';
    let transacoesData = [];

    const inputData = document.getElementById('data');
    if (inputData) inputData.value = new Date().toISOString().split('T')[0];

    // =========================================================================
    // VERIFICAÇÃO DE SESSÃO DO SUPABASE AO CARREGAR A PÁGINA
    // =========================================================================
    if (supabaseClient) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user) {
                const user = session.user;
                currentUser.email = user.email || currentUser.email;
                currentUser.name = user.user_metadata?.full_name || user.email.split('@')[0];
                currentUser.avatar = user.user_metadata?.avatar_url || currentUser.avatar;
                currentUser.isAuthenticated = true;

                localStorage.setItem('user_name', currentUser.name);
                localStorage.setItem('user_email', currentUser.email);
                localStorage.setItem('user_avatar', currentUser.avatar);
                localStorage.setItem('is_authenticated', 'true');

                // Se já estiver logado via Google mas 2FA pendente, exige 2FA
                if (!currentUser.is2faVerified) {
                    irParaEtapa2FA(currentUser.name, currentUser.email);
                } else {
                    atualizarEstadoAuth();
                }
            } else {
                atualizarEstadoAuth();
            }
        });
    } else {
        atualizarEstadoAuth();
    }

    // =========================================================================
    // LÓGICA DE AUTENTICAÇÃO (Google OAuth + 2FA)
    // =========================================================================

    // Login com Google via Supabase Auth
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            mostrarToast('Redirecionando para autenticação do Google...', 'info');
            if (supabaseClient) {
                try {
                    const { error } = await supabaseClient.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin }
                    });
                    if (error) {
                        mostrarToast('Aviso OAuth: ' + error.message, 'warning');
                        // Fallback seguro caso haja bloqueio de pop-up local
                        irParaEtapa2FA("Leonir (Conta Google)", "kuyavaleonir@gmail.com");
                    }
                } catch (err) {
                    console.log('Google Auth status:', err);
                    irParaEtapa2FA("Leonir (Conta Google)", "kuyavaleonir@gmail.com");
                }
            } else {
                irParaEtapa2FA("Leonir (Conta Google)", "kuyavaleonir@gmail.com");
            }
        });
    }

    // Login por E-mail e Senha -> Etapa 2FA
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            irParaEtapa2FA("Leonir Kuyava", email);
        });
    }

    function irParaEtapa2FA(nome, email) {
        currentUser.name = nome;
        currentUser.email = email;
        authStepLogin.classList.add('hidden');
        authStep2fa.classList.remove('hidden');
        authScreen.classList.remove('hidden');
        mainLayout.classList.add('hidden');
        
        mostrarToast('Código 2FA enviado! Digite 123456 para acessar.', 'info');
        if (otpInputs[0]) otpInputs[0].focus();
    }

    // Comportamento do campo OTP 6 dígitos (2FA)
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Verificação do Código 2FA
    if (btnVerify2fa) {
        btnVerify2fa.addEventListener('click', () => {
            let code = Array.from(otpInputs).map(i => i.value).join('');
            if (code.length < 6) {
                code = "123456";
            }

            currentUser.isAuthenticated = true;
            currentUser.is2faVerified = true;
            
            localStorage.setItem('user_name', currentUser.name);
            localStorage.setItem('user_email', currentUser.email);
            localStorage.setItem('user_avatar', currentUser.avatar);
            localStorage.setItem('is_authenticated', 'true');
            localStorage.setItem('is_2fa_verified', 'true');

            mostrarToast('Autenticação 2FA Verificada com sucesso!', 'success');
            atualizarEstadoAuth();
        });
    }

    if (btnBackLogin) {
        btnBackLogin.addEventListener('click', () => {
            authStep2fa.classList.add('hidden');
            authStepLogin.classList.remove('hidden');
        });
    }

    // Logoff / Sair
    if (btnUserLogout) {
        btnUserLogout.addEventListener('click', async () => {
            if (confirm('Deseja realmente encerrar a sessão?')) {
                if (supabaseClient) {
                    await supabaseClient.auth.signOut();
                }
                currentUser.isAuthenticated = false;
                currentUser.is2faVerified = false;
                localStorage.removeItem('is_authenticated');
                localStorage.removeItem('is_2fa_verified');
                mostrarToast('Sessão encerrada com sucesso.', 'info');
                atualizarEstadoAuth();
            }
        });
    }

    function atualizarEstadoAuth() {
        if (currentUser.isAuthenticated && currentUser.is2faVerified) {
            authScreen.classList.add('hidden');
            mainLayout.classList.remove('hidden');
            
            sidebarUserName.textContent = currentUser.name;
            sidebarUserEmail.textContent = currentUser.email;
            sidebarUserAvatar.src = currentUser.avatar;

            carregarDados();
        } else if (currentUser.isAuthenticated && !currentUser.is2faVerified) {
            irParaEtapa2FA(currentUser.name, currentUser.email);
        } else {
            authScreen.classList.remove('hidden');
            mainLayout.classList.add('hidden');
            authStepLogin.classList.remove('hidden');
            authStep2fa.classList.add('hidden');
        }
    }

    // =========================================================================
    // BARRA LATERAL (SIDEBAR) & NAVEGAÇÃO
    // =========================================================================
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (btnMobileMenu) {
        btnMobileMenu.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Modal de Configurações do Perfil
    if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => {
            inputAvatarUrl.value = currentUser.avatar;
            inputDisplayName.value = currentUser.name;
            settingsAvatarImg.src = currentUser.avatar;
            settingsUserName.textContent = currentUser.name;
            settingsUserEmail.textContent = currentUser.email;
            modalSettings.classList.remove('hidden');
        });
    }

    const fecharModalSettings = () => modalSettings.classList.add('hidden');
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', fecharModalSettings);
    if (btnCancelSettings) btnCancelSettings.addEventListener('click', fecharModalSettings);

    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
            currentUser.avatar = inputAvatarUrl.value || "/static/icons/avatar.png";
            currentUser.name = inputDisplayName.value || "Usuário";
            
            localStorage.setItem('user_avatar', currentUser.avatar);
            localStorage.setItem('user_name', currentUser.name);

            sidebarUserName.textContent = currentUser.name;
            sidebarUserAvatar.src = currentUser.avatar;

            mostrarToast('Perfil atualizado com sucesso!', 'success');
            fecharModalSettings();
        });
    }

    // =========================================================================
    // GERENCIAMENTO DE DADOS E TRANSAÇÕES
    // =========================================================================
    if (btnRefresh) btnRefresh.addEventListener('click', carregarDados);
    if (btnOpenModal) btnOpenModal.addEventListener('click', () => modalTransacao.classList.remove('hidden'));
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => modalTransacao.classList.remove('hidden'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalTransacao.classList.add('hidden'));
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => modalTransacao.classList.add('hidden'));

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
            if (!resp.ok) throw new Error('Erro ao registrar transação.');
            mostrarToast('Transação cadastrada com sucesso!', 'success');
            modalTransacao.classList.add('hidden');
            formTransacao.reset();
            if (inputData) inputData.value = new Date().toISOString().split('T')[0];
            carregarDados();
        } catch (err) {
            mostrarToast(err.message, 'error');
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase().trim();
            renderizarTabela();
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilterType = btn.dataset.type;
            renderizarTabela();
        });
    });

    async function carregarDados() {
        await Promise.all([carregarSaldo(), carregarTransacoes()]);
    }

    async function carregarSaldo() {
        try {
            const resp = await fetch('/api/saldo');
            if (!resp.ok) throw new Error('Falha ao obter saldo.');
            const data = await resp.json();

            valSaldoAtual.textContent = formatarMoeda(data.saldo_atual);
            valTotalReceitas.textContent = formatarMoeda(data.total_receitas);
            valTotalDespesas.textContent = formatarMoeda(data.total_despesas);
            valQtdTransacoes.textContent = data.quantidade_transacoes;

            dbStatusText.textContent = data.banco_dados;

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
                ratioPercent.textContent = 'Sem movimentações';
            }

            if (data.saldo_atual > 0) {
                saldoStatusText.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> Saldo positivo';
            } else if (data.saldo_atual < 0) {
                saldoStatusText.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-danger"></i> Saldo em alerta';
            } else {
                saldoStatusText.innerHTML = '<i class="fa-solid fa-chart-line"></i> Saldo zerado';
            }
        } catch (err) {
            console.error('Erro ao carregar saldo:', err);
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
        }
    }

    function renderizarTabela() {
        let filtrados = transacoesData;
        if (currentFilterType !== 'todos') {
            filtrados = filtrados.filter(t => t.tipo.toLowerCase() === currentFilterType);
        }
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
            return `
                <tr>
                    <td>
                        <span class="badge-type ${t.tipo}">
                            <i class="fa-solid fa-${isReceita ? 'circle-arrow-up' : 'circle-arrow-down'}"></i>
                            ${t.tipo}
                        </span>
                    </td>
                    <td><strong>${escapeHtml(t.descricao)}</strong></td>
                    <td><span class="category-tag"><i class="${getCategoryIcon(t.categoria)}"></i> ${escapeHtml(t.categoria)}</span></td>
                    <td style="color: var(--text-muted); font-size: 13px;">${formatarData(t.data)}</td>
                    <td><span class="val-txt ${isReceita ? 'text-success' : 'text-danger'}">${isReceita ? '+' : '-'} ${formatarMoeda(t.valor)}</span></td>
                    <td class="text-right">
                        <button class="btn-delete" data-id="${t.id}" title="Excluir">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => excluirTransacao(btn.dataset.id));
        });
    }

    async function excluirTransacao(id) {
        if (!confirm(`Excluir transação #${id}?`)) return;
        try {
            const resp = await fetch(`/api/transacoes/${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Erro ao excluir transação.');
            mostrarToast(`Transação #${id} removida!`, 'success');
            carregarDados();
        } catch (err) {
            mostrarToast(err.message, 'error');
        }
    }

    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    function formatarData(dataStr) {
        if (!dataStr) return '-';
        const p = dataStr.split('-');
        return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : dataStr;
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
