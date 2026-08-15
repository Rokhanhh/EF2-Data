import { versionedUrl } from "./cache-bust.js?v=194107cf343d";
import { DATA_PATHS } from "./constants.js?v=194107cf343d";
import { loadAssetAtlases } from "./asset-atlas.js?v=194107cf343d";

export async function loadRelicData() {
    const [treasureBook, valueBook, setBook, limitBreakBook, locale, assetAtlases] = await Promise.all([
        loadJson(DATA_PATHS.treasure),
        loadJson(DATA_PATHS.values),
        loadJson(DATA_PATHS.sets),
        loadJson(DATA_PATHS.limitBreak),
        loadJson(DATA_PATHS.locale),
        loadAssetAtlases(undefined, ["ui", "relics"]),
    ]);

    const treasures = toArrayBook(treasureBook)
        .map(normalizeTreasure)
        .sort((a, b) => a.sortId - b.sortId || a.kindNum - b.kindNum);

    return {
        treasures,
        treasureMap: new Map(treasures.map((treasure) => [treasure.kindNum, treasure])),
        valueMap: new Map(toArrayBook(valueBook).map((value) => [Number(value.id), normalizeValue(value)])),
        sets: toArrayBook(setBook).map(normalizeSet),
        limitBreakAccByGrade: buildLimitBreakAccByGrade(toArrayBook(limitBreakBook)),
        locale: locale || {},
        assetAtlases,
    };
}

export async function loadPetData() {
    const [petBook, petSkillBook, unitBook, locale, assetAtlases] = await Promise.all([
        loadJson(DATA_PATHS.pets),
        loadJson(DATA_PATHS.petSkills),
        loadJson(DATA_PATHS.units),
        loadJson(DATA_PATHS.locale),
        loadAssetAtlases(undefined, ["pets", "units"]),
    ]);

    const pets = toArrayBook(petBook)
        .map(normalizePet)
        .sort((a, b) => a.kindNum - b.kindNum);
    const petSkills = toArrayBook(petSkillBook).map(normalizePetSkill);
    const units = toArrayBook(unitBook)
        .map(normalizeUnit)
        .filter((unit) => unit.tribe >= 1 && unit.tribe <= 4);

    return {
        pets,
        petMap: new Map(pets.map((pet) => [pet.kindNum, pet])),
        petSkills,
        petSkillMap: new Map(petSkills.map((skill) => [skill.kindNum, skill])),
        units,
        unitMap: new Map(units.map((unit) => [unit.kindNum, unit])),
        locale: locale || {},
        assetAtlases,
    };
}

export async function loadUnitData() {
    const [unitBook, petBook, goldSkillBook, uniqueSkillBook, locale, assetAtlases] = await Promise.all([
        loadJson(DATA_PATHS.units),
        loadJson(DATA_PATHS.pets),
        loadJson(DATA_PATHS.heroGoldSkills),
        loadJson(DATA_PATHS.heroUniqueSkills),
        loadJson(DATA_PATHS.locale),
        loadAssetAtlases(undefined, ["units", "pets"]),
    ]);

    const units = toArrayBook(unitBook)
        .map(normalizeUnit)
        .filter((unit) => unit.tribe >= 1 && unit.tribe <= 4)
        .sort((a, b) => a.tribe - b.tribe || b.grade - a.grade || b.kindNum - a.kindNum);

    return {
        units,
        unitMap: new Map(units.map((unit) => [unit.kindNum, unit])),
        petByCoupleMap: new Map(toArrayBook(petBook).map(normalizePet).filter((pet) => pet.couple > 0).map((pet) => [pet.couple, pet])),
        heroGoldSkillMap: new Map(toArrayBook(goldSkillBook).map((skill) => [Number(skill.id), normalizeHeroGoldSkill(skill)])),
        heroUniqueSkillMap: new Map(toArrayBook(uniqueSkillBook).map((skill) => [Number(skill.kindNum), normalizeHeroUniqueSkill(skill)])),
        locale: locale || {},
        assetAtlases,
    };
}

function toArrayBook(book) {
    if (Array.isArray(book)) return book;
    if (Array.isArray(book.data)) return book.data;
    if (Array.isArray(book.value)) return book.value;
    return [];
}

async function loadJson(path) {
    const response = await fetch(versionedUrl(path));
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
}

function normalizeTreasure(row) {
    return {
        ...row,
        kindNum: Number(row.kindNum),
        grade: Number(row.grade || 0),
        maxLv: Number(row.maxLv || 0),
        sortId: Number(row.sortId || row.kindNum || 0),
        openCost: parseNumberList(row.openCost, "|", 4),
        upCost: Number(row.upCost || 0.2),
        skillCode2: row.skillCode2 || row.SKILLCODE2 || "",
    };
}

