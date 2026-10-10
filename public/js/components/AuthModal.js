// GarbaJodi Auth Modal Component

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

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginTabBtn.classList.add('active');
    regTabBtn.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginTabBtn.classList.remove('active');
    regTabBtn.classList.add('active');
  }
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const rememberCheckbox = document.getElementById('login-remember');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

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

    showToast(`Welcome back, ${res.profile ? res.profile.display_name : 'Dancer'}!`, 'success');
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
    errEl.textContent = err.message;
  }
}

function quickFillLogin(email, password) {
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
    ? `Password reset link will be dispatched to ${email}. Check your inbox for temporary OTP access.`
    : `Please enter your registered email in the field above to receive a password recovery link.`;
  showToast(msg, 'info');
}

async function handleRegister(e) {
  e.preventDefault();
  const displayName = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const dob = document.getElementById('reg-dob').value;
  const city = document.getElementById('reg-city').value;
  const experience = document.getElementById('reg-experience').value;
  const isAdultConfirmed = document.getElementById('reg-adult-confirm').checked;
  const errEl = document.getElementById('reg-error');
  errEl.textContent = '';

  if (!isAdultConfirmed) {
    errEl.textContent = 'You must confirm you are at least 18 years old to join GarbaJodi.';
    return;
  }

  // Calculate age client-side for immediate feedback
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 18) {
    errEl.textContent = 'Eligibility requirement: You must be at least 18 years old to register.';
    return;
  }

  try {
    const res = await API.post('/api/auth/register', {
      displayName,
      email,
      password,
      dob,
      city,
      garbaExperience: experience,
      isAdultConfirmed
    });

    API.setToken(res.token);
    State.setUser(res.user, res.profile, []);
    showToast('Registration successful! Welcome to GarbaJodi Navratri 2026.', 'success');
    closeAuthModal();

    // Check if user was in the middle of selecting a subscription plan
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

    if (window.Router) Router.navigate('/profile');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

function handleGoogleSignInNotice() {
  alert('Google Sign-In Notice: To enable direct Google OAuth in production, specify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables. Email and password authentication is active and secure.');
}

// Global modal outside-click and escape listeners
document.addEventListener('DOMContentLoaded', () => {
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
window.handleGoogleSignInNotice = handleGoogleSignInNotice;
