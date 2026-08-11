document.addEventListener("DOMContentLoaded", () => {
    const flow = getAuthFlow();
    if (!flow.phoneNumber) {
        window.location.href = "signup.html";
        return;
    }

    document.getElementById("signupProfileForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signupName").value.trim();
        const pin = document.getElementById("signupPin").value.trim();

        if (!name) {
            showToast("Enter your name", "error");
            return;
        }
        if (pin.length < 4) {
            showToast("PIN must be at least 4 digits", "error");
            return;
        }
        if (!/^\d{4,6}$/.test(pin)) {
            showToast("PIN must contain 4 to 6 digits only", "error");
            return;
        }

        try {
            setLoading(true);
            const result = await requestJson(API.auth.createProfile, {
                method: "POST",
                body: JSON.stringify({
                    phoneNumber: flow.phoneNumber,
                    name,
                    pin,
                    email: document.getElementById("signupEmail")?.value.trim() || null
                })
            });

            const user = result.user;
            setSession(result);
            clearAuthFlow();
            showToast(`Welcome! Your UPI ID: ${user.upiId}`, "success");
            window.location.href = "dashboard.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });
});
