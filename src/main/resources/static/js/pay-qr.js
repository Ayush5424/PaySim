let qrScanner = null;
let qrScannerActive = false;

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("pay-qr");
    startQrScanner();

    document.getElementById("manualQrBtn")?.addEventListener("click", () => {
        const upiId = prompt("Enter receiver UPI ID (e.g. name1234@upi):");
        if (!upiId?.trim()) return;
        saveReceiverAndGo(upiId.trim(), upiId.split("@")[0]);
    });

    window.addEventListener("beforeunload", stopQrScanner);
});

function saveReceiverAndGo(upiId, name) {
    const draft = getPaymentDraft() || {};
    setPaymentDraft({
        ...draft,
        method: "qr",
        toUpi: upiId,
        toName: name || upiId.split("@")[0]
    });
    stopQrScanner();
    window.location.href = "payment-amount.html";
}

function onQrScanSuccess(decodedText) {
    const parsed = parseUpiQrData(decodedText);
    if (!parsed?.upiId) {
        showToast("Invalid QR code", "error");
        return;
    }
    showToast("QR scanned successfully", "success");
    saveReceiverAndGo(parsed.upiId, parsed.name);
}

async function startQrScanner() {
    if (typeof Html5Qrcode === "undefined") return;

    const readerEl = document.getElementById("qrReader");
    if (!readerEl) return;

    try {
        qrScanner = new Html5Qrcode("qrReader");
        await qrScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            onQrScanSuccess,
            () => {}
        );
        qrScannerActive = true;
    } catch {
        readerEl.innerHTML = `
            <div class="qr-placeholder-box" style="min-height:260px;justify-content:center;">
                <span>📷</span>
                <span>Camera unavailable</span>
                <span style="font-size:0.75rem;">Use manual UPI ID entry below</span>
            </div>`;
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
