/**
 * PaySim — shared page layout (bottom nav)
 */

const BOTTOM_NAV_PAGES = {
    dashboard: { href: "dashboard.html", label: "Home" },
    "pay-qr": { href: "pay-qr.html", label: "Scan" },
    "pay-phone": { href: "pay-phone.html", label: "Pay" },
    transactions: { href: "transactions.html", label: "History" },
    profile: { href: "profile.html", label: "Profile" }
};

function initBottomNav(activePage) {
    const nav = document.getElementById("bottomNav");
    if (!nav) return;

    const icons = {
        dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        "pay-qr": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        "pay-phone": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        transactions: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    };

    nav.innerHTML = Object.entries(BOTTOM_NAV_PAGES).map(([id, item]) => {
        const isCenter = id === "pay-phone";
        const isActive = id === activePage;
        if (isCenter) {
            return `
                <a href="${item.href}" class="nav-item nav-item-center${isActive ? " active" : ""}" aria-label="${item.label}">
                    <div class="nav-fab">${icons[id]}</div>
                    <span>${item.label}</span>
                </a>`;
        }
        return `
            <a href="${item.href}" class="nav-item${isActive ? " active" : ""}" aria-label="${item.label}">
                ${icons[id]}
                <span>${item.label}</span>
            </a>`;
    }).join("");
}

function pageShell(title, bodyClass = "page-app") {
    return { title, bodyClass };
}
