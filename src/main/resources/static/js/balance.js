let unlockedBalancePin = "";

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;
    initBottomNav("dashboard");

    bindBalancePinKeypad();

    if (isBalanceUnlocked() && getSession()?.pin) {
        unlockedBalancePin = String(getSession().pin);
        showBalanceContent();
        loadBalance();
    } else {
        setBalanceUnlocked(false);
    }

    document.getElementById("refreshBalanceBtn")?.addEventListener("click", loadBalance);
    document.getElementById("lockBalanceBtn")?.addEventListener("click", () => {
        setBalanceUnlocked(false);
        document.getElementById("balancePinGate")?.classList.remove("hidden");
        document.getElementById("balanceContent")?.classList.add("hidden");
        document.getElementById("balancePinInput").value = "";
        updatePinDots("balancePinDots", "");
        unlockedBalancePin = "";
    });
});

function bindBalancePinKeypad() {
    const keypad = document.querySelector('[data-pin-target="balancePinInput"]');
    const input = document.getElementById("balancePinInput");
    if (!keypad || !input) return;

    keypad.querySelectorAll("button[data-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;

            if (key === "clear") {
                input.value = input.value.slice(0, -1);
            } else if (key === "pay") {
                verifyBalancePin();
                return;
            } else if (input.value.length < 6) {
                input.value += key;
            }

            updatePinDots("balancePinDots", input.value);
        });
    });
}

async function verifyBalancePin() {
    const session = getSession();
    const pin = document.getElementById("balancePinInput")?.value;

    if (!pin || pin.length < 4) {
        showToast("Enter your UPI PIN", "error");
        return;
    }

    try {
        setLoading(true);
        const response = await requestJson(API.user.balanceWithPin, {
            method: "POST",
            body: JSON.stringify({
                upiId: session.upiId,
                pin
            })
        });

        unlockedBalancePin = pin;
        setBalanceUnlocked(true);
        showBalanceContent();
        document.getElementById("balanceScreenUpi").textContent = session.upiId;
        document.getElementById("balanceScreenAmount").textContent =
            formatCurrency(response.data);
    } catch (err) {
        showToast("Incorrect PIN. Balance cannot be viewed.", "error");
        document.getElementById("balancePinInput").value = "";
        updatePinDots("balancePinDots", "");
    } finally {
        setLoading(false);
    }
}

function showBalanceContent() {
    document.getElementById("balancePinGate")?.classList.add("hidden");
    document.getElementById("balanceContent")?.classList.remove("hidden");
}

async function loadBalance() {
    const session = getSession();
    if (!session) return;

    if (!isBalanceUnlocked()) return;
    if (!unlockedBalancePin) {
        setBalanceUnlocked(false);
        document.getElementById("balancePinGate")?.classList.remove("hidden");
        document.getElementById("balanceContent")?.classList.add("hidden");
        return;
    }

    document.getElementById("balanceScreenUpi").textContent = session.upiId;

    try {
        setLoading(true);
        const response = await requestJson(API.user.balanceWithPin, {
            method: "POST",
            body: JSON.stringify({
                upiId: session.upiId,
                pin: unlockedBalancePin
            })
        });
        document.getElementById("balanceScreenAmount").textContent =
            formatCurrency(response.data);
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        setLoading(false);
    }
}
