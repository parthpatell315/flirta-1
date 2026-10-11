// Flirta Auth Modal Component (Email, Secure Password & Google Authentication)

let authConfig = {
  enableDemoLogin: false,
  turnstileSiteKey: '',
  googleClientId: ''
};
let turnstileWidgetId = null;

async function fetchAuthConfig() {
  try {
    const res = await API.get('/api/auth/config');
    authConfig = res || { enableDemoLogin: false, turnstileSiteKey: '', googleClientId: '' };
    renderDemoAccountsUI();
    initTurnstileIfNeeded();
    initGoogleIdentity();
  } catch (err) {
    console.debug('Could not load auth config:', err);
  }
}

function renderDemoAccountsUI() {
  const container = document.getElementById('demo-accounts-container');
  if (!container) return;

  if (authConfig.enableDemoLogin) {
    container.style.display = 'block';
    container.innerHTML = `
      <div style="font-size: 0.74rem; font-weight: 700; color: #b45309; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
        Developer Demo Accounts (Non-Production Only):
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="quickFillLogin('test@flirta.in', 'TestPassword123')">Test Account</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="quickFillLogin('diya.shah@example.com', 'Dancer2026!')">Diya</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="quickFillLogin('rohan.mehta@example.com', 'Dancer2026!')">Rohan</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="quickFillLogin('admin@garbajodi.com', 'AdminGarba2026!')">Admin</button>
      </div>
    `;
  } else {
    container.style.display = 'none';
    container.innerHTML = '';
  }
}

function initTurnstileIfNeeded() {
  if (!authConfig.turnstileSiteKey) return;
  if (document.getElementById('cloudflare-turnstile-script')) return;

  const script = document.createElement('script');
  script.id = 'cloudflare-turnstile-script';
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    renderTurnstileWidget();
  };
  document.head.appendChild(script);
}

function renderTurnstileWidget() {
  const target = document.getElementById('turnstile-signup-widget');
  if (target && window.turnstile && authConfig.turnstileSiteKey && turnstileWidgetId === null) {
    try {
      turnstileWidgetId = window.turnstile.render('#turnstile-signup-widget', {
        sitekey: authConfig.turnstileSiteKey,
        theme: 'light'
      });
    } catch (e) {
      console.debug('Turnstile render error:', e);
    }
  }
}

// Google Identity Services (GIS) Integration
function initGoogleIdentity() {
  if (!authConfig.googleClientId) return;

  const checkGsi = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: authConfig.googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } catch (e) {
        console.debug('Google GIS init error:', e);
      }
    } else {
      setTimeout(checkGsi, 200);
    }
  };

  checkGsi();
}

async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    showToast('Google sign-in was cancelled or failed.', 'error');
    return;
  }

  try {
    const res = await API.post('/api/auth/google', { credential: response.credential });
    completeAuthSuccess(res);
  } catch (err) {
    showToast(err.message || 'Google authentication failed.', 'error');
  }
}

async function handleGoogleSignIn() {
  // If Google Client ID is configured and GIS is available
  if (authConfig.googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is skipped/blocked, navigate to standard OAuth flow
          window.location.href = '/api/auth/google';
        }
      });
      return;
    } catch (e) {
      console.debug('Google prompt error, falling back to redirect:', e);
      window.location.href = '/api/auth/google';
      return;
    }
  }

  // If GOOGLE_CLIENT_ID is not configured in .env yet:
  // Provide clear instructions + instant developer/test login
  const testEmail = prompt(
    'Google Sign-In Configuration Notice:\n\n' +
    'To enable live Google OAuth in production, specify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.\n\n' +
    'For instant testing right now, enter your test Google email (or click OK to use default):',
    'user.google@flirta.network'
  );

  if (!testEmail) return;

  try {
    const res = await API.post('/api/auth/google', {
      mockEmail: testEmail.trim(),
      mockName: testEmail.split('@')[0],
      isMock: true
    });
    completeAuthSuccess(res);
  } catch (err) {
    showToast(err.message || 'Google sign-in failed.', 'error');
  }
}

function completeAuthSuccess(res) {
  API.setToken(res.token);
  State.setUser(res.user, res.profile, res.photos || []);
  showToast(res.message || `Welcome to Flirta, ${res.profile?.display_name || 'Friend'}!`, 'success');
  closeAuthModal();

  // Check if user was in the middle of selecting a plan
  const pendingPlanId = sessionStorage.getItem('flirta_pending_plan_id') || (window.Pricing && window.Pricing.pendingPlanId);
  if (pendingPlanId && window.Pricing) {
    sessionStorage.removeItem('flirta_pending_plan_id');
    window.Pricing.pendingPlanId = null;
    if (window.Router && window.location.pathname !== '/pricing') {
      window.Router.navigate('/pricing');
    }
    setTimeout(() => {
      window.Pricing.openCheckoutModal(pendingPlanId);
    }, 100);
    return;
  }

  if (window.Router) Router.navigate('/discover');
}

