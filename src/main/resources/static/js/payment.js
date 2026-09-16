document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    const draft = getPaymentDraft();
    if (!draft?.toUpi || !draft?.amount) {
        window.location.href = "dashboard.html";
        return;
    }

    // Populate confirmation receipt card
    const name = draft.toName || draft.toUpi.split("@")[0];
    const avatarEl = document.getElementById("confirmAvatar");
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    const nameEl = document.getElementById("confirmName");
    if (nameEl) nameEl.textContent = name;
    const upiEl = document.getElementById("confirmUpi");
    if (upiEl) upiEl.textContent = draft.toUpi;
    const amountEl = document.getElementById("pinAmount");
    if (amountEl) amountEl.textContent = formatCurrency(draft.amount);

    bindPinKeypad("paymentPinInput", "paymentPinDots", processPayment);
});

async function processPayment() {
    const session = getSession();
    const draft = getPaymentDraft();
    const pin = document.getElementById("paymentPinInput")?.value;
    const payBtn = document.getElementById("payBtn");

    if (!pin || pin.length < 4) {
        showToast("Enter your UPI PIN (4–6 digits)", "error");
        return;
    }

    if (payBtn) {
        payBtn.classList.add("btn-loading");
        payBtn.disabled = true;
    }

    try {
        setLoading(true);
        const response = await requestJson(API.payment.send, {
            method: "POST",
            body: JSON.stringify({
                fromUpi: session.upiId,
                toUpi: draft.toUpi,
                amount: draft.amount,
                pin
            })
        });

        const result = response.data || {};
        sessionStorage.setItem("paysim_last_payment", JSON.stringify({
            amount: draft.amount,
            toName: draft.toName,
            toUpi: draft.toUpi,
            transactionId: result.transactionId || ""
        }));

        clearPaymentDraft();
        window.location.href = "payment-success.html";
    } catch (err) {
        showToast(err.message, "error");
        // Clear PIN on error so user can retry cleanly
        const pinInput = document.getElementById("paymentPinInput");
        if (pinInput) pinInput.value = "";
        updatePinDots("paymentPinDots", "");
    } finally {
        setLoading(false);
        if (payBtn) {
            payBtn.classList.remove("btn-loading");
            payBtn.disabled = false;
        }
    }
}
