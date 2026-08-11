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

        try {
            setLoading(true);
            const auth = await requestJson(API.auth.login, {
                method: "POST",
                body: JSON.stringify({ name, phoneNumber: phone })
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
