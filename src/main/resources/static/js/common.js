/**
 * PaySim — shared utilities, API, session
 */

const API_BASE = resolveApiBase();

const API = {
    auth: {
        sendSignupOtp: `${API_BASE}/api/auth/send-signup-otp`,
        verifySignupOtp: `${API_BASE}/api/auth/verify-signup-otp`,
        createProfile: `${API_BASE}/api/auth/create-profile`,
        sendLoginOtp: `${API_BASE}/api/auth/send-login-otp`,
        verifyLoginOtp: `${API_BASE}/api/auth/verify-login-otp`
    },
    user: {
        balance: (upiId) => `${API_BASE}/api/user/balance/${encodeURIComponent(upiId)}`,
        transactions: (upiId) => `${API_BASE}/api/user/transactions/${encodeURIComponent(upiId)}`,
        byPhone: (phone) => `${API_BASE}/api/user/phone/${encodeURIComponent(phone)}`
    },
    payment: {
        send: `${API_BASE}/api/payment/send`,
        qr: (upiId) => `${API_BASE}/api/payment/qr/${encodeURIComponent(upiId)}`
    }
};

const SESSION_KEY = "paysim_session";
const AUTH_FLOW_KEY = "paysim_auth_flow";
const PAYMENT_KEY = "paysim_payment";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
});

function getSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

function setSession(user) {
    const session = {
        name: user.name,
        phoneNumber: user.phoneNumber,
        upiId: user.upiId,
        verified: user.verified ?? true
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
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
    if (!getSession()?.upiId) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

function redirectIfAuthed(target = "dashboard.html") {
    if (getSession()?.upiId) {
        window.location.href = target;
    }
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options
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
    return /^[6-9]\d{9}$/.test(phone);
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

function bindOtpInputs() {
    document.querySelectorAll(".otp-digit").forEach((input) => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(0, 1);
            if (input.value && input.nextElementSibling?.classList.contains("otp-digit")) {
                input.nextElementSibling.focus();
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !input.value && input.previousElementSibling) {
                input.previousElementSibling.focus();
            }
        });

        input.addEventListener("paste", (e) => {
            e.preventDefault();
            const paste = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
            const group = input.dataset.otp;
            const inputs = [...document.querySelectorAll(`.otp-digit[data-otp="${group}"]`)];
            paste.split("").forEach((char, i) => {
                if (inputs[i]) inputs[i].value = char;
            });
            if (inputs[paste.length - 1]) inputs[paste.length - 1].focus();
        });
    });
}

function collectOtp(group) {
    return [...document.querySelectorAll(`.otp-digit[data-otp="${group}"]`)]
        .map((i) => i.value)
        .join("");
}

function clearOtpInputs(group) {
    document.querySelectorAll(`.otp-digit[data-otp="${group}"]`).forEach((i) => {
        i.value = "";
    });
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
