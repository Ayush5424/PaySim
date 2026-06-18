document.addEventListener("DOMContentLoaded", () => {
    const flow = getAuthFlow();
    if (!flow.phoneNumber) {
        window.location.href = "signup.html";
        return;
    }

    document.getElementById("signupOtpPhone").textContent = formatPhone(flow.phoneNumber);
    bindOtpInputs();
    clearOtpInputs("signup");

    document.getElementById("signupOtpForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const otp = collectOtp("signup");

        if (otp.length !== 6) {
            showToast("Enter the complete 6-digit OTP", "error");
            return;
        }

        try {
            setLoading(true);
            await requestAuthText(API.auth.verifySignupOtp, {
                phoneNumber: flow.phoneNumber,
                otp
            });
            window.location.href = "signup-profile.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });

    document.getElementById("resendSignupOtp")?.addEventListener("click", async () => {
        try {
            await requestAuthText(API.auth.sendSignupOtp, { phoneNumber: flow.phoneNumber });
            showToast("OTP resent — check server console", "info");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
});
