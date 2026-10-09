// GarbaJodi Auth Modal Component

function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  switchAuthTab(mode);
  modal.classList.add('open');
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
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  try {
    const res = await API.post('/api/auth/login', { email, password });
    API.setToken(res.token);
    State.setUser(res.user, res.profile, res.photos);
    showToast(`Welcome back, ${res.profile ? res.profile.display_name : 'Dancer'}!`, 'success');
    closeAuthModal();
    if (window.Router) Router.navigate('/discover');
  } catch (err) {
    errEl.textContent = err.message;
  }
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
    if (window.Router) Router.navigate('/profile');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

function handleGoogleSignInNotice() {
  alert('Google Sign-In Notice: To enable direct Google OAuth in production, specify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables. Email and password authentication is active and secure.');
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleGoogleSignInNotice = handleGoogleSignInNotice;
