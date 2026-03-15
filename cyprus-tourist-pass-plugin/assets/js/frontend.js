/**
 * Cyprus Tourist Pass - Frontend SPA
 * Vanilla JavaScript application that replaces the React frontend
 */
(function () {
    'use strict';

    // =====================
    // STATE MANAGEMENT
    // =====================
    const state = {
        token: localStorage.getItem('ctp_token') || null,
        user: JSON.parse(localStorage.getItem('ctp_user') || 'null'),
        currentTab: 'contract',
        merchantPosStep: 'scan',
        adminTab: 'overview',
        merchantView: 'pos',
        // Data
        contract: null,
        merchants: [],
        qrToken: null,
        transactions: [],
        posData: {},
        adminStats: {},
        adminMerchants: [],
        adminCustomers: [],
        adminSettings: {},
        // Filters
        searchQuery: '',
        filterCity: '',
        filterType: '',
        // UI
        loading: false,
        error: null,
    };

    // =====================
    // SVG ICONS
    // =====================
    const icons = {
        car: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2.2-3.3C13 5.6 11.9 5 10.8 5H7.2c-1.1 0-2.2.6-2.9 1.7C3.4 8 2.1 10 2.1 10S1 10.6.5 11.1.1 12.3.1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
        compass: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
        qrcode: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>',
        history: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
        logout: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
        check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        mapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
        terminal: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
        settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
        barChart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
        store: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>',
        users: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    };

    // =====================
    // API HELPER
    // =====================
    async function api(endpoint, options = {}) {
        const url = ctpData.restUrl + endpoint;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (state.token) {
            headers['Authorization'] = 'Bearer ' + state.token;
        }

        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.data?.message || 'An error occurred');
        }

        return data;
    }

    // =====================
    // APP INITIALIZATION
    // =====================
    function init() {
        const app = document.getElementById('ctp-app');
        if (!app) return;

        render();
    }

    // =====================
    // MAIN RENDER
    // =====================
    function render() {
        const app = document.getElementById('ctp-app');
        if (!app) return;

        if (state.user && state.token) {
            switch (state.user.role) {
                case 'CUSTOMER':
                    renderCustomerApp(app);
                    break;
                case 'MERCHANT':
                    renderMerchantApp(app);
                    break;
                case 'ADMIN':
                    renderAdminApp(app);
                    break;
                default:
                    renderAuth(app);
            }
        } else {
            renderAuth(app);
        }
    }

    // =====================
    // AUTH SCREEN
    // =====================
    function renderAuth(container) {
        container.innerHTML = `
            <div class="ctp-auth">
                <div class="ctp-auth-card">
                    <div class="ctp-auth-logo">
                        <h1>Cyprus Tourist Pass</h1>
                        <p>Exclusive discounts for car rental customers</p>
                    </div>

                    <div class="ctp-tabs">
                        <button class="ctp-tab active" data-auth-tab="login">Sign In</button>
                        <button class="ctp-tab" data-auth-tab="register">Create Account</button>
                    </div>

                    <div id="ctp-auth-error"></div>

                    <!-- Login Form -->
                    <form id="ctp-login-form">
                        <div class="ctp-form-group">
                            <label>Email</label>
                            <input type="email" class="ctp-input" id="ctp-login-email" placeholder="you@example.com" required>
                        </div>
                        <div class="ctp-form-group">
                            <label>Password</label>
                            <input type="password" class="ctp-input" id="ctp-login-password" placeholder="Enter your password" required>
                        </div>
                        <button type="submit" class="ctp-btn ctp-btn-primary ctp-btn-full ctp-btn-lg" id="ctp-login-btn">
                            Sign In
                        </button>
                    </form>

                    <!-- Register Form (hidden by default) -->
                    <form id="ctp-register-form" class="ctp-hidden">
                        <div class="ctp-form-group">
                            <label>I am a...</label>
                            <div class="ctp-role-selector">
                                <div class="ctp-role-option active" data-role="CUSTOMER">
                                    <div class="ctp-role-icon">&#9992;</div>
                                    <div class="ctp-role-label">Tourist</div>
                                </div>
                                <div class="ctp-role-option" data-role="MERCHANT">
                                    <div class="ctp-role-icon">&#127970;</div>
                                    <div class="ctp-role-label">Merchant</div>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="ctp-register-role" value="CUSTOMER">
                        <div class="ctp-form-row">
                            <div class="ctp-form-group">
                                <label>First Name</label>
                                <input type="text" class="ctp-input" id="ctp-register-fname" placeholder="John" required>
                            </div>
                            <div class="ctp-form-group">
                                <label>Last Name</label>
                                <input type="text" class="ctp-input" id="ctp-register-lname" placeholder="Doe" required>
                            </div>
                        </div>
                        <div class="ctp-form-group">
                            <label>Email</label>
                            <input type="email" class="ctp-input" id="ctp-register-email" placeholder="you@example.com" required>
                        </div>
                        <div class="ctp-form-group">
                            <label>Password</label>
                            <input type="password" class="ctp-input" id="ctp-register-password" placeholder="Create a password" required>
                        </div>

                        <!-- Merchant fields -->
                        <div id="ctp-merchant-fields" class="ctp-hidden">
                            <div class="ctp-form-group">
                                <label>Business Name</label>
                                <input type="text" class="ctp-input" id="ctp-register-business" placeholder="Your Business Name">
                            </div>
                            <div class="ctp-form-row">
                                <div class="ctp-form-group">
                                    <label>Business Type</label>
                                    <select class="ctp-select" id="ctp-register-btype">
                                        <option value="RESTAURANT">Restaurant</option>
                                        <option value="HOTEL">Hotel</option>
                                        <option value="ACTIVITY">Activity</option>
                                        <option value="TOUR">Tour</option>
                                        <option value="SPA">Spa</option>
                                    </select>
                                </div>
                                <div class="ctp-form-group">
                                    <label>City</label>
                                    <input type="text" class="ctp-input" id="ctp-register-city" placeholder="Paphos">
                                </div>
                            </div>
                            <div class="ctp-form-group">
                                <label>Address</label>
                                <input type="text" class="ctp-input" id="ctp-register-address" placeholder="Street address">
                            </div>
                        </div>

                        <button type="submit" class="ctp-btn ctp-btn-primary ctp-btn-full ctp-btn-lg" id="ctp-register-btn">
                            Create Account
                        </button>
                    </form>

                    <div class="ctp-demo-section">
                        <p>Quick demo login:</p>
                        <div class="ctp-demo-buttons">
                            <button class="ctp-demo-btn" data-demo="tourist">Tourist</button>
                            <button class="ctp-demo-btn" data-demo="merchant">Merchant</button>
                            <button class="ctp-demo-btn" data-demo="admin">Admin</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Tab switching
        container.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
            tab.addEventListener('click', function () {
                container.querySelectorAll('[data-auth-tab]').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                var isLogin = tab.dataset.authTab === 'login';
                document.getElementById('ctp-login-form').classList.toggle('ctp-hidden', !isLogin);
                document.getElementById('ctp-register-form').classList.toggle('ctp-hidden', isLogin);
            });
        });

        // Role selector
        container.querySelectorAll('.ctp-role-option').forEach(function (opt) {
            opt.addEventListener('click', function () {
                container.querySelectorAll('.ctp-role-option').forEach(function (o) { o.classList.remove('active'); });
                opt.classList.add('active');
                document.getElementById('ctp-register-role').value = opt.dataset.role;
                document.getElementById('ctp-merchant-fields').classList.toggle('ctp-hidden', opt.dataset.role !== 'MERCHANT');
            });
        });

        // Login form
        document.getElementById('ctp-login-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            var btn = document.getElementById('ctp-login-btn');
            btn.disabled = true;
            btn.textContent = 'Signing in...';
            clearError();

            try {
                var result = await api('auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: document.getElementById('ctp-login-email').value,
                        password: document.getElementById('ctp-login-password').value,
                    }),
                });
                handleLoginSuccess(result);
            } catch (err) {
                showError(err.message);
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });

        // Register form
        document.getElementById('ctp-register-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            var btn = document.getElementById('ctp-register-btn');
            btn.disabled = true;
            btn.textContent = 'Creating account...';
            clearError();

            var body = {
                email: document.getElementById('ctp-register-email').value,
                password: document.getElementById('ctp-register-password').value,
                firstName: document.getElementById('ctp-register-fname').value,
                lastName: document.getElementById('ctp-register-lname').value,
                role: document.getElementById('ctp-register-role').value,
            };

            if (body.role === 'MERCHANT') {
                body.businessName = document.getElementById('ctp-register-business').value;
                body.businessType = document.getElementById('ctp-register-btype').value;
                body.city = document.getElementById('ctp-register-city').value;
                body.address = document.getElementById('ctp-register-address').value;
            }

            try {
                var result = await api('auth/register', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                handleLoginSuccess(result);
            } catch (err) {
                showError(err.message);
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });

        // Demo buttons
        var demoAccounts = {
            tourist: { email: 'tourist@example.com', password: 'password123' },
            merchant: { email: 'ocean@cypruspass.com', password: 'password123' },
            admin: { email: 'admin@cypruspass.com', password: 'password123' },
        };

        container.querySelectorAll('.ctp-demo-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                var demo = demoAccounts[btn.dataset.demo];
                btn.textContent = 'Logging in...';
                clearError();
                try {
                    var result = await api('auth/login', {
                        method: 'POST',
                        body: JSON.stringify(demo),
                    });
                    handleLoginSuccess(result);
                } catch (err) {
                    showError(err.message);
                    btn.textContent = btn.dataset.demo.charAt(0).toUpperCase() + btn.dataset.demo.slice(1);
                }
            });
        });
    }

    function handleLoginSuccess(result) {
        state.token = result.token;
        state.user = result.user;
        localStorage.setItem('ctp_token', result.token);
        localStorage.setItem('ctp_user', JSON.stringify(result.user));
        render();
    }

    function logout() {
        state.token = null;
        state.user = null;
        state.contract = null;
        state.qrToken = null;
        state.merchants = [];
        state.transactions = [];
        localStorage.removeItem('ctp_token');
        localStorage.removeItem('ctp_user');
        render();
    }

    function showError(msg) {
        var el = document.getElementById('ctp-auth-error') || document.getElementById('ctp-error');
        if (el) {
            el.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(msg) + '</div>';
        }
    }

    function clearError() {
        var el = document.getElementById('ctp-auth-error') || document.getElementById('ctp-error');
        if (el) el.innerHTML = '';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    function formatCurrency(amount) {
        return '\u20AC' + parseFloat(amount).toFixed(2);
    }

    // =====================
    // CUSTOMER APP
    // =====================
    function renderCustomerApp(container) {
        container.innerHTML = `
            <div class="ctp-header">
                <div class="ctp-header-inner">
                    <div class="ctp-header-brand">
                        <h2>Cyprus Tourist Pass</h2>
                        <span class="ctp-role-badge ctp-role-badge-customer">Tourist</span>
                    </div>
                    <div class="ctp-header-user">
                        <span>${escapeHtml(state.user.firstName)}</span>
                        <button class="ctp-btn ctp-btn-ghost ctp-btn-sm" id="ctp-logout-btn">${icons.logout}</button>
                    </div>
                </div>
            </div>

            <div class="ctp-main">
                <div id="ctp-error"></div>
                <div class="ctp-content" id="ctp-customer-content"></div>
            </div>

            <div class="ctp-bottom-nav">
                <div class="ctp-bottom-nav-fixed">
                    <button class="ctp-nav-item ${state.currentTab === 'contract' ? 'active' : ''}" data-tab="contract">
                        ${icons.car}
                        <span>Contract</span>
                    </button>
                    <button class="ctp-nav-item ${state.currentTab === 'discover' ? 'active' : ''}" data-tab="discover">
                        ${icons.compass}
                        <span>Discover</span>
                    </button>
                    <button class="ctp-nav-item ${state.currentTab === 'qr' ? 'active' : ''}" data-tab="qr">
                        ${icons.qrcode}
                        <span>My QR</span>
                    </button>
                    <button class="ctp-nav-item ${state.currentTab === 'history' ? 'active' : ''}" data-tab="history">
                        ${icons.history}
                        <span>History</span>
                    </button>
                </div>
            </div>
        `;

        // Logout
        document.getElementById('ctp-logout-btn').addEventListener('click', logout);

        // Tab navigation
        container.querySelectorAll('.ctp-nav-item').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state.currentTab = btn.dataset.tab;
                render();
            });
        });

        // Render current tab
        var content = document.getElementById('ctp-customer-content');
        switch (state.currentTab) {
            case 'contract':
                renderContractTab(content);
                break;
            case 'discover':
                renderDiscoverTab(content);
                break;
            case 'qr':
                renderQrTab(content);
                break;
            case 'history':
                renderHistoryTab(content);
                break;
        }
    }

    // CONTRACT TAB
    function renderContractTab(container) {
        container.innerHTML = `
            <div class="ctp-card">
                <div class="ctp-card-header">
                    <h3>Rental Contract</h3>
                    <p>Validate your car rental contract to unlock exclusive discounts</p>
                </div>
                <div class="ctp-card-body">
                    <div id="ctp-contract-status"></div>
                    <div id="ctp-contract-form-area"></div>
                </div>
            </div>
        `;

        loadContractStatus();
    }

    async function loadContractStatus() {
        try {
            var result = await api('rental/status');
            state.contract = result.contract;
            renderContractStatusUI();
        } catch (err) {
            renderContractStatusUI();
        }
    }

    function renderContractStatusUI() {
        var statusEl = document.getElementById('ctp-contract-status');
        var formEl = document.getElementById('ctp-contract-form-area');

        if (state.contract && state.contract.isValid) {
            statusEl.innerHTML = `
                <div class="ctp-contract-status">
                    <h4>${icons.check} Active Contract</h4>
                    <div class="ctp-contract-detail">
                        <span class="label">Contract</span>
                        <span class="value">${escapeHtml(state.contract.contractNumber)}</span>
                    </div>
                    <div class="ctp-contract-detail">
                        <span class="label">Agency</span>
                        <span class="value">${escapeHtml(state.contract.agencyName)}</span>
                    </div>
                    <div class="ctp-contract-detail">
                        <span class="label">Vehicle</span>
                        <span class="value">${escapeHtml(state.contract.vehicleClass)}</span>
                    </div>
                    <div class="ctp-contract-detail">
                        <span class="label">Valid Until</span>
                        <span class="value">${formatDate(state.contract.endDate)}</span>
                    </div>
                </div>
            `;
            formEl.innerHTML = '<div class="ctp-alert ctp-alert-info">Your contract is validated. Head to the Discover tab to find merchants and claim discounts!</div>';
        } else {
            statusEl.innerHTML = '';
            formEl.innerHTML = `
                <form id="ctp-validate-form">
                    <div class="ctp-form-group">
                        <label>Rental Agency</label>
                        <select class="ctp-select" id="ctp-contract-agency">
                            <option value="Sixt">Sixt</option>
                            <option value="Hertz">Hertz</option>
                            <option value="GeoDrive">GeoDrive</option>
                        </select>
                    </div>
                    <div class="ctp-form-group">
                        <label>Contract Number</label>
                        <input type="text" class="ctp-input" id="ctp-contract-number" placeholder="e.g. TEST-12345" required>
                        <p class="ctp-text-xs ctp-text-muted ctp-mt-4">For demo, use a contract starting with "TEST"</p>
                    </div>
                    <button type="submit" class="ctp-btn ctp-btn-primary ctp-btn-full" id="ctp-validate-btn">
                        Validate Contract
                    </button>
                </form>
            `;

            document.getElementById('ctp-validate-form').addEventListener('submit', async function (e) {
                e.preventDefault();
                var btn = document.getElementById('ctp-validate-btn');
                btn.disabled = true;
                btn.textContent = 'Validating...';

                try {
                    await api('rental/validate', {
                        method: 'POST',
                        body: JSON.stringify({
                            contractNumber: document.getElementById('ctp-contract-number').value,
                            agencyName: document.getElementById('ctp-contract-agency').value,
                        }),
                    });
                    loadContractStatus();
                } catch (err) {
                    showError(err.message);
                    btn.disabled = false;
                    btn.textContent = 'Validate Contract';
                }
            });
        }
    }

    // DISCOVER TAB
    function renderDiscoverTab(container) {
        container.innerHTML = `
            <div class="ctp-card">
                <div class="ctp-card-header">
                    <h3>Discover Merchants</h3>
                    <p>Find exclusive discounts from partnered businesses</p>
                </div>
                <div class="ctp-card-body">
                    <div class="ctp-search-bar">
                        <input type="text" class="ctp-input" id="ctp-search" placeholder="Search merchants..." value="${escapeHtml(state.searchQuery)}">
                        <select class="ctp-select" id="ctp-filter-city">
                            <option value="">All Cities</option>
                            <option value="Paphos">Paphos</option>
                            <option value="Limassol">Limassol</option>
                            <option value="Ayia Napa">Ayia Napa</option>
                            <option value="Larnaca">Larnaca</option>
                            <option value="Nicosia">Nicosia</option>
                            <option value="Polis">Polis</option>
                            <option value="Troodos">Troodos</option>
                        </select>
                        <select class="ctp-select" id="ctp-filter-type">
                            <option value="">All Types</option>
                            <option value="RESTAURANT">Restaurant</option>
                            <option value="HOTEL">Hotel</option>
                            <option value="ACTIVITY">Activity</option>
                            <option value="TOUR">Tour</option>
                            <option value="SPA">Spa</option>
                        </select>
                    </div>
                    <div id="ctp-merchants-grid" class="ctp-merchant-grid">
                        <div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>
                    </div>
                </div>
            </div>
        `;

        // Set current filter values
        document.getElementById('ctp-filter-city').value = state.filterCity;
        document.getElementById('ctp-filter-type').value = state.filterType;

        // Search and filter handlers
        var searchTimer;
        document.getElementById('ctp-search').addEventListener('input', function (e) {
            state.searchQuery = e.target.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadMerchants, 300);
        });

        document.getElementById('ctp-filter-city').addEventListener('change', function (e) {
            state.filterCity = e.target.value;
            loadMerchants();
        });

        document.getElementById('ctp-filter-type').addEventListener('change', function (e) {
            state.filterType = e.target.value;
            loadMerchants();
        });

        loadMerchants();
    }

    async function loadMerchants() {
        try {
            var params = new URLSearchParams();
            if (state.searchQuery) params.set('search', state.searchQuery);
            if (state.filterCity) params.set('city', state.filterCity);
            if (state.filterType) params.set('type', state.filterType);

            var result = await api('merchants?' + params.toString());
            state.merchants = result;
            renderMerchantGrid();
        } catch (err) {
            var grid = document.getElementById('ctp-merchants-grid');
            if (grid) grid.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    function renderMerchantGrid() {
        var grid = document.getElementById('ctp-merchants-grid');
        if (!grid) return;

        if (state.merchants.length === 0) {
            grid.innerHTML = '<div class="ctp-empty-state"><p>No merchants found.</p><p class="ctp-text-xs">Try adjusting your search or filters.</p></div>';
            return;
        }

        grid.innerHTML = state.merchants.map(function (m) {
            var imgSrc = m.imageUrl || (ctpData.pluginUrl + 'assets/images/placeholder.jpg');
            return `
                <div class="ctp-merchant-card">
                    <div class="ctp-merchant-card-img">
                        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(m.businessName)}" onerror="this.style.display='none'">
                        <div class="ctp-discount-badge">${m.discountRate}% OFF</div>
                    </div>
                    <div class="ctp-merchant-card-body">
                        <h4>${escapeHtml(m.businessName)}</h4>
                        <span class="ctp-merchant-type-badge">${escapeHtml(m.businessType)}</span>
                        <p>${escapeHtml((m.description || '').substring(0, 100))}${(m.description || '').length > 100 ? '...' : ''}</p>
                        <div class="ctp-address">${icons.mapPin} ${escapeHtml(m.address || '')}${m.city ? ', ' + escapeHtml(m.city) : ''}</div>
                    </div>
                    <div class="ctp-merchant-card-footer">
                        <button class="ctp-btn ctp-btn-success ctp-btn-full ctp-btn-sm" data-claim-merchant="${m.id}">
                            Claim Discount
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Claim discount buttons
        grid.querySelectorAll('[data-claim-merchant]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                claimDiscount(parseInt(btn.dataset.claimMerchant));
            });
        });
    }

    async function claimDiscount(merchantId) {
        if (!state.contract) {
            showError('Please validate your rental contract first.');
            state.currentTab = 'contract';
            render();
            return;
        }

        try {
            var result = await api('payment/create-qr', {
                method: 'POST',
                body: JSON.stringify({ merchantId: merchantId }),
            });
            state.qrToken = result;
            state.currentTab = 'qr';
            render();
        } catch (err) {
            showError(err.message);
        }
    }

    // QR TAB
    function renderQrTab(container) {
        if (!state.qrToken) {
            container.innerHTML = `
                <div class="ctp-card">
                    <div class="ctp-card-body">
                        <div class="ctp-qr-empty">
                            ${icons.qrcode}
                            <p>No active QR code</p>
                            <p class="ctp-text-xs">Visit the Discover tab to claim a merchant discount.</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        var isExpired = new Date(state.qrToken.expiresAt) < new Date();
        var expiresIn = Math.max(0, Math.floor((new Date(state.qrToken.expiresAt) - new Date()) / 60000));

        container.innerHTML = `
            <div class="ctp-card">
                <div class="ctp-card-body">
                    <div class="ctp-qr-section">
                        <div class="ctp-qr-frame">
                            <div class="ctp-qr-code">${escapeHtml(state.qrToken.token)}</div>
                            <div class="ctp-qr-corners-bottom"></div>
                        </div>
                        <div class="ctp-qr-info">
                            <h3>${escapeHtml(state.qrToken.merchantName)}</h3>
                            <div class="ctp-qr-discount">${state.qrToken.discountRate}% OFF</div>
                            <div class="ctp-qr-expires">
                                ${isExpired
                                    ? '<span style="color:var(--ctp-red-500)">Expired</span>'
                                    : 'Expires in ' + expiresIn + ' minutes'}
                            </div>
                        </div>
                        <p class="ctp-text-sm ctp-text-muted ctp-mt-6">Show this QR code to the merchant to claim your discount.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // HISTORY TAB
    function renderHistoryTab(container) {
        container.innerHTML = `
            <div class="ctp-card">
                <div class="ctp-card-header">
                    <h3>Transaction History</h3>
                </div>
                <div class="ctp-card-body" id="ctp-history-list">
                    <div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>
                </div>
            </div>
        `;
        loadTransactions();
    }

    async function loadTransactions() {
        try {
            var result = await api('payment/transactions');
            state.transactions = result;
            renderTransactionList();
        } catch (err) {
            var list = document.getElementById('ctp-history-list');
            if (list) list.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    function renderTransactionList() {
        var list = document.getElementById('ctp-history-list');
        if (!list) return;

        if (state.transactions.length === 0) {
            list.innerHTML = '<div class="ctp-empty-state"><p>No transactions yet.</p></div>';
            return;
        }

        list.innerHTML = '<div class="ctp-transaction-list">' + state.transactions.map(function (t) {
            return `
                <div class="ctp-transaction-item">
                    <div class="ctp-transaction-info">
                        <h4>${escapeHtml(t.merchantName || t.customerName || 'Transaction')}</h4>
                        <p>${formatDateTime(t.createdAt)}</p>
                        <span class="ctp-status-badge ctp-status-${t.status.toLowerCase()}">${t.status}</span>
                    </div>
                    <div class="ctp-transaction-amounts">
                        <div class="original">${formatCurrency(t.originalAmount)}</div>
                        <div class="discount">-${t.discountRate}%</div>
                        <div class="final">${formatCurrency(t.finalAmount)}</div>
                    </div>
                </div>
            `;
        }).join('') + '</div>';
    }

    // =====================
    // MERCHANT APP
    // =====================
    function renderMerchantApp(container) {
        container.innerHTML = `
            <div class="ctp-header">
                <div class="ctp-header-inner">
                    <div class="ctp-header-brand">
                        <h2>Cyprus Tourist Pass</h2>
                        <span class="ctp-role-badge ctp-role-badge-merchant">Merchant</span>
                    </div>
                    <div class="ctp-header-user">
                        <span>${escapeHtml(state.user.firstName)}</span>
                        <button class="ctp-btn ctp-btn-ghost ctp-btn-sm" id="ctp-logout-btn">${icons.logout}</button>
                    </div>
                </div>
            </div>

            <div class="ctp-main">
                <div id="ctp-error"></div>
                <div class="ctp-content" id="ctp-merchant-content"></div>
            </div>

            <div class="ctp-bottom-nav">
                <div class="ctp-bottom-nav-fixed">
                    <button class="ctp-nav-item ${state.merchantView === 'pos' ? 'active' : ''}" data-tab="pos">
                        ${icons.terminal}
                        <span>POS</span>
                    </button>
                    <button class="ctp-nav-item ${state.merchantView === 'history' ? 'active' : ''}" data-tab="history">
                        ${icons.history}
                        <span>History</span>
                    </button>
                    <button class="ctp-nav-item ${state.merchantView === 'settings' ? 'active' : ''}" data-tab="settings">
                        ${icons.settings}
                        <span>Settings</span>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('ctp-logout-btn').addEventListener('click', logout);

        container.querySelectorAll('.ctp-nav-item').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state.merchantView = btn.dataset.tab;
                render();
            });
        });

        var content = document.getElementById('ctp-merchant-content');
        switch (state.merchantView) {
            case 'pos':
                renderPOS(content);
                break;
            case 'history':
                renderHistoryTab(content);
                break;
            case 'settings':
                renderMerchantSettings(content);
                break;
        }
    }

    // MERCHANT POS
    function renderPOS(container) {
        container.innerHTML = `
            <div class="ctp-pos">
                <div class="ctp-card">
                    <div class="ctp-card-header ctp-text-center">
                        <h3>POS Terminal</h3>
                        <div class="ctp-steps ctp-mt-4">
                            <div class="ctp-step-dot ${state.merchantPosStep === 'scan' ? 'active' : (state.merchantPosStep !== 'scan' ? 'completed' : '')}"></div>
                            <div class="ctp-step-dot ${state.merchantPosStep === 'calculate' ? 'active' : (['processing','success'].includes(state.merchantPosStep) ? 'completed' : '')}"></div>
                            <div class="ctp-step-dot ${state.merchantPosStep === 'processing' ? 'active' : (state.merchantPosStep === 'success' ? 'completed' : '')}"></div>
                            <div class="ctp-step-dot ${state.merchantPosStep === 'success' ? 'active' : ''}"></div>
                        </div>
                    </div>
                    <div class="ctp-card-body" id="ctp-pos-content"></div>
                </div>
            </div>
        `;

        var posContent = document.getElementById('ctp-pos-content');
        switch (state.merchantPosStep) {
            case 'scan':
                renderPosScan(posContent);
                break;
            case 'calculate':
                renderPosCalculate(posContent);
                break;
            case 'processing':
                renderPosProcessing(posContent);
                break;
            case 'success':
                renderPosSuccess(posContent);
                break;
        }
    }

    function renderPosScan(container) {
        container.innerHTML = `
            <div class="ctp-pos-step">
                <h3>Scan QR Code</h3>
                <p>Enter or paste the customer's QR token</p>
                <div class="ctp-form-group">
                    <input type="text" class="ctp-input" id="ctp-qr-input" placeholder="Paste QR token here..." style="font-family:monospace; font-size:13px;">
                </div>
                <button class="ctp-btn ctp-btn-primary ctp-btn-full" id="ctp-scan-btn">Validate Token</button>
            </div>
        `;

        document.getElementById('ctp-scan-btn').addEventListener('click', async function () {
            var token = document.getElementById('ctp-qr-input').value.trim();
            if (!token) return;

            var btn = document.getElementById('ctp-scan-btn');
            btn.disabled = true;
            btn.textContent = 'Validating...';

            try {
                var result = await api('payment/validate-qr', {
                    method: 'POST',
                    body: JSON.stringify({ token: token }),
                });
                state.posData = result;
                state.posData.token = token;
                state.merchantPosStep = 'calculate';
                renderPOS(document.getElementById('ctp-merchant-content'));
            } catch (err) {
                showError(err.message);
                btn.disabled = false;
                btn.textContent = 'Validate Token';
            }
        });
    }

    function renderPosCalculate(container) {
        var d = state.posData;
        container.innerHTML = `
            <div class="ctp-pos-step">
                <h3>Enter Bill Amount</h3>
                <p>Customer: <strong>${escapeHtml(d.customerName)}</strong> | Discount: <strong>${d.discountRate}%</strong></p>
                <div class="ctp-form-group">
                    <input type="number" class="ctp-input ctp-pos-amount-input" id="ctp-bill-amount" placeholder="0.00" step="0.01" min="0.01">
                </div>
                <div class="ctp-pos-breakdown ctp-hidden" id="ctp-breakdown">
                    <div class="ctp-pos-breakdown-row">
                        <span class="label">Original Amount</span>
                        <span class="value" id="ctp-calc-original">-</span>
                    </div>
                    <div class="ctp-pos-breakdown-row highlight">
                        <span class="label">Discount (${d.discountRate}%)</span>
                        <span class="value" id="ctp-calc-discount">-</span>
                    </div>
                    <div class="ctp-pos-breakdown-row total">
                        <span class="label">Customer Pays</span>
                        <span class="value" id="ctp-calc-final">-</span>
                    </div>
                    <div class="ctp-pos-breakdown-row fee" style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--ctp-slate-200);">
                        <span class="label">Platform Fee (${d.platformFeeRate}%)</span>
                        <span class="value" id="ctp-calc-fee">-</span>
                    </div>
                    <div class="ctp-pos-breakdown-row">
                        <span class="label"><strong>Your Payout</strong></span>
                        <span class="value" id="ctp-calc-payout" style="color:var(--ctp-indigo-600); font-size:18px;">-</span>
                    </div>
                </div>
                <div class="ctp-flex ctp-gap-2 ctp-mt-4">
                    <button class="ctp-btn ctp-btn-outline" id="ctp-pos-back" style="flex:1;">Back</button>
                    <button class="ctp-btn ctp-btn-success ctp-hidden" id="ctp-process-btn" style="flex:2;">Process Payment</button>
                </div>
            </div>
        `;

        var amountInput = document.getElementById('ctp-bill-amount');
        var breakdown = document.getElementById('ctp-breakdown');
        var processBtn = document.getElementById('ctp-process-btn');

        amountInput.addEventListener('input', function () {
            var amount = parseFloat(amountInput.value);
            if (!amount || amount <= 0) {
                breakdown.classList.add('ctp-hidden');
                processBtn.classList.add('ctp-hidden');
                return;
            }

            var discountAmt = amount * (d.discountRate / 100);
            var finalAmt = amount - discountAmt;
            var platformFee = finalAmt * (d.platformFeeRate / 100);
            var payout = finalAmt - platformFee;

            document.getElementById('ctp-calc-original').textContent = formatCurrency(amount);
            document.getElementById('ctp-calc-discount').textContent = '-' + formatCurrency(discountAmt);
            document.getElementById('ctp-calc-final').textContent = formatCurrency(finalAmt);
            document.getElementById('ctp-calc-fee').textContent = '-' + formatCurrency(platformFee);
            document.getElementById('ctp-calc-payout').textContent = formatCurrency(payout);

            breakdown.classList.remove('ctp-hidden');
            processBtn.classList.remove('ctp-hidden');
        });

        document.getElementById('ctp-pos-back').addEventListener('click', function () {
            state.merchantPosStep = 'scan';
            state.posData = {};
            renderPOS(document.getElementById('ctp-merchant-content'));
        });

        processBtn.addEventListener('click', async function () {
            var amount = parseFloat(amountInput.value);
            if (!amount) return;

            state.merchantPosStep = 'processing';
            renderPOS(document.getElementById('ctp-merchant-content'));

            try {
                var result = await api('payment/process', {
                    method: 'POST',
                    body: JSON.stringify({
                        qrTokenId: d.qrTokenId,
                        originalAmount: amount,
                    }),
                });
                state.posData.result = result;
                state.merchantPosStep = 'success';
                renderPOS(document.getElementById('ctp-merchant-content'));
            } catch (err) {
                showError(err.message);
                state.merchantPosStep = 'calculate';
                renderPOS(document.getElementById('ctp-merchant-content'));
            }
        });
    }

    function renderPosProcessing(container) {
        container.innerHTML = `
            <div class="ctp-pos-processing">
                <div class="ctp-loading-spinner"></div>
                <h3>Processing Payment...</h3>
                <p class="ctp-text-muted">Connecting to payment gateway</p>
            </div>
        `;
    }

    function renderPosSuccess(container) {
        var r = state.posData.result || {};
        container.innerHTML = `
            <div class="ctp-pos-success">
                <div class="ctp-success-icon">${icons.check}</div>
                <h3>Payment Successful!</h3>
                <div class="ctp-pos-breakdown">
                    <div class="ctp-pos-breakdown-row">
                        <span class="label">Original Amount</span>
                        <span class="value">${formatCurrency(r.originalAmount)}</span>
                    </div>
                    <div class="ctp-pos-breakdown-row highlight">
                        <span class="label">Discount (${r.discountRate}%)</span>
                        <span class="value">-${formatCurrency(r.discountAmount)}</span>
                    </div>
                    <div class="ctp-pos-breakdown-row total">
                        <span class="label">Customer Paid</span>
                        <span class="value">${formatCurrency(r.finalAmount)}</span>
                    </div>
                    <div class="ctp-pos-breakdown-row" style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--ctp-slate-200);">
                        <span class="label"><strong>Your Payout</strong></span>
                        <span class="value" style="color:var(--ctp-indigo-600); font-size:18px;">${formatCurrency(r.merchantPayout)}</span>
                    </div>
                </div>
                <button class="ctp-btn ctp-btn-primary ctp-btn-full ctp-mt-4" id="ctp-new-transaction">New Transaction</button>
            </div>
        `;

        document.getElementById('ctp-new-transaction').addEventListener('click', function () {
            state.merchantPosStep = 'scan';
            state.posData = {};
            renderPOS(document.getElementById('ctp-merchant-content'));
        });
    }

    // MERCHANT SETTINGS
    function renderMerchantSettings(container) {
        container.innerHTML = `
            <div class="ctp-card">
                <div class="ctp-card-header">
                    <h3>Business Settings</h3>
                </div>
                <div class="ctp-card-body" id="ctp-merchant-settings-body">
                    <div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>
                </div>
            </div>
        `;
        loadMerchantProfile();
    }

    async function loadMerchantProfile() {
        try {
            var result = await api('auth/me');
            var mp = result.merchantProfile || {};
            var body = document.getElementById('ctp-merchant-settings-body');
            if (!body) return;

            body.innerHTML = `
                <div class="ctp-settings-section">
                    <div class="ctp-settings-row">
                        <span class="label">Business Name</span>
                        <span class="value">${escapeHtml(mp.businessName || '-')}</span>
                    </div>
                    <div class="ctp-settings-row">
                        <span class="label">Type</span>
                        <span class="value">${escapeHtml(mp.businessType || '-')}</span>
                    </div>
                    <div class="ctp-settings-row">
                        <span class="label">City</span>
                        <span class="value">${escapeHtml(mp.city || '-')}</span>
                    </div>
                    <div class="ctp-settings-row">
                        <span class="label">Status</span>
                        <span class="ctp-status-badge ctp-status-${(mp.status || 'pending').toLowerCase()}">${mp.status || 'PENDING'}</span>
                    </div>
                </div>

                <div class="ctp-settings-section">
                    <h3>Editable Settings</h3>
                    <form id="ctp-merchant-settings-form">
                        <div class="ctp-form-group">
                            <label>Discount Rate (%)</label>
                            <input type="number" class="ctp-input" id="ctp-edit-discount" value="${mp.discountRate || 10}" min="5" max="25" step="1">
                        </div>
                        <div class="ctp-form-group">
                            <label>Description</label>
                            <textarea class="ctp-input" id="ctp-edit-description" rows="3">${escapeHtml(mp.description || '')}</textarea>
                        </div>
                        <button type="submit" class="ctp-btn ctp-btn-primary" id="ctp-save-merchant-btn">Save Changes</button>
                    </form>
                </div>
            `;

            document.getElementById('ctp-merchant-settings-form').addEventListener('submit', async function (e) {
                e.preventDefault();
                var btn = document.getElementById('ctp-save-merchant-btn');
                btn.disabled = true;
                btn.textContent = 'Saving...';

                try {
                    await api('merchants/profile', {
                        method: 'PUT',
                        body: JSON.stringify({
                            discountRate: parseFloat(document.getElementById('ctp-edit-discount').value),
                            description: document.getElementById('ctp-edit-description').value,
                        }),
                    });
                    btn.textContent = 'Saved!';
                    setTimeout(function () {
                        btn.textContent = 'Save Changes';
                        btn.disabled = false;
                    }, 2000);
                } catch (err) {
                    showError(err.message);
                    btn.disabled = false;
                    btn.textContent = 'Save Changes';
                }
            });
        } catch (err) {
            var body = document.getElementById('ctp-merchant-settings-body');
            if (body) body.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    // =====================
    // ADMIN APP
    // =====================
    function renderAdminApp(container) {
        container.innerHTML = `
            <div class="ctp-header">
                <div class="ctp-header-inner">
                    <div class="ctp-header-brand">
                        <h2>Cyprus Tourist Pass</h2>
                        <span class="ctp-role-badge ctp-role-badge-admin">Admin</span>
                    </div>
                    <div class="ctp-header-user">
                        <span>${escapeHtml(state.user.firstName)}</span>
                        <button class="ctp-btn ctp-btn-ghost ctp-btn-sm" id="ctp-logout-btn">${icons.logout}</button>
                    </div>
                </div>
            </div>

            <div class="ctp-main">
                <div id="ctp-error"></div>

                <div class="ctp-tabs ctp-mb-6">
                    <button class="ctp-tab ${state.adminTab === 'overview' ? 'active' : ''}" data-admin-tab="overview">Overview</button>
                    <button class="ctp-tab ${state.adminTab === 'merchants' ? 'active' : ''}" data-admin-tab="merchants">Merchants</button>
                    <button class="ctp-tab ${state.adminTab === 'tourists' ? 'active' : ''}" data-admin-tab="tourists">Tourists</button>
                    <button class="ctp-tab ${state.adminTab === 'settings' ? 'active' : ''}" data-admin-tab="settings">Settings</button>
                </div>

                <div class="ctp-content" id="ctp-admin-content"></div>
            </div>
        `;

        document.getElementById('ctp-logout-btn').addEventListener('click', logout);

        container.querySelectorAll('[data-admin-tab]').forEach(function (tab) {
            tab.addEventListener('click', function () {
                state.adminTab = tab.dataset.adminTab;
                render();
            });
        });

        var content = document.getElementById('ctp-admin-content');
        switch (state.adminTab) {
            case 'overview':
                renderAdminOverview(content);
                break;
            case 'merchants':
                renderAdminMerchants(content);
                break;
            case 'tourists':
                renderAdminTourists(content);
                break;
            case 'settings':
                renderAdminSettings(content);
                break;
        }
    }

    // ADMIN OVERVIEW
    async function renderAdminOverview(container) {
        container.innerHTML = '<div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>';

        try {
            var stats = await api('admin/stats');
            state.adminStats = stats;

            container.innerHTML = `
                <div class="ctp-stats-grid">
                    <div class="ctp-stat-card indigo">
                        <div class="ctp-stat-label">Total Volume</div>
                        <div class="ctp-stat-value">${formatCurrency(stats.totalVolume)}</div>
                    </div>
                    <div class="ctp-stat-card emerald">
                        <div class="ctp-stat-label">Platform Revenue</div>
                        <div class="ctp-stat-value">${formatCurrency(stats.platformRevenue)}</div>
                    </div>
                    <div class="ctp-stat-card orange">
                        <div class="ctp-stat-label">Active Merchants</div>
                        <div class="ctp-stat-value">${stats.activeMerchants}</div>
                    </div>
                    <div class="ctp-stat-card cyan">
                        <div class="ctp-stat-label">Total Tourists</div>
                        <div class="ctp-stat-value">${stats.totalTourists}</div>
                    </div>
                </div>

                <div class="ctp-card">
                    <div class="ctp-card-header">
                        <h3>Recent Transactions</h3>
                    </div>
                    <div class="ctp-table-wrapper">
                        <table class="ctp-table">
                            <thead>
                                <tr>
                                    <th>Merchant</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Platform Fee</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stats.recentTransactions.map(function (t) {
                                    return '<tr>' +
                                        '<td>' + escapeHtml(t.merchantName) + '</td>' +
                                        '<td>' + escapeHtml(t.customerName) + '</td>' +
                                        '<td>' + formatCurrency(t.finalAmount) + '</td>' +
                                        '<td>' + formatCurrency(t.platformFee) + '</td>' +
                                        '<td><span class="ctp-status-badge ctp-status-' + t.status.toLowerCase() + '">' + t.status + '</span></td>' +
                                        '</tr>';
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    // ADMIN MERCHANTS
    async function renderAdminMerchants(container) {
        container.innerHTML = '<div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>';

        try {
            var merchants = await api('admin/merchants');
            state.adminMerchants = merchants;

            container.innerHTML = `
                <div class="ctp-card">
                    <div class="ctp-card-header">
                        <h3>All Merchants (${merchants.length})</h3>
                    </div>
                    <div id="ctp-admin-merchant-list">
                        ${merchants.map(function (m) {
                            return `
                                <div class="ctp-admin-merchant-item" data-merchant-id="${m.id}">
                                    <div class="ctp-admin-merchant-info">
                                        <h4>${escapeHtml(m.businessName)}
                                            <span class="ctp-status-badge ctp-status-${m.status.toLowerCase()}">${m.status}</span>
                                        </h4>
                                        <p>${escapeHtml(m.businessType)} | ${escapeHtml(m.city || '-')} | Discount: ${m.discountRate}%</p>
                                        <p>Owner: ${escapeHtml(m.ownerName)} (${escapeHtml(m.ownerEmail)}) | Transactions: ${m.transactionCount}</p>
                                        ${m.platformFeeRate !== null ? '<p>Custom Fee: ' + m.platformFeeRate + '%</p>' : ''}
                                    </div>
                                    <div class="ctp-admin-merchant-actions">
                                        ${m.status === 'PENDING' ? `
                                            <button class="ctp-btn ctp-btn-success ctp-btn-sm" data-action="approve" data-id="${m.id}">Approve</button>
                                            <button class="ctp-btn ctp-btn-danger ctp-btn-sm" data-action="reject" data-id="${m.id}">Reject</button>
                                        ` : ''}
                                        ${m.status === 'APPROVED' ? `
                                            <button class="ctp-btn ctp-btn-orange ctp-btn-sm" data-action="suspend" data-id="${m.id}">Suspend</button>
                                        ` : ''}
                                        ${m.status === 'SUSPENDED' ? `
                                            <button class="ctp-btn ctp-btn-success ctp-btn-sm" data-action="reactivate" data-id="${m.id}">Reactivate</button>
                                        ` : ''}
                                        <div class="ctp-inline-form">
                                            <input type="number" class="ctp-input" value="${m.platformFeeRate || ''}" placeholder="Fee %" min="2" max="15" step="0.5" data-fee-input="${m.id}">
                                            <button class="ctp-btn ctp-btn-outline ctp-btn-sm" data-action="setfee" data-id="${m.id}">Set Fee</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            // Bind action buttons
            container.querySelectorAll('[data-action]').forEach(function (btn) {
                btn.addEventListener('click', async function () {
                    var action = btn.dataset.action;
                    var id = btn.dataset.id;

                    if (action === 'setfee') {
                        var feeInput = container.querySelector('[data-fee-input="' + id + '"]');
                        var fee = parseFloat(feeInput.value);
                        if (!fee || fee < 2 || fee > 15) {
                            alert('Fee must be between 2% and 15%');
                            return;
                        }
                        try {
                            await api('admin/merchants/' + id + '/fee', {
                                method: 'PUT',
                                body: JSON.stringify({ platformFeeRate: fee }),
                            });
                            renderAdminMerchants(container);
                        } catch (err) {
                            alert(err.message);
                        }
                    } else {
                        var statusMap = {
                            approve: 'APPROVED',
                            reject: 'REJECTED',
                            suspend: 'SUSPENDED',
                            reactivate: 'APPROVED',
                        };
                        try {
                            await api('admin/merchants/' + id + '/status', {
                                method: 'PUT',
                                body: JSON.stringify({ status: statusMap[action] }),
                            });
                            renderAdminMerchants(container);
                        } catch (err) {
                            alert(err.message);
                        }
                    }
                });
            });
        } catch (err) {
            container.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    // ADMIN TOURISTS
    async function renderAdminTourists(container) {
        container.innerHTML = '<div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>';

        try {
            var customers = await api('admin/customers');
            state.adminCustomers = customers;

            container.innerHTML = `
                <div class="ctp-card">
                    <div class="ctp-card-header">
                        <h3>All Tourists (${customers.length})</h3>
                    </div>
                    <div class="ctp-table-wrapper">
                        <table class="ctp-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Contract</th>
                                    <th>Agency</th>
                                    <th>Valid</th>
                                    <th>Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${customers.map(function (c) {
                                    return '<tr>' +
                                        '<td>' + escapeHtml(c.firstName + ' ' + c.lastName) + '</td>' +
                                        '<td>' + escapeHtml(c.email) + '</td>' +
                                        '<td>' + escapeHtml(c.contractNumber || '-') + '</td>' +
                                        '<td>' + escapeHtml(c.agencyName || '-') + '</td>' +
                                        '<td>' + (c.contractValid ? '<span class="ctp-status-badge ctp-status-approved">Valid</span>' : '<span class="ctp-status-badge ctp-status-pending">-</span>') + '</td>' +
                                        '<td>' + c.transactionCount + '</td>' +
                                        '</tr>';
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    // ADMIN SETTINGS
    async function renderAdminSettings(container) {
        container.innerHTML = '<div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>';

        try {
            var settings = await api('admin/settings');
            state.adminSettings = settings;

            container.innerHTML = `
                <div class="ctp-card">
                    <div class="ctp-card-header">
                        <h3>Platform Settings</h3>
                    </div>
                    <div class="ctp-card-body">
                        <form id="ctp-admin-settings-form">
                            <div class="ctp-form-group">
                                <label>Default Platform Fee (%)</label>
                                <input type="number" class="ctp-input" id="ctp-admin-fee" value="${settings.defaultPlatformFee}" min="2" max="15" step="0.5">
                            </div>
                            <div class="ctp-form-group">
                                <label>Minimum Discount Rate (%)</label>
                                <input type="number" class="ctp-input" id="ctp-admin-min-disc" value="${settings.minimumDiscountRate}" min="1" max="50" step="1">
                            </div>
                            <div class="ctp-form-group">
                                <label>Maximum Discount Rate (%)</label>
                                <input type="number" class="ctp-input" id="ctp-admin-max-disc" value="${settings.maximumDiscountRate}" min="5" max="50" step="1">
                            </div>
                            <button type="submit" class="ctp-btn ctp-btn-primary" id="ctp-admin-settings-btn">Save Settings</button>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('ctp-admin-settings-form').addEventListener('submit', async function (e) {
                e.preventDefault();
                var btn = document.getElementById('ctp-admin-settings-btn');
                btn.disabled = true;
                btn.textContent = 'Saving...';

                try {
                    await api('admin/settings', {
                        method: 'PUT',
                        body: JSON.stringify({
                            defaultPlatformFee: parseFloat(document.getElementById('ctp-admin-fee').value),
                            minimumDiscountRate: parseFloat(document.getElementById('ctp-admin-min-disc').value),
                            maximumDiscountRate: parseFloat(document.getElementById('ctp-admin-max-disc').value),
                        }),
                    });
                    btn.textContent = 'Saved!';
                    setTimeout(function () {
                        btn.textContent = 'Save Settings';
                        btn.disabled = false;
                    }, 2000);
                } catch (err) {
                    showError(err.message);
                    btn.disabled = false;
                    btn.textContent = 'Save Settings';
                }
            });
        } catch (err) {
            container.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    // =====================
    // BOOT
    // =====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
