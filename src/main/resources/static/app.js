const API_BASE = resolveApiBase();

const API = {
    createUser: `${API_BASE}/api/user/create`,
    balance: (upiId) =>
        `${API_BASE}/api/user/balance/${encodeURIComponent(upiId)}`,

    sendMoney: `${API_BASE}/api/payment/send`,

    transactions: (upiId) =>
        `${API_BASE}/api/user/transactions/${encodeURIComponent(upiId)}`
};

let paymentData = {};

const selectors = {
    createUserForm: document.getElementById("createUserForm"),
    balanceForm: document.getElementById("balanceForm"),
    paymentForm: document.getElementById("paymentForm"),
    transactionsForm: document.getElementById("transactionsForm"),

    createdUserCard: document.getElementById("createdUserCard"),
    paymentResult: document.getElementById("paymentResult"),

    transactionsList: document.getElementById("transactionsList"),
    transactionsState: document.getElementById("transactionsState"),

    balanceAmount: document.getElementById("balanceAmount"),
    dashboardBalance: document.getElementById("dashboardBalance"),
    dashboardUpi: document.getElementById("dashboardUpi"),

    profileName: document.getElementById("profileName"),
    profileUpi: document.getElementById("profileUpi"),
    profilePhone: document.getElementById("profilePhone"),

    toastRoot: document.getElementById("toastRoot"),

    phoneMethodBtn: document.getElementById("phoneMethodBtn"),
    qrMethodBtn: document.getElementById("qrMethodBtn"),

    phonePaymentSection:
        document.getElementById("phonePaymentSection"),

    qrPaymentSection:
        document.getElementById("qrPaymentSection"),

    receiverCard:
        document.getElementById("receiverCard"),

    receiverName:
        document.getElementById("receiverName"),

    receiverUpi:
        document.getElementById("receiverUpi"),

    paymentConfirmation:
        document.getElementById("paymentConfirmation"),

    confirmReceiver:
        document.getElementById("confirmReceiver"),

    confirmAmount:
        document.getElementById("confirmAmount"),

    payNowBtn:
        document.getElementById("payNowBtn"),

    scanQrBtn:
        document.getElementById("scanQrBtn")
};

const currencyFormatter =
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    });

document.addEventListener(
    "DOMContentLoaded",
    initApp
);

function initApp() {

    selectors.createUserForm?.addEventListener(
        "submit",
        handleCreateUser
    );

    selectors.balanceForm?.addEventListener(
        "submit",
        handleBalanceCheck
    );

    selectors.paymentForm?.addEventListener(
        "submit",
        handlePhonePayment
    );

    selectors.transactionsForm?.addEventListener(
        "submit",
        handleTransactions
    );

    selectors.phoneMethodBtn?.addEventListener(
        "click",
        switchToPhone
    );

    selectors.qrMethodBtn?.addEventListener(
        "click",
        switchToQr
    );

    selectors.scanQrBtn?.addEventListener(
        "click",
        simulateQrScan
    );

    selectors.payNowBtn?.addEventListener(
        "click",
        processPayment
    );
}

function switchToPhone() {

    selectors.phoneMethodBtn?.classList.add("active");

    selectors.qrMethodBtn?.classList.remove("active");

    selectors.phonePaymentSection?.classList.remove("hidden");

    selectors.qrPaymentSection?.classList.add("hidden");
}

function switchToQr() {

    selectors.qrMethodBtn?.classList.add("active");

    selectors.phoneMethodBtn?.classList.remove("active");

    selectors.qrPaymentSection?.classList.remove("hidden");

    selectors.phonePaymentSection?.classList.add("hidden");
}

async function handleCreateUser(e) {

    e.preventDefault();

    const formData =
        getFormValues(
            selectors.createUserForm
        );

    try {

        const response =
            await requestJson(
                API.createUser,
                {
                    method: "POST",
                    body: JSON.stringify({
                        name: formData.name,
                        phoneNumber:
                            formData.phoneNumber
                    })
                }
            );

        renderCreatedUser(
            response.data,
            formData.phoneNumber
        );

        renderProfile({
            ...response.data,
            phoneNumber:
                formData.phoneNumber
        });

        showToast(
            "User created successfully",
            "success"
        );

    } catch (err) {

        showToast(
            err.message,
            "error"
        );
    }
}

async function handleBalanceCheck(e) {

    e.preventDefault();

    const upi =
        document.getElementById(
            "balanceUpi"
        ).value.trim();

    try {

        const response =
            await requestJson(
                API.balance(upi)
            );

        renderBalance(
            upi,
            response.data
        );

    } catch (err) {

        showToast(
            err.message,
            "error"
        );
    }
}

async function handlePhonePayment(e) {

    e.preventDefault();

    const values =
        getFormValues(
            selectors.paymentForm
        );

    if (
        !values.fromUpi ||
        !values.receiverPhone ||
        !values.amount
    ) {
        showToast(
            "Fill all fields",
            "error"
        );
        return;
    }

    paymentData = {
            fromUpi:
                    values.fromUpi.trim(),

            toUpi:
                    values.toUpi.trim(),


            amount:
                    values.amount
    };

    showPaymentConfirmation();
}

