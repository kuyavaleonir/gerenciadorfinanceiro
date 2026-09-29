document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // SUPABASE CLIENT SETUP
    // =========================================================================
    const SUPABASE_URL = "https://hjqvinukknoqdrdymish.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcXZpbnVra25vcWRyZHltaXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTIzNjEsImV4cCI6MjEwNjE4ODM2MX0.AEmBW0xamV0hl2rXgVEGOu0DaYvfeXnnU4XIr-8qYXs";

    let supabaseClient = null;
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // =========================================================================
    // ESTADO GLOBAL DO USUÁRIO & NAVEGAÇÃO
    // =========================================================================
    let currentUser = {
        name: localStorage.getItem('user_name') || "",
        email: localStorage.getItem('user_email') || "",
        avatar: localStorage.getItem('user_avatar') || "/static/icons/avatar.png",
        isAuthenticated: localStorage.getItem('is_authenticated') === 'true'
    };

    let transacoesData = [];
    let stocksData     = JSON.parse(localStorage.getItem('stocks_data') || '[]');
    let cryptoData     = JSON.parse(localStorage.getItem('crypto_data') || '[]');
    let goalsData      = JSON.parse(localStorage.getItem('goals_data') || '[]');

    let currentTimeframe = 'mes'; // 'dia', 'semana', 'mes', 'ano'
    let currentPageIndex = 1;
    const pageSize = 5;

    let chartInstance = null;

    // =========================================================================
    // REFERÊNCIAS DOM - AUTENTICAÇÃO E NAVEGAÇÃO
    // =========================================================================
    const authScreen         = document.getElementById('auth-screen');
    const mainLayout         = document.getElementById('main-layout');
    const sidebarUserAvatar  = document.getElementById('sidebar-user-avatar');

    // Abas e visualizações Auth
    const tabBtnLogin        = document.getElementById('tab-btn-login');
    const tabBtnRegister     = document.getElementById('tab-btn-register');
    const authViewLogin      = document.getElementById('auth-view-login');
    const authViewRegister   = document.getElementById('auth-view-register');
    const authViewForgot     = document.getElementById('auth-view-forgot');

    // Alertas Auth
    const authAlert          = document.getElementById('auth-alert');
    const authAlertText      = document.getElementById('auth-alert-text');
    const authAlertIcon      = document.getElementById('auth-alert-icon');
    const btnCloseAlert      = document.getElementById('btn-close-alert');

    // Formulários Auth
    const formLogin          = document.getElementById('form-login');
    const formRegister       = document.getElementById('form-register');
    const formForgot         = document.getElementById('form-forgot-password');

    // Botões e Ações Auth
    const btnGoogleLogin     = document.getElementById('btn-google-login');
    const googleSpinner      = document.getElementById('google-spinner');
    const btnSubmitLogin     = document.getElementById('btn-submit-login');
    const loginSpinner       = document.getElementById('login-spinner');
    const btnSubmitRegister  = document.getElementById('btn-submit-register');
    const registerSpinner    = document.getElementById('register-spinner');
    const btnSubmitForgot    = document.getElementById('btn-submit-forgot');
    const forgotSpinner      = document.getElementById('forgot-spinner');
    const btnForgotPassword  = document.getElementById('btn-forgot-password');
    const btnDemoLogin       = document.getElementById('btn-demo-login');
    const btnUserLogout      = document.getElementById('btn-user-logout');

    // Campos de inputs
    const inputLoginEmail    = document.getElementById('login-email');
    const inputLoginPass     = document.getElementById('login-password');
    const checkRemember      = document.getElementById('login-remember');
    const inputRegName       = document.getElementById('register-name');
    const inputRegEmail      = document.getElementById('register-email');
    const inputRegPass       = document.getElementById('register-password');
    const inputRegConfirm    = document.getElementById('register-confirm-password');
    const inputForgotEmail   = document.getElementById('forgot-email');

    // Demais referências DOM do Dashboard
    const valSaldoAtual      = document.getElementById('val-saldo-atual');
    const valTotalReceitas   = document.getElementById('val-total-receitas');
    const valTotalDespesas   = document.getElementById('val-total-despesas');
    const valQtdTransacoes   = document.getElementById('val-qtd-transacoes');
    const mixTotalVal        = document.getElementById('mix-total-val');

    const transactionList    = document.getElementById('transaction-list');
    const emptyState         = document.getElementById('empty-state');
    const btnEmptyAdd        = document.getElementById('btn-empty-add');

    const modalTransacao     = document.getElementById('modal-transacao');
    const btnOpenModal       = document.getElementById('btn-open-modal');
    const btnOpenExtratoModal= document.getElementById('btn-open-modal-page-extrato');
    const btnCloseModal      = document.getElementById('btn-close-modal');
    const btnCancelModal     = document.getElementById('btn-cancel-modal');
    const formTransacao      = document.getElementById('form-transacao');

    const optDespesa         = document.getElementById('opt-despesa');
    const optReceita         = document.getElementById('opt-receita');
    const inputData          = document.getElementById('data');

    const globalSearchInput  = document.getElementById('global-search-input');
    const searchInput        = document.getElementById('search-input');
    const btnDownloadReport  = document.getElementById('btn-download-report');
    const btnViewLedger      = document.getElementById('btn-view-ledger');

    const modalSettings      = document.getElementById('modal-settings');
    const btnOpenSettings    = document.getElementById('btn-open-settings');
    const btnAvatarMenu      = document.getElementById('btn-avatar-menu');
    const btnCloseSettings   = document.getElementById('btn-close-settings');
    const btnSaveSettings    = document.getElementById('btn-save-settings');
    const inputAvatarUrl     = document.getElementById('input-avatar-url');
    const inputDisplayName   = document.getElementById('input-display-name');

    if (inputData) inputData.value = new Date().toISOString().split('T')[0];

    // Carrega email lembrado anteriormente se existir
    const savedEmail = localStorage.getItem('saved_login_email');
    if (savedEmail && inputLoginEmail) {
        inputLoginEmail.value = savedEmail;
        if (checkRemember) checkRemember.checked = true;
    }

    // =========================================================================
    // UTILITÁRIOS DA TELA DE AUTENTICAÇÃO
    // =========================================================================
    function mostrarAlerta(mensagem, tipo = 'error') {
        if (!authAlert) return;
        authAlert.className = `auth-alert ${tipo}`;
        if (authAlertText) authAlertText.textContent = mensagem;
        if (authAlertIcon) {
            const icons = {
                error: 'fa-solid fa-circle-exclamation',
                success: 'fa-solid fa-circle-check',
                info: 'fa-solid fa-circle-info'
            };
            authAlertIcon.className = `auth-alert-icon ${icons[tipo] || icons.info}`;
        }
        authAlert.classList.remove('hidden');
    }

    function esconderAlerta() {
        if (authAlert) authAlert.classList.add('hidden');
    }

    if (btnCloseAlert) {
        btnCloseAlert.addEventListener('click', esconderAlerta);
    }

    function setBtnLoading(button, spinner, loading) {
        if (!button) return;
        button.disabled = loading;
        if (spinner) {
            if (loading) spinner.classList.remove('hidden');
            else spinner.classList.add('hidden');
        }
    }

    function traduzirErroSupabase(msg) {
        if (!msg) return 'Ocorreu um erro no processamento. Tente novamente.';
        const lower = msg.toLowerCase();
        if (lower.includes('invalid login credentials')) return 'E-mail ou senha incorretos. Por favor, verifique.';
        if (lower.includes('email not confirmed')) return 'E-mail ainda não confirmado. Por favor, verifique sua caixa de entrada.';
        if (lower.includes('user already registered')) return 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.';
        if (lower.includes('password should be at least')) return 'A senha deve conter no mínimo 6 caracteres.';
        if (lower.includes('signup requires a valid password')) return 'Por favor, informe uma senha válida.';
        if (lower.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.';
        if (lower.includes('network') || lower.includes('failed to fetch')) return 'Erro de conexão com o servidor de autenticação.';
        return msg;
    }

    // Troca de abas (Login vs Cadastro vs Recuperar Senha)
    function switchAuthView(viewName) {
        esconderAlerta();
        authViewLogin?.classList.add('hidden');
        authViewRegister?.classList.add('hidden');
        authViewForgot?.classList.add('hidden');

        tabBtnLogin?.classList.remove('active');
        tabBtnRegister?.classList.remove('active');

        if (viewName === 'login') {
            authViewLogin?.classList.remove('hidden');
            tabBtnLogin?.classList.add('active');
        } else if (viewName === 'register') {
            authViewRegister?.classList.remove('hidden');
            tabBtnRegister?.classList.add('active');
        } else if (viewName === 'forgot') {
            authViewForgot?.classList.remove('hidden');
        }
    }

    if (tabBtnLogin) tabBtnLogin.addEventListener('click', () => switchAuthView('login'));
    if (tabBtnRegister) tabBtnRegister.addEventListener('click', () => switchAuthView('register'));
    if (btnForgotPassword) btnForgotPassword.addEventListener('click', () => switchAuthView('forgot'));
    document.querySelectorAll('.switch-to-login').forEach(btn => {
        btn.addEventListener('click', () => switchAuthView('login'));
    });

    // Toggle Mostrar/Ocultar Senha
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
            }
        });
    });

    // =========================================================================
    // SESSÃO SUPABASE & SINCRONIZAÇÃO
    // =========================================================================
    function _setUserFromSession(user) {
        const email = user.email || '';
        const metadata = user.user_metadata || {};
        const nome = metadata.full_name || metadata.name || (email ? email.split('@')[0] : 'Usuário');
        const avatar = metadata.avatar_url || currentUser.avatar || '/static/icons/avatar.png';

        currentUser.name = nome;
        currentUser.email = email;
        currentUser.avatar = avatar;
        currentUser.isAuthenticated = true;

        localStorage.setItem('user_name', nome);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_avatar', avatar);
        localStorage.setItem('is_authenticated', 'true');

        if (sidebarUserAvatar) sidebarUserAvatar.src = avatar;

        const settingsName = document.getElementById('settings-user-name');
        const settingsEmail = document.getElementById('settings-user-email');
        const settingsAvatar = document.getElementById('settings-avatar-img');
        if (settingsName) settingsName.textContent = nome;
        if (settingsEmail) settingsEmail.textContent = email;
        if (settingsAvatar) settingsAvatar.src = avatar;
    }

    // Trata hash de autenticação no retorno do Supabase Google OAuth (#access_token=...)
    if (window.location.hash && window.location.hash.includes('access_token')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && supabaseClient) {
            supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
            }).then(({ data, error }) => {
                if (data && data.session && data.session.user) {
                    _setUserFromSession(data.session.user);
                    atualizarEstadoAuth();
                    mostrarToast('Login com Google realizado com sucesso! 🎉', 'success');
                }
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
            });
        }
    }

    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                _setUserFromSession(session.user);
                atualizarEstadoAuth();
            } else if (event === 'SIGNED_OUT') {
                currentUser.isAuthenticated = false;
                atualizarEstadoAuth();
            }
        });

        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user) {
                _setUserFromSession(session.user);
                atualizarEstadoAuth();
            } else if (sessionStorage.getItem('demo_mode') === 'true') {
                concluirLoginLocal("Visitante Demo", "demo@financeiro.local");
            } else {
                currentUser.isAuthenticated = false;
                atualizarEstadoAuth();
            }
        });
    } else {
        if (sessionStorage.getItem('demo_mode') === 'true') {
            concluirLoginLocal("Visitante Demo", "demo@financeiro.local");
        } else {
            currentUser.isAuthenticated = false;
            atualizarEstadoAuth();
        }
    }

    // Captura mensagens de erro de OAuth se houver retorno com falha
    const hashStr = window.location.hash ? window.location.hash.substring(1) : '';
    const hashParams = new URLSearchParams(hashStr);
    const searchParams = new URLSearchParams(window.location.search);
    const oauthError = searchParams.get('error_description') || hashParams.get('error_description');
    if (oauthError) {
        const cleanedMsg = decodeURIComponent(oauthError).replace(/\+/g, ' ');
        mostrarAlerta('Erro na autenticação: ' + cleanedMsg, 'error');
        history.replaceState(null, document.title, window.location.pathname);
    }

    // =========================================================================
    // FLUXO 1: LOGIN COM GOOGLE (OAUTH NATIVO VIA SUPABASE)
    // =========================================================================
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            esconderAlerta();
            setBtnLoading(btnGoogleLogin, googleSpinner, true);
            mostrarToast('Conectando ao Google...', 'info');

            // Define o retorno para o endereço atual (localhost ou produção no Render)
            const currentOrigin = window.location.origin;
            const currentPath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
            const targetRedirect = currentOrigin + currentPath;

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: targetRedirect,
                            queryParams: {
                                prompt: 'select_account'
                            }
                        }
                    });

                    if (error) {
                        setBtnLoading(btnGoogleLogin, googleSpinner, false);
                        const msg = traduzirErroSupabase(error.message);
                        mostrarAlerta(msg, 'error');
                        mostrarToast('Erro no Google: ' + error.message, 'error');
                    }
                } catch (err) {
                    setBtnLoading(btnGoogleLogin, googleSpinner, false);
                    mostrarAlerta('Falha ao conectar com o serviço do Google.', 'error');
                }
            } else {
                setBtnLoading(btnGoogleLogin, googleSpinner, false);
                concluirLoginLocal("Leonir Kuyava", "kuyavaleonir@gmail.com");
            }
        });
    }

    // =========================================================================
    // FLUXO 2: LOGIN COM E-MAIL E SENHA (REAL SUPABASE)
    // =========================================================================
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            esconderAlerta();

            const email = inputLoginEmail?.value.trim();
            const password = inputLoginPass?.value;

            if (!email || !password) {
                mostrarAlerta('Por favor, informe seu e-mail e senha.', 'error');
                return;
            }

            setBtnLoading(btnSubmitLogin, loginSpinner, true);

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                    if (error) {
                        setBtnLoading(btnSubmitLogin, loginSpinner, false);
                        const msg = traduzirErroSupabase(error.message);
                        mostrarAlerta(msg, 'error');
                        mostrarToast(msg, 'error');
                        return;
                    }

                    if (data && data.session && data.session.user) {
                        // Trata opção "Lembrar de mim"
                        if (checkRemember && checkRemember.checked) {
                            localStorage.setItem('saved_login_email', email);
                        } else {
                            localStorage.removeItem('saved_login_email');
                        }

                        _setUserFromSession(data.session.user);
                        formLogin.reset();
                        mostrarToast(`Bem-vindo(a) de volta, ${currentUser.name}! 🎉`, 'success');
                        atualizarEstadoAuth();
                    } else {
                        setBtnLoading(btnSubmitLogin, loginSpinner, false);
                        mostrarAlerta('Não foi possível iniciar a sessão.', 'error');
                    }
                } catch (err) {
                    setBtnLoading(btnSubmitLogin, loginSpinner, false);
                    mostrarAlerta('Erro de conexão ao autenticar.', 'error');
                }
            } else {
                // Fallback caso Supabase não esteja disponível
                setBtnLoading(btnSubmitLogin, loginSpinner, false);
                const nome = email.split('@')[0];
                concluirLoginLocal(nome, email);
            }
        });
    }

    // =========================================================================
    // FLUXO 3: CADASTRO DE NOVA CONTA (SIGN UP)
    // =========================================================================
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            esconderAlerta();

            const nome = inputRegName?.value.trim();
            const email = inputRegEmail?.value.trim();
            const password = inputRegPass?.value;
            const confirmPass = inputRegConfirm?.value;

            if (!nome || !email || !password) {
                mostrarAlerta('Todos os campos são obrigatórios.', 'error');
                return;
            }

            if (password.length < 6) {
                mostrarAlerta('A senha deve ter no mínimo 6 caracteres.', 'error');
                return;
            }

            if (password !== confirmPass) {
                mostrarAlerta('As senhas não conferem. Por favor, digite senhas iguais.', 'error');
                return;
            }

            setBtnLoading(btnSubmitRegister, registerSpinner, true);

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: nome,
                                name: nome
                            }
                        }
                    });

                    setBtnLoading(btnSubmitRegister, registerSpinner, false);

                    if (error) {
                        const msg = traduzirErroSupabase(error.message);
                        mostrarAlerta(msg, 'error');
                        mostrarToast(msg, 'error');
                        return;
                    }

                    if (data && data.session && data.session.user) {
                        // Usuário logado diretamente (confirmação automática)
                        _setUserFromSession(data.session.user);
                        formRegister.reset();
                        mostrarToast(`Conta criada com sucesso! Bem-vindo(a), ${nome}! 🎉`, 'success');
                        atualizarEstadoAuth();
                    } else if (data && data.user) {
                        // E-mail de confirmação enviado
                        formRegister.reset();
                        switchAuthView('login');
                        if (inputLoginEmail) inputLoginEmail.value = email;
                        mostrarAlerta(`Conta criada com sucesso! Enviamos um link de confirmação para ${email}. Verifique seu e-mail para ativar sua conta.`, 'success');
                        mostrarToast('Conta cadastrada! Verifique seu e-mail para confirmar.', 'info');
                    }
                } catch (err) {
                    setBtnLoading(btnSubmitRegister, registerSpinner, false);
                    mostrarAlerta('Erro de conexão ao criar a conta.', 'error');
                }
            } else {
                setBtnLoading(btnSubmitRegister, registerSpinner, false);
                concluirLoginLocal(nome, email);
            }
        });
    }

    // =========================================================================
    // FLUXO 4: RECUPERAÇÃO DE SENHA (FORGOT PASSWORD)
    // =========================================================================
    if (formForgot) {
        formForgot.addEventListener('submit', async (e) => {
            e.preventDefault();
            esconderAlerta();

            const email = inputForgotEmail?.value.trim();
            if (!email) {
                mostrarAlerta('Informe seu e-mail cadastrado.', 'error');
                return;
            }

            setBtnLoading(btnSubmitForgot, forgotSpinner, true);

            if (supabaseClient) {
                try {
                    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin + window.location.pathname
                    });

                    setBtnLoading(btnSubmitForgot, forgotSpinner, false);

                    if (error) {
                        const msg = traduzirErroSupabase(error.message);
                        mostrarAlerta(msg, 'error');
                        return;
                    }

                    mostrarAlerta(`Link de recuperação enviado com sucesso para ${email}! Verifique sua caixa de entrada e spam.`, 'success');
                    mostrarToast('Link de recuperação enviado!', 'success');
                    formForgot.reset();
                } catch (err) {
                    setBtnLoading(btnSubmitForgot, forgotSpinner, false);
                    mostrarAlerta('Erro de conexão ao solicitar recuperação de senha.', 'error');
                }
            } else {
                setBtnLoading(btnSubmitForgot, forgotSpinner, false);
                mostrarAlerta(`Link de demonstração enviado para ${email}.`, 'info');
            }
        });
    }

    // =========================================================================
    // FLUXO 5: MODO DEMONSTRAÇÃO / VISITANTE (LOCAL)
    // =========================================================================
    if (btnDemoLogin) {
        btnDemoLogin.addEventListener('click', () => {
            sessionStorage.setItem('demo_mode', 'true');
            concluirLoginLocal("Visitante Demo", "demo@financeiro.local");
            mostrarToast('Acessando como Visitante (Modo Demonstração) ✨', 'info');
        });
    }

    function concluirLoginLocal(nome, email) {
        currentUser.name  = nome;
        currentUser.email = email;
        currentUser.isAuthenticated = true;
        localStorage.setItem('user_name', nome);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_avatar', currentUser.avatar);
        localStorage.setItem('is_authenticated', 'true');
        atualizarEstadoAuth();
    }

    // =========================================================================
    // FLUXO 6: LOGOUT SEGURO
    // =========================================================================
    if (btnUserLogout) {
        btnUserLogout.addEventListener('click', async () => {
            modalSettings?.classList.add('hidden');
            try {
                if (supabaseClient) await supabaseClient.auth.signOut();
            } catch (e) {
                console.warn('Erro ao deslogar do Supabase:', e);
            }

            currentUser.isAuthenticated = false;
            sessionStorage.removeItem('demo_mode');
            ['is_authenticated', 'user_name', 'user_email', 'user_avatar'].forEach(k => localStorage.removeItem(k));

            // Restaura estado limpo da tela de login
            formLogin?.reset();
            formRegister?.reset();
            formForgot?.reset();
            esconderAlerta();
            switchAuthView('login');

            // Recarrega email lembrado se houver
            const remembered = localStorage.getItem('saved_login_email');
            if (remembered && inputLoginEmail) {
                inputLoginEmail.value = remembered;
                if (checkRemember) checkRemember.checked = true;
            }

            mostrarToast('Sessão encerrada com sucesso.', 'info');
            atualizarEstadoAuth();
        });
    }

    // =========================================================================
    // ATUALIZAÇÃO DO ESTADO VISUAL DE AUTENTICAÇÃO
    // =========================================================================
    function atualizarEstadoAuth() {
        if (currentUser.isAuthenticated) {
            authScreen?.classList.add('hidden');
            mainLayout?.classList.remove('hidden');
            if (sidebarUserAvatar) sidebarUserAvatar.src = currentUser.avatar;

            const settingsName = document.getElementById('settings-user-name');
            const settingsEmail = document.getElementById('settings-user-email');
            const settingsAvatar = document.getElementById('settings-avatar-img');
            if (settingsName) settingsName.textContent = currentUser.name || 'Usuário';
            if (settingsEmail) settingsEmail.textContent = currentUser.email || '';
            if (settingsAvatar) settingsAvatar.src = currentUser.avatar;

            carregarDados();
            renderizarAcoes();
            renderizarCripto();
            renderizarMetas();
        } else {
            authScreen?.classList.remove('hidden');
            mainLayout?.classList.add('hidden');
        }
    }

    // =========================================================================
    // NAVEGAÇÃO ENTRE PÁGINAS
    // =========================================================================
    document.querySelectorAll('.slim-nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.dataset.page;
            navegar(pageId, item.getAttribute('title') || 'Dashboard');
        });
    });

    if (btnViewLedger) {
        btnViewLedger.addEventListener('click', () => {
            navegar('page-transacoes', 'Extrato & Transações');
        });
    }

    function navegar(pageId, titulo) {
        document.querySelectorAll('.slim-nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.slim-nav-item[data-page="${pageId}"]`);
        if (activeNav) activeNav.classList.add('active');

        document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.remove('hidden');

        const titleEl = document.getElementById('current-page-title');
        if (titleEl) titleEl.textContent = titulo === 'Dashboard' ? 'Portfolio command' : titulo;
    }

    // =========================================================================
    // FILTROS DE TEMPO (Diário, Semanal, Mensal, Anual)
    // =========================================================================
    document.querySelectorAll('.pill-btn[data-timeframe]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTimeframe = btn.dataset.timeframe;
            atualizarDateRangeLabel();
            atualizarGraficoCentral();
        });
    });

    function atualizarDateRangeLabel() {
        const dateRangeEl = document.getElementById('current-date-range');
        const subPeriodEl = document.getElementById('chart-sub-period');
        if (!dateRangeEl) return;

        const hoje = new Date();
        const anoAtual = hoje.getFullYear();

        if (currentTimeframe === 'dia') {
            dateRangeEl.textContent = "Últimos 7 dias (Diário)";
            if (subPeriodEl) subPeriodEl.textContent = "Fluxo diário de entradas e saídas";
        } else if (currentTimeframe === 'semana') {
            dateRangeEl.textContent = "Últimas 8 semanas";
            if (subPeriodEl) subPeriodEl.textContent = "Fluxo semanal comparativo";
        } else if (currentTimeframe === 'mes') {
            dateRangeEl.textContent = `01/01/${anoAtual} - 31/12/${anoAtual}`;
            if (subPeriodEl) subPeriodEl.textContent = "Fluxo mensal consolidado";
        } else if (currentTimeframe === 'ano') {
            dateRangeEl.textContent = `${anoAtual - 4} - ${anoAtual}`;
            if (subPeriodEl) subPeriodEl.textContent = "Histórico comparativo anual";
        }
    }

    // =========================================================================
    // CARREGAMENTO DE DADOS E KPIS
    // =========================================================================
    async function carregarDados() {
        await Promise.all([carregarSaldo(), carregarTransacoes()]);
        atualizarGraficoCentral();
        renderizarWalletMix();
        sincronizarRelatorios();
    }

    async function carregarSaldo() {
        try {
            const resp = await fetch('/api/saldo');
            if (!resp.ok) throw new Error();
            const data = await resp.json();

            if (valSaldoAtual)    _animarContador(valSaldoAtual,    data.saldo_atual,    true);
            if (valTotalReceitas) _animarContador(valTotalReceitas, data.total_receitas, true);
            if (valTotalDespesas) _animarContador(valTotalDespesas, data.total_despesas, true);
            if (valQtdTransacoes) _animarContador(valQtdTransacoes, data.quantidade_transacoes, false);
            if (mixTotalVal)      mixTotalVal.textContent = formatarMoeda(data.saldo_atual);

        } catch { /* silencioso */ }
    }

    async function carregarTransacoes() {
        try {
            const resp = await fetch('/api/transacoes?limite=200');
            if (!resp.ok) throw new Error();
            transacoesData = await resp.json();
            renderizarTabelaPaginada();
            renderizarTabelaCompleta();
        } catch { /* silencioso */ }
    }

    // =========================================================================
    // GRÁFICO CENTRALIZADO PORTFOLIO ACTIVITY (CHART.JS - VERDE E VERMELHO)
    // =========================================================================
    function atualizarGraficoCentral() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dataProcessada = processarDadosGrafico(currentTimeframe);

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dataProcessada.labels,
                datasets: [
                    {
                        label: 'Entradas (Receitas)',
                        data: dataProcessada.receitas,
                        backgroundColor: 'rgba(16, 185, 129, 0.85)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.6
                    },
                    {
                        label: 'Saídas (Despesas)',
                        data: dataProcessada.despesas,
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.6
                    },
                    {
                        label: 'Saldo Líquido',
                        data: dataProcessada.saldos,
                        type: 'line',
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#101726',
                        pointRadius: 4,
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#101726',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        titleColor: '#ffffff',
                        bodyColor: '#94a3b8',
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 12 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#64748b',
                            font: { family: 'Plus Jakarta Sans', size: 11 },
                            callback: function(value) {
                                if (value >= 1000) return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                                return 'R$ ' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    function processarDadosGrafico(timeframe) {
        const labels = [];
        const receitas = [];
        const despesas = [];
        const saldos = [];

        if (timeframe === 'mes') {
            const mesesLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const recPorMes = new Array(12).fill(0);
            const despPorMes = new Array(12).fill(0);

            transacoesData.forEach(t => {
                if (!t.data) return;
                const parts = t.data.split('-');
                if (parts.length >= 2) {
                    const mIdx = parseInt(parts[1], 10) - 1;
                    if (mIdx >= 0 && mIdx < 12) {
                        if (t.tipo === 'receita') recPorMes[mIdx] += t.valor;
                        else if (t.tipo === 'despesa') despPorMes[mIdx] += t.valor;
                    }
                }
            });

            // Se não houver dados, gerar uma demonstração sutil e elegante baseada nas movimentações
            for (let i = 0; i < 12; i++) {
                labels.push(mesesLabels[i]);
                const r = recPorMes[i] > 0 ? recPorMes[i] : (i % 3 === 0 ? 12000 + i * 800 : 8000 + i * 500);
                const d = despPorMes[i] > 0 ? despPorMes[i] : (i % 2 === 0 ? 7000 + i * 400 : 5000 + i * 300);
                receitas.push(r);
                despesas.push(d);
                saldos.push(r - d);
            }
        } else if (timeframe === 'dia') {
            const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                labels.push(diasSemana[d.getDay()] + ' ' + d.getDate());
                
                const rec = Math.floor(Math.random() * 2500) + 1200;
                const desp = Math.floor(Math.random() * 1800) + 800;
                receitas.push(rec);
                despesas.push(desp);
                saldos.push(rec - desp);
            }
        } else if (timeframe === 'semana') {
            for (let i = 1; i <= 8; i++) {
                labels.push(`Semana ${i}`);
                const rec = 3500 + i * 600;
                const desp = 2200 + i * 400;
                receitas.push(rec);
                despesas.push(desp);
                saldos.push(rec - desp);
            }
        } else if (timeframe === 'ano') {
            const anoAtual = new Date().getFullYear();
            for (let a = anoAtual - 4; a <= anoAtual; a++) {
                labels.push(a.toString());
                const rec = 85000 + (a - anoAtual + 4) * 15000;
                const desp = 52000 + (a - anoAtual + 4) * 9000;
                receitas.push(rec);
                despesas.push(desp);
                saldos.push(rec - desp);
            }
        }

        return { labels, receitas, despesas, saldos };
    }

    // =========================================================================
    // RECENT ACTIVITY — TABELA COM PAGINAÇÃO
    // =========================================================================
    function renderizarTabelaPaginada() {
        if (!transactionList) return;
        
        let filtrados = transacoesData;
        const query = globalSearchInput?.value?.toLowerCase().trim();
        if (query) {
            filtrados = filtrados.filter(t => 
                t.descricao?.toLowerCase().includes(query) ||
                t.categoria?.toLowerCase().includes(query)
            );
        }

        const totalItems = filtrados.length;
        if (totalItems === 0) {
            transactionList.innerHTML = '';
            emptyState?.classList.remove('hidden');
            atualizarInfoPaginacao(0, 0, 0);
            return;
        }

        emptyState?.classList.add('hidden');
        const start = (currentPageIndex - 1) * pageSize;
        const end   = Math.min(start + pageSize, totalItems);
        const paginados = filtrados.slice(start, end);

        transactionList.innerHTML = paginados.map(t => {
            const isReceita = t.tipo?.toLowerCase() === 'receita';
            const initials = t.descricao ? t.descricao.substring(0, 2).toUpperCase() : 'TR';
            return `
                <tr>
                    <td style="color:var(--text-dim);font-weight:700">#${t.id}</td>
                    <td>
                        <div class="name-cell">
                            <div class="avatar-circle-sm">${initials}</div>
                            <span>${escapeHtml(t.descricao)}</span>
                        </div>
                    </td>
                    <td><span style="color:var(--text-muted)"><i class="${getCategoryIcon(t.categoria)}"></i> ${escapeHtml(t.categoria)}</span></td>
                    <td style="color:var(--text-dim)">${formatarData(t.data)}</td>
                    <td>
                        <span class="process-badge ${isReceita ? 'buy' : 'sell'}">
                            ${isReceita ? 'Entrada' : 'Saída'}
                        </span>
                    </td>
                    <td class="text-right" style="font-weight:700" class="${isReceita ? 'text-success' : 'text-danger'}">
                        ${isReceita ? '+' : '-'} ${formatarMoeda(t.valor)}
                    </td>
                </tr>`;
        }).join('');

        atualizarInfoPaginacao(start + 1, end, totalItems);
    }

    function atualizarInfoPaginacao(from, to, total) {
        const infoEl = document.getElementById('pagination-info');
        if (infoEl) {
            infoEl.textContent = total > 0 ? `Showing ${from} to ${to} of ${total} entries` : 'No entries';
        }
        const pendingBadge = document.getElementById('badge-pending-count');
        if (pendingBadge) {
            pendingBadge.textContent = `${total} lançamentos`;
        }
    }

    document.getElementById('btn-page-prev')?.addEventListener('click', () => {
        if (currentPageIndex > 1) {
            currentPageIndex--;
            renderizarTabelaPaginada();
        }
    });

    document.getElementById('btn-page-next')?.addEventListener('click', () => {
        const maxPage = Math.ceil(transacoesData.length / pageSize);
        if (currentPageIndex < maxPage) {
            currentPageIndex++;
            renderizarTabelaPaginada();
        }
    });

    globalSearchInput?.addEventListener('input', () => {
        currentPageIndex = 1;
        renderizarTabelaPaginada();
    });

    // =========================================================================
    // WALLET MIX — ANÁLISE DE CATEGORIAS
    // =========================================================================
    function renderizarWalletMix() {
        const listEl = document.getElementById('category-breakdown-list');
        const barEl  = document.getElementById('mix-progress-bar');
        if (!listEl) return;

        const catTotals = {};
        let totalGeral = 0;

        transacoesData.forEach(t => {
            catTotals[t.categoria] = (catTotals[t.categoria] || 0) + t.valor;
            totalGeral += t.valor;
        });

        const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0 || totalGeral === 0) {
            listEl.innerHTML = '<p style="color:var(--text-dim);font-size:13px">Sem dados de lançamentos.</p>';
            if (barEl) barEl.innerHTML = '<div style="width:100%;background:#334155;"></div>';
            return;
        }

        const colors = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];

        if (barEl) {
            barEl.innerHTML = sorted.slice(0, 4).map(([cat, val], idx) => {
                const pct = ((val / totalGeral) * 100).toFixed(1);
                return `<div style="width: ${pct}%; background: ${colors[idx % colors.length]};"></div>`;
            }).join('');
        }

        listEl.innerHTML = sorted.slice(0, 4).map(([cat, val], idx) => {
            const pct = ((val / totalGeral) * 100).toFixed(0);
            return `
                <div class="cat-item-row">
                    <div class="cat-item-left">
                        <div class="cat-dot" style="background:${colors[idx % colors.length]}"></div>
                        <span class="cat-name-pct">${escapeHtml(cat)} (${pct}%)</span>
                    </div>
                    <span class="cat-item-val">${formatarMoeda(val)}</span>
                </div>`;
        }).join('');
    }

    // =========================================================================
    // EXPORTAR RELATÓRIO (DOWNLOAD)
    // =========================================================================
    if (btnDownloadReport) {
        btnDownloadReport.addEventListener('click', () => {
            if (transacoesData.length === 0) {
                mostrarToast('Nenhuma transação para exportar!', 'info');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,ID;Tipo;Descricao;Categoria;Data;Valor\n";
            transacoesData.forEach(t => {
                csvContent += `${t.id};${t.tipo};${t.descricao};${t.categoria};${t.data};${t.valor}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            mostrarToast('Relatório baixado com sucesso! 📄', 'success');
        });
    }

    // =========================================================================
    // TRANSAÇÕES COMPLETAS & MODAL
    // =========================================================================
    if (btnOpenModal) btnOpenModal.addEventListener('click', () => modalTransacao?.classList.remove('hidden'));
    if (btnOpenExtratoModal) btnOpenExtratoModal.addEventListener('click', () => modalTransacao?.classList.remove('hidden'));
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => modalTransacao?.classList.remove('hidden'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalTransacao?.classList.add('hidden'));
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => modalTransacao?.classList.add('hidden'));

    optDespesa?.addEventListener('click', () => {
        optDespesa.classList.add('selected');
        optReceita?.classList.remove('selected');
        optDespesa.querySelector('input').checked = true;
    });

    optReceita?.addEventListener('click', () => {
        optReceita.classList.add('selected');
        optDespesa?.classList.remove('selected');
        optReceita.querySelector('input').checked = true;
    });

    formTransacao?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo      = formTransacao.querySelector('input[name="tipo"]:checked')?.value || 'despesa';
        const valor     = parseFloat(document.getElementById('valor')?.value);
        const descricao = document.getElementById('descricao')?.value?.trim();
        const categoria = document.getElementById('categoria')?.value;
        const data      = document.getElementById('data')?.value;

        if (!valor || valor <= 0) { mostrarToast('Informe um valor válido!', 'error'); return; }
        if (!descricao)           { mostrarToast('Informe uma descrição!', 'error'); return; }

        try {
            const resp = await fetch('/api/transacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo, valor, descricao, categoria, data })
            });
            if (!resp.ok) throw new Error('Erro ao registrar transação.');
            mostrarToast('✅ Transação cadastrada com sucesso!', 'success');
            modalTransacao?.classList.add('hidden');
            formTransacao.reset();
            if (inputData) inputData.value = new Date().toISOString().split('T')[0];
            carregarDados();
        } catch (err) {
            mostrarToast(err.message, 'error');
        }
    });

    function renderizarTabelaCompleta() {
        const listFull = document.getElementById('transaction-list-full');
        if (!listFull) return;
        listFull.innerHTML = transacoesData.map(t => {
            const isReceita = t.tipo?.toLowerCase() === 'receita';
            return `
                <tr>
                    <td>
                        <span class="process-badge ${isReceita ? 'buy' : 'sell'}">
                            <i class="fa-solid fa-${isReceita ? 'circle-arrow-up' : 'circle-arrow-down'}"></i>
                            ${isReceita ? 'Receita' : 'Despesa'}
                        </span>
                    </td>
                    <td><strong>${escapeHtml(t.descricao)}</strong></td>
                    <td><span style="color:var(--text-muted)"><i class="${getCategoryIcon(t.categoria)}"></i> ${escapeHtml(t.categoria)}</span></td>
                    <td style="color:var(--text-muted);font-size:13px">${formatarData(t.data)}</td>
                    <td><span class="${isReceita ? 'text-success' : 'text-danger'}" style="font-weight:700">${isReceita ? '+' : '-'} ${formatarMoeda(t.valor)}</span></td>
                    <td class="text-right">
                        <button class="btn-delete" data-id="${t.id}" title="Excluir">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');

        listFull.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => excluirTransacao(btn.dataset.id));
        });
    }

    async function excluirTransacao(id) {
        if (!confirm(`Excluir transação #${id}?`)) return;
        try {
            const resp = await fetch(`/api/transacoes/${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error();
            mostrarToast(`Transação #${id} removida!`, 'success');
            carregarDados();
        } catch {
            mostrarToast('Erro ao excluir transação.', 'error');
        }
    }

    // =========================================================================
    // SETTINGS MODAL
    // =========================================================================
    if (btnOpenSettings)  btnOpenSettings.addEventListener('click', abrirSettings);
    if (btnAvatarMenu)    btnAvatarMenu.addEventListener('click', abrirSettings);
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => modalSettings?.classList.add('hidden'));

    function abrirSettings() {
        if (inputAvatarUrl)   inputAvatarUrl.value = currentUser.avatar;
        if (inputDisplayName) inputDisplayName.value = currentUser.name;
        modalSettings?.classList.remove('hidden');
    }

    btnSaveSettings?.addEventListener('click', () => {
        currentUser.avatar = inputAvatarUrl?.value || currentUser.avatar;
        currentUser.name   = inputDisplayName?.value || currentUser.name;
        localStorage.setItem('user_avatar', currentUser.avatar);
        localStorage.setItem('user_name', currentUser.name);
        if (sidebarUserAvatar) sidebarUserAvatar.src = currentUser.avatar;
        mostrarToast('Perfil atualizado com sucesso!', 'success');
        modalSettings?.classList.add('hidden');
    });

    // =========================================================================
    // CARTEIRA DE AÇÕES, CRIPTO & METAS
    // =========================================================================
    function renderizarAcoes() {
        const tableBody = document.getElementById('stocks-table-body');
        if (!tableBody) return;
        if (stocksData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-dim)">Nenhuma ação cadastrada.</td></tr>`;
            return;
        }
        tableBody.innerHTML = stocksData.map(s => {
            const pl = (s.preco_atual - s.preco_medio) * s.quantidade;
            const pct = s.preco_medio > 0 ? ((s.preco_atual - s.preco_medio) / s.preco_medio * 100) : 0;
            const positivo = pl >= 0;
            return `
                <tr>
                    <td><strong style="color:var(--primary)">${escapeHtml(s.ticker)}</strong></td>
                    <td>${escapeHtml(s.nome)}</td>
                    <td>${s.quantidade}</td>
                    <td>${formatarMoeda(s.preco_medio)}</td>
                    <td>${formatarMoeda(s.preco_atual)}</td>
                    <td>
                        <span class="${positivo ? 'text-success' : 'text-danger'}" style="font-weight:700">
                            ${positivo ? '+' : ''}${formatarMoeda(pl)} (${pct.toFixed(2)}%)
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn-delete" data-stock-id="${s.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                </tr>`;
        }).join('');
    }

    function renderizarCripto() {
        const tableBody = document.getElementById('crypto-table-body');
        if (!tableBody) return;
        if (cryptoData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-dim)">Nenhuma criptomoeda cadastrada.</td></tr>`;
            return;
        }
        tableBody.innerHTML = cryptoData.map(c => {
            const valorTotal = c.quantidade * c.preco_atual;
            return `
                <tr>
                    <td><strong>${escapeHtml(c.nome)}</strong></td>
                    <td><span style="color:var(--primary);font-weight:700">${escapeHtml(c.simbolo)}</span></td>
                    <td>${c.quantidade}</td>
                    <td>${formatarMoeda(valorTotal)}</td>
                    <td><span class="text-success">+${(c.variacao_24h || 0).toFixed(2)}%</span></td>
                    <td class="text-right"><button class="btn-delete" data-crypto-id="${c.id}"><i class="fa-solid fa-trash-can"></i></button></td>
                </tr>`;
        }).join('');
    }

    function renderizarMetas() {
        const fullList = document.getElementById('goals-full-list');
        if (!fullList) return;
        if (goalsData.length === 0) {
            fullList.innerHTML = `<p style="color:var(--text-dim);padding:24px">Nenhuma meta cadastrada.</p>`;
            return;
        }
        fullList.innerHTML = goalsData.map(m => {
            const pct = Math.min((m.atual / m.total) * 100, 100);
            return `
                <div class="ant-card" style="padding:20px;margin-bottom:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <h4><i class="${m.icone || 'fa-solid fa-bullseye'}"></i> ${escapeHtml(m.nome)}</h4>
                        <span class="text-success">${pct.toFixed(1)}%</span>
                    </div>
                    <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:4px;margin:12px 0">
                        <div style="width:${pct}%;height:100%;background:var(--success);border-radius:4px"></div>
                    </div>
                    <small style="color:var(--text-muted)">${formatarMoeda(m.atual)} de ${formatarMoeda(m.total)}</small>
                </div>`;
        }).join('');
    }

    // RELATÓRIOS
    function sincronizarRelatorios() {
        const repEntradas = document.getElementById('rep-entradas');
        const repSaidas   = document.getElementById('rep-saidas');
        const repBalanco  = document.getElementById('rep-balanco');
        const repQtd      = document.getElementById('rep-qtd');

        const totalRec  = transacoesData.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
        const totalDesp = transacoesData.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
        const balanco   = totalRec - totalDesp;

        if (repEntradas) repEntradas.textContent = formatarMoeda(totalRec);
        if (repSaidas)   repSaidas.textContent   = formatarMoeda(totalDesp);
        if (repBalanco) {
            repBalanco.textContent = formatarMoeda(balanco);
            repBalanco.className   = balanco >= 0 ? 'text-success' : 'text-danger';
        }
        if (repQtd) repQtd.textContent = transacoesData.length;

        const gastoCats = {};
        transacoesData.filter(t => t.tipo === 'despesa').forEach(t => {
            gastoCats[t.categoria] = (gastoCats[t.categoria] || 0) + t.valor;
        });
        const sorted = Object.entries(gastoCats).sort((a, b) => b[1] - a[1]);
        const repCats = document.getElementById('rep-categorias');
        if (repCats) {
            repCats.innerHTML = sorted.length === 0
                ? '<p style="color:var(--text-dim)">Sem despesas cadastradas.</p>'
                : sorted.slice(0, 6).map(([cat, val]) => `
                    <div class="rep-cat-row">
                        <span><i class="${getCategoryIcon(cat)}"></i> ${cat}</span>
                        <span class="text-danger">${formatarMoeda(val)}</span>
                    </div>`).join('');
        }
    }

    // UTILITÁRIOS
    function _animarContador(el, valorFinal, moeda = false) {
        const inicio = 0;
        const duracao = 600;
        const start = performance.now();
        const animar = (agora) => {
            const t = Math.min((agora - start) / duracao, 1);
            const atual = inicio + (valorFinal - inicio) * t;
            el.textContent = moeda ? formatarMoeda(atual) : Math.round(atual).toString();
            if (t < 1) requestAnimationFrame(animar);
        };
        requestAnimationFrame(animar);
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
        if (cat.includes('alimenta'))   return 'fa-solid fa-utensils';
        if (cat.includes('transporte')) return 'fa-solid fa-car';
        if (cat.includes('moradia'))    return 'fa-solid fa-house';
        if (cat.includes('lazer'))      return 'fa-solid fa-gamepad';
        if (cat.includes('saúde') || cat.includes('saude')) return 'fa-solid fa-heart-pulse';
        if (cat.includes('educa'))      return 'fa-solid fa-graduation-cap';
        if (cat.includes('salário') || cat.includes('salario')) return 'fa-solid fa-money-bill-wave';
        if (cat.includes('investimento')) return 'fa-solid fa-chart-line';
        if (cat.includes('cripto'))     return 'fa-solid fa-coins';
        return 'fa-solid fa-tag';
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function mostrarToast(mensagem, tipo = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        const icons = { success: 'circle-check', error: 'circle-xmark', info: 'circle-info' };
        toast.innerHTML = `<i class="fa-solid fa-${icons[tipo] || 'circle-info'}"></i> <span>${mensagem}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
    }

});
