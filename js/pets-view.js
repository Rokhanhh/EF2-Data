import { renderAtlasIconById } from "./asset-atlas.js";
import { loadPetData } from "./data.js";
import { defaultNavLinks, renderNavbar } from "./layout.js";
import { escapeHtml, formatNumber } from "./utils.js";

const state = {
    pets: [],
    petMap: new Map(),
    petSkillMap: new Map(),
    locale: {},
    assetAtlases: {},
    selectedKindNum: 1,
    mode: "images",
    initialized: false,
};

const PET_MASTER_SKILL_PLACEHOLDER_ID = 10005;

let els;

export async function initPetsView() {
    if (state.initialized) return;

    els = getElements();
    Object.assign(state, await loadPetData());
    readRoute();
    bindEvents();
    state.initialized = true;
}

export function renderPetsRoute() {
    readRoute();
    const parts = getRouteParts();
    if (parts[0] === "pets" && parts[1]) {
        showDetail();
        return;
    }

    showList();
}

function getElements() {
    return {
        listView: document.getElementById("petListView"),
        detailView: document.getElementById("petDetailView"),
        viewModeButtons: Array.from(document.querySelectorAll("[data-pet-view-mode]")),
        content: document.getElementById("petContent"),
        backLink: document.getElementById("petBackLink"),
        title: document.getElementById("petTitle"),
        meta: document.getElementById("petMeta"),
        mainIcon: document.getElementById("petMainIcon"),
        info: document.getElementById("petInfo"),
        skills: document.getElementById("petSkills"),
    };
}

function text(key, fallback) {
    return state.locale[key] || fallback || key;
}

function getPetName(pet) {
    return text(`PET_NAME_${pet.kindNum}`, pet.className || pet.name || `Pet ${pet.kindNum}`);
}

function getUnitName(kindNum) {
    if (kindNum <= 0) return "";
    return text(`UNIT_NAME_${kindNum}`, `Unit ${kindNum}`);
}

function getSkillText(skillId) {
    const skill = state.petSkillMap.get(Number(skillId));
    return text(`PET_${skillId}`, skill && skill.desc ? skill.desc : `Pet Skill ${skillId}`);
}

function getMasterSkillText(pet, skillId) {
    if (!skillId) return "";
    const coupleName = getUnitName(pet.couple);
    const template = text("GAME_722", "Awakens the hidden special ability of [ ## ].");
    const title = template.replace("##", coupleName);
    const description = state.locale[`PET_${skillId}`] || "";
    const placeholder = state.locale[`PET_${PET_MASTER_SKILL_PLACEHOLDER_ID}`] || "";
    if (!description || (description === placeholder && pet.kindNum !== 5)) return title;
    return `${title}\n${description}`;
}

function readRoute() {
    const parts = getRouteParts();

    if (parts[0] !== "pets") {
        window.location.hash = "#/pets";
        return;
    }

    const requestedKindNum = Number(parts[1]);
    if (state.petMap.has(requestedKindNum)) {
        state.selectedKindNum = requestedKindNum;
    }
}

function getRouteParts() {
    return (window.location.hash || "#/pets")
        .replace(/^#\/?/, "")
        .split("?")[0]
        .split("/")
        .filter(Boolean);
}

function showList() {
    els.detailView.classList.add("view-hidden");
    els.listView.classList.remove("view-hidden");
    renderNavbar({
        links: defaultNavLinks("Pets"),
    });
    renderList();
}

function showDetail() {
    els.listView.classList.add("view-hidden");
    els.detailView.classList.remove("view-hidden");
    renderNavbar({
        links: defaultNavLinks("Pets"),
    });
    renderDetail();
}

function renderList() {
    renderToggle();
    renderListContent();
}

function renderToggle() {
    els.viewModeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.petViewMode === state.mode);
    });
}

function renderListContent() {
    const pets = state.pets;
    els.content.classList.toggle("icon-grid", state.mode === "images");
    els.content.classList.toggle("text-list", state.mode === "list");
    if (!pets.length) {
        els.content.textContent = "No pets found.";
        return;
    }

    els.content.innerHTML = state.mode === "list"
        ? renderListTable(pets)
        : pets.map(renderImageItem).join("");
}

