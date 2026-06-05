import { renderFooter, renderNavbar } from "./layout.js";
import { initRelicsView, renderRelicsRoute } from "./relics-view.js";

(function () {
    "use strict";

    renderNavbar({
        links: [{ label: "Relics", href: "#/relics", active: true }],
    });
    renderFooter();

    function normalizeRoute() {
        const parts = (window.location.hash || "#/relics")
            .replace(/^#\/?/, "")
            .split("?")[0]
            .split("/")
            .filter(Boolean);

        if (parts[0] !== "relics") {
            window.location.hash = "#/relics";
        }
    }

    async function renderRoute() {
        normalizeRoute();
        await initRelicsView();
        renderRelicsRoute();
    }

    async function init() {
        try {
            await renderRoute();
            window.addEventListener("hashchange", renderRoute);
        } catch (error) {
            const title = document.getElementById("artifactTitle");
            const abilityResults = document.getElementById("abilityResults");
            if (title) title.textContent = "Data load failed";
            if (abilityResults) abilityResults.textContent = error.message;
        }
    }

    init();
}());
