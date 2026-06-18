document.addEventListener("DOMContentLoaded", () => {
    redirectIfAuthed("dashboard.html");

    document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("loginName").value.trim();
        const phone = document.getElementById("loginPhone").value.trim();

        if (!name || !isValidPhone(phone)) {
            showToast("Enter valid name and phone number", "error");
            return;
        }

        setAuthFlow({ name, phoneNumber: phone });

        try {
            setLoading(true);
            await requestAuthText(API.auth.sendLoginOtp, { name, phoneNumber: phone });
            window.location.href = "login-otp.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });
});
