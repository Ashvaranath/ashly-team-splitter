const accountButton = document.getElementById("accountButton");
const accountMenu = document.getElementById("accountMenu");
const accountLoginOption = document.getElementById("accountLoginOption");
const accountSaveRatingsOption = document.getElementById("accountSaveRatingsOption");
const accountUsername = document.getElementById("accountUsername");
const accountLogoutOption = document.getElementById("accountLogoutOption");
const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const authError = document.getElementById("authError");
const authTitle = document.getElementById("authTitle");
const authEyebrow = document.getElementById("authEyebrow");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmit = document.getElementById("authSubmit");
const authSwitchLine = document.getElementById("authSwitchLine");
const authClose = document.getElementById("authClose");

const AUTH_EMAIL_DOMAIN = "ashly.users";

let authMode = "login";
let cachedUsername = null;
let cachedUserId = null;

function sb() {
  return window.AshlySupabase;
}

/** Turn any username into a stable synthetic email for Supabase Auth. */
function usernameToEmail(username) {
  const bytes = new TextEncoder().encode(username);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${encoded}@${AUTH_EMAIL_DOMAIN}`;
}

/**
 * Supabase enforces a minimum password length server-side.
 * Wrap the user's password so even a 1-character password is accepted,
 * while keeping the app UX rule: any non-empty password is fine.
 */
function toAuthPassword(password) {
  return `ats.v1:${password}`;
}

function usernameFromUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  if (typeof meta.username === "string" && meta.username.length > 0) return meta.username;
  return null;
}

function friendlyAuthError(error, mode) {
  const message = (error && error.message) || "Something went wrong.";
  const code = (error && error.code) || "";
  const lower = `${message} ${code}`.toLowerCase();

  if (mode === "login") {
    if (
      message === "NO_ACCOUNT_MATCH" ||
      lower.includes("invalid login credentials") ||
      lower.includes("invalid_credentials") ||
      lower.includes("user not found")
    ) {
      return "No account found with this username and password.";
    }
  }

  if (
    mode === "register" &&
    (message === "USERNAME_TAKEN" ||
      lower.includes("user already registered") ||
      lower.includes("already been registered") ||
      lower.includes("email_exists") ||
      lower.includes("user_already_exists"))
  ) {
    return "This username is already registered. Please try another username.";
  }
  if (lower.includes("password should be at least") || lower.includes("password is too short")) {
    return "Could not create account. Please try again.";
  }
  return message;
}

function closeAccountMenu() {
  accountMenu.hidden = true;
  accountButton.setAttribute("aria-expanded", "false");
}

function openAccountMenu() {
  if (window.AshlyUi && typeof window.AshlyUi.closeConnect === "function") {
    window.AshlyUi.closeConnect();
  }
  accountMenu.hidden = false;
  accountButton.setAttribute("aria-expanded", "true");
}

function setCachedUser(user) {
  cachedUserId = user && user.id ? user.id : null;
  cachedUsername = usernameFromUser(user);
}

function updateAccountUi() {
  if (cachedUsername) {
    const initial = cachedUsername.slice(0, 1).toUpperCase() || "?";
    accountButton.classList.add("is-logged-in");
    accountButton.dataset.initial = initial;
    accountButton.title = `Signed in as ${cachedUsername}`;
    accountButton.setAttribute("aria-label", `Account, signed in as ${cachedUsername}`);
    accountUsername.hidden = false;
    accountUsername.textContent = cachedUsername;
    accountLoginOption.hidden = true;
    accountSaveRatingsOption.hidden = false;
    accountLogoutOption.hidden = false;
  } else {
    accountButton.classList.remove("is-logged-in");
    accountButton.removeAttribute("data-initial");
    accountButton.title = "Account";
    accountButton.setAttribute("aria-label", "Account");
    accountUsername.hidden = true;
    accountUsername.textContent = "";
    accountLoginOption.hidden = false;
    accountSaveRatingsOption.hidden = true;
    accountLogoutOption.hidden = true;
  }
  document.dispatchEvent(
    new CustomEvent("ats-auth-change", {
      detail: { username: cachedUsername, userId: cachedUserId },
    })
  );
}

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = !message;
}

function setAuthBusy(busy) {
  authSubmit.disabled = busy;
  authUsername.disabled = busy;
  authPassword.disabled = busy;
  authSubmit.textContent = busy
    ? authMode === "register"
      ? "Creating…"
      : "Logging in…"
    : authMode === "register"
      ? "Register"
      : "Login";
}

function setAuthMode(mode) {
  authMode = mode;
  showAuthError("");
  if (mode === "register") {
    authEyebrow.textContent = "Create account";
    authTitle.textContent = "Register";
    authSubtitle.textContent = "";
    authSubtitle.hidden = true;
    authSubmit.textContent = "Register";
    authPassword.autocomplete = "new-password";
    authSwitchLine.innerHTML =
      'Already have an account? <button type="button" id="authSwitch" class="auth-switch-btn">Login</button>';
  } else {
    authEyebrow.textContent = "Welcome";
    authTitle.textContent = "Login";
    authSubtitle.textContent = "Sign in to save your player ratings.";
    authSubtitle.hidden = false;
    authSubmit.textContent = "Login";
    authPassword.autocomplete = "current-password";
    authSwitchLine.innerHTML =
      'No account yet? <button type="button" id="authSwitch" class="auth-switch-btn">Register</button>';
  }
  document.getElementById("authSwitch").addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
  });
}

function openAuthModal(mode) {
  closeAccountMenu();
  setAuthMode(mode);
  authForm.reset();
  showAuthError("");
  setAuthBusy(false);
  authOverlay.hidden = false;
  setTimeout(() => authUsername.focus(), 40);
}

function closeAuthModal() {
  authOverlay.hidden = true;
  authForm.reset();
  showAuthError("");
  setAuthBusy(false);
  document.dispatchEvent(new CustomEvent("ats-auth-close"));
}

async function registerUser(username, password) {
  const email = usernameToEmail(username);
  const { data, error } = await sb().auth.signUp({
    email,
    password: toAuthPassword(password),
    options: {
      data: { username },
    },
  });
  if (error) throw error;

  // Supabase may return a user with no identities when the username already exists.
  const identities = data.user && Array.isArray(data.user.identities) ? data.user.identities : null;
  if (data.user && identities && identities.length === 0) {
    throw new Error("USERNAME_TAKEN");
  }

  if (data.user && data.session) {
    setCachedUser(data.user);
    return { needsConfirmation: false };
  }

  if (data.user && identities && identities.length > 0) {
    return { needsConfirmation: true };
  }

  throw new Error("USERNAME_TAKEN");
}

async function loginUser(username, password) {
  const email = usernameToEmail(username);
  const { data, error } = await sb().auth.signInWithPassword({
    email,
    password: toAuthPassword(password),
  });
  if (error) throw error;

  // Only allow login when Supabase returns a real session for this pair.
  if (!data || !data.user || !data.session) {
    setCachedUser(null);
    throw new Error("NO_ACCOUNT_MATCH");
  }

  setCachedUser(data.user);
}

async function logoutUser() {
  const { error } = await sb().auth.signOut();
  if (error) throw error;
  setCachedUser(null);
}

async function initAuthSession() {
  const { data, error } = await sb().auth.getSession();
  if (error) {
    console.warn("Could not restore session:", error.message);
    setCachedUser(null);
  } else {
    setCachedUser(data.session && data.session.user ? data.session.user : null);
  }
  updateAccountUi();

  sb().auth.onAuthStateChange((_event, session) => {
    setCachedUser(session && session.user ? session.user : null);
    updateAccountUi();
  });
}

accountButton.addEventListener("click", (event) => {
  event.stopPropagation();
  if (accountButton.getAttribute("aria-expanded") === "true") closeAccountMenu();
  else openAccountMenu();
});

accountLoginOption.addEventListener("click", (event) => {
  event.stopPropagation();
  openAuthModal("login");
});

accountSaveRatingsOption.addEventListener("click", (event) => {
  event.stopPropagation();
  closeAccountMenu();
  document.dispatchEvent(new CustomEvent("ats-open-save-ratings"));
});

accountLogoutOption.addEventListener("click", async (event) => {
  event.stopPropagation();
  const username = cachedUsername;
  try {
    await logoutUser();
  } catch (error) {
    console.warn("Logout failed:", error.message);
    setCachedUser(null);
    updateAccountUi();
  }
  closeAccountMenu();
  document.dispatchEvent(
    new CustomEvent("ats-auth-logout", {
      detail: { username: username || "" },
    })
  );
});

authClose.addEventListener("click", closeAuthModal);

authOverlay.addEventListener("click", (event) => {
  if (event.target === authOverlay) closeAuthModal();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  // Keep exact values — no trimming, no format rules.
  const username = authUsername.value;
  const password = authPassword.value;
  showAuthError("");

  if (username.length < 1 || password.length < 1) {
    showAuthError("Username and password cannot be empty.");
    return;
  }

  setAuthBusy(true);
  try {
    if (authMode === "register") {
      const result = await registerUser(username, password);
      if (result.needsConfirmation) {
        showAuthError("Account created. Please log in.");
        setAuthMode("login");
        authUsername.value = username;
        return;
      }
      updateAccountUi();
      closeAuthModal();
      document.dispatchEvent(
        new CustomEvent("ats-auth-success", {
          detail: { mode: "register", username: cachedUsername },
        })
      );
      return;
    }

    await loginUser(username, password);
    updateAccountUi();
    closeAuthModal();
    document.dispatchEvent(
      new CustomEvent("ats-auth-success", {
        detail: { mode: "login", username: cachedUsername },
      })
    );
  } catch (error) {
    // Failed login/register must never leave the user signed in.
    if (authMode === "login") {
      setCachedUser(null);
      updateAccountUi();
    }
    showAuthError(friendlyAuthError(error, authMode));
  } finally {
    setAuthBusy(false);
  }
});

document.addEventListener(
  "click",
  (event) => {
    if (!event.target.closest(".account-wrap")) closeAccountMenu();
  },
  true
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAccountMenu();
    if (!authOverlay.hidden) closeAuthModal();
  }
});

initAuthSession();

window.AshlyAuth = {
  currentUser: () => cachedUsername,
  currentUserId: () => cachedUserId,
  openLogin: () => openAuthModal("login"),
  openRegister: () => openAuthModal("register"),
  closeAccountMenu,
};