function normalizeValue(row) {
    return {
        id: Number(row.id),
        init: Number(row.init || 0),
        inc: Number(row.inc || 0),
        inflaPoint: Number(row.inflaPoint || 999),
        inc2: Number(row.inc2 || 0),
        isPlus: Number(row.isPlus == null ? 1 : row.isPlus),
    };
}

function normalizeSet(row) {
    return {
        ...row,
        kindNum: Number(row.kindNum),
        itemList: parseNumberList(row.itemList, "|"),
        numSetList: parseNumberList(row.numSetList, "|"),
        skillList: parseNestedList(row.skillList),
        valueList: parseNestedNumberList(row.valueList),
        valueList1: parseNestedNumberList(row.valueList1),
        valueList2: parseNestedNumberList(row.valueList2),
        valueList3: parseNestedNumberList(row.valueList3),
        descList: parseNestedList(row.desc || row.descList || ""),
    };
}

function normalizePet(row) {
    return {
        ...row,
        kindNum: Number(row.kindNum),
        tribe: Number(row.tribe || 0),
        rank: Number(row.rank || 0),
        skill1: Number(row.skill1 || 0),
        skill2: Number(row.skill2 || 0),
        masterSkill: Number(row.masterSkill || 0),
        couple: Number(row.couple || 0),
        treasureKindNum: Number(row.treasureKindNum || 0),
        value1: parseNumberList(row.value1, "|"),
        value2: parseNumberList(row.value2, "|"),
        value3: parseNumberList(row.value3, "|"),
        incGoldLevel: parseNumberList(row.incGoldLevel, "|"),
    };
}

function normalizePetSkill(row) {
    return {
        ...row,
        kindNum: Number(row.kindNum),
        isPercent: row.isPercent === "Y",
    };
}

function normalizeUnit(row) {
    return {
        ...row,
        kindNum: Number(row.kindNum),
        base: Number(row.base || 0),
        tribe: Number(row.tribe || 0),
        grade: Number(row.grade || 0),
        evolStage: Number(row.evolStage || 0),
        evolKindNum: Number(row.evolKindNum || 0),
        atkDmg: Number(row.atkDmg || 0),
        hp: Number(row.hp || 0),
        phyDef: Number(row.phyDef || 0),
        magDef: Number(row.magDef || 0),
        atkSpd: Number(row.atkSpd || 0),
        moveSpd: Number(row.moveSpd || 0),
        atkRange: Number(row.atkRange || 0),
        reviveTime: Number(row.reviveTime || 0),
        recovery: Number(row.recovery || 0),
        uniqueSkill: Number(row.uniqueSkill || 0),
        trans: Number(row.trans || 0),
        goldBuffs: parseNumberList(row.goldBuffs, "|"),
        goldBuffValues: parseNumberList(row.goldBuffValues, "|"),
        material1: parseNumberList(row.material1, "|").filter((id) => id > 0),
        material2: parseNumberList(row.material2, "|").filter((id) => id > 0),
        material3: parseNumberList(row.material3, "|").filter((id) => id > 0),
    };
}

function normalizeHeroGoldSkill(row) {
    return {
        ...row,
        id: Number(row.id),
    };
}

function normalizeHeroUniqueSkill(row) {
    return {
        ...row,
        kindNum: Number(row.kindNum),
        value: Number(row.value || 0),
    };
}

function buildLimitBreakAccByGrade(rows) {
    const accByGrade = {};
    for (let grade = 1; grade <= 6; grade += 1) {
        accByGrade[grade] = [0];
    }

    rows
        .slice()
        .sort((a, b) => Number(a.level) - Number(b.level))
        .forEach((row) => {
            for (let grade = 1; grade <= 6; grade += 1) {
                accByGrade[grade][Number(row.level)] = Number(row[`grade${grade}`] || 0);
            }
        });

    return accByGrade;
}

function parseNumberList(value, separator, padTo) {
    const list = String(value == null ? "" : value)
        .split(separator)
        .filter((part) => part !== "")
        .map((part) => Number(part || 0));
    while (padTo && list.length < padTo) list.push(0);
    return list;
}

function parseNestedList(value) {
    if (value == null || value === "") return [];
    return String(value).split("|").map((tier) => tier.split("#").filter(Boolean));
}

function parseNestedNumberList(value) {
    return parseNestedList(value).map((tier) => tier.map((part) => Number(part || 0)));
}
