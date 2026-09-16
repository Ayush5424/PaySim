document.addEventListener("DOMContentLoaded", () => {
    redirectIfAuthed("dashboard.html");

    const pinInput = document.getElementById("signupPin");
    const toggleBtn = document.getElementById("togglePinVisibility");
    if (pinInput && toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const isPassword = pinInput.type === "password";
            pinInput.type = isPassword ? "text" : "password";
            const showIcon = toggleBtn.querySelector(".eye-show");
            const hideIcon = toggleBtn.querySelector(".eye-hide");
            if (showIcon) showIcon.style.display = isPassword ? "none" : "";
            if (hideIcon) hideIcon.style.display = isPassword ? "" : "none";
        });
    }

    document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signupName").value.trim();
        const phone = document.getElementById("signupPhone").value.trim();
        const email = document.getElementById("signupEmail")?.value.trim() || null;
        const pin = document.getElementById("signupPin").value.trim();

        if (!name) {
            showToast("Enter your full name", "error");
            return;
        }
        if (!isValidPhone(phone)) {
            showToast("Enter a valid 10-digit mobile number", "error");
            return;
        }
        if (pin.length < 4 || !/^\d{4,6}$/.test(pin)) {
            showToast("PIN must be 4 to 6 digits only", "error");
            return;
        }

        try {
            setLoading(true);
            const result = await requestJson(API.auth.signup, {
                method: "POST",
                body: JSON.stringify({ name, phoneNumber: phone, email: email || null, pin })
            });
            setSession(result);
            clearAuthFlow();
            showToast(`Welcome! Your UPI ID: ${result.user.upiId}`, "success");
            window.location.href = "dashboard.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });
});
