document.addEventListener("DOMContentLoaded", () => {
    const flow = getAuthFlow();
    if (!flow.phoneNumber) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("loginOtpPhone").textContent = formatPhone(flow.phoneNumber);
    bindOtpInputs();
    clearOtpInputs("login");

    document.getElementById("loginOtpForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const otp = collectOtp("login");

        if (otp.length !== 6) {
            showToast("Enter the complete 6-digit OTP", "error");
            return;
        }

        try {
            setLoading(true);
            await requestAuthText(API.auth.verifyLoginOtp, {
                phoneNumber: flow.phoneNumber,
                otp
            });

            const userResponse = await requestJson(API.user.byPhone(flow.phoneNumber));
            const user = userResponse.data;
            setSession({
                ...user,
                pin: user.pin || null
            });
            clearAuthFlow();
            window.location.href = "dashboard.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });

    document.getElementById("resendLoginOtp")?.addEventListener("click", async () => {
        try {
            await requestAuthText(API.auth.sendLoginOtp, {
                name: flow.name,
                phoneNumber: flow.phoneNumber
            });
            showToast("OTP resent — check server console", "info");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
});
