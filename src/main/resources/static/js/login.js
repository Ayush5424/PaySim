document.addEventListener("DOMContentLoaded", () => {
    redirectIfAuthed("dashboard.html");

    const pinInput = document.getElementById("loginPin");
    const toggleBtn = document.getElementById("toggleLoginPin");
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

    document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("loginName").value.trim();
        const phone = document.getElementById("loginPhone").value.trim();
        const pin = document.getElementById("loginPin")?.value.trim() || null;

        if (!name || !isValidPhone(phone)) {
            showToast("Enter valid name and phone number", "error");
            return;
        }

        try {
            setLoading(true);
            const auth = await requestJson(API.auth.login, {
                method: "POST",
                body: JSON.stringify({ name, phoneNumber: phone, pin })
            });
            setSession(auth);
            clearAuthFlow();
            window.location.href = "dashboard.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });
});
