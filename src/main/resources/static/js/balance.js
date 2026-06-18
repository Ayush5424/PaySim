document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("dashboard");
    loadBalance();

    document.getElementById("refreshBalanceBtn")?.addEventListener("click", loadBalance);
});

async function loadBalance() {
    const session = getSession();
    if (!session) return;

    document.getElementById("balanceScreenUpi").textContent = session.upiId;

    try {
        setLoading(true);
        const response = await requestJson(API.user.balance(session.upiId));
        document.getElementById("balanceScreenAmount").textContent =
            formatCurrency(response.data);
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        setLoading(false);
    }
}
