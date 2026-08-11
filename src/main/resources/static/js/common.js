/**
 * PaySim — shared utilities, API, session
 */

const API_BASE = resolveApiBase();

const API = {
    auth: {
        signup: `${API_BASE}/api/auth/signup`,
        createProfile: `${API_BASE}/api/auth/create-profile`,
        login: `${API_BASE}/api/auth/login`,
        me: `${API_BASE}/api/auth/me`,
        logout: `${API_BASE}/api/auth/logout`
    },
    user: {
        balance: (upiId) => `${API_BASE}/api/user/balance/${encodeURIComponent(upiId)}`,
        balanceWithPin: `${API_BASE}/api/user/balance`,
        transactions: (upiId) => `${API_BASE}/api/user/transactions/${encodeURIComponent(upiId)}`,
        byPhone: (phone) => `${API_BASE}/api/user/phone/${encodeURIComponent(phone)}`,
        updateProfile: (phone) => `${API_BASE}/api/user/profile/${encodeURIComponent(phone)}`,
        removePhoto: (phone) => `${API_BASE}/api/user/profile/${encodeURIComponent(phone)}/photo`,
        deleteAccount: `${API_BASE}/api/user/account`
    },
    payment: {
        send: `${API_BASE}/api/payment/send`,
        qr: (upiId) => `${API_BASE}/api/payment/qr/${encodeURIComponent(upiId)}`,
        qrPayload: (upiId) => `${API_BASE}/api/payment/qr/${encodeURIComponent(upiId)}/payload`
    }
};

const SESSION_KEY = "paysim_session";
const AUTH_FLOW_KEY = "paysim_auth_flow";
const PAYMENT_KEY = "paysim_payment";
const PROFILE_PREFIX = "paysim_profile_";
const BALANCE_UNLOCK_KEY = "paysim_balance_unlocked";
const THEME_KEY = "paysim_theme";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
});

initTheme();

document.addEventListener("DOMContentLoaded", () => {
    mountThemeToggle();
});

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initTheme() {
    applyTheme(getPreferredTheme());
}

function applyTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
        "content",
        nextTheme === "dark" ? "#111827" : "#123b3b"
    );
    document.querySelectorAll(".theme-toggle").forEach((toggle) => {
        toggle.setAttribute("aria-checked", String(nextTheme === "dark"));
        toggle.querySelector(".theme-toggle-text").textContent = nextTheme === "dark" ? "Dark" : "Light";
    });
}

function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}

function mountThemeToggle() {
    if (document.querySelector(".theme-toggle")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-label", "Toggle dark mode");
    toggle.innerHTML = `
        <span class="theme-toggle-track" aria-hidden="true">
            <span class="theme-toggle-thumb"></span>
        </span>
        <span class="theme-toggle-text"></span>
    `;

    toggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });

    document.body.appendChild(toggle);
    applyTheme(getPreferredTheme());
}

