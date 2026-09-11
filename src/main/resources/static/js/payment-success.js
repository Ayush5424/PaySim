document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    let lastPayment;
    try {
        lastPayment = JSON.parse(sessionStorage.getItem("paysim_last_payment"));
    } catch {
        lastPayment = null;
    }

    if (!lastPayment) {
        window.location.href = "dashboard.html";
        return;
    }

    // Amount
    const amountFormatted = formatCurrency(lastPayment.amount);
    document.getElementById("successAmount").textContent = amountFormatted;

    // Recipient
    document.getElementById("successToName").textContent = lastPayment.toName || "—";
    document.getElementById("successToUpi").textContent  = lastPayment.toUpi  || "—";

    // Date & Time (use now as payment just completed)
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true
    });
    document.getElementById("successDateTime").textContent = `${dateStr}, ${timeStr}`;

    // Txn ID
    const txnIdEl = document.getElementById("successTxnId");
    const txnRowEl = document.getElementById("txnIdRow");
    if (lastPayment.transactionId) {
        txnIdEl.textContent = lastPayment.transactionId;
    } else {
        if (txnRowEl) txnRowEl.style.display = "none";
    }

    // Share receipt button
    document.getElementById("shareReceiptBtn")?.addEventListener("click", () => {
        const text = [
            "💳 PaySim Payment Receipt",
            `Amount : ${amountFormatted}`,
            `Paid to: ${lastPayment.toName || ""} (${lastPayment.toUpi || ""})`,
            `Date   : ${dateStr}, ${timeStr}`,
            lastPayment.transactionId ? `Txn ID : ${lastPayment.transactionId}` : "",
            "Status : ✓ Success"
        ].filter(Boolean).join("\n");

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast("Receipt copied to clipboard", "success");
            }).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    });

    sessionStorage.removeItem("paysim_last_payment");
});

function fallbackCopy(text) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(el);
    el.select();
    try {
        document.execCommand("copy");
        showToast("Receipt copied to clipboard", "success");
    } catch {
        showToast("Could not copy — please screenshot", "info");
    }
    el.remove();
}