function simulateQrScan() {

    const scannedUpi =
        prompt(
            "Enter scanned UPI ID"
        );

    if (!scannedUpi) return;

    const amount =
        prompt(
            "Enter amount"
        );

    const fromUpi =
        prompt(
            "Enter your UPI ID"
        );

    paymentData = {
        fromUpi,
        toUpi: scannedUpi,
        amount
    };

    showPaymentConfirmation();
}

function showPaymentConfirmation() {

    selectors.receiverCard?.classList.remove(
        "hidden"
    );

    selectors.paymentConfirmation?.classList.remove(
        "hidden"
    );

    selectors.receiverName.textContent =
        paymentData.toUpi.split("@")[0];

    selectors.receiverUpi.textContent =
        paymentData.toUpi;

    selectors.confirmReceiver.textContent =
        paymentData.toUpi;

    selectors.confirmAmount.textContent =
        formatCurrency(
            paymentData.amount
        );
}

async function processPayment() {

    const pin =
        document.getElementById(
            "confirmPin"
        )?.value;

    if (!pin) {
        showToast(
            "Enter PIN",
            "error"
        );
        return;
    }

    try {

        const response =
            await requestJson(
                API.sendMoney,
                {
                    method: "POST",
                    body: JSON.stringify({
                        fromUpi:
                            paymentData.fromUpi,

                        toUpi:
                            paymentData.toUpi,

                        amount:
                            Number(paymentData.amount),

                        pin
                    })
                }
            );

        selectors.paymentResult.classList.remove(
            "hidden"
        );

        selectors.paymentResult.innerHTML = `
            <h3>Payment Successful</h3>
            <p>
                ${formatCurrency(paymentData.amount)}
                sent to
                ${paymentData.toUpi}
            </p>
        `;

        showToast(
            response.message ||
            "Payment Successful",
            "success"
        );

    } catch (err) {

        showToast(
            err.message,
            "error"
        );
    }
}

async function handleTransactions(e) {

    e.preventDefault();

    const upi =
        document.getElementById(
            "transactionsUpi"
        ).value.trim();

    try {

        const response =
            await requestJson(
                API.transactions(upi)
            );

        renderTransactions(
            response.data || []
        );

    } catch (err) {

        showToast(
            err.message,
            "error"
        );
    }
}

async function requestJson(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                headers: {
                    "Content-Type":
                        "application/json"
                },
                ...options
            }
        );

    const text =
        await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {

        throw new Error(
            "Backend returned HTML. Check API URL or backend route."
        );
    }

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Request failed"
        );
    }

    return data;
}

function renderCreatedUser(
    user,
    phone
) {

    selectors.createdUserCard.classList.remove(
        "hidden"
    );

    selectors.createdUserCard.innerHTML = `
        <h3>User Created</h3>
        <p><b>Name:</b> ${user.name}</p>
        <p><b>UPI:</b> ${user.upiId}</p>
        <p><b>Phone:</b> ${phone}</p>
    `;
}

function renderProfile(user) {

    selectors.profileName.textContent =
        user.name;

    selectors.profileUpi.textContent =
        user.upiId;

    selectors.profilePhone.textContent =
        user.phoneNumber;
}

function renderBalance(
    upiId,
    balance
) {

    const formatted =
        formatCurrency(
            balance
        );

    selectors.balanceAmount.textContent =
        formatted;

    selectors.dashboardBalance.textContent =
        formatted;

    selectors.dashboardUpi.textContent =
        upiId;
}

function renderTransactions(
    transactions
) {

    selectors.transactionsList.innerHTML =
        transactions.map(t => `
            <div class="transaction-card">
                <h4>
                    ${formatCurrency(t.amount)}
                </h4>

                <p>
                    ${t.senderUpi}
                    →
                    ${t.receiverUpi}
                </p>

                <p>
                    ${t.status}
                </p>

                <small>
                    ${t.timestamp}
                </small>
            </div>
        `).join("");
}

function getFormValues(form) {

    return Object.fromEntries(
        new FormData(form)
    );
}

function formatCurrency(amount) {

    return currencyFormatter.format(
        Number(amount)
    );
}

function resolveApiBase() {

    const {
        protocol,
        hostname,
        port
    } = window.location;

    if (
        protocol === "file:" ||
        (
            ["localhost", "127.0.0.1"]
                .includes(hostname)
            && port !== "8080"
        )
    ) {
        return "http://localhost:8080";
    }

    return "";
}

function showToast(
    message,
    type = "info"
) {

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast toast-${type}`;

    toast.textContent =
        message;

    selectors.toastRoot
        .appendChild(
            toast
        );

    setTimeout(
        () => toast.remove(),
        3000
    );
}