function getSession() {
    try {
        const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function setSession(user) {
    const existing = getSession() || {};
    const payload = user.user ? user.user : user;
    const session = {
        token: user.token || existing.token,
        name: payload.name || existing.name,
        displayName: payload.displayName || payload.name || existing.displayName,
        phoneNumber: payload.phoneNumber || existing.phoneNumber,
        email: payload.email ?? existing.email ?? null,
        upiId: payload.upiId || existing.upiId,
        verified: payload.verified ?? existing.verified ?? true
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(SESSION_KEY);
    if (session.phoneNumber && (payload.displayName || payload.name || payload.profilePhoto)) {
        setProfileData(session.phoneNumber, {
            displayName: payload.displayName || payload.name || session.displayName,
            photo: payload.profilePhoto || getProfilePhoto(session.phoneNumber)
        });
    }
    return session;
}

function updateSession(fields) {
    const session = { ...getSession(), ...fields };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function getDisplayName() {
    const session = getSession();
    if (!session) return "User";
    const profile = getProfileData(session.phoneNumber);
    return profile.displayName || session.displayName || session.name || "User";
}

function getProfileData(phoneNumber) {
    if (!phoneNumber) return {};
    try {
        return JSON.parse(localStorage.getItem(PROFILE_PREFIX + phoneNumber)) || {};
    } catch {
        return {};
    }
}

function setProfileData(phoneNumber, data) {
    const merged = { ...getProfileData(phoneNumber), ...data };
    localStorage.setItem(PROFILE_PREFIX + phoneNumber, JSON.stringify(merged));
    return merged;
}

function getProfilePhoto(phoneNumber) {
    return getProfileData(phoneNumber).photo || null;
}

function applyAvatar(el, phoneNumber, fallbackName) {
    if (!el) return;
    const photo = getProfilePhoto(phoneNumber);
    const name = fallbackName || getDisplayName();
    if (photo) {
        el.innerHTML = `<img src="${photo}" alt="Profile" class="avatar-img">`;
        el.classList.add("has-photo");
    } else {
        el.textContent = (name || "U").charAt(0).toUpperCase();
        el.classList.remove("has-photo");
    }
}

function verifyUserPin(pin) {
    const session = getSession();
    if (!session?.pin) return false;
    return String(pin) === String(session.pin);
}

function isBalanceUnlocked() {
    return sessionStorage.getItem(BALANCE_UNLOCK_KEY) === "true";
}

function setBalanceUnlocked(unlocked) {
    if (unlocked) {
        sessionStorage.setItem(BALANCE_UNLOCK_KEY, "true");
    } else {
        sessionStorage.removeItem(BALANCE_UNLOCK_KEY);
    }
}

function buildUpiQrPayload(upiId, name) {
    const params = new URLSearchParams({
        pa: upiId,
        pn: name || upiId.split("@")[0],
        cu: "INR"
    });
    return `upi://pay?${params.toString()}`;
}

async function renderUpiQr(canvasOrImgId, upiId, name) {
    const payload = buildUpiQrPayload(upiId, name);
    const el = document.getElementById(canvasOrImgId);
    if (!el || typeof QRCode === "undefined") return false;

    try {
        if (el.tagName === "CANVAS") {
            await QRCode.toCanvas(el, payload, { width: 200, margin: 2 });
        } else {
            const url = await QRCode.toDataURL(payload, { width: 200, margin: 2 });
            el.src = url;
        }
        return true;
    } catch {
        return false;
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setBalanceUnlocked(false);
}

function getAuthFlow() {
    try {
        return JSON.parse(sessionStorage.getItem(AUTH_FLOW_KEY)) || {};
    } catch {
        return {};
    }
}

function setAuthFlow(data) {
    sessionStorage.setItem(AUTH_FLOW_KEY, JSON.stringify({ ...getAuthFlow(), ...data }));
}

function clearAuthFlow() {
    sessionStorage.removeItem(AUTH_FLOW_KEY);
}

function getPaymentDraft() {
    try {
        return JSON.parse(sessionStorage.getItem(PAYMENT_KEY));
    } catch {
        return null;
    }
}

function setPaymentDraft(data) {
    sessionStorage.setItem(PAYMENT_KEY, JSON.stringify(data));
}

function clearPaymentDraft() {
    sessionStorage.removeItem(PAYMENT_KEY);
}

function requireAuth(redirectTo = "login.html") {
    const session = getSession();
    if (!session?.token || !session?.upiId) {
        window.location.replace(redirectTo);
        return false;
    }
    return true;
}

function redirectIfAuthed(target = "dashboard.html") {
    if (getSession()?.token && getSession()?.upiId) {
        window.location.replace(target);
    }
}

window.addEventListener("pageshow", (event) => {
    if (event.persisted && document.getElementById("bottomNav") && !getSession()?.token) {
        window.location.replace("login.html");
    }
});

async function requestJson(url, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    const token = getSession()?.token;
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const text = await response.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch {
        if (!response.ok) throw new Error(text || "Request failed");
        return { data: text };
    }

    if (!response.ok || data.status === "FAILED") {
        if (response.status === 401 || ["Authentication required", "Session expired"].includes(data.message)) {
            clearSession();
            window.location.replace("login.html");
        }
        throw new Error(data.message || "Request failed");
    }

    return data;
}

async function requestAuthText(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const text = await response.text();

    if (!response.ok) {
        try {
            const err = JSON.parse(text);
            throw new Error(err.message || "Request failed");
        } catch (e) {
            if (e.message && !e.message.includes("JSON")) throw e;
            throw new Error(text || "Request failed");
        }
    }

    return text;
}

function resolveApiBase() {
    const { protocol, hostname, port } = window.location;
    if (
        protocol === "file:" ||
        (["localhost", "127.0.0.1"].includes(hostname) && port !== "8080")
    ) {
        return "http://localhost:8080";
    }
    return "";
}

function formatCurrency(amount) {
    return currencyFormatter.format(Number(amount) || 0);
}

function formatPhone(phone) {
    if (!phone) return "—";
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });
    } catch {
        return dateStr;
    }
}

function isValidPhone(phone) {
    return /^\d{10}$/.test(phone);
}

function isValidUpiId(upiId) {
    return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(upiId || "");
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function setLoading(show) {
    document.getElementById("loadingOverlay")?.classList.toggle("hidden", !show);
}

function showToast(message, type = "info") {
    const root = document.getElementById("toastRoot");
    if (!root) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    root.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        toast.style.transition = "0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function bindPinKeypad(targetId, dotsId, onPay) {
    const keypad = document.querySelector(`[data-pin-target="${targetId}"]`);
    const input = document.getElementById(targetId);
    if (!keypad || !input) return;

    keypad.querySelectorAll("button[data-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;

            if (key === "clear") {
                input.value = input.value.slice(0, -1);
            } else if (key === "pay") {
                onPay();
                return;
            } else if (input.value.length < 6) {
                input.value += key;
            }

            updatePinDots(dotsId, input.value);
        });
    });
}

function updatePinDots(dotsId, value) {
    document.querySelectorAll(`#${dotsId} span`).forEach((dot, i) => {
        dot.classList.toggle("filled", i < value.length);
    });
}

function bindAmountChips(targetId) {
    document.querySelectorAll(".amount-chips").forEach((group) => {
        const inputId = group.dataset.target || targetId;
        group.querySelectorAll(".chip-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const input = document.getElementById(inputId);
                if (input) input.value = btn.dataset.amount;
                group.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
            });
        });
    });
}

function parseUpiQrData(decodedText) {
    if (decodedText.startsWith("upi://")) {
        const params = new URLSearchParams(decodedText.split("?")[1] || "");
        return {
            upiId: params.get("pa") || "",
            name: params.get("pn") || params.get("pa")?.split("@")[0] || "Unknown"
        };
    }
    if (decodedText.includes("@")) {
        return { upiId: decodedText.trim(), name: decodedText.split("@")[0] };
    }
    return null;
}
