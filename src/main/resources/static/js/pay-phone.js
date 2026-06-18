document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("pay-phone");

    document.getElementById("phoneLookupForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const phone = document.getElementById("receiverPhoneInput").value.trim();

        if (!isValidPhone(phone)) {
            showToast("Enter a valid 10-digit number", "error");
            return;
        }

        try {
            setLoading(true);
            const response = await requestJson(API.user.byPhone(phone));
            const user = response.data;

            setPaymentDraft({
                method: "phone",
                toUpi: user.upiId,
                toName: user.name
            });

            window.location.href = "payment-amount.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });
});
