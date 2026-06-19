document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("pay-phone");

    document.querySelectorAll(".pay-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".pay-tab").forEach((t) => t.classList.remove("active"));
            document.querySelectorAll(".pay-tab-panel").forEach((p) => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`payTab${tab.dataset.tab === "phone" ? "Phone" : "Qr"}`)?.classList.add("active");
        });
    });

    document.getElementById("phoneLookupForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const phone = document.getElementById("receiverPhoneInput").value.trim();

        if (!isValidPhone(phone)) {
            showToast("Enter a valid 10-digit number", "error");
            return;
        }

        try {
            setLoading(true);
            const response = await requestJson(API.user.byPhone(phone));
            const user = response.data;

            setPaymentDraft({
                method: "phone",
                toUpi: user.upiId,
                toName: user.name
            });

            window.location.href = "payment-amount.html";
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });

    document.getElementById("galleryQrFromPay")?.addEventListener("click", () => {
        document.getElementById("galleryQrInput")?.click();
    });

    document.getElementById("galleryQrInput")?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await scanQrFromFile(file);
        e.target.value = "";
    });

    document.getElementById("manualQrFromPay")?.addEventListener("click", () => {
        document.getElementById("manualPayUpiForm")?.classList.remove("hidden");
        document.getElementById("manualPayUpiInput")?.focus();
    });

    document.getElementById("cancelManualPayUpi")?.addEventListener("click", () => {
        document.getElementById("manualPayUpiForm")?.classList.add("hidden");
        document.getElementById("manualPayUpiInput").value = "";
    });

    document.getElementById("manualPayUpiForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const upiId = document.getElementById("manualPayUpiInput")?.value.trim();
        if (!isValidUpiId(upiId)) {
            showToast("Enter a valid UPI ID", "error");
            return;
        }
        goToPaymentWithQr(upiId);
    });
});

function goToPaymentWithQr(upiId, name) {
    setPaymentDraft({
        method: "qr",
        toUpi: upiId,
        toName: name || upiId.split("@")[0]
    });
    window.location.href = "payment-amount.html";
}

async function scanQrFromFile(file) {
    if (typeof Html5Qrcode === "undefined") {
        showToast("QR scanner not available", "error");
        return;
    }

    try {
        setLoading(true);
        const scanner = new Html5Qrcode("qrFileHelper");
        const decoded = await scanner.scanFile(file, true);
        const parsed = parseUpiQrData(decoded);

        if (!parsed?.upiId) {
            showToast("No valid UPI QR found in image", "error");
            return;
        }

        showToast("QR scanned from gallery", "success");
        goToPaymentWithQr(parsed.upiId, parsed.name);
    } catch {
        showToast("Could not read QR from image", "error");
    } finally {
        setLoading(false);
    }
}
