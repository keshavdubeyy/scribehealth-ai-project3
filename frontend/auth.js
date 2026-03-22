/**
 * auth.js — ScribeHealth AI
 * Vanilla JS only. No libraries.
 *
 * Exports:
 *   requireAuth(allowedRoles)  — call at top of any protected page
 *
 * Usage example:
 *   // requireAuth(['DOCTOR'])        — only doctors allowed
 *   // requireAuth(['ADMIN'])         — only admins allowed
 *   // requireAuth(['DOCTOR','ADMIN']) — either role allowed
 */

'use strict';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const API_BASE      = 'http://localhost:8080/api/auth';
const TOKEN_KEY     = 'scribeToken';
const ROLE_KEY      = 'scribeRole';
const NAME_KEY      = 'scribeName';

// ─────────────────────────────────────────────
// JWT helpers (no library — base64 decode only)
// ─────────────────────────────────────────────

/**
 * Decode the payload segment of a JWT without verifying the signature.
 * @param {string} token
 * @returns {object|null}
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json   = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true if the token exists and has not expired.
 * @param {string} token
 * @returns {boolean}
 */
function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now(); // exp is in seconds
}

// ─────────────────────────────────────────────
// requireAuth — token guard for protected pages
// ─────────────────────────────────────────────

/**
 * Call this at the top of any protected page.
 * Redirects to /login.html if the token is missing, expired,
 * or the user's role is not in allowedRoles.
 *
 * @param {string[]} allowedRoles  e.g. ['DOCTOR'] or ['ADMIN'] or ['DOCTOR','ADMIN']
 *
 * Usage:
 *   requireAuth(['DOCTOR'])
 */
function requireAuth(allowedRoles) {
  const token = localStorage.getItem(TOKEN_KEY);
  const role  = localStorage.getItem(ROLE_KEY);

  if (!isTokenValid(token) || !allowedRoles.includes(role)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(NAME_KEY);
    window.location.href = '/login.html';
  }
}

// ─────────────────────────────────────────────
// Shared UI helpers
// ─────────────────────────────────────────────

function showError(msg) {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function showSuccess(msg) {
  const el = document.getElementById('form-success');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearMessages() {
  const err = document.getElementById('form-error');
  const suc = document.getElementById('form-success');
  if (err) err.style.display = 'none';
  if (suc) suc.style.display = 'none';
}

// ─────────────────────────────────────────────
// login()
// ─────────────────────────────────────────────

async function login(email, password) {
  const submitBtn = document.getElementById('submit-btn');

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Signing in…';
  clearMessages();

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    if (res.status === 401) {
      showError('Invalid email or password.');
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      showError(body.message || body.error || 'Login failed. Please try again.');
      return;
    }

    const data = await res.json();

    // Store credentials
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ROLE_KEY,  data.role);
    localStorage.setItem(NAME_KEY,  data.name);

    showSuccess(`Welcome back, ${data.name}! Redirecting…`);

    setTimeout(() => {
      window.location.href =
        data.role === 'ADMIN' ? 'admin-dashboard.html' : 'doctor-dashboard.html';
    }, 900);

  } catch {
    showError('Server unreachable. Please try again.');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Sign In';
  }
}

// ─────────────────────────────────────────────
// register() — modal
// ─────────────────────────────────────────────

