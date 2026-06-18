document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    const draft = getPaymentDraft();
    if (!draft?.toUpi) {
        window.location.href = "dashboard.html";
        return;
    }

    document.getElementById("receiverName").textContent = draft.toName;
    document.getElementById("receiverUpi").textContent = draft.toUpi;
    document.getElementById("receiverAvatar").textContent =
        (draft.toName || "?").charAt(0).toUpperCase();

    const backLink = document.getElementById("amountBackLink");
    if (backLink) {
        backLink.href = draft.method === "qr" ? "pay-qr.html" : "pay-phone.html";
    }

    bindAmountChips("payAmount");

    document.getElementById("amountForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById("payAmount").value);

        if (!amount || amount <= 0) {
            showToast("Enter a valid amount", "error");
            return;
        }

        setPaymentDraft({ ...draft, amount });
        window.location.href = "payment.html";
    });
});
