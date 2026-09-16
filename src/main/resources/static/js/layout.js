/**
 * PaySim — Shared Layout Shell
 * Provides responsive desktop sidebar navigation and mobile bottom navigation.
 */

const NAV_ITEMS = [
    {
        id: "dashboard",
        href: "dashboard.html",
        label: "Dashboard",
        mobileLabel: "Home",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    },
    {
        id: "pay-phone",
        href: "pay-phone.html",
        label: "Send Money",
        mobileLabel: "Pay",
        isCenter: true,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`
    },
    {
        id: "pay-qr",
        href: "pay-qr.html",
        label: "Scan & Pay",
        mobileLabel: "Scan",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM19 19h2v2h-2z"/></svg>`
    },
    {
        id: "transactions",
        href: "transactions.html",
        label: "Transactions",
        mobileLabel: "History",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
    },
    {
        id: "balance",
        href: "balance.html",
        label: "Check Balance",
        mobileLabel: "Balance",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`
    },
    {
        id: "profile",
        href: "profile.html",
        label: "My Profile",
        mobileLabel: "Profile",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    }
];

function handleGlobalLogout() {
    if (typeof clearSession === "function") clearSession();
    if (typeof clearAuthFlow === "function") clearAuthFlow();
    if (typeof clearPaymentDraft === "function") clearPaymentDraft();
    if (typeof setBalanceUnlocked === "function") setBalanceUnlocked(false);
    window.location.href = "index.html";
}

function initBottomNav(activePage) {
    initAppShell(activePage);
}

function initAppShell(activePage) {
    document.body.classList.add("has-app-shell");

    // 1. Render Mobile Bottom Navigation
    const nav = document.getElementById("bottomNav");
    if (nav) {
        const mobileItems = [
            NAV_ITEMS[0], // dashboard
            NAV_ITEMS[2], // pay-qr
            NAV_ITEMS[1], // pay-phone (center)
            NAV_ITEMS[3], // transactions
            NAV_ITEMS[5]  // profile
        ];

        nav.innerHTML = mobileItems.map(item => {
            const isActive = item.id === activePage;
            if (item.isCenter) {
                return `
                    <a href="${item.href}" class="nav-item nav-item-center${isActive ? " active" : ""}" aria-label="${item.mobileLabel}">
                        <div class="nav-fab">${item.icon}</div>
                        <span>${item.mobileLabel}</span>
                    </a>`;
            }
            return `
                <a href="${item.href}" class="nav-item${isActive ? " active" : ""}" aria-label="${item.mobileLabel}">
                    ${item.icon}
                    <span>${item.mobileLabel}</span>
                </a>`;
        }).join("");
    }

    // 2. Render Desktop Sidebar (injected dynamically if not already present)
    let sidebar = document.getElementById("desktopSidebar");
    if (!sidebar) {
        sidebar = document.createElement("aside");
        sidebar.id = "desktopSidebar";
        sidebar.className = "desktop-sidebar";
        document.body.insertBefore(sidebar, document.body.firstChild);
    }

    const session = (typeof getSession === "function") ? getSession() : null;
    const displayName = session?.displayName || session?.name || "User";
    const initial = (displayName.charAt(0) || "U").toUpperCase();
    const upiId = session?.upiId || "—";

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <a href="dashboard.html" class="sidebar-brand">
                <div class="sidebar-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                </div>
                <div class="sidebar-brand-text">
                    <span class="brand-name">PaySim</span>
                    <span class="brand-tagline">UPI Simulation</span>
                </div>
            </a>
        </div>

        <nav class="sidebar-nav">
            ${NAV_ITEMS.map(item => {
                const isActive = item.id === activePage;
                return `
                    <a href="${item.href}" class="sidebar-nav-item${isActive ? " active" : ""}">
                        <span class="sidebar-icon">${item.icon}</span>
                        <span class="sidebar-label">${item.label}</span>
                    </a>`;
            }).join("")}
        </nav>

        <div class="sidebar-footer">
            <a href="profile.html" class="sidebar-user">
                <div class="sidebar-avatar">${initial}</div>
                <div class="sidebar-user-info">
                    <div class="sidebar-user-name" title="${displayName}">${displayName}</div>
                    <div class="sidebar-user-upi" title="${upiId}">${upiId}</div>
                </div>
            </a>
            <button type="button" class="sidebar-logout-btn" id="sidebarLogoutBtn" title="Sign Out" aria-label="Sign Out">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Logout</span>
            </button>
        </div>
    `;

    document.getElementById("sidebarLogoutBtn")?.addEventListener("click", handleGlobalLogout);
}

function pageShell(title, bodyClass = "page-app") {
    return { title, bodyClass };
}
