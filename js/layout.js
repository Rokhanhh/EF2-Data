export function renderNavbar(options = {}) {
    const target = document.getElementById("siteNavbar");
    if (!target) return;

    const links = options.links || [];
    const backHref = options.backHref || "";
    const backText = options.backText || "Back";
    const linkHtml = backHref
        ? `<li><a href="${escapeAttr(backHref)}" id="${escapeAttr(options.backId || "")}">${escapeHtml(backText)}</a></li>`
        : links.map(renderNavLink).join("");

    target.innerHTML = `
        <nav class="navbar navbar-inverse navbar-fixed-top relic-navbar" role="navigation">
            <div class="container">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#navigationbar">
                        <span class="sr-only">Toggle navigation</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                </div>
                <div class="collapse navbar-collapse" id="navigationbar">
                    <ul class="nav navbar-nav relic-nav-links">
                        ${linkHtml}
                    </ul>
                </div>
            </div>
        </nav>
    `;

    bindNavbar();
}

export function renderFooter(options = {}) {
    const target = document.getElementById("siteFooter");
    if (!target) return;

    target.innerHTML = `
        <footer class="footer relic-footer">
            <div class="container">
                <span>${escapeHtml(options.text || "Created by Rokhan.")}</span>
            </div>
        </footer>
    `;
}

export function defaultNavLinks(activeLabel = "") {
    return [
        { label: "Home", href: "./" },
        { label: "Units", href: "#/units" },
        { label: "Relics", href: "#/relics" },
        { label: "Pets", href: "#/pets" },
        { label: "Guild Raids", href: "#/guild-raids/1" },
    ].map((link) => ({ ...link, active: link.label === activeLabel }));
}

function renderNavLink(link) {
    const active = link.active ? " class=\"active\"" : "";
    return `<li${active}><a href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a></li>`;
}

function bindNavbar() {
    const toggle = document.querySelector(".navbar-toggle");
    const navigation = document.getElementById("navigationbar");
    if (toggle && navigation) {
        toggle.addEventListener("click", () => {
            navigation.classList.toggle("in");
        });
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value);
}
