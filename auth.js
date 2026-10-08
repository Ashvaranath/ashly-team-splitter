const AUTH_USERS_KEY = "ats_users";
const AUTH_SESSION_KEY = "ats_session";

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
const authSwitch = document.getElementById("authSwitch");
const authSwitchLine = document.getElementById("authSwitchLine");
const authClose = document.getElementById("authClose");

let authMode = "login";

function readUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getSessionUsername() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.username === "string" ? parsed.username : null;
  } catch (error) {
    return null;
  }
}

function setSession(username) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ username }));
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function currentUser() {
  const username = getSessionUsername();
  if (!username) return null;
  const users = readUsers();
  return users[username] ? username : null;
}

function closeAccountMenu() {
  accountMenu.hidden = true;
  accountButton.setAttribute("aria-expanded", "false");
}

function openAccountMenu() {
  accountMenu.hidden = false;
  accountButton.setAttribute("aria-expanded", "true");
}

function updateAccountUi() {
  const username = currentUser();
  if (username) {
    accountButton.classList.add("is-logged-in");
    accountButton.dataset.initial = username.slice(0, 1).toUpperCase();
    accountButton.title = `Signed in as ${username}`;
    accountButton.setAttribute("aria-label", `Account, signed in as ${username}`);
    accountUsername.hidden = false;
    accountUsername.textContent = username;
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
  document.dispatchEvent(new CustomEvent("ats-auth-change", { detail: { username } }));
}

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = !message;
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
    authSubtitle.textContent = "";
    authSubtitle.hidden = true;
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
  authOverlay.hidden = false;
  setTimeout(() => authUsername.focus(), 40);
}

function closeAuthModal() {
  authOverlay.hidden = true;
  authForm.reset();
  showAuthError("");
}

async function registerUser(username, password) {
  const users = readUsers();
  if (Object.prototype.hasOwnProperty.call(users, username)) {
    throw new Error("That username is already taken.");
  }
  users[username] = {
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  };
  writeUsers(users);
  setSession(username);
}

async function loginUser(username, password) {
  const users = readUsers();
  const account = users[username];
  if (!account) {
    throw new Error("Username or password is wrong.");
  }
  const passwordHash = await hashPassword(password);
  if (passwordHash !== account.passwordHash) {
    throw new Error("Username or password is wrong.");
  }
  setSession(username);
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

accountLogoutOption.addEventListener("click", (event) => {
  event.stopPropagation();
  clearSession();
  updateAccountUi();
  closeAccountMenu();
});

authClose.addEventListener("click", closeAuthModal);

authOverlay.addEventListener("click", (event) => {
  if (event.target === authOverlay) closeAuthModal();
});

authSwitch.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = authUsername.value;
  const password = authPassword.value;
  showAuthError("");

  try {
    if (authMode === "register") await registerUser(username, password);
    else await loginUser(username, password);
    updateAccountUi();
    closeAuthModal();
  } catch (error) {
    showAuthError(error.message || "Something went wrong.");
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".account-wrap")) closeAccountMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !authOverlay.hidden) closeAuthModal();
});

updateAccountUi();

window.AshlyAuth = {
  currentUser,
  openLogin: () => openAuthModal("login"),
  openRegister: () => openAuthModal("register"),
};
