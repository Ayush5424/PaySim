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

    document.getElementById("successAmount").textContent =
        formatCurrency(lastPayment.amount);
    document.getElementById("successDetail").textContent =
        `Sent to ${lastPayment.toName} (${lastPayment.toUpi})`;
    document.getElementById("successTxnId").textContent =
        lastPayment.transactionId ? `Txn ID: ${lastPayment.transactionId}` : "";

    sessionStorage.removeItem("paysim_last_payment");
});
