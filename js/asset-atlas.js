import { versionedUrl } from "./cache-bust.js?v=194107cf343d";
import { escapeHtml } from "./utils.js?v=194107cf343d";

let atlasConfigCache;
const sourceCache = new Map();
const setCache = {};

export async function loadAssetAtlases(path = "data/asset_atlases.json", requestedSets) {
    const config = await loadAtlasConfig(path);
    const setNames = requestedSets || Object.keys(config.sets || {});
    const missingSetNames = setNames.filter((key) => !setCache[key]);

    await Promise.all(missingSetNames.map(async (key) => {
        const setConfig = config.sets && config.sets[key];
        if (!setConfig) return;

        const source = await loadAtlasSource(config.sources && config.sources[setConfig.source]);
        if (!source) return;

        setCache[key] = {
            ...source,
            ...setConfig,
        };
    }));

    return setCache;
}

async function loadAtlasConfig(path) {
    if (atlasConfigCache) return atlasConfigCache;

    const response = await fetch(versionedUrl(path));
    if (!response.ok) return { sources: {}, sets: {} };

    atlasConfigCache = await response.json();
    return atlasConfigCache;
}

async function loadAtlasSource(sourceConfig) {
    if (!sourceConfig) return null;
    if (sourceCache.has(sourceConfig.json)) return sourceCache.get(sourceConfig.json);

    const sourcePromise = fetch(versionedUrl(sourceConfig.json)).then(async (atlasResponse) => {
        if (!atlasResponse.ok) return null;

        const atlas = await atlasResponse.json();
        const imagePath = sourceConfig.image || imagePathFromJson(sourceConfig.json, atlas.meta && atlas.meta.image);
        return {
            ...sourceConfig,
            image: versionedUrl(imagePath),
            frames: atlas.frames || {},
            size: atlas.meta && atlas.meta.size ? atlas.meta.size : null,
        };
    });
    sourceCache.set(sourceConfig.json, sourcePromise);
    return sourcePromise;
}

export function renderAtlasIcon(atlas, frameName, options = {}) {
    const label = options.label || frameName;
    const className = options.className || "";
    const size = options.size || 48;
    const sprite = atlas && atlas.frames ? atlas.frames[frameName] : null;

    if (!sprite || !atlas.size) {
        const missingStyle = `width:${size}px;height:${size}px`;
        return `<span class="sprite-icon sprite-icon-missing ${escapeHtml(className)}" role="img" aria-label="${escapeHtml(label)}" style="${missingStyle}">${escapeHtml(options.missingText || "?")}</span>`;
    }

    const frame = sprite.frame;
    const sourceSize = sprite.sourceSize || { w: frame.w, h: frame.h };
    const sourceOffset = sprite.spriteSourceSize || { x: 0, y: 0 };
    const scale = size / Math.max(sourceSize.w, sourceSize.h);
    const outerWidth = sourceSize.w * scale;
    const outerHeight = sourceSize.h * scale;
    const rotated = Boolean(sprite.rotated);
    const clipWidth = rotated ? sourceOffset.w : frame.w;
    const clipHeight = rotated ? sourceOffset.h : frame.h;
    const packedWidth = rotated ? frame.h : frame.w;
    const packedHeight = rotated ? frame.w : frame.h;
    const outerStyle = [
        `width:${size}px`,
        `height:${size}px`,
    ].join(";");
    const clipStyle = [
        `left:${sourceOffset.x}px`,
        `top:${sourceOffset.y}px`,
        `width:${clipWidth}px`,
        `height:${clipHeight}px`,
    ].join(";");
    const imageStyle = [
        `width:${packedWidth}px`,
        `height:${packedHeight}px`,
        `background-image:url('${atlas.image}')`,
        `background-position:${-frame.x}px ${-frame.y}px`,
        ...(rotated ? [`transform:translateY(${clipHeight}px) rotate(-90deg)`] : []),
    ].join(";");
    const canvasStyle = [
        `width:${sourceSize.w}px`,
        `height:${sourceSize.h}px`,
        `left:${formatCssNumber((size - outerWidth) / 2)}px`,
        `top:${formatCssNumber((size - outerHeight) / 2)}px`,
        `transform:scale(${formatCssNumber(scale)})`,
    ].join(";");

    return `<span class="sprite-icon ${escapeHtml(className)}" role="img" aria-label="${escapeHtml(label)}" style="${outerStyle}"><span class="sprite-icon-canvas" style="${canvasStyle}"><span class="sprite-icon-clip" style="${clipStyle}"><span class="sprite-icon-frame" style="${imageStyle}"></span></span></span></span>`;
}

export function renderAtlasIconById(atlas, id, options = {}) {
    return renderAtlasIcon(atlas, frameNameForId(id, atlas), {
        ...options,
        missingText: options.missingText || id,
    });
}

export function frameNameForId(id, atlas) {
    const candidates = frameNameCandidatesForId(id, atlas);
    if (atlas && atlas.frames) {
        const match = candidates.find((frameName) => atlas.frames[frameName]);
        if (match) return match;
    }

    return candidates[0];
}

function frameNameCandidatesForId(id, atlas) {
    const prefix = atlas && atlas.framePrefix ? atlas.framePrefix : "UI_T";
    const pad = atlas && atlas.pad != null ? atlas.pad : 3;
    const rawId = String(id);
    const names = [
        `${prefix}${rawId.padStart(pad, "0")}`,
        `${prefix}${rawId}`,
        `${prefix}${rawId.padStart(3, "0")}`,
        `${prefix}${rawId.padStart(4, "0")}`,
        `${prefix}_${rawId}`,
        `${prefix}__${rawId}`,
    ];
    return [...new Set(names)];
}

function imagePathFromJson(jsonPath, imageName) {
    if (!imageName) return "";
    const slashIndex = jsonPath.lastIndexOf("/");
    if (slashIndex < 0) return imageName;
    return `${jsonPath.slice(0, slashIndex + 1)}${imageName}`;
}

function formatCssNumber(value) {
    return Number(value.toFixed(4));
}
