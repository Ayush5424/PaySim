document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    const draft = getPaymentDraft();
    if (!draft?.toUpi || !draft?.amount) {
        window.location.href = "dashboard.html";
        return;
    }

    document.getElementById("pinAmount").textContent = formatCurrency(draft.amount);
    document.getElementById("pinReceiver").textContent = draft.toName;

    bindPinKeypad("paymentPinInput", "paymentPinDots", processPayment);
});

async function processPayment() {
    const session = getSession();
    const draft = getPaymentDraft();
    const pin = document.getElementById("paymentPinInput")?.value;

    if (!pin || pin.length < 4) {
        showToast("Enter your UPI PIN", "error");
        return;
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
    } finally {
        setLoading(false);
    }
}
