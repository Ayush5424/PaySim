document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("dashboard");
    refreshDashboard();
    initBalanceCard();
    loadRecentTransactions();
});

function refreshDashboard() {
    const session = getSession();
    if (!session) return;

    // Time-aware greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
    const greetingEl = document.getElementById("dashGreeting");
    if (greetingEl) greetingEl.textContent = greeting;

    document.getElementById("dashUserName").textContent = getDisplayName();
    document.getElementById("dashUpiId").textContent = session.upiId || "—";
    applyAvatar(document.getElementById("dashAvatar"), session.phoneNumber, getDisplayName());
}

function initBalanceCard() {
    const amountEl = document.getElementById("dashBalanceAmount");
    const eyeBtn   = document.getElementById("balanceEyeBtn");
    const eyeShow  = document.getElementById("eyeIconShow");
    const eyeHide  = document.getElementById("eyeIconHide");
    const upiCopyBtn = document.getElementById("dashUpiCopyBtn");

    if (!amountEl || !eyeBtn) return;

    let revealed = false;

    // Default: show a placeholder masked amount
    amountEl.textContent = "₹••,•••.••";
    amountEl.classList.add("masked");

    eyeBtn.addEventListener("click", () => {
        revealed = !revealed;
        amountEl.classList.toggle("masked", !revealed);
        if (eyeShow) eyeShow.style.display = revealed ? "none" : "";
        if (eyeHide) eyeHide.style.display = revealed ? "" : "none";
        eyeBtn.setAttribute("aria-label", revealed ? "Hide balance" : "Show balance");

        // If first reveal, fetch real balance from the balance page link
        // (non-blocking — user can still navigate to balance.html for the full PIN-gated view)
        if (revealed && amountEl.textContent === "₹••,•••.••") {
            fetchMaskedBalance(amountEl);
        }
    });

    // UPI ID copy
    if (upiCopyBtn) {
        upiCopyBtn.addEventListener("click", () => {
            const upiId = getSession()?.upiId;
            if (!upiId) return;
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(upiId).then(() => showToast("UPI ID copied!", "success"))
                    .catch(() => showToast("Could not copy", "error"));
            } else {
                showToast("UPI ID: " + upiId, "info");
            }
        });
    }
}

async function fetchMaskedBalance(amountEl) {
    try {
        const session = getSession();
        if (!session?.upiId) return;
        // Use the public balance endpoint (no PIN required — shows balance in response)
        const data = await requestJson(API.user.balance(session.upiId));
        const bal = data?.balance ?? data?.data?.balance;
        if (bal !== undefined && bal !== null) {
            amountEl.textContent = formatCurrency(bal);
        }
    } catch {
        // Fail silently — user can go to balance.html for PIN-gated view
        amountEl.textContent = "—";
    }
}

async function loadRecentTransactions() {
    const container = document.getElementById("dashRecentTxns");
    if (!container) return;

    try {
        const session = getSession();
        if (!session?.upiId) throw new Error("No session");

        const data = await requestJson(API.user.transactions(session.upiId));
        const txns = (data?.data || data?.transactions || data || []).slice(0, 3);

        if (!txns.length) {
            container.innerHTML = `
                <div class="empty-mini">
                    <p style="font-size:0.85rem;color:var(--text-muted)">No transactions yet</p>
                </div>`;
            return;
        }

        container.innerHTML = txns.map(txn => {
            const isSent = txn.type === "DEBIT" || txn.fromUpi === session.upiId;
            const icon   = isSent ? "↑" : "↓";
            const cls    = isSent ? "sent" : "received";
            const other  = isSent ? (txn.toName || txn.toUpi || "—") : (txn.fromName || txn.fromUpi || "—");
            const sign   = isSent ? "−" : "+";
            return `
                <div class="mini-txn">
                    <div class="mini-txn-icon ${cls}">${icon}</div>
                    <div class="mini-txn-info">
                        <strong>${escapeHtml(other)}</strong>
                        <span>${formatDate(txn.createdAt || txn.timestamp)}</span>
                    </div>
                    <span class="mini-txn-amt ${cls}">${sign}${formatCurrency(txn.amount)}</span>
                </div>`;
        }).join("");
    } catch {
        // Remove skeletons, show subtle fallback
        if (container) {
            container.innerHTML = `
                <div class="empty-mini">
                    <p style="font-size:0.85rem;color:var(--text-muted)">
                        <a href="transactions.html" style="color:var(--primary);text-decoration:none;font-weight:600">View all transactions →</a>
                    </p>
                </div>`;
        }
    }
}
