document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("dashboard");
    refreshDashboard();
});

function refreshDashboard() {
    const session = getSession();
    if (!session) return;

    document.getElementById("dashUserName").textContent = getDisplayName();
    document.getElementById("dashUpiId").textContent = session.upiId;
    applyAvatar(document.getElementById("dashAvatar"), session.phoneNumber, getDisplayName());
}
