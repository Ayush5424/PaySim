let qrScanner = null;
let qrScannerActive = false;
let scanHandled = false;

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("pay-qr");

    startQrScanner();

    document.getElementById("galleryQrBtn")?.addEventListener("click", () => {
        document.getElementById("galleryQrFile")?.click();
    });

    document.getElementById("galleryQrFile")?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await scanFromGallery(file);
        e.target.value = "";
    });

    document.getElementById("manualQrBtn")?.addEventListener("click", () => {
        document.getElementById("manualUpiForm")?.classList.remove("hidden");
        document.getElementById("manualUpiInput")?.focus();
    });

    document.getElementById("cancelManualUpi")?.addEventListener("click", () => {
        document.getElementById("manualUpiForm")?.classList.add("hidden");
        document.getElementById("manualUpiInput").value = "";
    });

    document.getElementById("manualUpiForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const upiId = document.getElementById("manualUpiInput")?.value.trim();
        if (!isValidUpiId(upiId)) {
            showToast("Enter a valid UPI ID", "error");
            return;
        }
        saveReceiverAndGo(upiId, upiId.split("@")[0]);
    });

    window.addEventListener("beforeunload", stopQrScanner);
});

function saveReceiverAndGo(upiId, name) {
    if (scanHandled) return;
    scanHandled = true;

    setPaymentDraft({
        method: "qr",
        toUpi: upiId,
        toName: name || upiId.split("@")[0]
    });

    stopQrScanner();
    window.location.href = "payment-amount.html";
}

function onQrScanSuccess(decodedText) {
    if (scanHandled) return;

    const parsed = parseUpiQrData(decodedText);
    if (!parsed?.upiId) {
        showToast("Invalid QR code", "error");
        return;
    }

    showToast("QR scanned successfully", "success");
    saveReceiverAndGo(parsed.upiId, parsed.name);
}

async function scanFromGallery(file) {
    if (typeof Html5Qrcode === "undefined") return;

    try {
        setLoading(true);
        await stopQrScanner();

        const fileScanner = new Html5Qrcode("qrReader");
        const decoded = await fileScanner.scanFile(file, true);
        const parsed = parseUpiQrData(decoded);

        if (!parsed?.upiId) {
            showToast("No valid UPI QR found in image", "error");
            await startQrScanner();
            return;
        }

        showToast("QR scanned from gallery", "success");
        saveReceiverAndGo(parsed.upiId, parsed.name);
    } catch {
        showToast("Could not read QR from image", "error");
        await startQrScanner();
    } finally {
        setLoading(false);
    }
}

async function startQrScanner() {
    if (typeof Html5Qrcode === "undefined") return;

    const readerEl = document.getElementById("qrReader");
    const statusEl = document.getElementById("scannerStatus");
    if (!readerEl) return;

    readerEl.innerHTML = "";
    scanHandled = false;

    try {
        qrScanner = new Html5Qrcode("qrReader");
        await qrScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            onQrScanSuccess,
            () => {}
        );
        qrScannerActive = true;
        if (statusEl) statusEl.textContent = "Point your camera at a UPI QR code";
    } catch {
        readerEl.innerHTML = `
            <div class="qr-placeholder-box" style="min-height:260px;justify-content:center;">
                <span>📷</span>
                <span>Camera unavailable</span>
                <span style="font-size:0.75rem;">Use gallery scan or manual entry</span>
            </div>`;
        if (statusEl) statusEl.textContent = "Camera not available — use gallery or manual entry";
    }
}

async function stopQrScanner() {
    if (qrScanner && qrScannerActive) {
        try {
            await qrScanner.stop();
            qrScanner.clear();
        } catch { /* already stopped */ }
        qrScannerActive = false;
    }
}
