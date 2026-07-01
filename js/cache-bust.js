export const BUILD_VERSION = "bd6461bee5ce";

export function versionedUrl(path) {
    if (!path) return path;
    if (/^(data:|blob:|#)/.test(path)) return path;

    const value = String(path);
    const hashIndex = value.indexOf("#");
    const base = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
    const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
    const separator = base.includes("?") ? "&" : "?";

    return `${base}${separator}v=${encodeURIComponent(BUILD_VERSION)}${hash}`;
}
