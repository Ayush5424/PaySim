let balanceHidden = false;

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("dashboard");
    refreshDashboard();

    document.getElementById("toggleBalanceVisibility")?.addEventListener("click", () => {
        balanceHidden = !balanceHidden;
        const session = getSession();
        if (session) {
            requestJson(API.user.balance(session.upiId))
                .then((r) => updateBalanceDisplay(r.data))
                .catch(() => {
                    document.getElementById("dashBalance").textContent =
                        balanceHidden ? "••••••" : "₹0.00";
                });
        }
    });
});

async function refreshDashboard() {
    const session = getSession();
    if (!session) return;

    document.getElementById("dashUserName").textContent = session.name;
    document.getElementById("dashAvatarInitial").textContent =
        session.name.charAt(0).toUpperCase();
    document.getElementById("dashUpiId").textContent = session.upiId;

    try {
        const response = await requestJson(API.user.balance(session.upiId));
        updateBalanceDisplay(response.data);
    } catch {
        document.getElementById("dashBalance").textContent =
            balanceHidden ? "••••••" : "₹0.00";
    }

    try {
        const response = await requestJson(API.user.transactions(session.upiId));
        renderRecentTransactions(response.data || []);
    } catch {
        document.getElementById("dashRecentTxns").innerHTML =
            '<div class="empty-mini">No recent transactions</div>';
    }
}

function updateBalanceDisplay(balance) {
    const formatted = formatCurrency(balance);
    document.getElementById("dashBalance").textContent =
        balanceHidden ? "••••••" : formatted;
}

function renderRecentTransactions(transactions) {
    const container = document.getElementById("dashRecentTxns");
    const session = getSession();

    if (!transactions.length) {
        container.innerHTML = '<div class="empty-mini">No recent transactions</div>';
        return;
    }

    container.innerHTML = transactions.slice(0, 3).map((t) => {
        const isSent = t.senderUpi === session.upiId;
        const otherParty = isSent ? t.receiverUpi : t.senderUpi;
        const name = otherParty.split("@")[0];
        const type = isSent ? "sent" : "received";
        const sign = isSent ? "−" : "+";

        return `
            <div class="mini-txn">
                <div class="mini-txn-icon ${type}">${isSent ? "↑" : "↓"}</div>
                <div class="mini-txn-info">
                    <strong>${escapeHtml(name)}</strong>
                    <span>${formatDate(t.timestamp)}</span>
                </div>
                <span class="mini-txn-amt ${type}">${sign}${formatCurrency(t.amount)}</span>
            </div>`;
    }).join("");
}
