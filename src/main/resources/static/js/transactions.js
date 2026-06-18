let allTransactions = [];

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("transactions");
    loadTransactions();

    document.getElementById("txnSearch")?.addEventListener("input", () => {
        renderTransactionList(allTransactions);
    });

    document.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            renderTransactionList(allTransactions);
        });
    });
});

async function loadTransactions() {
    const session = getSession();
    const list = document.getElementById("txnList");
    const empty = document.getElementById("txnEmpty");
    const loading = document.getElementById("txnLoading");

    list.innerHTML = "";
    empty.classList.add("hidden");
    loading.classList.remove("hidden");

    try {
        const response = await requestJson(API.user.transactions(session.upiId));
        allTransactions = response.data || [];
        loading.classList.add("hidden");
        renderTransactionList(allTransactions);
    } catch (err) {
        loading.classList.add("hidden");
        showToast(err.message, "error");
        empty.classList.remove("hidden");
    }
}

function renderTransactionList(transactions) {
    const session = getSession();
    const list = document.getElementById("txnList");
    const empty = document.getElementById("txnEmpty");
    const filter = document.querySelector(".filter-chip.active")?.dataset.filter || "all";
    const search = (document.getElementById("txnSearch")?.value || "").toLowerCase();

    const filtered = transactions.filter((t) => {
        const isSent = t.senderUpi === session.upiId;
        const isReceived = t.receiverUpi === session.upiId;
        const otherParty = isSent ? t.receiverUpi : t.senderUpi;

        if (filter === "sent" && !isSent) return false;
        if (filter === "received" && !isReceived) return false;

        if (search) {
            const haystack = `${otherParty} ${t.status} ${t.transactionId || ""}`.toLowerCase();
            if (!haystack.includes(search)) return false;
        }
        return true;
    });

    if (!filtered.length) {
        list.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    const sentIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`;
    const receivedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></svg>`;

    list.innerHTML = filtered.map((t) => {
        const isSent = t.senderUpi === session.upiId;
        const otherParty = isSent ? t.receiverUpi : t.senderUpi;
        const name = otherParty.split("@")[0];
        const type = isSent ? "sent" : "received";
        const sign = isSent ? "−" : "+";
        const statusClass = (t.status || "pending").toLowerCase();

        return `
            <div class="txn-card">
                <div class="txn-icon ${type}">${isSent ? sentIcon : receivedIcon}</div>
                <div class="txn-body">
                    <h4>${isSent ? "Paid to" : "Received from"} ${escapeHtml(name)}</h4>
                    <p>${formatDate(t.timestamp)} · ${escapeHtml(otherParty)}</p>
                </div>
                <div class="txn-right">
                    <div class="txn-amount ${type}">${sign}${formatCurrency(t.amount)}</div>
                    <span class="txn-status ${statusClass}">${escapeHtml(t.status || "PENDING")}</span>
                </div>
            </div>`;
    }).join("");
}
