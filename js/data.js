import { DATA_PATHS } from "./constants.js";

export async function loadRelicData() {
    const [treasureBook, valueBook, setBook, limitBreakBook, locale] = await Promise.all([
        loadJson(DATA_PATHS.treasure),
        loadJson(DATA_PATHS.values),
        loadJson(DATA_PATHS.sets),
        loadJson(DATA_PATHS.limitBreak),
        loadJson(DATA_PATHS.locale),
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
    };
}

function toArrayBook(book) {
    if (Array.isArray(book)) return book;
    if (Array.isArray(book.data)) return book.data;
    return [];
}

async function loadJson(path) {
    const response = await fetch(path);
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