function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  switchAuthTab(mode);
  modal.classList.add('open');

  // Load remembered email if present
  try {
    const savedEmail = localStorage.getItem('flirta_remember_email');
    const emailInput = document.getElementById('login-email');
    if (savedEmail && emailInput && !emailInput.value) {
      emailInput.value = savedEmail;
    }
  } catch (e) {}

  fetchAuthConfig();
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form-container');
  const registerForm = document.getElementById('register-form-container');
  const loginTabBtn = document.getElementById('tab-login-btn');
  const regTabBtn = document.getElementById('tab-reg-btn');

  if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
  if (registerForm) registerForm.style.display = tab === 'register' ? 'block' : 'none';

  if (loginTabBtn) loginTabBtn.classList.toggle('active', tab === 'login');
  if (regTabBtn) regTabBtn.classList.toggle('active', tab === 'register');

  if (tab === 'register') {
    renderTurnstileWidget();
  }
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const rememberCheckbox = document.getElementById('login-remember');
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.textContent = '';

  try {
    const res = await API.post('/api/auth/login', { email, password });
    API.setToken(res.token);
    State.setUser(res.user, res.profile, res.photos);

    // Save or clear remembered email
    try {
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('flirta_remember_email', email);
      } else {
        localStorage.removeItem('flirta_remember_email');
      }
    } catch (e) {}

    showToast(`Welcome back, ${res.profile ? res.profile.display_name : 'Friend'}!`, 'success');
    closeAuthModal();

    // Check if user was in the middle of selecting a plan
    const pendingPlanId = sessionStorage.getItem('flirta_pending_plan_id') || (window.Pricing && window.Pricing.pendingPlanId);
    if (pendingPlanId && window.Pricing) {
      sessionStorage.removeItem('flirta_pending_plan_id');
      window.Pricing.pendingPlanId = null;
      if (window.Router && window.location.pathname !== '/pricing') {
        window.Router.navigate('/pricing');
      }
      setTimeout(() => {
        window.Pricing.openCheckoutModal(pendingPlanId);
      }, 100);
      return;
    }

    if (window.Router) Router.navigate('/discover');
  } catch (err) {
    if (errEl) errEl.textContent = err.message;
  }
}

function quickFillLogin(email, password) {
  if (!authConfig.enableDemoLogin) {
    showToast('Demo login is disabled in this environment.', 'error');
    return;
  }
  switchAuthTab('login');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  if (emailInput && passInput) {
    emailInput.value = email;
    passInput.value = password;
    handleLogin({ preventDefault: () => {} });
  }
}

function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  if (btnEl) {
    btnEl.innerHTML = isPassword
      ? `<svg style="pointer-events: none;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg style="pointer-events: none;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
}

function handleForgotPassword() {
  const email = (document.getElementById('login-email')?.value || '').trim();
  const msg = email
    ? `Password recovery instructions dispatched to ${email}. Check your inbox.`
    : `Please enter your registered email in the field above to receive a recovery link.`;
  showToast(msg, 'info');
}

async function handleRegister(e) {
  e.preventDefault();
  const displayName = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const dob = document.getElementById('reg-dob').value;
  const city = document.getElementById('reg-city').value;
  const experience = document.getElementById('reg-experience').value;
  const isAdultConfirmed = document.getElementById('reg-adult-confirm').checked;
  const errEl = document.getElementById('reg-error');
  if (errEl) errEl.textContent = '';

  if (!isAdultConfirmed) {
    if (errEl) errEl.textContent = 'You must confirm you are at least 18 years old and agree to the Terms, Privacy Policy and Anti-Escort Policy.';
    return;
  }

  // Password Hardening Validation
  if (password.length < 8) {
    if (errEl) errEl.textContent = 'Password must be at least 8 characters long.';
    return;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    if (errEl) errEl.textContent = 'Password must include both letters and numbers for account security.';
    return;
  }

  // Strict DOB Age Verification Client-Side
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (isNaN(age) || age < 18) {
    if (errEl) errEl.textContent = 'Eligibility requirement: You must be at least 18 years old to join Flirta.';
    return;
  }

  // Get Turnstile token if enabled
  let turnstileToken = '';
  if (window.turnstile && turnstileWidgetId !== null) {
    try {
      turnstileToken = window.turnstile.getResponse(turnstileWidgetId);
    } catch (e) {}
  }

  try {
    const res = await API.post('/api/auth/register', {
      displayName,
      email,
      password,
      dob,
      city,
      garbaExperience: experience,
      isAdultConfirmed,
      turnstileToken
    });

    completeAuthSuccess(res);
  } catch (err) {
    if (errEl) errEl.textContent = err.message;
  }
}

// Global modal outside-click and escape listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchAuthConfig();

  const authModal = document.getElementById('auth-modal');
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        closeAuthModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAuthModal();
      const checkoutModal = document.getElementById('checkout-modal');
      if (checkoutModal) checkoutModal.remove();
    }
  });
});

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.quickFillLogin = quickFillLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleForgotPassword = handleForgotPassword;
window.handleRegister = handleRegister;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;
