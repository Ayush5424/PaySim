document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("profile");
    loadProfile();

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        clearSession();
        clearAuthFlow();
        clearPaymentDraft();
        window.location.href = "index.html";
    });

    document.getElementById("profileUpi")?.addEventListener("click", (e) => {
        const upi = e.target.textContent;
        if (upi && upi !== "—") {
            navigator.clipboard?.writeText(upi).then(() => {
                showToast("UPI ID copied!", "success");
            });
        }
    });
});

function loadProfile() {
    const session = getSession();
    if (!session) return;

    document.getElementById("profileAvatar").textContent =
        session.name.charAt(0).toUpperCase();
    document.getElementById("profileName").textContent = session.name;
    document.getElementById("profilePhone").textContent =
        formatPhone(session.phoneNumber);
    document.getElementById("profileUpi").textContent = session.upiId;
    document.getElementById("profileStatus").textContent =
        session.verified ? "Verified" : "Unverified";

    const qrImg = document.getElementById("profileQrImage");
    const qrPlaceholder = document.getElementById("profileQrPlaceholder");

    qrImg.onload = () => {
        qrImg.classList.remove("hidden");
        qrPlaceholder.classList.add("hidden");
    };
    qrImg.onerror = () => {
        qrImg.classList.add("hidden");
        qrPlaceholder.classList.remove("hidden");
    };
    qrImg.src = `${API.payment.qr(session.upiId)}?t=${Date.now()}`;
}
