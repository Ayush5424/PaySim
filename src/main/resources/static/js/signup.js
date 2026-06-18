document.addEventListener("DOMContentLoaded", () => {
    redirectIfAuthed("dashboard.html");

    document.getElementById("signupPhoneForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const phone = document.getElementById("signupPhone").value.trim();

        if (!isValidPhone(phone)) {
            showToast("Enter a valid 10-digit mobile number", "error");
            return;
        }

        setAuthFlow({ phoneNumber: phone });

        try {
            setLoading(true);
            await requestAuthText(API.auth.sendSignupOtp, { phoneNumber: phone });
            window.location.href = "signup-otp.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });
});
