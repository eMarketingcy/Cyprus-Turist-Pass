/**
 * Cyprus Tourist Pass - Frontend SPA v2.1.0
 * Pure vanilla JavaScript — no React or framework dependencies
 */
(function () {
    'use strict';

    // Ensure WordPress localization data is available
    if (typeof ctpData === 'undefined') {
        var appEl = document.getElementById('ctp-app');
        if (appEl) {
            appEl.innerHTML = '<div class="ctp-alert ctp-alert-error" style="margin:20px;">Cyprus Tourist Pass: Configuration error. Please reload the page.</div>';
        }
        return;
    }

    // =====================
    // STATE MANAGEMENT
    // =====================
    var storedUser = null;
    try { storedUser = JSON.parse(localStorage.getItem('ctp_user') || 'null'); } catch (e) { /* ignore */ }

    var storedAgency = null;
    try { storedAgency = JSON.parse(localStorage.getItem('ctp_agency') || 'null'); } catch (e) { /* ignore */ }

    const state = {
        token: localStorage.getItem('ctp_token') || null,
        user: storedUser,
        currentTab: 'contract',
        merchantPosStep: 'scan',
        adminTab: 'overview',
        merchantView: 'pos',
        // Data
        contract: null,
        agency: storedAgency,        // Current agency branding (Hertz/Sixt/etc)
        agencies: [],                 // All available agencies
        merchants: [],
        qrToken: null,
        qrMerchantId: null,           // Track which merchant the QR was for
        transactions: [],
        posData: {},
        adminStats: {},
        adminMerchants: [],
        adminCustomers: [],
        adminSettings: {},
        adminAgencies: [],
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
        camera: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
        scan: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
    };

    // =====================
    // QR CODE GENERATOR (Lightweight - generates SVG QR codes)
    // Based on QR Code spec - supports alphanumeric content
    // =====================
    var QRCodeGenerator = (function () {
        // Simple QR code generator using Google Charts API as fallback,
        // but primarily generates via canvas for offline support
        function generateQRSvg(text, size) {
            size = size || 200;
            // Use a canvas-based approach with a simple QR encoding
            // For reliability, we use the QR code API endpoint
            var img = document.createElement('img');
            img.width = size;
            img.height = size;
            img.style.borderRadius = '8px';
            img.alt = 'QR Code';
            // Use WordPress REST API to generate QR or use inline SVG approach
            img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text) + '&format=svg&margin=8';
            img.onerror = function () {
                // Fallback: show the token as text
                var parent = img.parentNode;
                if (parent) {
                    parent.innerHTML = '<div style="width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;background:var(--ctp-slate-50);border-radius:8px;font-family:monospace;font-size:11px;word-break:break-all;padding:16px;text-align:center;">' + escapeHtml(text) + '</div>';
                }
            };
            return img;
        }

        return { generate: generateQRSvg };
    })();

    // =====================
    // QR SCANNER (Camera-based using BarcodeDetector or jsQR fallback)
    // =====================
    var QRScanner = (function () {
        var videoStream = null;
        var scanning = false;
        var animFrameId = null;

        function start(videoEl, canvasEl, onResult) {
            if (scanning) return;
            scanning = true;

            var constraints = {
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            };

            navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                videoStream = stream;
                videoEl.srcObject = stream;
                videoEl.setAttribute('playsinline', 'true');
                videoEl.play();

                var ctx = canvasEl.getContext('2d', { willReadFrequently: true });

                // Check for BarcodeDetector support (Chrome 83+, Edge, Samsung Browser)
                var hasBarcodeDetector = typeof BarcodeDetector !== 'undefined';
                var detector = hasBarcodeDetector ? new BarcodeDetector({ formats: ['qr_code'] }) : null;

                function scanFrame() {
                    if (!scanning) return;
                    if (videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
                        animFrameId = requestAnimationFrame(scanFrame);
                        return;
                    }

                    canvasEl.width = videoEl.videoWidth;
                    canvasEl.height = videoEl.videoHeight;
                    ctx.drawImage(videoEl, 0, 0);

                    if (detector) {
                        // Use native BarcodeDetector
                        detector.detect(canvasEl).then(function (barcodes) {
                            if (barcodes.length > 0) {
                                stop();
                                onResult(barcodes[0].rawValue);
                                return;
                            }
                            animFrameId = requestAnimationFrame(scanFrame);
                        }).catch(function () {
                            animFrameId = requestAnimationFrame(scanFrame);
                        });
                    } else {
                        // Fallback: no native scanner, scan every 500ms using image analysis
                        // For browsers without BarcodeDetector, user can paste manually
                        animFrameId = requestAnimationFrame(scanFrame);
                    }
                }

                videoEl.addEventListener('loadeddata', function () {
                    scanFrame();
                });
            }).catch(function (err) {
                console.warn('Camera access error:', err);
                scanning = false;
                onResult(null, err);
            });
        }

        function stop() {
            scanning = false;
            if (animFrameId) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
            if (videoStream) {
                videoStream.getTracks().forEach(function (t) { t.stop(); });
                videoStream = null;
            }
        }

        function isSupported() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }

        return { start: start, stop: stop, isSupported: isSupported };
    })();

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
        // Clean up any active camera on re-render
        QRScanner.stop();

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

                    <!-- Register Form (hidden by default) - Multi-step wizard -->
                    <div id="ctp-register-form" class="ctp-hidden">
                        <!-- Step 1: Role Selection -->
                        <div id="ctp-reg-step-role" class="ctp-reg-step">
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
                            <button type="button" class="ctp-btn ctp-btn-primary ctp-btn-full ctp-btn-lg" id="ctp-reg-role-next">
                                Continue
                            </button>
                        </div>

                        <!-- Step 2: Contract Validation (Tourist only) -->
                        <div id="ctp-reg-step-contract" class="ctp-reg-step ctp-hidden">
                            <div class="ctp-reg-step-header">
                                <button type="button" class="ctp-btn ctp-btn-ghost ctp-btn-sm" id="ctp-reg-contract-back">&larr; Back</button>
                                <div class="ctp-reg-step-indicator">
                                    <span class="ctp-step-dot completed"></span>
                                    <span class="ctp-step-dot active"></span>
                                    <span class="ctp-step-dot"></span>
                                </div>
                            </div>
                            <div class="ctp-card-header" style="text-align:center;padding:0 0 16px 0;">
                                <h3>Validate Your Contract</h3>
                                <p>Enter your car rental contract number to activate your Tourist Pass</p>
                            </div>
                            <div id="ctp-reg-contract-error"></div>
                            <div class="ctp-form-group">
                                <label>Contract Number</label>
                                <input type="text" class="ctp-input" id="ctp-reg-contract-number" placeholder="e.g. HZ-12345 or SX-12345" required style="text-transform:uppercase;font-family:monospace;letter-spacing:1px;">
                                <p class="ctp-text-xs ctp-text-muted ctp-mt-4">The prefix determines the agency (HZ = Hertz, SX = Sixt).</p>
                            </div>
                            <div id="ctp-reg-contract-success" class="ctp-hidden"></div>
                            <button type="button" class="ctp-btn ctp-btn-primary ctp-btn-full ctp-btn-lg" id="ctp-reg-contract-validate">
                                Validate Contract
                            </button>
                            <button type="button" class="ctp-btn ctp-btn-primary ctp-btn-full ctp-btn-lg ctp-hidden" id="ctp-reg-contract-next">
                                Continue to Registration
                            </button>
                        </div>

                        <!-- Step 3: Personal Details (Tourist) / All Details (Merchant) -->
                        <div id="ctp-reg-step-details" class="ctp-reg-step ctp-hidden">
                            <div class="ctp-reg-step-header">
                                <button type="button" class="ctp-btn ctp-btn-ghost ctp-btn-sm" id="ctp-reg-details-back">&larr; Back</button>
                                <div class="ctp-reg-step-indicator" id="ctp-reg-details-indicator">
                                    <span class="ctp-step-dot completed"></span>
                                    <span class="ctp-step-dot completed"></span>
                                    <span class="ctp-step-dot active"></span>
                                </div>
                            </div>
                            <div id="ctp-reg-agency-badge" class="ctp-hidden"></div>
                            <form id="ctp-register-details-form">
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

                                <!-- Merchant fields (shown only for MERCHANT role) -->
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
                        </div>
                    </div>

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

                // Reset registration wizard to step 1 when switching tabs
                if (!isLogin) {
                    document.getElementById('ctp-reg-step-role').classList.remove('ctp-hidden');
                    document.getElementById('ctp-reg-step-contract').classList.add('ctp-hidden');
                    document.getElementById('ctp-reg-step-details').classList.add('ctp-hidden');
                }
            });
        });

        // === MULTI-STEP REGISTRATION WIZARD ===
        var regState = {
            role: 'CUSTOMER',
            contractNumber: '',
            agencyData: null,
        };

        // Role selector
        container.querySelectorAll('.ctp-role-option').forEach(function (opt) {
            opt.addEventListener('click', function () {
                container.querySelectorAll('.ctp-role-option').forEach(function (o) { o.classList.remove('active'); });
                opt.classList.add('active');
                document.getElementById('ctp-register-role').value = opt.dataset.role;
                regState.role = opt.dataset.role;
            });
        });

        // Step 1 -> Step 2/3: Role selection "Continue"
        document.getElementById('ctp-reg-role-next').addEventListener('click', function () {
            document.getElementById('ctp-reg-step-role').classList.add('ctp-hidden');
            if (regState.role === 'CUSTOMER') {
                // Tourist: show contract validation step
                document.getElementById('ctp-reg-step-contract').classList.remove('ctp-hidden');
            } else {
                // Merchant: skip contract, go directly to details
                document.getElementById('ctp-reg-step-details').classList.remove('ctp-hidden');
                document.getElementById('ctp-merchant-fields').classList.remove('ctp-hidden');
                // Show 2-step indicator for merchants
                document.getElementById('ctp-reg-details-indicator').innerHTML = '<span class="ctp-step-dot completed"></span><span class="ctp-step-dot active"></span>';
            }
        });

        // Step 2 back button (contract -> role)
        document.getElementById('ctp-reg-contract-back').addEventListener('click', function () {
            document.getElementById('ctp-reg-step-contract').classList.add('ctp-hidden');
            document.getElementById('ctp-reg-step-role').classList.remove('ctp-hidden');
            // Reset contract state
            regState.contractNumber = '';
            regState.agencyData = null;
        });

        // Step 2: Validate Contract
        document.getElementById('ctp-reg-contract-validate').addEventListener('click', async function () {
            var btn = document.getElementById('ctp-reg-contract-validate');
            var contractInput = document.getElementById('ctp-reg-contract-number');
            var contractNumber = contractInput.value.toUpperCase().trim();
            var errEl = document.getElementById('ctp-reg-contract-error');
            var successEl = document.getElementById('ctp-reg-contract-success');

            if (!contractNumber) {
                errEl.innerHTML = '<div class="ctp-alert ctp-alert-error">Please enter your contract number.</div>';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Validating...';
            errEl.innerHTML = '';
            successEl.classList.add('ctp-hidden');

            try {
                var result = await api('rental/pre-check', {
                    method: 'POST',
                    body: JSON.stringify({ contractNumber: contractNumber }),
                });

                regState.contractNumber = result.contractNumber;
                regState.agencyData = result.agency;

                // Show success with agency branding
                var agencyLogo = result.agency && result.agency.logoUrl
                    ? '<img src="' + escapeHtml(result.agency.logoUrl) + '" alt="' + escapeHtml(result.agencyName) + '" style="height:36px;max-width:120px;object-fit:contain;margin-bottom:8px;">'
                    : '';

                successEl.innerHTML = `
                    <div class="ctp-contract-status ctp-agency-branded" style="margin-bottom:16px;">
                        ${agencyLogo}
                        <h4>${icons.check} Contract Verified — ${escapeHtml(result.agencyName)}</h4>
                        <div class="ctp-contract-detail">
                            <span class="label">Contract</span>
                            <span class="value" style="font-family:monospace;letter-spacing:1px;">${escapeHtml(result.contractNumber)}</span>
                        </div>
                    </div>
                `;
                successEl.classList.remove('ctp-hidden');

                // Hide validate button, show continue button
                btn.classList.add('ctp-hidden');
                document.getElementById('ctp-reg-contract-next').classList.remove('ctp-hidden');

                // Disable the input
                contractInput.disabled = true;
                contractInput.style.opacity = '0.6';
            } catch (err) {
                errEl.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
                btn.disabled = false;
                btn.textContent = 'Validate Contract';
            }
        });

        // Step 2 -> Step 3: Contract validated, continue to details
        document.getElementById('ctp-reg-contract-next').addEventListener('click', function () {
            document.getElementById('ctp-reg-step-contract').classList.add('ctp-hidden');
            document.getElementById('ctp-reg-step-details').classList.remove('ctp-hidden');
            document.getElementById('ctp-merchant-fields').classList.add('ctp-hidden');

            // Show agency badge on details step
            if (regState.agencyData) {
                var badgeEl = document.getElementById('ctp-reg-agency-badge');
                var agencyLogo = regState.agencyData.logoIconUrl
                    ? '<img src="' + escapeHtml(regState.agencyData.logoIconUrl) + '" alt="' + escapeHtml(regState.agencyData.name) + '" style="height:20px;max-width:80px;object-fit:contain;">'
                    : '<strong>' + escapeHtml(regState.agencyData.name) + '</strong>';
                badgeEl.innerHTML = '<div class="ctp-reg-agency-pill">' + agencyLogo + ' <span>' + escapeHtml(regState.contractNumber) + '</span></div>';
                badgeEl.classList.remove('ctp-hidden');
            }
        });

        // Step 3 back button (details -> contract or role)
        document.getElementById('ctp-reg-details-back').addEventListener('click', function () {
            document.getElementById('ctp-reg-step-details').classList.add('ctp-hidden');
            if (regState.role === 'CUSTOMER') {
                document.getElementById('ctp-reg-step-contract').classList.remove('ctp-hidden');
            } else {
                document.getElementById('ctp-reg-step-role').classList.remove('ctp-hidden');
            }
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

        // Register form (Step 3 submission)
        document.getElementById('ctp-register-details-form').addEventListener('submit', async function (e) {
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
                role: regState.role,
            };

            // Include contract number for tourists
            if (regState.role === 'CUSTOMER' && regState.contractNumber) {
                body.contractNumber = regState.contractNumber;
            }

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
                // If registration returned agency branding, apply it
                if (result.agency) {
                    applyAgencyBranding(result.agency);
                }
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
        // Apply agency branding if returned (e.g. from registration with contract)
        if (result.agency) {
            applyAgencyBranding(result.agency);
        }
        render();
    }

    function logout() {
        state.token = null;
        state.user = null;
        state.contract = null;
        state.agency = null;
        state.qrToken = null;
        state.qrMerchantId = null;
        state.merchants = [];
        state.transactions = [];
        localStorage.removeItem('ctp_token');
        localStorage.removeItem('ctp_user');
        localStorage.removeItem('ctp_agency');
        removeAgencyBranding();
        render();
    }

    // =====================
    // AGENCY BRANDING
    // =====================
    function applyAgencyBranding(agency) {
        if (!agency) {
            removeAgencyBranding();
            return;
        }
        state.agency = agency;
        localStorage.setItem('ctp_agency', JSON.stringify(agency));

        var app = document.getElementById('ctp-app');
        if (!app) return;

        app.setAttribute('data-agency', agency.slug || '');
        app.style.setProperty('--ctp-agency-primary', agency.primaryColor || '#4f46e5');
        app.style.setProperty('--ctp-agency-secondary', agency.secondaryColor || '#ffffff');
        app.style.setProperty('--ctp-agency-accent', agency.accentColor || agency.primaryColor || '#4f46e5');
    }

    function removeAgencyBranding() {
        var app = document.getElementById('ctp-app');
        if (!app) return;
        app.removeAttribute('data-agency');
        app.style.removeProperty('--ctp-agency-primary');
        app.style.removeProperty('--ctp-agency-secondary');
        app.style.removeProperty('--ctp-agency-accent');
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
        // Apply agency branding if available
        if (state.agency) {
            applyAgencyBranding(state.agency);
        }

        var agencyLogoHtml = '';
        var headerClass = 'ctp-header';
        if (state.agency && state.agency.logoUrl) {
            agencyLogoHtml = '<img src="' + escapeHtml(state.agency.logoUrl) + '" alt="' + escapeHtml(state.agency.name) + '" class="ctp-header-agency-logo">';
            headerClass += ' ctp-header-branded';
        }

        container.innerHTML = `
            <div class="${headerClass}">
                <div class="ctp-header-inner">
                    <div class="ctp-header-brand">
                        ${agencyLogoHtml}
                        <div>
                            <h2>${state.agency ? '<span class="ctp-header-tourist-pass">Tourist Pass</span>' : 'Cyprus Tourist Pass'}</h2>
                        </div>
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
            if (result.agency) {
                applyAgencyBranding(result.agency);
            }
            renderContractStatusUI();
        } catch (err) {
            renderContractStatusUI();
        }
    }

    async function loadAgencies() {
        if (state.agencies.length > 0) return;
        try {
            state.agencies = await api('rental/agencies');
        } catch (e) {
            state.agencies = [];
        }
    }

    function renderContractStatusUI() {
        var statusEl = document.getElementById('ctp-contract-status');
        var formEl = document.getElementById('ctp-contract-form-area');

        if (state.contract && state.contract.isValid) {
            var agencyLogo = state.agency && state.agency.logoUrl
                ? '<img src="' + escapeHtml(state.agency.logoUrl) + '" alt="' + escapeHtml(state.contract.agencyName) + '" style="height:32px;max-width:120px;object-fit:contain;margin-bottom:8px;">'
                : '';

            statusEl.innerHTML = `
                <div class="ctp-contract-status ctp-agency-branded">
                    ${agencyLogo}
                    <h4>${icons.check} Active Contract — ${escapeHtml(state.contract.agencyName)}</h4>
                    <div class="ctp-contract-detail">
                        <span class="label">Contract</span>
                        <span class="value" style="font-family:monospace;letter-spacing:1px;">${escapeHtml(state.contract.contractNumber)}</span>
                    </div>
                    <div class="ctp-contract-detail">
                        <span class="label">Agency</span>
                        <span class="value">${escapeHtml(state.contract.agencyName)}</span>
                    </div>
                    <div class="ctp-contract-detail">
                        <span class="label">Vehicle Class</span>
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
            renderContractForm(formEl);
        }
    }

    async function renderContractForm(formEl) {
        await loadAgencies();

        var agencyOptions = state.agencies.map(function(a) {
            return '<option value="' + escapeHtml(a.name) + '">' + escapeHtml(a.name) + ' (' + escapeHtml(a.contractPrefix) + '-...)</option>';
        }).join('');

        var demoCards = state.agencies.filter(function(a) { return a.isDemo && a.demoContract; }).map(function(a) {
            var bgStyle = 'background:' + a.primaryColor + ';color:' + a.secondaryColor;
            return `
                <div class="ctp-demo-contract-card" style="border:2px solid ${a.primaryColor};border-radius:var(--ctp-radius-lg);padding:16px;cursor:pointer;transition:all var(--ctp-transition);flex:1;min-width:140px;" data-demo-contract="${escapeHtml(a.demoContract)}" data-demo-agency="${escapeHtml(a.name)}">
                    ${a.logoIconUrl ? '<img src="' + escapeHtml(a.logoIconUrl) + '" alt="' + escapeHtml(a.name) + '" style="height:28px;max-width:100px;object-fit:contain;margin-bottom:8px;">' : '<strong style="color:' + a.primaryColor + '">' + escapeHtml(a.name) + '</strong>'}
                    <div style="font-size:12px;color:var(--ctp-slate-500);margin-top:4px;font-family:monospace;">${escapeHtml(a.demoContract)}</div>
                    <div style="margin-top:8px;"><span style="${bgStyle};padding:4px 12px;border-radius:var(--ctp-radius-full);font-size:11px;font-weight:700;">Try Demo</span></div>
                </div>
            `;
        }).join('');

        formEl.innerHTML = `
            ${demoCards ? `
            <div style="margin-bottom:24px;">
                <p class="ctp-text-xs ctp-text-muted" style="text-align:center;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:12px;">Quick Demo — Try a sample contract</p>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    ${demoCards}
                </div>
            </div>
            <div style="text-align:center;margin-bottom:20px;position:relative;">
                <span style="background:var(--ctp-white);padding:0 12px;font-size:12px;color:var(--ctp-slate-400);position:relative;z-index:1;">or enter your contract</span>
                <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:var(--ctp-slate-200);"></div>
            </div>
            ` : ''}
            <form id="ctp-validate-form">
                <div class="ctp-form-group">
                    <label>Contract Number</label>
                    <input type="text" class="ctp-input" id="ctp-contract-number" placeholder="e.g. HZ-12345 or SX-12345" required style="text-transform:uppercase;font-family:monospace;letter-spacing:1px;">
                    <p class="ctp-text-xs ctp-text-muted ctp-mt-4">Enter your contract number. The prefix determines the agency (HZ = Hertz, SX = Sixt).</p>
                </div>
                <button type="submit" class="ctp-btn ctp-btn-primary ctp-btn-full" id="ctp-validate-btn">
                    Validate Contract
                </button>
            </form>
        `;

        // Demo contract quick-fill buttons
        formEl.querySelectorAll('[data-demo-contract]').forEach(function(card) {
            card.addEventListener('click', async function() {
                var contractNum = card.dataset.demoContract;
                var agencyName = card.dataset.demoAgency;
                card.style.opacity = '0.6';
                card.querySelector('span').textContent = 'Validating...';
                clearError();

                try {
                    var result = await api('rental/validate', {
                        method: 'POST',
                        body: JSON.stringify({
                            contractNumber: contractNum,
                            agencyName: agencyName,
                        }),
                    });
                    if (result.agency) {
                        applyAgencyBranding(result.agency);
                    }
                    loadContractStatus();
                } catch (err) {
                    showError(err.message);
                    card.style.opacity = '1';
                    card.querySelector('span').textContent = 'Try Demo';
                }
            });
        });

        // Manual form
        document.getElementById('ctp-validate-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            var btn = document.getElementById('ctp-validate-btn');
            btn.disabled = true;
            btn.textContent = 'Validating...';
            clearError();

            try {
                var contractNumber = document.getElementById('ctp-contract-number').value.toUpperCase().trim();
                var result = await api('rental/validate', {
                    method: 'POST',
                    body: JSON.stringify({
                        contractNumber: contractNumber,
                    }),
                });
                if (result.agency) {
                    applyAgencyBranding(result.agency);
                }
                loadContractStatus();
            } catch (err) {
                showError(err.message);
                btn.disabled = false;
                btn.textContent = 'Validate Contract';
            }
        });
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
            state.qrMerchantId = merchantId;
            state.currentTab = 'qr';
            render();
        } catch (err) {
            showError(err.message);
        }
    }

    async function regenerateQr() {
        if (!state.qrMerchantId) {
            state.currentTab = 'discover';
            render();
            return;
        }
        try {
            var result = await api('payment/create-qr', {
                method: 'POST',
                body: JSON.stringify({ merchantId: state.qrMerchantId }),
            });
            state.qrToken = result;
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
                            <div id="ctp-qr-code-container" class="ctp-qr-code"></div>
                            <div class="ctp-qr-corners-bottom"></div>
                        </div>
                        <div class="ctp-qr-info">
                            <h3>${escapeHtml(state.qrToken.merchantName)}</h3>
                            <div class="ctp-qr-discount">${state.qrToken.discountRate}% OFF</div>
                            <div class="ctp-qr-expires">
                                ${isExpired
                                    ? '<span style="color:var(--ctp-red-500)">Expired — please generate a new one</span>'
                                    : 'Expires in ' + expiresIn + ' minutes'}
                            </div>
                        </div>
                        <p class="ctp-text-sm ctp-text-muted ctp-mt-6">Show this QR code to the merchant to claim your discount.</p>
                        ${isExpired ? '<button class="ctp-btn ctp-btn-primary ctp-btn-full ctp-mt-4" id="ctp-refresh-qr">Generate New QR Code</button>' : ''}
                    </div>
                </div>
            </div>
        `;

        // Generate visual QR code
        var qrContainer = document.getElementById('ctp-qr-code-container');
        if (qrContainer && state.qrToken.token) {
            var qrImg = QRCodeGenerator.generate(state.qrToken.token, 200);
            qrContainer.innerHTML = '';
            qrContainer.appendChild(qrImg);
        }

        // Refresh QR button for expired codes — actually regenerate!
        var refreshBtn = document.getElementById('ctp-refresh-qr');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async function () {
                refreshBtn.disabled = true;
                refreshBtn.textContent = 'Generating...';
                await regenerateQr();
            });
        }

        // Auto-refresh countdown
        if (!isExpired && expiresIn > 0) {
            var countdownInterval = setInterval(function () {
                var expiresEl = container.querySelector('.ctp-qr-expires');
                if (!expiresEl || !document.contains(expiresEl)) {
                    clearInterval(countdownInterval);
                    return;
                }
                var remaining = Math.max(0, Math.floor((new Date(state.qrToken.expiresAt) - new Date()) / 1000));
                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                    expiresEl.innerHTML = '<span style="color:var(--ctp-red-500)">Expired — please generate a new one</span>';
                    return;
                }
                var mins = Math.floor(remaining / 60);
                var secs = remaining % 60;
                expiresEl.textContent = 'Expires in ' + mins + ':' + (secs < 10 ? '0' : '') + secs;
            }, 1000);
        }
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
        var cameraSupported = QRScanner.isSupported();
        container.innerHTML = `
            <div class="ctp-pos-step">
                <h3>${icons.scan} Scan QR Code</h3>
                <p>Scan the customer's QR code or enter the token manually</p>

                ${cameraSupported ? `
                <div id="ctp-scanner-area" style="margin-bottom:20px;">
                    <div id="ctp-camera-preview" style="position:relative;width:100%;max-width:320px;margin:0 auto;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:4/3;">
                        <video id="ctp-scanner-video" style="width:100%;height:100%;object-fit:cover;" muted playsinline></video>
                        <canvas id="ctp-scanner-canvas" style="display:none;"></canvas>
                        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
                            <div style="width:180px;height:180px;border:3px solid rgba(99,102,241,0.7);border-radius:16px;"></div>
                        </div>
                    </div>
                    <p class="ctp-text-xs ctp-text-muted ctp-mt-4" id="ctp-scan-status">Point camera at customer's QR code...</p>
                    <button class="ctp-btn ctp-btn-outline ctp-btn-sm ctp-mt-4" id="ctp-stop-camera">Stop Camera</button>
                </div>
                ` : ''}

                <div style="margin-top:${cameraSupported ? '8' : '0'}px;">
                    ${cameraSupported ? '<p class="ctp-text-xs ctp-text-muted ctp-mb-4">Or enter token manually:</p>' : ''}
                    <div class="ctp-form-group">
                        <input type="text" class="ctp-input" id="ctp-qr-input" placeholder="Paste QR token here..." style="font-family:monospace; font-size:13px;">
                    </div>
                    <button class="ctp-btn ctp-btn-primary ctp-btn-full" id="ctp-scan-btn">Validate Token</button>
                </div>
            </div>
        `;

        // Start camera scanning
        if (cameraSupported) {
            var video = document.getElementById('ctp-scanner-video');
            var canvas = document.getElementById('ctp-scanner-canvas');
            var statusEl = document.getElementById('ctp-scan-status');

            QRScanner.start(video, canvas, function (result, err) {
                if (err) {
                    statusEl.textContent = 'Camera not available. Please enter token manually.';
                    statusEl.style.color = 'var(--ctp-orange-500)';
                    return;
                }
                if (result) {
                    statusEl.textContent = 'QR Code detected!';
                    statusEl.style.color = 'var(--ctp-emerald-600)';
                    document.getElementById('ctp-qr-input').value = result;
                    // Auto-validate
                    validateScannedToken(result);
                }
            });

            var stopBtn = document.getElementById('ctp-stop-camera');
            if (stopBtn) {
                stopBtn.addEventListener('click', function () {
                    QRScanner.stop();
                    document.getElementById('ctp-scanner-area').style.display = 'none';
                });
            }
        }

        // Manual validate button
        document.getElementById('ctp-scan-btn').addEventListener('click', async function () {
            var token = document.getElementById('ctp-qr-input').value.trim();
            if (!token) return;
            validateScannedToken(token);
        });
    }

    async function validateScannedToken(token) {
        var btn = document.getElementById('ctp-scan-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Validating...';
        }

        try {
            QRScanner.stop();
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
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Validate Token';
            }
        }
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

                <div class="ctp-tabs ctp-mb-6" style="flex-wrap:wrap;">
                    <button class="ctp-tab ${state.adminTab === 'overview' ? 'active' : ''}" data-admin-tab="overview">Overview</button>
                    <button class="ctp-tab ${state.adminTab === 'merchants' ? 'active' : ''}" data-admin-tab="merchants">Merchants</button>
                    <button class="ctp-tab ${state.adminTab === 'tourists' ? 'active' : ''}" data-admin-tab="tourists">Tourists</button>
                    <button class="ctp-tab ${state.adminTab === 'agencies' ? 'active' : ''}" data-admin-tab="agencies">Car Companies</button>
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
            case 'agencies':
                renderAdminAgencies(content);
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
    // ADMIN - CAR COMPANIES (AGENCIES)
    // =====================
    async function renderAdminAgencies(container) {
        container.innerHTML = '<div class="ctp-loading-screen"><div class="ctp-loading-spinner"></div></div>';

        try {
            var agencies = await api('admin/agencies');
            state.adminAgencies = agencies;

            container.innerHTML = `
                <div class="ctp-card">
                    <div class="ctp-card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                        <div>
                            <h3>Car Rental Companies (${agencies.length})</h3>
                            <p>Configure branding, API settings, and demo contracts for each rental company</p>
                        </div>
                        <button class="ctp-btn ctp-btn-primary ctp-btn-sm" id="ctp-add-agency-btn">+ Add Company</button>
                    </div>
                    <div id="ctp-agencies-list">
                        ${agencies.length === 0 ? '<div class="ctp-empty-state"><p>No car companies configured yet.</p></div>' :
                        agencies.map(function(a) {
                            return `
                            <div class="ctp-admin-merchant-item" style="border-left:4px solid ${a.primaryColor};">
                                <div class="ctp-admin-merchant-info" style="flex:1;">
                                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                                        ${a.logoUrl ? '<img src="' + escapeHtml(a.logoUrl) + '" alt="' + escapeHtml(a.name) + '" style="height:28px;max-width:100px;object-fit:contain;">' : ''}
                                        <h4 style="margin:0;">${escapeHtml(a.name)}
                                            <span class="ctp-status-badge ${a.isActive ? 'ctp-status-approved' : 'ctp-status-suspended'}">${a.isActive ? 'Active' : 'Inactive'}</span>
                                            ${a.isDemo ? '<span class="ctp-status-badge ctp-status-pending">Demo</span>' : ''}
                                        </h4>
                                    </div>
                                    <p>Prefix: <strong>${escapeHtml(a.contractPrefix)}</strong> | Colors: <span style="display:inline-block;width:14px;height:14px;background:${a.primaryColor};border-radius:3px;vertical-align:middle;border:1px solid var(--ctp-slate-200);"></span> <span style="display:inline-block;width:14px;height:14px;background:${a.secondaryColor};border-radius:3px;vertical-align:middle;border:1px solid var(--ctp-slate-200);"></span></p>
                                    ${a.demoContract ? '<p>Demo Contract: <code style="background:var(--ctp-slate-100);padding:2px 8px;border-radius:4px;font-size:12px;">' + escapeHtml(a.demoContract) + '</code></p>' : ''}
                                    ${a.apiEndpoint ? '<p>API: <code style="font-size:11px;">' + escapeHtml(a.apiEndpoint) + '</code></p>' : '<p style="color:var(--ctp-slate-400);font-size:12px;">No API configured (mock mode)</p>'}
                                </div>
                                <div class="ctp-admin-merchant-actions" style="flex-shrink:0;">
                                    <button class="ctp-btn ctp-btn-outline ctp-btn-sm" data-edit-agency="${a.id}">Edit</button>
                                    <button class="ctp-btn ctp-btn-danger ctp-btn-sm" data-delete-agency="${a.id}" style="padding:8px 12px;">Delete</button>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div id="ctp-agency-form-area"></div>
            `;

            // Add company button
            document.getElementById('ctp-add-agency-btn').addEventListener('click', function() {
                showAgencyForm(null);
            });

            // Edit buttons
            container.querySelectorAll('[data-edit-agency]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var agencyId = parseInt(btn.dataset.editAgency);
                    var agency = agencies.find(function(a) { return a.id === agencyId; });
                    if (agency) showAgencyForm(agency);
                });
            });

            // Delete buttons
            container.querySelectorAll('[data-delete-agency]').forEach(function(btn) {
                btn.addEventListener('click', async function() {
                    if (!confirm('Delete this car company? This cannot be undone.')) return;
                    try {
                        await api('admin/agencies/' + btn.dataset.deleteAgency, { method: 'DELETE' });
                        renderAdminAgencies(container);
                    } catch (err) {
                        alert(err.message);
                    }
                });
            });
        } catch (err) {
            container.innerHTML = '<div class="ctp-alert ctp-alert-error">' + escapeHtml(err.message) + '</div>';
        }
    }

    function showAgencyForm(agency) {
        var formArea = document.getElementById('ctp-agency-form-area');
        if (!formArea) return;
        var isEdit = !!agency;

        formArea.innerHTML = `
            <div class="ctp-card ctp-mt-4" style="border:2px solid var(--ctp-primary-200);">
                <div class="ctp-card-header">
                    <h3>${isEdit ? 'Edit' : 'Add New'} Car Company</h3>
                </div>
                <div class="ctp-card-body">
                    <form id="ctp-agency-form">
                        <div class="ctp-form-row">
                            <div class="ctp-form-group">
                                <label>Company Name</label>
                                <input type="text" class="ctp-input" id="ctp-ag-name" value="${escapeHtml((agency && agency.name) || '')}" placeholder="e.g. Hertz" required>
                            </div>
                            <div class="ctp-form-group">
                                <label>Contract Prefix</label>
                                <input type="text" class="ctp-input" id="ctp-ag-prefix" value="${escapeHtml((agency && agency.contractPrefix) || '')}" placeholder="e.g. HZ" maxlength="5" required style="text-transform:uppercase;font-family:monospace;">
                            </div>
                        </div>
                        <div class="ctp-form-row">
                            <div class="ctp-form-group">
                                <label>Primary Color</label>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <input type="color" id="ctp-ag-color1" value="${(agency && agency.primaryColor) || '#000000'}" style="width:48px;height:40px;border:1px solid var(--ctp-slate-200);border-radius:8px;cursor:pointer;">
                                    <input type="text" class="ctp-input" id="ctp-ag-color1-hex" value="${(agency && agency.primaryColor) || '#000000'}" placeholder="#000000" style="flex:1;font-family:monospace;">
                                </div>
                            </div>
                            <div class="ctp-form-group">
                                <label>Secondary Color</label>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <input type="color" id="ctp-ag-color2" value="${(agency && agency.secondaryColor) || '#ffffff'}" style="width:48px;height:40px;border:1px solid var(--ctp-slate-200);border-radius:8px;cursor:pointer;">
                                    <input type="text" class="ctp-input" id="ctp-ag-color2-hex" value="${(agency && agency.secondaryColor) || '#ffffff'}" placeholder="#ffffff" style="flex:1;font-family:monospace;">
                                </div>
                            </div>
                            <div class="ctp-form-group">
                                <label>Accent Color</label>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <input type="color" id="ctp-ag-color3" value="${(agency && agency.accentColor) || '#000000'}" style="width:48px;height:40px;border:1px solid var(--ctp-slate-200);border-radius:8px;cursor:pointer;">
                                    <input type="text" class="ctp-input" id="ctp-ag-color3-hex" value="${(agency && agency.accentColor) || '#000000'}" placeholder="#000000" style="flex:1;font-family:monospace;">
                                </div>
                            </div>
                        </div>
                        <div class="ctp-form-group">
                            <label>Logo URL (full-size)</label>
                            <input type="url" class="ctp-input" id="ctp-ag-logo" value="${escapeHtml((agency && agency.logoUrl) || '')}" placeholder="https://...logo.png">
                        </div>
                        <div class="ctp-form-group">
                            <label>Logo Icon URL (small, for header)</label>
                            <input type="url" class="ctp-input" id="ctp-ag-logo-icon" value="${escapeHtml((agency && agency.logoIconUrl) || '')}" placeholder="https://...icon.png">
                        </div>

                        <div style="border-top:1px solid var(--ctp-slate-100);padding-top:16px;margin-top:16px;">
                            <h4 style="font-size:14px;font-weight:700;color:var(--ctp-slate-700);margin-bottom:12px;">API Configuration</h4>
                            <div class="ctp-form-group">
                                <label>API Endpoint (for real validation)</label>
                                <input type="url" class="ctp-input" id="ctp-ag-api" value="${escapeHtml((agency && agency.apiEndpoint) || '')}" placeholder="https://api.company.com/validate">
                            </div>
                            <div class="ctp-form-group">
                                <label>API Key</label>
                                <input type="text" class="ctp-input" id="ctp-ag-apikey" value="" placeholder="${isEdit ? 'Leave blank to keep current' : 'Enter API key'}">
                            </div>
                        </div>

                        <div style="border-top:1px solid var(--ctp-slate-100);padding-top:16px;margin-top:16px;">
                            <h4 style="font-size:14px;font-weight:700;color:var(--ctp-slate-700);margin-bottom:12px;">Demo Settings</h4>
                            <div class="ctp-form-row">
                                <div class="ctp-form-group">
                                    <label>Demo Contract Number</label>
                                    <input type="text" class="ctp-input" id="ctp-ag-demo" value="${escapeHtml((agency && agency.demoContract) || '')}" placeholder="e.g. HZ-DEMO-2026-001" style="font-family:monospace;">
                                </div>
                            </div>
                            <div style="display:flex;gap:16px;margin-top:8px;">
                                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;">
                                    <input type="checkbox" id="ctp-ag-active" ${(!agency || agency.isActive) ? 'checked' : ''}> Active
                                </label>
                                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;">
                                    <input type="checkbox" id="ctp-ag-is-demo" ${(agency && agency.isDemo) ? 'checked' : ''}> Show in Demo
                                </label>
                            </div>
                        </div>

                        <div id="ctp-ag-preview" style="margin-top:20px;padding:16px;border-radius:var(--ctp-radius-lg);border:1px solid var(--ctp-slate-200);"></div>

                        <div class="ctp-flex ctp-gap-2 ctp-mt-6">
                            <button type="button" class="ctp-btn ctp-btn-outline" id="ctp-ag-cancel" style="flex:1;">Cancel</button>
                            <button type="submit" class="ctp-btn ctp-btn-primary" id="ctp-ag-save" style="flex:2;">${isEdit ? 'Update Company' : 'Add Company'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Color picker sync
        ['1','2','3'].forEach(function(n) {
            var picker = document.getElementById('ctp-ag-color' + n);
            var hex = document.getElementById('ctp-ag-color' + n + '-hex');
            picker.addEventListener('input', function() { hex.value = picker.value; updateAgencyPreview(); });
            hex.addEventListener('input', function() { if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) { picker.value = hex.value; } updateAgencyPreview(); });
        });

        // Live preview
        function updateAgencyPreview() {
            var preview = document.getElementById('ctp-ag-preview');
            var name = document.getElementById('ctp-ag-name').value || 'Company';
            var c1 = document.getElementById('ctp-ag-color1').value;
            var c2 = document.getElementById('ctp-ag-color2').value;
            var logo = document.getElementById('ctp-ag-logo').value;
            preview.innerHTML = `
                <p style="font-size:11px;color:var(--ctp-slate-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:600;">Live Preview</p>
                <div style="background:${c1};color:${c2};padding:12px 20px;border-radius:var(--ctp-radius);display:flex;align-items:center;gap:12px;">
                    ${logo ? '<img src="' + escapeHtml(logo) + '" style="height:24px;max-width:80px;object-fit:contain;" onerror="this.style.display=\'none\'">' : ''}
                    <span style="font-weight:700;font-size:16px;">${escapeHtml(name)} <span style="font-weight:400;font-size:12px;opacity:0.8;">Tourist Pass</span></span>
                </div>
            `;
        }
        document.getElementById('ctp-ag-name').addEventListener('input', updateAgencyPreview);
        document.getElementById('ctp-ag-logo').addEventListener('input', updateAgencyPreview);
        updateAgencyPreview();

        // Cancel
        document.getElementById('ctp-ag-cancel').addEventListener('click', function() {
            formArea.innerHTML = '';
        });

        // Save
        document.getElementById('ctp-agency-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            var btn = document.getElementById('ctp-ag-save');
            btn.disabled = true;
            btn.textContent = 'Saving...';

            var payload = {
                name: document.getElementById('ctp-ag-name').value,
                contractPrefix: document.getElementById('ctp-ag-prefix').value.toUpperCase(),
                primaryColor: document.getElementById('ctp-ag-color1').value,
                secondaryColor: document.getElementById('ctp-ag-color2').value,
                accentColor: document.getElementById('ctp-ag-color3').value,
                logoUrl: document.getElementById('ctp-ag-logo').value,
                logoIconUrl: document.getElementById('ctp-ag-logo-icon').value,
                apiEndpoint: document.getElementById('ctp-ag-api').value,
                isActive: document.getElementById('ctp-ag-active').checked ? 1 : 0,
                isDemo: document.getElementById('ctp-ag-is-demo').checked ? 1 : 0,
                demoContract: document.getElementById('ctp-ag-demo').value,
            };
            var apiKeyVal = document.getElementById('ctp-ag-apikey').value;
            if (apiKeyVal) payload.apiKey = apiKeyVal;

            try {
                if (isEdit) {
                    await api('admin/agencies/' + agency.id, { method: 'PUT', body: JSON.stringify(payload) });
                } else {
                    await api('admin/agencies', { method: 'POST', body: JSON.stringify(payload) });
                }
                formArea.innerHTML = '';
                renderAdminAgencies(document.getElementById('ctp-admin-content'));
            } catch (err) {
                alert(err.message);
                btn.disabled = false;
                btn.textContent = isEdit ? 'Update Company' : 'Add Company';
            }
        });
    }

    // =====================
    // BOOT
    // =====================
    function safeBoot() {
        try {
            init();
        } catch (err) {
            console.error('Cyprus Tourist Pass init error:', err);
            var app = document.getElementById('ctp-app');
            if (app) {
                app.innerHTML = '<div class="ctp-alert ctp-alert-error" style="margin:20px;">Something went wrong loading Cyprus Tourist Pass. Please refresh the page.</div>';
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeBoot);
    } else {
        safeBoot();
    }

})();