function openRegisterModal() {
  // Prevent duplicates
  if (document.getElementById('register-modal')) return;

  const overlay = document.createElement('div');
  overlay.id        = 'register-modal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modal-title');

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">Create an Account</h2>
        <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
      </div>

      <div id="modal-error"   class="form-msg form-msg--error"   style="display:none;"></div>
      <div id="modal-success" class="form-msg form-msg--success" style="display:none;"></div>

      <form id="register-form" novalidate>

        <div class="field-group">
          <label class="field-label" for="reg-name">Full Name</label>
          <input class="field-input" type="text" id="reg-name"
            placeholder="Dr. Jane Smith" required autocomplete="name" />
        </div>

        <div class="field-group">
          <label class="field-label" for="reg-email">Email</label>
          <input class="field-input" type="email" id="reg-email"
            placeholder="you@example.com" required autocomplete="email" />
        </div>

        <div class="field-group">
          <label class="field-label" for="reg-password">Password</label>
          <input class="field-input" type="password" id="reg-password"
            placeholder="Min. 8 characters" required autocomplete="new-password" />
        </div>

        <div class="field-group">
          <label class="field-label" for="reg-role">Role</label>
          <select class="field-input" id="reg-role" required>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <!-- Shown only when DOCTOR is selected -->
        <div class="field-group" id="specialization-group">
          <label class="field-label" for="reg-spec">Specialization</label>
          <input class="field-input" type="text" id="reg-spec"
            placeholder="e.g. Cardiology" autocomplete="off" />
        </div>

        <button type="submit" class="btn-submit" id="register-submit-btn">
          Create Account
        </button>

      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Show/hide specialization based on role
  const roleSelect   = document.getElementById('reg-role');
  const specGroup    = document.getElementById('specialization-group');

  function syncSpecVisibility() {
    specGroup.style.display = roleSelect.value === 'DOCTOR' ? 'flex' : 'none';
  }
  syncSpecVisibility();
  roleSelect.addEventListener('change', syncSpecVisibility);

  // Close on overlay click or close button
  document.getElementById('modal-close-btn').addEventListener('click', closeRegisterModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeRegisterModal(); });

  // Trap Escape key
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRegisterModal(); });

  // Form submit
  document.getElementById('register-form').addEventListener('submit', handleRegisterSubmit);

  // Focus first input
  requestAnimationFrame(() => document.getElementById('reg-name').focus());
}

function closeRegisterModal() {
  const modal = document.getElementById('register-modal');
  if (modal) modal.remove();
}

async function handleRegisterSubmit(e) {
  e.preventDefault();

  const modalError   = document.getElementById('modal-error');
  const modalSuccess = document.getElementById('modal-success');
  const regBtn       = document.getElementById('register-submit-btn');

  modalError.style.display   = 'none';
  modalSuccess.style.display = 'none';

  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;
  const spec     = document.getElementById('reg-spec').value.trim();

  // Basic client-side validation
  if (!name || !email || !password || !role) {
    modalError.textContent = 'Please fill in all required fields.';
    modalError.style.display = 'block';
    return;
  }

  const body = { name, email, password, role };
  if (role === 'DOCTOR' && spec) {
    body.doctorProfile = { specialization: spec };
  }

  regBtn.disabled    = true;
  regBtn.textContent = 'Creating account…';

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (res.status === 409) {
      modalError.textContent   = 'An account with this email already exists.';
      modalError.style.display = 'block';
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      modalError.textContent   = data.message || data.error || 'Registration failed.';
      modalError.style.display = 'block';
      return;
    }

    const data = await res.json();

    // Store credentials
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ROLE_KEY,  data.role);
    localStorage.setItem(NAME_KEY,  data.name);

    modalSuccess.textContent   = `Account created! Welcome, ${data.name}.`;
    modalSuccess.style.display = 'block';

    // Pre-fill email in the login form
    const loginEmailInput = document.getElementById('email');
    if (loginEmailInput) loginEmailInput.value = email;

    // Auto-close after short delay then redirect
    setTimeout(() => {
      closeRegisterModal();
      window.location.href =
        data.role === 'ADMIN' ? 'admin-dashboard.html' : 'doctor-dashboard.html';
    }, 1200);

  } catch {
    modalError.textContent   = 'Server unreachable. Please try again.';
    modalError.style.display = 'block';
  } finally {
    regBtn.disabled    = false;
    regBtn.textContent = 'Create Account';
  }
}

// ─────────────────────────────────────────────
// Wire up login.html on DOMContentLoaded
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const loginForm    = document.getElementById('login-form');
  const registerLink = document.getElementById('register-link');

  // Hook: login form submit → login()
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      login(email, password);
    });
  }

  // Hook: "Request a free trial" → open register modal
  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      openRegisterModal();
    });
  }
});

// ─────────────────────────────────────────────
// Exports (for protected pages)
// ─────────────────────────────────────────────

// Usage: <script src="auth.js"></script>
// Then call: requireAuth(['DOCTOR']) or requireAuth(['ADMIN'])
window.requireAuth = requireAuth;
