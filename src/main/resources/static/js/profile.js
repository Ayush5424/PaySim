document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("profile");
    loadProfile();

    document.getElementById("photoInput")?.addEventListener("change", handlePhotoUpload);
    document.getElementById("removePhotoBtn")?.addEventListener("click", removePhoto);
    document.getElementById("saveNameBtn")?.addEventListener("click", saveDisplayName);
    document.getElementById("regenerateQrBtn")?.addEventListener("click", () => generateProfileQr(false));
    document.getElementById("downloadQrBtn")?.addEventListener("click", downloadProfileQr);

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        clearSession();
        clearAuthFlow();
        clearPaymentDraft();
        setBalanceUnlocked(false);
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

    const displayName = getDisplayName();
    const profile = getProfileData(session.phoneNumber);

    applyAvatar(document.getElementById("profileAvatar"), session.phoneNumber, displayName);
    document.getElementById("profileName").textContent = displayName;
    document.getElementById("editNameInput").value = displayName;
    document.getElementById("profilePhone").textContent = formatPhone(session.phoneNumber);
    document.getElementById("profileUpi").textContent = session.upiId;
    document.getElementById("profileStatus").textContent =
        session.verified ? "Verified" : "Unverified";

    const removeBtn = document.getElementById("removePhotoBtn");
    if (profile.photo) {
        removeBtn?.classList.remove("hidden");
    } else {
        removeBtn?.classList.add("hidden");
    }

    generateProfileQr();
}

function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "error");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast("Image must be under 2 MB", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
        const session = getSession();
        try {
            const response = await requestJson(API.user.updateProfile(session.phoneNumber), {
                method: "PUT",
                body: JSON.stringify({
                    displayName: getDisplayName(),
                    profilePhoto: reader.result
                })
            });
            setSession(response.data || {});
            setProfileData(session.phoneNumber, { photo: reader.result });
            applyAvatar(document.getElementById("profileAvatar"), session.phoneNumber, getDisplayName());
            document.getElementById("removePhotoBtn")?.classList.remove("hidden");
            showToast("Profile photo updated", "success");
        } catch (err) {
            showToast(err.message, "error");
        }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
}

async function removePhoto() {
    const session = getSession();
    try {
        await requestJson(API.user.removePhoto(session.phoneNumber), {
            method: "DELETE"
        });

        const profile = getProfileData(session.phoneNumber);
        delete profile.photo;
        localStorage.setItem(PROFILE_PREFIX + session.phoneNumber, JSON.stringify(profile));

        applyAvatar(document.getElementById("profileAvatar"), session.phoneNumber, getDisplayName());
        document.getElementById("removePhotoBtn")?.classList.add("hidden");
        showToast("Profile photo removed", "info");
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function saveDisplayName() {
    const session = getSession();
    const name = document.getElementById("editNameInput")?.value.trim();

    if (!name) {
        showToast("Enter a valid name", "error");
        return;
    }

    try {
        const response = await requestJson(API.user.updateProfile(session.phoneNumber), {
            method: "PUT",
            body: JSON.stringify({
                displayName: name,
                profilePhoto: getProfilePhoto(session.phoneNumber)
            })
        });

        setSession(response.data || { name, displayName: name });
        setProfileData(session.phoneNumber, { displayName: name });
        updateSession({ name, displayName: name });
        document.getElementById("profileName").textContent = name;
        showToast("Name updated", "success");
        generateProfileQr();
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function generateProfileQr(silent = false) {
    const session = getSession();
    const canvas = document.getElementById("profileQrCanvas");
    const img = document.getElementById("profileQrImage");
    const placeholder = document.getElementById("profileQrPlaceholder");

    placeholder.classList.remove("hidden");
    placeholder.innerHTML = "<span>Generating QR…</span>";
    canvas.classList.add("hidden");
    img.classList.add("hidden");

    let ok = false;

    try {
        const response = await requestJson(API.payment.qrPayload(session.upiId));
        const payload = response.data?.payload;
        if (payload && typeof QRCode !== "undefined") {
            await QRCode.toCanvas(canvas, payload, { width: 200, margin: 2 });
            ok = true;
        }
    } catch {
        ok = await renderUpiQr("profileQrCanvas", session.upiId, getDisplayName());
    }

    if (ok) {
        const dataUrl = canvas.toDataURL("image/png");
        img.src = dataUrl + `#t=${Date.now()}`;
        img.classList.remove("hidden");
        placeholder.classList.add("hidden");
        if (!silent) showToast("QR code generated", "success");
    } else {
        placeholder.innerHTML = "<span>QR generation failed</span>";
    }
}

async function generateProfileQr(silent = false) {
    const session = getSession();
    const canvas = document.getElementById("profileQrCanvas");
    const img = document.getElementById("profileQrImage");
    const placeholder = document.getElementById("profileQrPlaceholder");
    const downloadBtn = document.getElementById("downloadQrBtn");

    placeholder.classList.remove("hidden");
    placeholder.innerHTML = "<span>Generating QR...</span>";
    canvas.classList.add("hidden");
    img.classList.add("hidden");
    downloadBtn?.classList.add("hidden");

    const backendOk = await loadBackendQrImage(img, session.upiId);
    if (backendOk) {
        img.classList.remove("hidden");
        placeholder.classList.add("hidden");
        downloadBtn?.classList.remove("hidden");
        if (!silent) showToast("QR code generated", "success");
        return true;
    }

    const ok = await renderUpiQr("profileQrCanvas", session.upiId, getDisplayName());
    if (!ok) {
        placeholder.innerHTML = "<span>QR generation failed</span>";
        return false;
    }

    img.src = canvas.toDataURL("image/png") + `#t=${Date.now()}`;
    img.classList.remove("hidden");
    placeholder.classList.add("hidden");
    downloadBtn?.classList.remove("hidden");
    if (!silent) showToast("QR code generated", "success");
    return true;
}

function loadBackendQrImage(img, upiId) {
    return new Promise((resolve) => {
        if (!img || !upiId) {
            resolve(false);
            return;
        }

        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = `${API.payment.qr(upiId)}?t=${Date.now()}`;
    });
}

async function downloadProfileQr() {
    const session = getSession();
    const img = document.getElementById("profileQrImage");

    if (!img?.src || img.classList.contains("hidden")) {
        const generated = await generateProfileQr(true);
        if (!generated) {
            showToast("QR is not ready to download", "error");
            return;
        }
    }

    const filename = `paysim-${session.upiId.replace(/[^a-z0-9_-]/gi, "-")}-qr.png`;

    try {
        const response = await fetch(API.payment.qr(session.upiId));
        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        triggerDownload(url, filename);
        URL.revokeObjectURL(url);
        showToast("QR downloaded", "success");
    } catch {
        if (img.src.startsWith("data:image/")) {
            triggerDownload(img.src.split("#")[0], filename);
            showToast("QR downloaded", "success");
        } else {
            showToast("Could not download QR", "error");
        }
    }
}

function triggerDownload(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}
