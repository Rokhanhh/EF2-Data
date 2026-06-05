export class NumberUtil {
    static addZeros(t, i) {
        let s = String(i);
        const e = t - s.length;
        for (let n = 0; n < e; n += 1) s = `0${s}`;
        return s;
    }

    static displayLargeNumberAsAlphabet(i) {
        if (i <= 0) return "0";
        if (i < 10000) return Math.floor(i).toString();

        const s = Math.floor(Math.log10(i) / 3);
        const e = i / Math.pow(1000, s);
        const n = this.suffixes[s] || "";
        const h = Math.floor(Math.log10(e)) + 1;
        const r = Math.max(0, 3 - h);

        return parseFloat(e.toFixed(r)).toString() + n;
    }
}

NumberUtil.suffixes = (() => {
    const t = [""];
    for (let i = 0; i < 26; i += 1) {
        t.push(String.fromCharCode(97 + i));
    }
    for (let i = 0; i < 26; i += 1) {
        for (let s = 0; s < 26; s += 1) {
            t.push(String.fromCharCode(97 + i) + String.fromCharCode(97 + s));
        }
    }
    return t;
})();

export function clamp(value, min, max) {
    const number = Number.parseInt(value, 10);
    if (Number.isNaN(number)) return min;
    return Math.min(Math.max(number, min), max);
}

export function formatNumber(value) {
    return NumberUtil.displayLargeNumberAsAlphabet(value);
}

export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