function renderImageItem(pet) {
    const name = getPetName(pet);
    return `<a href="#/pets/${pet.kindNum}" title="${escapeHtml(name)}">${renderPetIcon(pet.kindNum, {
        label: name,
        size: 62,
    })}</a>`;
}

function renderListTable(pets) {
    return `
        <table class="relic-list-table">
            <thead>
                <tr>
                    <th class="id-column">ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Couple</th>
                </tr>
            </thead>
            <tbody>
                ${pets.map(renderListRow).join("")}
            </tbody>
        </table>
    `;
}

function renderListRow(pet) {
    const name = getPetName(pet);
    const couple = getUnitName(pet.couple);
    return `
        <tr>
            <td class="id-column">${pet.kindNum}</td>
            <td class="name-column"><a href="#/pets/${pet.kindNum}">${escapeHtml(name)}</a></td>
            <td>${escapeHtml(formatType(pet.type))}</td>
            <td class="set-column" title="${escapeHtml(couple)}">${escapeHtml(couple || "-")}</td>
        </tr>
    `;
}

function renderDetail() {
    const pet = state.petMap.get(state.selectedKindNum);
    if (!pet) return;

    els.backLink.href = "#/pets";
    els.title.textContent = getPetName(pet);
    els.meta.textContent = "";
    els.mainIcon.innerHTML = renderPetIcon(pet.kindNum, {
        label: getPetName(pet),
        className: "relic-main-icon-sprite",
        size: 64,
    });
    els.info.innerHTML = renderPetInfo(pet);
    els.skills.innerHTML = renderPetSkills(pet);
}

function renderPetInfo(pet) {
    return [
        `<div class="effect-line">+ Pet Points : ${formatValues(pet.incGoldLevel)}</div>`,
        pet.couple > 0 ? `<div class="effect-line">+ Hero Couple : ${escapeHtml(getUnitName(pet.couple))}</div>` : "",
    ].filter(Boolean).join("");
}

function renderPetSkills(pet) {
    const rows = [
        renderSkillLine("Skill 1", pet.skill1, pet.value1),
        renderSkillLine("Skill 2", pet.skill2, pet.value2),
    ];

    if (pet.masterSkill && pet.couple > 0) {
        const masterSkillText = getMasterSkillText(pet, pet.masterSkill);
        if (masterSkillText) {
            rows.push(`<div class="pet-master-skill"><strong class="pet-skill-label">Skill 3:</strong> ${formatMultiline(masterSkillText)}</div>`);
        }
    } else if (pet.masterSkill && hasNonZeroValue(pet.value3)) {
        rows.push(renderSkillLine("Skill 3", pet.masterSkill, pet.value3));
    }

    return rows.filter(Boolean).join("");
}

function renderSkillLine(label, skillId, values) {
    if (!skillId) return "";
    const skill = state.petSkillMap.get(Number(skillId));
    return `<div class="effect-line"><strong class="pet-skill-label">${escapeHtml(label)}:</strong> ${escapeHtml(getSkillText(skillId))} (${formatValues(values, { percent: Boolean(skill && skill.isPercent) })})</div>`;
}

function renderPetIcon(kindNum, options = {}) {
    return renderAtlasIconById(state.assetAtlases.pets, kindNum, options);
}

function writeListRoute() {
    window.location.hash = "#/pets";
}

function bindEvents() {
    els.viewModeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.mode = button.dataset.petViewMode;
            writeListRoute();
            renderList();
        });
    });
}

function formatType(type) {
    return String(type || "unknown")
        .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValues(values, options = {}) {
    const suffix = options.percent ? "%" : "";
    return values.map((value) => `${formatPetValue(value)}${suffix}`).join(", ");
}

function hasNonZeroValue(values) {
    return values.some((value) => Number(value) !== 0);
}

function formatPetValue(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    if (Math.abs(number) >= 10000) return formatNumber(number);
    return Number.isInteger(number) ? String(number) : String(number);
}

function formatMultiline(value) {
    return escapeHtml(value).replace(/\\n|\n/g, "<br>");
}
