// ── PRODUCT ART — drawn by code ───────────────────────────
// Draws one image for every item in catalog.data.js with code (SVG turned
// into JPEG by sharp). Nothing is downloaded from the internet. Each image
// gets its own background, pattern and angle on top of the item's own
// colors and label, so no two products look the same.
// Only needed to make NEW images. The current ones are already on
// Cloudinary and listed in catalog.photos.json, which `npm run demoCatalog`
// applies.
// Usage (in backend/):  GEN_OUT=<folder> node prisma/product.art.js
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { CATALOG, expandCatalog } from "./catalog.data.js";

// ── palettes and helpers ─────────────────────────────────
const BG = [
  ["#FDF6EC", "#F3E3C8"], ["#EEF4FA", "#D3E2F0"], ["#F1F7EE", "#D6E8CE"], ["#FBEFF2", "#F0D3DC"],
  ["#F5F3FF", "#DFD8F8"], ["#FFF8E1", "#F9E4A8"], ["#EAF6F6", "#C7E5E3"], ["#F7F7F7", "#E1E1E1"],
  ["#FFF1E6", "#F7D4BA"], ["#EDF2F4", "#D0DAE0"], ["#F4F1EA", "#DED6C3"], ["#EFF7FF", "#C9E0F8"],
];
const COLORS = ["#E4572E", "#2E86AB", "#F3A712", "#4C956C", "#8E5572", "#3D5A80",
  "#EE6C4D", "#2A9D8F", "#C1666B", "#6D597A", "#D4A373", "#264653", "#E76F51", "#5E60CE"];

// Mix a hex color toward white (amt > 0) or black (amt < 0)
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)),
  );
  return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join("");
};
// Light colors need dark text on top of them
const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 170;
};
const ink = (bg) => (isLight(bg) ? "#2C2C2C" : "#FFFFFF");
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
// Centered bold text; shrinks long labels so they fit `max` px
const T = (x, y, size, fill, text, max = 999) => {
  const fit = Math.min(size, Math.floor(max / (String(text).length * 0.62)));
  return `<text x="${x}" y="${y}" font-size="${fit}" fill="${fill}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold">${esc(text)}</text>`;
};
const R = (x, y, w, h, rx, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const C = (cx, cy, r, fill, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, extra = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const L = (d, stroke, w, extra = "") => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const range = (n) => Array.from({ length: n }, (_, i) => i);
const STEEL = "#C3C9D1";

// ── drawings: draw[art](params, color, k) in local coords around (0,0) ──
const draw = {
  // ── food ──
  tin(p, c, k) {
    const n = 1 + (k % 2);
    return range(n).reverse().map((i) => {
      const y = -i * 70 + (n - 1) * 30, dx = i * 18;
      const body = i === 0 ? "#C9CED6" : "#AEB4BE";
      return `<g transform="translate(${dx},${y})">${R(-170, -70, 340, 160, 48, shade(body, -0.25))}${R(-170, -80, 340, 150, 48, body)}
        ${R(-150, -62, 300, 114, 36, i === 0 ? p.color : shade(p.color, -0.25))}
        ${p.fish ? E(-40, -12, 64, 22, "#fff", 'opacity="0.92"') + P("M18,-12 L64,-36 L64,12 Z", "#fff", 'opacity="0.92"') + C(-80, -16, 5, p.color) : R(-110, -40, 220, 44, 22, "#fff", 'opacity="0.18"')}
        ${T(0, 38, 26, "#fff", p.label, 270)}${C(128, -58, 16, "none", 'stroke="#8C939E" stroke-width="6"')}</g>`;
    }).join("");
  },
  jar(p, c) {
    const lid = c, h = p.short ? 200 : 330, top = p.short ? -60 : -140;
    let inside = "";
    if (p.balls) inside = range(14).map((i) => C(-90 + (i % 5) * 45, top + 30 + Math.floor(i / 5) * 55, 24, "#fff", 'stroke="#E5E8E8" stroke-width="3"')).join("");
    if (p.nuts) inside = range(12).map((i) => `<polygon points="${range(6).map((j) => `${(-90 + (i % 4) * 60 + Math.cos(j * 1.047) * 20).toFixed(0)},${(top + 40 + Math.floor(i / 4) * 60 + Math.sin(j * 1.047) * 20).toFixed(0)}`).join(" ")}" fill="#AAB2BD" stroke="#7F8C8D" stroke-width="3"/>`).join("");
    const labelY = p.short ? top + 50 : -40, labelH = p.short ? 100 : 150;
    return `${R(-118, top - 60, 236, 66, 16, lid)}${range(5).map((i) => L(`M${-80 + i * 40},${top - 56} L${-80 + i * 40},${top + 2}`, shade(lid, -0.25), 4)).join("")}
      ${R(-135, top, 270, h, p.short ? 34 : 52, p.fill)}${inside}
      ${p.balls || p.nuts ? "" : R(-135, labelY, 270, labelH, 0, "#FFF6E5")}
      ${p.peanut ? `<g transform="translate(0,${labelY + 55})">${E(-22, 0, 30, 24, "#D9A55B")}${E(22, 0, 30, 24, "#D9A55B")}</g>` : ""}
      ${p.balls || p.nuts ? R(-120, top + h - 90, 240, 60, 10, "#FFF6E5") + T(0, top + h - 48, 28, lid, p.label, 220) : T(0, labelY + labelH - (p.peanut ? 25 : labelH / 2 - 12), 32, lid, p.label, 240)}
      ${L(`M-105,${top + 30} L-105,${top + h - 30}`, "#fff", 14, 'opacity="0.25"')}`;
  },
  sack(p, c) {
    const s = p.sackColor || "#EFE6D2";
    return `${P("M-150,-120 Q-175,60 -160,190 L160,190 Q175,60 150,-120 Q140,-160 100,-170 L-100,-170 Q-140,-160 -150,-120Z", s, `stroke="${shade(s, -0.15)}" stroke-width="4"`)}
      ${P("M-150,-120 Q-175,60 -160,190 L160,190 Q175,60 150,-120 Q140,-160 100,-170 L-100,-170 Q-140,-160 -150,-120Z", "url(#weave)")}
      ${P("M-70,-170 Q-90,-230 -40,-215 Q0,-250 40,-215 Q90,-230 70,-170Z", shade(s, -0.05), `stroke="${shade(s, -0.15)}" stroke-width="4"`)}
      ${R(-80, -182, 160, 16, 8, shade(c, -0.2))}${R(-120, -50, 240, 160, 18, c)}
      ${T(0, 15, 40, "#fff", p.label, 220)}${T(0, 62, 32, "#fff", p.sub)}
      ${[-60, -30, 0, 30, 60].map((x, i) => E(x, 88, 7, 12, "#fff", `opacity="0.85" transform="rotate(${(i - 2) * 15} ${x} 88)"`)).join("")}`;
  },
  sticks(p, c, k) {
    const n = 6;
    const sticks = range(n).map((i) => `<g transform="rotate(${(i - 2.5) * 9} 0 170)">${R(-24, -190, 48, 300, 6, i % 2 ? c : shade(c, -0.15))}${R(-24, -190, 48, 22, 0, shade(c, -0.35))}${C(0, -60, 15, "#fff")}${C(0, -60, 9, p.drink)}</g>`).join("");
    const mx = k % 2 ? 120 : -120;
    return sticks + `<g transform="translate(${mx},120)">${P("M-60,-40 L60,-40 L50,70 Q48,85 30,85 L-30,85 Q-48,85 -50,70Z", "#fff", 'stroke="#DDD" stroke-width="3"')}
      ${L("M58,-15 Q100,-10 92,30 Q85,55 52,50", "#fff", 14)}${E(0, -40, 60, 14, p.drink)}
      ${L("M-20,-60 Q-35,-85 -15,-105 M10,-60 Q-5,-90 18,-112", "#fff", 6, 'opacity="0.8"')}</g>`;
  },
  bottle(p, c) {
    const liq = p.liquid, big = p.big ? 1.1 : 1;
    if (p.shape === "tall") {
      return `${R(-30, -215, 60, 50, 10, shade(c, -0.2))}${R(-85, -170, 170, 370, 60, liq, `stroke="${shade(liq, -0.15)}" stroke-width="4"`)}
        ${R(-70, -40, 140, 150, 14, "#fff")}${T(0, 45, 26, c, p.label, 125)}${L("M-60,-140 L-60,170", "#fff", 10, 'opacity="0.5"')}`;
    }
    if (p.shape === "square") {
      return `${R(-34, -210, 68, 56, 10, c)}${R(-55, -165, 110, 40, 10, shade(liq, -0.1))}
        ${R(-120, -130, 240, 330, 30, liq, `stroke="${shade(liq, -0.2)}" stroke-width="4"`)}${R(-95, -40, 190, 150, 14, "#fff")}
        ${T(0, 48, 28, c, p.label, 170)}${L("M-100,-100 L-100,175", "#fff", 10, 'opacity="0.5"')}`;
    }
    if (p.shape === "dropper") {
      return `${E(0, -205, 30, 34, shade(c, -0.3))}${R(-22, -175, 44, 50, 6, "#2C2C2C")}
        ${R(-90, -125, 180, 260, 40, shade(liq, -0.25), 'opacity="0.95"')}${R(-70, -40, 140, 120, 12, "#fff")}
        ${T(0, 30, 24, "#333", p.label, 125)}${L("M-70,-100 L-70,110", "#fff", 10, 'opacity="0.45"')}`;
    }
    return `<g transform="scale(${big})">${R(-36, -150, 72, 70, 0, shade(liq, 0.3), `stroke="${shade(liq, -0.2)}" stroke-width="3"`)}
      ${R(-48, -205, 96, 62, 12, shade(c, -0.25))}
      ${P("M-36,-82 Q-110,-70 -110,-10 L-110,170 Q-110,195 -85,195 L85,195 Q110,195 110,170 L110,-10 Q110,-70 36,-82 Z", liq, `stroke="${shade(liq, -0.25)}" stroke-width="4"`)}
      ${R(-92, -10, 184, 150, 14, "#fff")}
      ${p.cross ? R(-14, 10, 28, 66, 0, c) + R(-33, 29, 66, 28, 0, c) + T(0, 118, 36, c, p.label) : T(0, 80, 30, c, p.label, 165)}
      ${L("M-85,-30 L-85,160", "#fff", 10, 'opacity="0.6"')}</g>`;
  },
  chipbag(p, c) {
    const bag = p.bag || c;
    return `${P("M-140,-190 L140,-190 Q160,0 140,190 L-140,190 Q-160,0 -140,-190Z", bag)}
      ${range(14).map((i) => `<path d="M${-140 + i * 20},-190 l10,-14 l10,14" fill="${shade(bag, -0.2)}"/><path d="M${-140 + i * 20},190 l10,14 l10,-14" fill="${shade(bag, -0.2)}"/>`).join("")}
      ${E(0, -20, 105, 85, "#fff", 'opacity="0.9"')}
      ${range(7).map((i) => E(-55 + (i % 4) * 36 + (i > 3 ? 18 : 0), -45 + (i > 3 ? 45 : 0), 26, 20, p.chip, `stroke="${shade(p.chip, -0.2)}" stroke-width="3"`)).join("")}
      ${R(-120, 95, 240, 60, 12, shade(bag, -0.3))}${T(0, 137, 30, "#fff", p.label, 220)}`;
  },
  noodles(p, c) {
    if (p.cup) {
      return `${P("M-130,-120 L130,-120 L100,190 L-100,190Z", "#fff", 'stroke="#DDD" stroke-width="4"')}${P("M-122,-60 L122,-60 L108,70 L-108,70Z", c)}
        ${E(0, -125, 140, 26, shade(c, -0.25))}${T(0, 20, 40, "#fff", p.label, 200)}${L("M-20,-180 Q-35,-210 -10,-240 M20,-180 Q5,-215 30,-245", "#BBB", 6)}`;
    }
    return `${R(-190, -130, 380, 260, 22, c)}${R(-190, -130, 380, 40, 0, shade(c, -0.25))}${R(-190, 90, 380, 40, 0, shade(c, -0.25))}
      ${E(-60, 10, 95, 70, "#F7DC6F")}${range(6).map((i) => L(`M${-140 + i * 4},${-30 + i * 14} Q-60,${-60 + i * 14} ${20 - i * 3},${-30 + i * 14}`, "#E9B44C", 6)).join("")}
      ${T(90, 0, 40, "#fff", p.label, 170)}${T(90, 45, 26, "#fff", "6 PACKS")}`;
  },
  eggs(p, c) {
    const cols = p.big ? 5 : 4, rows = 3;
    return `${R(-210, -150, 420, 300, 24, "#C9B79C")}${R(-195, -135, 390, 270, 18, "#D8C8AE")}
      ${range(cols * rows).map((i) => {
        const x = -150 + (i % cols) * (300 / (cols - 1)), y = -90 + Math.floor(i / cols) * 90;
        return E(x, y + 6, 36, 30, "#B9A486") + E(x, y, 32, 40, p.egg, `stroke="${shade(p.egg, -0.12)}" stroke-width="3"`);
      }).join("")}`;
  },

  // ── clothing ──
  shirt(p) {
    const c = p.color, long = p.style === "long";
    const body = long
      ? "M-70,-170 Q0,-130 70,-170 L150,-140 L210,120 L160,135 L110,-30 L110,180 L-110,180 L-110,-30 L-160,135 L-210,120 L-150,-140 Z"
      : "M-70,-170 Q0,-130 70,-170 L190,-110 L150,-30 L110,-50 L110,180 L-110,180 L-110,-50 L-150,-30 L-190,-110 Z";
    const edge = isLight(c) ? `stroke="#D5D8DC" stroke-width="4"` : "";
    return `${P(body, c, edge)}${p.style === "stripes" ? P(body, "url(#stripes)", 'opacity="0.55"') : ""}
      ${p.style === "pocket" ? R(35, -60, 50, 55, 6, "none", `stroke="${shade(c, -0.3)}" stroke-width="4"`) : ""}
      ${p.style === "graphic" ? C(0, -10, 62, "#2E86AB", 'opacity="0.85"') + P("M-50,20 L-15,-30 L10,0 L30,-20 L50,20Z", "#4C956C") + T(0, 85, 26, ink(c), "MUNTINLUPA") : ""}
      ${L("M-70,-170 Q0,-112 70,-170", shade(c, -0.3), 12)}`;
  },
  tank(p) {
    const c = p.color;
    return `${P("M-80,-180 Q0,-60 80,-180 L120,-180 Q110,-70 140,-40 L140,190 L-140,190 L-140,-40 Q-110,-70 -120,-180 Z", c, isLight(c) ? `stroke="#D5D8DC" stroke-width="4"` : "")}
      ${p.reflect ? R(-140, 40, 280, 26, 0, "#D5D8DC") + R(-140, 110, 280, 26, 0, "#D5D8DC") + R(-14, -110, 28, 300, 0, "#F39C12", 'opacity="0.0"') : ""}
      ${L("M-80,-180 Q0,-60 80,-180", shade(c, -0.25), 8)}`;
  },
  hoodie(p) {
    const c = p.color;
    const body = "M-80,-160 L80,-160 L150,-130 L210,130 L160,145 L115,-20 L115,190 L-115,190 L-115,-20 L-160,145 L-210,130 L-150,-130 Z";
    return `${P(body, c)}${p.hood ? P("M-85,-160 Q-90,-235 0,-240 Q90,-235 85,-160 Q0,-110 -85,-160Z", shade(c, -0.15)) : P("M-60,-165 L0,-120 L60,-165", "none", `stroke="${shade(c, -0.3)}" stroke-width="10"`)}
      ${p.zip ? L("M0,-130 L0,190", "#BDC3C7", 6) + R(-8, -60, 16, 24, 4, "#BDC3C7") : R(-80, 70, 160, 70, 24, shade(c, -0.15))}
      ${p.hood ? L("M-20,-150 L-25,-70 M20,-150 L25,-70", "#fff", 5) : ""}${R(-115, 170, 230, 22, 6, shade(c, -0.2))}`;
  },
  polo(p) {
    const c = p.color, t = p.trim;
    const body = "M-70,-170 L70,-170 L190,-110 L150,-30 L110,-50 L110,180 L-110,180 L-110,-50 L-150,-30 L-190,-110 Z";
    return `${P(body, c, isLight(c) ? 'stroke="#D9DCE1" stroke-width="4"' : "")}
      ${P("M-70,-170 L0,-120 L-50,-100 Z M70,-170 L0,-120 L50,-100 Z", c, `stroke="${t}" stroke-width="6" stroke-linejoin="round"`)}
      ${R(-14, -120, 28, p.full ? 300 : 110, 4, c, `stroke="${shade(c, -0.15)}" stroke-width="3"`)}
      ${range(p.full ? 6 : 2).map((i) => C(0, -90 + i * 48, 6, t)).join("")}
      ${L("M150,-30 L190,-110 M-150,-30 L-190,-110", t, 10)}${p.full ? "" : C(65, -60, 14, t, 'opacity="0.85"')}`;
  },
  shorts(p) {
    const c = p.color, len = p.long ? 210 : 172;
    return `${P(`M-150,-120 L150,-120 L180,${len - 22} L25,${len} L0,30 L-25,${len} L-180,${len - 22} Z`, c)}
      ${p.side ? L(`M-162,-110 L-180,${len - 30} M162,-110 L180,${len - 30}`, "#fff", 12, 'opacity="0.85"') : ""}
      ${R(-155, -160, 310, 46, 12, shade(c, -0.25))}
      ${L("M-15,-114 Q-30,-60 -50,-40 M15,-114 Q30,-60 50,-40", "#fff", 6)}${C(-50, -38, 7, "#fff")}${C(50, -38, 7, "#fff")}`;
  },
  pants(p) {
    const c = p.color, w = p.slim ? 0.8 : 1;
    const d = `M${-130 * w},-200 L${130 * w},-200 L${150 * w},210 L${30 * w},210 L0,-60 L${-30 * w},210 L${-150 * w},210 Z`;
    return `${P(d, c)}${p.check ? P(d, "url(#check)", 'opacity="0.5"') : ""}
      ${R(-135 * w, -225, 270 * w, 40, 10, shade(c, -0.25))}
      ${p.seams ? L(`M${-90 * w},-185 Q${-60 * w},-140 ${-20 * w},-150 M${90 * w},-185 Q${60 * w},-140 ${20 * w},-150`, "#F5CBA7", 4) + L(`M0,-185 L0,-80`, shade(c, -0.3), 4) : ""}
      ${p.cuffs ? R(-150 * w, 180, 120 * w, 30, 8, shade(c, -0.25)) + R(30 * w, 180, 120 * w, 30, 8, shade(c, -0.25)) : ""}`;
  },
  dress(p) {
    const c = p.color;
    if (p.poncho) {
      return `${P("M0,-200 Q-40,-200 -60,-160 L-220,150 Q-220,175 -195,175 L195,175 Q220,175 220,150 L60,-160 Q40,-200 0,-200Z", c, 'opacity="0.92"')}
        ${P("M-60,-160 Q0,-260 60,-160 Q0,-130 -60,-160Z", shade(c, -0.2))}${L("M-120,0 L120,0", "#fff", 6, 'opacity="0.4"')}`;
    }
    if (p.skirt) {
      const d = "M-110,-150 L110,-150 L190,170 L-190,170 Z";
      return `${P(d, c)}${p.plaid ? P(d, "url(#check)", 'opacity="0.55"') : ""}${R(-115, -175, 230, 36, 8, shade(c, -0.25))}
        ${range(7).map((i) => L(`M${-80 + i * 27},-140 L${-150 + i * 50},165`, shade(c, -0.25), 4)).join("")}`;
    }
    const d = "M-70,-200 L-40,-200 Q0,-160 40,-200 L70,-200 L90,-90 Q60,-80 70,-40 L200,190 L-200,190 L-70,-40 Q-60,-80 -90,-90 Z";
    return `${P(d, c)}${p.floral ? range(10).map((i) => C(-120 + (i * 53) % 240, -20 + Math.floor(i / 3) * 60, 12, "#fff", 'opacity="0.75"') + C(-120 + (i * 53) % 240, -20 + Math.floor(i / 3) * 60, 5, "#F4D03F")).join("") : ""}
      ${R(-75, -50, 150, 18, 6, shade(c, -0.2))}`;
  },
  cap(p) {
    const c = p.color;
    if (p.salakot) {
      return `${P("M0,-170 L230,90 Q0,140 -230,90 Z", c)}${P("M0,-170 L230,90 Q0,140 -230,90 Z", "url(#weave)")}${C(0, -170, 18, shade(c, -0.3))}${L("M-150,100 Q0,190 150,100", shade(c, -0.4), 5)}`;
    }
    if (p.bucket) {
      return `${P("M-120,-110 Q0,-170 120,-110 L140,40 L-140,40 Z", c)}${E(0, 50, 230, 60, shade(c, -0.12))}${R(-140, 10, 280, 30, 0, shade(c, -0.25))}`;
    }
    return `${P("M-150,40 Q-160,-170 0,-175 Q160,-170 150,40 Z", c)}${P("M60,30 Q220,20 250,80 Q170,95 60,70 Z", shade(c, -0.25))}
      ${L("M0,-175 L0,40 M-80,-150 Q-50,-60 -60,40 M80,-150 Q50,-60 60,40", shade(c, -0.2), 4)}${C(0, -175, 12, shade(c, -0.3))}`;
  },
  socks(p) {
    const c = p.color, h = p.tall ? 260 : 150;
    const sock = (x) => `<g transform="translate(${x},0)">${P(`M-45,${-h / 2 - 60} L45,${-h / 2 - 60} L45,${h / 2 - 20} Q45,${h / 2 + 50} 120,${h / 2 + 50} Q160,${h / 2 + 55} 150,${h / 2 + 95} L-10,${h / 2 + 95} Q-45,${h / 2 + 95} -45,${h / 2 + 50} Z`, c, isLight(c) ? 'stroke="#D5D8DC" stroke-width="4"' : "")}
      ${R(-45, -h / 2 - 60, 90, 30, 6, shade(c, -0.2))}${p.stripes ? R(-45, -h / 2 - 10, 90, 20, 0, "#fff") + R(-45, -h / 2 + 30, 90, 20, 0, "#fff") : ""}
      ${P(`M100,${h / 2 + 52} Q150,${h / 2 + 55} 150,${h / 2 + 95} L100,${h / 2 + 95} Z`, shade(c, -0.25))}</g>`;
    return sock(-110) + sock(10);
  },
  slippers(p) {
    const c = p.color;
    const one = (x, a) => `<g transform="translate(${x},0) rotate(${a})">${E(0, 0, 70, 175, shade(c, -0.25))}${E(0, -8, 66, 168, c)}
      ${p.woven ? E(0, -8, 66, 168, "url(#weave)") + P("M-66,-40 Q0,-110 66,-40 L66,10 Q0,-50 -66,10 Z", shade(c, -0.3)) : L("M-60,-20 L0,-110 L60,-20", shade(c, -0.45), 16)}</g>`;
    return one(-80, -8) + one(80, 8);
  },

  // ── home ──
  basket(p, c) {
    const nat = p.nat;
    if (p.bag) {
      return `${L("M-100,-110 Q-100,-230 0,-230 Q100,-230 100,-110", shade(nat, -0.35), 16)}${P("M-160,-110 L160,-110 L140,190 L-140,190 Z", nat)}
        ${P("M-160,-110 L160,-110 L140,190 L-140,190 Z", "url(#check)", 'opacity="0.5"')}${p.band ? R(-152, 40, 304, 30, 0, p.band) : ""}`;
    }
    const top = p.tall ? -150 : p.low ? 20 : -60;
    return `${p.handle ? L(`M-120,${top - 10} Q0,${top - 190} 120,${top - 10}`, shade(nat, -0.3), 16) : L(`M-180,${top - 10} Q-230,${top} -190,${top + 40} M180,${top - 10} Q230,${top} 190,${top + 40}`, shade(nat, -0.3), 14)}
      ${P(`M-175,${top} L175,${top} L135,175 L-135,175 Z`, nat)}${P(`M-175,${top} L175,${top} L135,175 L-135,175 Z`, "url(#check)", 'opacity="0.55"')}
      ${p.band ? R(-158, 60, 316, 26, 0, p.band) : ""}${R(-188, top - 24, 376, 36, 16, shade(nat, -0.25))}`;
  },
  bin(p) {
    const c = p.color;
    if (p.small) {
      return range(p.layers ? 2 : 3).map((i) => `<g transform="translate(0,${110 - i * 95})">${R(-150, -30, 300, 90, 14, shade(c, 0.6), `stroke="${shade(c, -0.1)}" stroke-width="4"`)}${R(-160, -50, 320, 26, 10, c)}</g>`).join("") +
        (p.layers ? R(-20, -150, 40, 40, 8, shade(c, -0.3)) : "");
    }
    return `${P("M-170,-90 L170,-90 L148,170 L-148,170 Z", shade(c, 0.45), `opacity="0.9" stroke="${shade(c, -0.1)}" stroke-width="5"`)}
      ${[-100, -50, 0, 50, 100].map((x) => L(`M${x},-80 L${x * 0.88},160`, shade(c, 0.2), 5, 'opacity="0.6"')).join("")}
      ${R(-188, -130, 376, 46, 12, c)}${R(-150, -118, 60, 16, 8, shade(c, -0.35))}${R(90, -118, 60, 16, 8, shade(c, -0.35))}`;
  },
  hanger(p, c, k) {
    const n = 4;
    return range(n).reverse().map((i) => {
      const col = p.wood ? pick(["#A0522D", "#8B5A2B", "#B5793A", "#9C6B30"], i) : p.velvet ? pick(["#F1948A", "#BB8FCE", "#F5B7B1", "#D7BDE2"], i + k) : pick(COLORS, k * 3 + i);
      return `<g transform="translate(${(i - 1.5) * 26},${i * 14})">${L("M0,-130 C0,-185 32,-195 34,-168", "#B9C0C9", 9)}
        <path d="M0,-130 L-175,25 Q-185,40 -165,40 L165,40 Q185,40 175,25 Z" fill="none" stroke="${col}" stroke-width="${p.wood ? 22 : 16}" stroke-linejoin="round"/></g>`;
    }).join("");
  },
  broom(p) {
    if (p.soft) {
      return `${R(-14, -230, 28, 240, 10, "#C0392B")}${R(-30, -10, 60, 40, 8, "#7B241C")}
        ${P("M-30,25 L30,25 L150,210 Q0,235 -150,210 Z", "#D4AC6E")}${range(14).map((i) => L(`M${-26 + i * 4},30 L${-140 + i * 21},212`, "#B7955A", 3)).join("")}`;
    }
    return `${range(40).map((i) => L(`M${-10 + (i % 5) * 5},-200 L${-170 + i * 8.5},${200 - (i % 3) * 10}`, pick(["#8B6B3A", "#A07A42", "#7A5A2E"], i), 3)).join("")}
      ${R(-30, -130, 60, 46, 10, "#C0392B")}${R(-30, -110, 60, 8, 0, "#F4D03F")}`;
  },
  dustpan(p) {
    const c = p.color;
    return `${p.long ? R(-12, -240, 24, 260, 10, shade(c, -0.25)) : R(-30, -120, 60, 130, 20, shade(c, -0.25))}
      ${P("M-170,0 L170,0 L210,190 L-210,190 Z", c)}${P("M-170,0 L170,0 L150,40 L-150,40 Z", shade(c, -0.2))}${range(8).map((i) => L(`M${-150 + i * 43},60 L${-170 + i * 48},180`, shade(c, 0.25), 4)).join("")}`;
  },
  pail(p) {
    const c = p.color;
    if (p.tabo) {
      return `${P("M-130,-80 L130,-80 L110,150 Q0,175 -110,150 Z", c)}${E(0, -80, 130, 34, shade(c, -0.25))}${E(0, -80, 112, 24, shade(c, 0.35))}
        ${P("M110,-40 L250,-110 L262,-85 L118,0 Z", shade(c, -0.15))}`;
    }
    const top = p.low ? 20 : -120;
    return `${p.low ? "" : L(`M-160,${top} Q0,${top - 220} 160,${top}`, "#7F8C8D", 10)}${P(`M-175,${top} L175,${top} L140,180 Q0,200 -140,180 Z`, c)}
      ${E(0, top, 175, 38, shade(c, -0.25))}${E(0, top, 155, 26, shade(c, 0.3))}${R(-160, top + 70, 320, 14, 6, shade(c, -0.2))}`;
  },
  plates(p) {
    return range(4).map((i) => `<g transform="translate(0,${60 - i * 26})">${E(0, 0, 210, 70, "#E5E8E8")}${E(0, -8, 205, 64, "#FFFFFF")}${E(0, -8, 205, 64, "none", `stroke="${p.rim}" stroke-width="10"`)}${E(0, -10, 120, 34, "#F4F6F7")}</g>`).join("");
  },
  mug(p) {
    const c = p.color;
    return `${L("M110,-60 Q210,-55 200,30 Q190,110 110,100", c === "#F4F4F2" ? "#D5D8DC" : c, 26)}
      ${R(-140, -120, 260, 300, 40, c, isLight(c) ? 'stroke="#D5D8DC" stroke-width="5"' : "")}${E(-10, -120, 130, 26, "#6B3E26")}
      ${p.print ? C(-10, 30, 70, "#2E86AB", 'opacity="0.9"') + P("M-70,60 L-30,0 L0,30 L30,5 L50,60Z", "#4C956C") : ""}
      ${p.text ? T(-10, 140, 26, "#2C3E50", "MUNTINLUPA") : ""}`;
  },
  pot(p) {
    if (p.type === "pan" || p.type === "skillet") {
      const body = p.type === "pan" ? "#2C2C2C" : "#3B3B3B";
      return `${R(130, -30, 260, 44, 20, p.type === "pan" ? "#1C1C1C" : body, 'transform="rotate(-10)"')}${E(-60, 0, 190, 150, body)}${E(-60, -6, 170, 132, p.type === "pan" ? "#424949" : "#555")}
        ${p.type === "skillet" ? "" : E(-60, -6, 120, 90, "#4D5656")}`;
    }
    const s = p.big ? 1.1 : 1;
    return `<g transform="scale(${s})">${R(-200, -40, 50, 26, 12, "#95A5A6")}${R(150, -40, 50, 26, 12, "#95A5A6")}${R(-160, -70, 320, 250, 30, "#BDC3C7")}
      ${R(-160, -70, 320, 30, 10, "#AAB7B8")}${E(0, -88, 170, 30, "#D5DBDB")}${R(-30, -140, 60, 40, 14, "#7F8C8D")}${L("M-120,-20 L-120,150", "#fff", 10, 'opacity="0.5"')}</g>`;
  },
  pillow(p) {
    const c = p.color, w = p.long ? 400 : 320, h = p.long ? 230 : 300;
    return `${P(`M${-w / 2},${-h / 2} Q0,${-h / 2 + 30} ${w / 2},${-h / 2} Q${w / 2 - 30},0 ${w / 2},${h / 2} Q0,${h / 2 - 30} ${-w / 2},${h / 2} Q${-w / 2 + 30},0 ${-w / 2},${-h / 2}Z`, c, isLight(c) ? 'stroke="#D5D8DC" stroke-width="4"' : "")}
      ${p.dots ? P(`M${-w / 2},${-h / 2} Q0,${-h / 2 + 30} ${w / 2},${-h / 2} Q${w / 2 - 30},0 ${w / 2},${h / 2} Q0,${h / 2 - 30} ${-w / 2},${h / 2} Q${-w / 2 + 30},0 ${-w / 2},${-h / 2}Z`, "url(#dotsDark)") : ""}
      ${p.tassel ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => C((x * w) / 2, (y * h) / 2, 16, shade(c, -0.3))).join("") : ""}
      ${L(`M${-w / 2 + 40},${-h / 2 + 50} Q0,0 ${w / 2 - 60},${h / 2 - 40}`, shade(c, -0.12), 4, 'opacity="0.6"')}`;
  },
  mat(p) {
    const c = p.color;
    if (p.placemats) return range(3).map((i) => `<g transform="translate(${-40 + i * 40},${-60 + i * 60}) rotate(${-6 + i * 6})">${R(-170, -100, 340, 200, 16, shade(c, -i * 0.1))}${R(-170, -100, 340, 200, 16, "url(#weave)")}</g>`).join("");
    if (p.sunshade) return range(6).map((i) => R(-220 + i * 74, -120, 70, 240, 8, i % 2 ? "#D5D8DC" : "#AEB6BF")).join("") + R(-225, -125, 450, 250, 12, "none", 'stroke="#7F8C8D" stroke-width="6"');
    const w = p.banig ? 420 : 400, h = p.banig ? 300 : 240;
    return `${R(-w / 2, -h / 2, w, h, p.carmat ? 40 : 14, c)}
      ${p.stripes ? range(5).map((i) => R(-w / 2, -h / 2 + 20 + i * 48, w, 20, 0, "#F4F4F2", 'opacity="0.7"')).join("") : ""}
      ${p.coir ? R(-w / 2, -h / 2, w, h, 14, "url(#check)", 'opacity="0.4"') + T(0, 15, 50, "#5D3A1A", "WELCOME") : ""}
      ${p.banig ? R(-w / 2, -h / 2, w, h, 14, "url(#diagMat)") + R(-w / 2 + 20, -h / 2 + 20, w - 40, h - 40, 8, "none", 'stroke="#C0392B" stroke-width="10"') : ""}
      ${p.carmat ? R(-w / 2 + 30, -h / 2 + 30, w - 60, h - 60, 26, "url(#gridDark)") : ""}`;
  },
  clock(p) {
    const c = p.color;
    return `${C(0, 0, 200, p.wood ? "#A0522D" : c)}${C(0, 0, 172, "#FFFFFF")}
      ${range(12).map((i) => { const a = (i * 30 * Math.PI) / 180; return L(`M${(Math.sin(a) * 150).toFixed(0)},${(-Math.cos(a) * 150).toFixed(0)} L${(Math.sin(a) * 165).toFixed(0)},${(-Math.cos(a) * 165).toFixed(0)}`, "#2C3E50", i % 3 ? 4 : 9); }).join("")}
      ${L("M0,0 L0,-110", "#2C3E50", 10)}${L("M0,0 L80,40", "#2C3E50", 8)}${L("M0,30 L0,-140", "#E74C3C", 3)}${C(0, 0, 12, "#2C3E50")}`;
  },
  candle(p) {
    const c = p.color;
    return `${R(-130, -80, 260, 260, 30, shade(c, 0.5), `stroke="${shade(c, -0.1)}" stroke-width="5" opacity="0.95"`)}${R(-120, -40, 240, 210, 24, c)}
      ${R(-100, 40, 200, 80, 10, "#fff")}${T(0, 92, 28, shade(c, -0.5), "SOY WAX")}${L("M0,-40 L0,-80", "#333", 5)}
      ${P("M0,-150 Q30,-110 0,-82 Q-30,-110 0,-150Z", "#F5B041")}${P("M0,-130 Q14,-105 0,-90 Q-14,-105 0,-130Z", "#FCF3CF")}`;
  },
  towel(p, c, k) {
    const cols = p.colors;
    return cols.map((col, i) => {
      const y = (cols.length === 1 ? 0 : 80 - i * 80), w = p.single ? 380 : 340, h = p.single ? 160 : 80;
      return `<g transform="translate(${(i - 1) * 14 * (k % 2 ? 1 : -1)},${y})">${R(-w / 2, -h / 2, w, h, 24, col, isLight(col) ? 'stroke="#D5D8DC" stroke-width="4"' : "")}
        ${p.dots ? R(-w / 2, -h / 2, w, h, 24, "url(#dots)", 'opacity="0.35"') : ""}${p.check ? R(-w / 2, -h / 2, w, h, 24, "url(#check)", 'opacity="0.35"') : ""}
        ${R(-w / 2, h / 2 - 18, w, 18, 9, shade(col, -0.15))}${p.single ? R(-w / 2, -h / 2 + 20, w, 14, 0, shade(col, -0.1)) : ""}</g>`;
    }).join("");
  },
  roll(p) {
    const c = p.color;
    if (p.tape) return `${C(0, 0, 180, c)}${C(0, 0, 180, "url(#dots)", 'opacity="0.25"')}${C(0, 0, 90, "#E5E8E8")}${C(0, 0, 70, "#F8F9F9")}${P("M150,90 L250,170 L230,195 L130,115Z", c)}`;
    return `${R(-180, -110, 300, 220, 20, c)}${E(120, 0, 60, 110, shade(c, -0.3))}${E(120, 0, 26, 50, "#ECF0F1")}
      ${P("M-180,-110 L-240,-90 L-240,150 L-180,110 Z", shade(c, 0.15))}${T(-40, 15, 34, "#fff", "TRASH BAGS")}`;
  },
  chair(p) {
    const c = p.color, edge = isLight(c) ? 'stroke="#BFC9CA" stroke-width="5"' : "";
    return `${P("M-120,-220 Q0,-250 120,-220 L130,-30 L-130,-30 Z", c, edge)}${range(4).map((i) => R(-90 + i * 50, -190, 26, 130, 13, "#000", 'opacity="0.10"')).join("")}
      ${P("M-160,-40 L160,-40 L150,20 L-150,20 Z", shade(c, -0.08), edge)}
      ${P("M-150,20 L-190,220 L-150,220 L-110,20 Z M150,20 L190,220 L150,220 L110,20 Z", c, edge)}${P("M-80,20 L-100,200 L-70,200 L-50,20 Z M80,20 L100,200 L70,200 L50,20Z", shade(c, -0.15))}`;
  },
  sponge(p) {
    const c = p.color;
    if (p.loofah) return `${E(0, 0, 200, 130, c)}${E(0, 0, 200, 130, "url(#weave)")}${range(10).map((i) => E(-150 + i * 34, (i % 2 ? 1 : -1) * 30, 14, 10, shade(c, -0.15))).join("")}${L("M-200,0 Q-260,-60 -230,-120", "#8B5A2B", 8)}`;
    return range(p.scrub ? 3 : 1).map((i) => `<g transform="translate(${(i - 1) * 40},${(1 - i) * 70})">${R(-170, -60, 340, 140, 28, c)}${p.scrub ? R(-170, -80, 340, 40, 16, p.scrub) : ""}
      ${range(9).map((j) => E(-130 + j * 32, 20 + (j % 2) * 24, 8, 6, shade(c, -0.18))).join("")}</g>`).join("");
  },
  coil() {
    let d = "M0,0";
    for (let a = 0; a < 6 * Math.PI; a += 0.3) d += ` L${(Math.cos(a) * (12 + a * 9)).toFixed(1)},${(Math.sin(a) * (12 + a * 9)).toFixed(1)}`;
    return `${L(d, "#2E7D32", 22)}${L(d, "#43A047", 10)}${R(-180, 190, 360, 20, 10, "#7F8C8D")}${L("M175,-20 Q200,-80 180,-140", "#BBB", 6, 'opacity="0.7"')}`;
  },
  spoon() {
    return range(3).map((i) => `<g transform="rotate(${-20 + i * 20}) translate(${(i - 1) * 20},0)">${R(-12, -60, 24, 260, 12, pick(["#B5793A", "#A0652D", "#C8955A"], i))}
      ${i === 1 ? R(-40, -230, 80, 170, 20, "#A0652D") + range(3).map((j) => R(-28 + j * 22, -230, 12, 60, 4, "#FFF", 'opacity="0.0"')).join("") : E(0, -130, 58, 85, pick(["#B5793A", "#A0652D", "#C8955A"], i))}</g>`).join("");
  },

  // ── health ──
  soap(p) {
    const sc = p.color, w = p.long ? 360 : 310;
    const leaf = (x, y, a, s) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${s})">${P("M0,0 Q40,-40 0,-110 Q-40,-40 0,0Z", "#5E9C5B")}${L("M0,0 L0,-100", "#3F7A3D", 3)}</g>`;
    return `${R(-w / 2, -70, w, 175, 48, shade(sc, -0.18))}${R(-w / 2, -80, w, 160, 48, sc, isLight(sc) ? 'stroke="#E5E0D5" stroke-width="3"' : "")}
      ${p.label ? T(0, 15, 44, shade(sc, -0.45), p.label, w - 60) : P("M0,40 Q50,-10 0,-60 Q-50,-10 0,40Z", shade(sc, -0.15)) + L("M0,35 L0,-50", shade(sc, -0.25), 4)}
      ${p.label ? "" : leaf(175, 120, 25, 0.9) + leaf(140, 140, 60, 0.7)}`;
  },
  tube(p) {
    const c = p.color;
    return `${P("M-210,-58 L-185,-58 Q100,-78 140,-52 L140,52 Q100,78 -185,58 L-210,58 Z", "#FFFFFF", 'stroke="#E0E3E8" stroke-width="4"')}
      ${R(-222, -62, 40, 124, 4, "#F1F3F6", 'stroke="#E0E3E8" stroke-width="3"')}${range(5).map((i) => L(`M-218,${-40 + i * 20} L-186,${-40 + i * 20}`, "#D3D7DD", 3)).join("")}
      ${P("M-150,-64 Q0,-72 100,-56 L100,56 Q0,72 -150,64 Z", c)}${T(-25, 14, 38, "#fff", p.label, 220)}
      ${R(140, -38, 70, 76, 12, shade(c, -0.25))}${range(4).map((i) => L(`M${152 + i * 15},-34 L${152 + i * 15},34`, shade(c, -0.45), 3)).join("")}`;
  },
  toothbrush(p) {
    const one = (y, col, a) => `<g transform="translate(0,${y}) rotate(${a})">${R(-220, -18, 300, 36, 18, col)}${R(60, -12, 120, 24, 8, shade(col, 0.4))}
      ${range(8).map((i) => R(70 + i * 13, -48, 9, 38, 3, i % 2 ? "#FFFFFF" : "#5DADE2")).join("")}</g>`;
    return p.kids ? one(0, p.color, -10) + C(-160, -10, 22, "#F4D03F") : one(-50, p.color, -8) + one(60, "#27AE60", -8);
  },
  pump(p) {
    const c = p.color, s = p.small ? 0.75 : 1;
    return `<g transform="scale(${s})">${R(-15, -230, 30, 60, 6, "#ECF0F1")}${R(-15, -230, 90, 24, 10, "#ECF0F1")}${R(-50, -175, 100, 40, 10, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="3"')}
      ${R(-110, -140, 220, 330, 50, c)}${R(-90, -40, 180, 160, 16, "#fff")}${T(0, 52, 30, shade(c, -0.4), p.label, 160)}${L("M-90,-110 L-90,160", "#fff", 10, 'opacity="0.45"')}</g>`;
  },
  comb(p) {
    const c = p.color;
    if (p.brush) {
      return `${R(-40, 40, 80, 200, 30, c)}${R(-130, -230, 260, 280, 90, c)}${R(-110, -210, 220, 240, 80, "#2C2C2C", 'opacity="0.35"')}
        ${range(30).map((i) => C(-80 + (i % 6) * 32, -180 + Math.floor(i / 6) * 42, 6, "#F4F4F2")).join("")}`;
    }
    return `${R(-220, -60, 440, 70, 20, c)}${range(26).map((i) => R(-210 + i * 16, 0, i < 10 ? 10 : 8, i < 10 ? 120 : 95, 3, c)).join("")}`;
  },
  box(p) {
    const c = p.color, w = p.small ? 220 : 340, h = p.small ? 220 : 240;
    let extra = "";
    if (p.buds) extra = range(7).map((i) => R(-90 + i * 30, -h / 2 - 90, 8, 110, 4, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="2"') + C(-86 + i * 30, -h / 2 - 95, 14, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="2"')).join("");
    if (p.mask) extra = P(`M-90,${-h / 2 - 90} Q0,${-h / 2 - 120} 90,${-h / 2 - 90} L80,${-h / 2 + 10} Q0,${-h / 2 + 30} -80,${-h / 2 + 10}Z`, shade(c, 0.3), `stroke="${shade(c, -0.1)}" stroke-width="3"`);
    if (p.tissue) extra = P(`M-60,${-h / 2} Q-40,${-h / 2 - 110} 0,${-h / 2 - 70} Q40,${-h / 2 - 120} 60,${-h / 2}Z`, "#FFFFFF", 'stroke="#E5E8E8" stroke-width="3"');
    if (p.bandage) extra = `<g transform="translate(60,${-h / 2 - 40}) rotate(-20)">${R(-90, -26, 180, 52, 26, "#F5CBA7")}${R(-30, -20, 60, 40, 8, "#FAE5D3")}</g>`;
    return `${extra}${R(-w / 2, -h / 2, w, h, 16, c)}${P(`M${-w / 2},${-h / 2} L${-w / 2 + 40},${-h / 2 - 34} L${w / 2 + 40},${-h / 2 - 34} L${w / 2},${-h / 2}Z`, shade(c, 0.25))}
      ${P(`M${w / 2},${-h / 2} L${w / 2 + 40},${-h / 2 - 34} L${w / 2 + 40},${h / 2 - 34} L${w / 2},${h / 2}Z`, shade(c, -0.25))}
      ${p.ribbon ? R(-20, -h / 2, 40, h, 0, "#F4D03F") + L(`M0,${-h / 2 - 20} Q-60,${-h / 2 - 80} -40,${-h / 2 - 10} M0,${-h / 2 - 20} Q60,${-h / 2 - 80} 40,${-h / 2 - 10}`, "#F4D03F", 14) : ""}
      ${R(-w / 2 + 20, 10, w - 40, 70, 10, "#fff", 'opacity="0.95"')}${T(0, 58, 32, c, p.label, w - 60)}`;
  },
  pills(p) {
    const c = p.color;
    return `${R(-110, -200, 220, 70, 16, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}${R(-130, -140, 260, 320, 40, c)}${R(-110, -60, 220, 150, 14, "#fff")}
      ${T(0, 0, 34, c, "VITAMINS")}${T(0, 50, 24, "#555", "30 CAPSULES")}
      ${range(3).map((i) => `<g transform="translate(${-180 + i * 30},${180 - i * 20}) rotate(${30 + i * 20})">${R(-40, -16, 40, 32, 16, c)}${R(0, -16, 40, 32, 16, "#FDFEFE")}</g>`).join("")}`;
  },
  small(p) {
    const c = p.color;
    if (p.type === "rollon") return `${R(-70, -200, 140, 90, 30, shade(c, -0.3))}${R(-80, -120, 160, 320, 70, c)}${R(-60, 0, 120, 110, 14, "#fff")}${T(0, 66, 26, c, "FRESH")}`;
    if (p.type === "lipbalm") return `${R(-50, -220, 100, 140, 20, c)}${R(-55, -90, 110, 290, 22, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}${R(-55, 20, 110, 60, 0, c)}${R(160, -160, 60, 160, 20, shade(c, 0.3))}${R(140, 0, 100, 200, 20, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}`;
    if (p.type === "polish") return `${R(-30, -220, 60, 150, 14, "#2C2C2C")}${R(-110, -80, 220, 260, 60, c)}${L("M-70,-40 L-70,140", "#fff", 12, 'opacity="0.45"')}${E(180, 160, 50, 20, c)}`;
    return `${R(-40, -230, 80, 50, 12, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="3"')}${range(5).map((i) => C(-24 + i * 12, -215, 3, "#AAB7B8")).join("")}
      ${P("M-60,-180 L60,-180 Q130,-100 120,60 L110,200 L-110,200 L-120,60 Q-130,-100 -60,-180Z", c)}${R(-90, 0, 180, 120, 14, "#fff")}${T(0, 70, 28, shade(c, -0.4), "POWDER")}`;
  },
  nailcutter() {
    return `${P("M-200,-30 L150,-60 Q200,-50 200,0 Q200,50 150,60 L-200,30 Z", "#AAB7B8")}${P("M-200,-30 L150,-60 L150,-20 L-200,0 Z", "#D5DBDB")}
      ${P("M-160,-40 L170,-110 L180,-80 L-150,-10 Z", "#BFC9CA")}${C(-150, 0, 18, "#7F8C8D")}${L("M140,-5 L200,-5", "#7F8C8D", 4)}`;
  },
  razor(p) {
    const c = p.color;
    return range(3).map((i) => `<g transform="translate(${(i - 1) * 90},${(i % 2) * 20}) rotate(${-12 + i * 12})">${R(-18, -60, 36, 260, 18, c)}${R(-70, -120, 140, 64, 14, shade(c, -0.3))}${R(-60, -112, 120, 14, 4, STEEL)}</g>`).join("");
  },

  // ── electronics ──
  fan(p, c, k) {
    const cy = p.stand ? -120 : -60, r = p.clip ? 120 : 152;
    const lines = range(18).map((i) => { const a = (i * 20 * Math.PI) / 180; return L(`M0,${cy} L${(Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`, "#9AA3AF", 3); }).join("");
    const base = p.clip
      ? R(-60, 100, 120, 70, 16, shade(c, -0.25)) + L("M-50,170 Q0,230 50,170", shade(c, -0.25), 14)
      : p.stand ? R(-12, cy + 140, 24, 280 - cy, 0, shade(c, -0.15)) + E(0, 215, 140, 26, c) : E(0, 180, 120, 28, c) + R(-14, cy + 100, 28, 180 - cy - 100, 0, shade(c, -0.15));
    return `${base}${p.handle ? L(`M-60,${cy - r - 10} Q0,${cy - r - 70} 60,${cy - r - 10}`, shade(c, -0.25), 14) : ""}
      <g transform="rotate(${k * 23} 0 ${cy})">${[0, 120, 240].map((a) => E(0, cy - r * 0.46, r * 0.28, r * 0.47, shade(c, 0.35), `opacity="0.95" transform="rotate(${a} 0 ${cy})"`)).join("")}</g>
      ${lines}${C(0, cy, r, "none", 'stroke="#8B95A1" stroke-width="8"')}${C(0, cy, 30, shade(c, -0.3))}`;
  },
  cable(p, c, k) {
    if (p.rope) {
      let s = "";
      for (let i = 0; i < 5; i++) s += E(0, -10 + i * 6, 170 - i * 12, 120 - i * 10, "none", `stroke="${i % 2 ? "#F39C12" : "#E67E22"}" stroke-width="14"`);
      return s + R(140, 60, 80, 40, 10, STEEL) + L("M180,80 Q220,130 190,170", STEEL, 12);
    }
    if (p.clamps) {
      const clamp = (x, y, col) => `<g transform="translate(${x},${y})">${P("M-30,-60 L30,-60 L50,40 L-50,40Z", col)}${R(-40, 40, 80, 50, 8, STEEL)}${range(4).map((i) => R(-34 + i * 20, 85, 10, 22, 2, STEEL)).join("")}</g>`;
      return `${L("M-170,110 C-80,-200 80,200 160,-110", "#C0392B", 18)}${L("M-120,140 C-40,-170 120,230 200,-80", "#2C2C2C", 18)}${clamp(-170, 160, "#C0392B")}${clamp(170, -170, "#2C2C2C")}`;
    }
    const w = (k % 5) * 25 + (p.long ? 40 : 0), col = p.leds ? "#ECF0F1" : c;
    const tipW = { c: 20, l: 18, m: 26, h: 50 }[p.tip] || 20;
    const plug = (x, y, a, tip) => `<g transform="translate(${x},${y}) rotate(${a})">${R(-24, -40, 48, 80, 10, shade(c, -0.3))}${R(tip ? -tipW / 2 : -16, -72, tip ? tipW : 32, 34, tip && p.tip === "c" ? 8 : 3, STEEL)}</g>`;
    const path = `M-160,140 C${-60 - w},-240 ${60 + w},240 160,-120`;
    return `${L(path, col, p.tip === "h" ? 26 : 18)}${p.leds ? L(path, "#F4D03F", 10, 'stroke-dasharray="2 22"') : L(path, "#fff", 4, 'opacity="0.25"')}${plug(-160, 175, 180, false)}${plug(175, -150, 20, true)}`;
  },
  bulb(p, c, k) {
    if (p.headlight) {
      return `${R(-40, 60, 80, 140, 10, STEEL)}${range(4).map((i) => R(-50, 80 + i * 26, 100, 12, 4, "#95A5A6")).join("")}${P("M-60,60 L60,60 L45,-150 Q0,-190 -45,-150Z", "#F8F9F9", 'stroke="#D5D8DC" stroke-width="4"')}
        ${R(-20, -120, 40, 120, 6, "#F4D03F")}${C(0, -60, 200, "url(#glow)")}${P("M-90,200 L90,200 L60,240 L-60,240Z", "#2C2C2C")}`;
    }
    if (p.solar) {
      return `${R(-200, -210, 400, 180, 14, "#1F3A5F")}${range(10).map((i) => R(-190 + (i % 5) * 76, -200 + Math.floor(i / 5) * 82, 70, 76, 4, "#2E86C1")).join("")}
        ${R(-12, -30, 24, 70, 0, "#7F8C8D")}${R(-140, 40, 280, 150, 30, "#ECF0F1")}${range(12).map((i) => C(-100 + (i % 6) * 40, 90 + Math.floor(i / 6) * 50, 13, "#F9E79F")).join("")}`;
    }
    const glow = pick(["#FFD54F", "#FFF59D", "#FFE0B2"], k);
    return `${C(0, -50, 195, "url(#glow)")}${C(0, -60, 120, "#FFFFFF", 'stroke="#E2E5EA" stroke-width="4"')}
      ${P("M-62,40 Q-55,80 -50,110 L50,110 Q55,80 62,40 Z", "#FFFFFF", 'stroke="#E2E5EA" stroke-width="4"')}${R(-30, -80, 60, 40, 8, glow)}
      ${range(4).map((i) => R(-52, 110 + i * 18, 104, 14, 5, i % 2 ? "#A9B0BA" : "#C7CDD5")).join("")}${P("M-30,182 L30,182 L12,205 L-12,205Z", "#3B3F46")}
      ${p.emergency ? R(-48, 60, 96, 30, 8, "#E74C3C") + T(0, 82, 18, "#fff", "EMERGENCY") : ""}`;
  },
  charger(p, c) {
    if (p.batteries) {
      return `${R(-170, -120, 340, 240, 30, "#2C3E50")}${range(4).map((i) => `<g transform="translate(${-105 + i * 70},0)">${R(-24, -90, 48, 180, 10, "#27AE60")}${R(-24, -90, 48, 40, 6, "#1C1C1C")}${R(-8, -102, 16, 14, 3, STEEL)}</g>`).join("")}${C(140, -95, 8, "#2ECC71")}`;
    }
    if (p.adapter) return `${R(-140, -140, 280, 280, 40, "#ECF0F1", 'stroke="#BDC3C7" stroke-width="5"')}${R(-70, -60, 30, 70, 8, "#7F8C8D")}${R(40, -60, 30, 70, 8, "#7F8C8D")}${C(0, 60, 22, "#7F8C8D")}${R(-30, 140, 20, 80, 4, STEEL)}${R(10, 140, 20, 80, 4, STEEL)}`;
    return `${R(-130, -150, 260, 260, 40, "#F8F9F9", 'stroke="#D5D8DC" stroke-width="5"')}${R(-55, -230, 26, 80, 6, STEEL)}${R(29, -230, 26, 80, 6, STEEL)}
      ${range(p.ports).map((i) => R(-60, 0 + i * 50 - (p.ports - 1) * 25, 120, 30, 6, "#2C3E50")).join("")}${T(0, -60, 34, "#2E86AB", p.ports > 1 ? "DUAL" : "20W")}
      ${L("M0,110 C0,200 150,150 180,230", "#F8F9F9", 18)}`;
  },
  earphones(p) {
    if (p.wireless) {
      return `${R(-170, -40, 340, 220, 100, "#F8F9F9", 'stroke="#D5D8DC" stroke-width="5"')}${L("M-170,40 L170,40", "#D5D8DC", 4)}${C(0, 120, 10, "#2ECC71")}
        ${E(-80, -90, 50, 60, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}${R(-90, -60, 22, 90, 10, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}
        ${E(80, -90, 50, 60, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}${R(70, -60, 22, 90, 10, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}`;
    }
    return `${L("M-90,-90 C-90,40 0,40 0,100 M90,-90 C90,40 0,40 0,100 M0,100 C0,160 -80,180 -120,220", "#2C2C2C", 7)}
      ${E(-90, -120, 42, 48, "#2C2C2C")}${E(-90, -125, 30, 34, "#555")}${E(90, -120, 42, 48, "#2C2C2C")}${E(90, -125, 30, 34, "#555")}${R(-12, 80, 24, 40, 8, "#2C2C2C")}${R(-136, 210, 30, 50, 6, STEEL)}`;
  },
  headphones(p, c) {
    const col = p.kids ? "#EC7FA9" : "#2C2C2C";
    return `${L("M-160,40 Q-170,-220 0,-220 Q170,-220 160,40", col, 28)}${R(-210, 0, 100, 170, 40, col)}${R(110, 0, 100, 170, 40, col)}
      ${R(-185, 20, 50, 130, 24, p.kids ? "#F5B7B1" : "#555")}${R(135, 20, 50, 130, 24, p.kids ? "#F5B7B1" : "#555")}${p.kids ? C(-160, 85, 18, "#F4D03F") + C(160, 85, 18, "#F4D03F") : ""}`;
  },
  device(p, c) {
    const { w, h, rx } = p, x = -w / 2, y = -h / 2, body = p.clear ? "#D6EAF8" : p.glass ? "#EBF5FB" : c;
    let s = R(x, y, w, h, rx, body, p.clear || p.glass ? 'stroke="#AED6F1" stroke-width="6" opacity="0.9"' : "");
    if (p.bumpers) s += [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([cx, cy]) => C(cx, cy, 30, shade(c, -0.35))).join("");
    if (p.cam) s += R(x + 26, y + 26, 90, 110, 24, shade(body, -0.3)) + C(x + 50, y + 55, 14, "#1C1C1C") + C(x + 50, y + 105, 14, "#1C1C1C") + C(x + 90, y + 80, 8, "#F4D03F");
    if (p.glass) s += L(`M${x + 30},${y + 60} L${x + w - 60},${y + h - 30}`, "#fff", 10, 'opacity="0.8"') + R(x + 70, y + 14, 70, 10, 5, "#AED6F1");
    if (p.screen) s += R(x + 22, y + 26, w - 44, Math.min(90, h * 0.28), 10, "#A3E4D7") + T(0, y + 26 + Math.min(90, h * 0.28) / 2 + 12, 34, "#145A32", p.nozzle || p.hose ? "32 PSI" : "88.8");
    if (p.keys) {
      const [rows, cols] = p.keys, top = p.screen ? y + 140 : y + (p.power ? 90 : 20), kh = (y + h - 20 - top) / rows, kw = (w - 30) / cols;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) s += R(x + 15 + q * kw + 3, top + r * kh + 3, kw - 6, kh - 6, Math.min(kw, kh) / 4, r === 0 && p.power ? "#E74C3C" : shade(c, 0.3));
      if (p.power) s += C(0, y + 50, 20, "#E74C3C");
    }
    if (p.leds) s += range(p.leds).map((i) => C(-45 + i * 30, y + h - 50, 9, i < 3 ? "#2ECC71" : shade(c, 0.4))).join("");
    if (p.port) s += R(-30, y - 12, 60, 16, 6, "#2C3E50");
    if (p.clock) s += R(x + 26, y + 30, w - 52, h - 60, 16, "#1C1C1C") + T(0, 30, 90, "#E74C3C", "07:30");
    if (p.speaker) s += C(x + 100, 15, 75, shade(c, -0.35)) + C(x + 100, 15, 60, "url(#dotsDark)") + R(x + 200, y + 40, 150, 60, 8, "#F9E79F") + range(4).map((i) => C(x + 220 + i * 36, y + 150, 12, shade(c, -0.35))).join("");
    if (p.antenna) s += L(`M${x + w - 50},${y} L${x + w + 60},${y - 200}`, STEEL, 8);
    if (p.usb) s += R(-40, y - 70, 80, 80, 8, STEEL) + R(-22, y - 50, 14, 14, 2, "#555") + R(8, y - 50, 14, 14, 2, "#555") + T(0, 40, 40, "#fff", "32GB");
    if (p.sd) s += P(`M${x},${y + 40} L${x + 40},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h}Z`, c) + range(5).map((i) => R(x + 50 + i * 26, y + 14, 16, 46, 3, "#F4D03F")).join("") + T(0, 60, 52, "#fff", "64GB");
    if (p.lens) s += C(0, 0, h * 0.32, "#1C1C1C") + C(0, 0, h * 0.2, "#2E4053") + C(-h * 0.06, -h * 0.06, h * 0.06, "#85C1E9") + (p.stand ? R(-60, y + h, 120, 60, 10, shade(c, -0.3)) : "");
    if (p.socket) s += R(-50, -50, 26, 60, 8, "#7F8C8D") + R(24, -50, 26, 60, 8, "#7F8C8D") + C(0, 60, 14, "#2ECC71");
    if (p.bell) s += C(0, -20, 60, shade(c, 0.4)) + C(0, -20, 40, "#ECF0F1") + C(0, 90, 10, "#3498DB");
    if (p.nozzle) s += R(-25, y + h, 50, 60, 10, STEEL) + R(-14, y + h + 60, 28, 50, 6, "#555");
    if (p.hose) s += L(`M${x + w - 20},20 C${x + w + 90},40 ${x + w + 60},180 ${x + w - 40},190`, "#2C2C2C", 16) + range(4).map((i) => R(x + 30 + i * 60, 40, 44, 34, 8, shade(c, 0.3))).join("");
    if (p.clamp) s += R(x - 30, -40, 30, 80, 8, shade(c, -0.3)) + R(x + w, -40, 30, 80, 8, shade(c, -0.3)) + R(x + 20, y + 20, w - 40, h - 40, 20, "#1C1C1C") + R(-40, y + h, 80, 100, 14, shade(c, -0.3));
    if (p.battery) s += R(x + 60, y - 40, 60, 40, 6, "#C0392B") + R(x + w - 120, y - 40, 60, 40, 6, "#2C2C2C") + R(x + 30, y + 40, w - 60, 90, 10, "#F4D03F") + T(0, y + 105, 40, "#2C2C2C", "12V");
    return s;
  },
  flashlight(p, c) {
    if (p.headlamp) return `${E(0, 0, 200, 130, "none", 'stroke="#2C2C2C" stroke-width="30"')}${R(-80, 70, 160, 110, 30, c)}${C(0, 125, 40, "#F9E79F")}${C(0, 125, 160, "url(#glow)")}`;
    return `${P("M200,-120 L330,-220 L330,220 L200,120Z", "url(#beam)")}${R(-200, -50, 280, 100, 24, c)}${P("M80,-80 L200,-110 L200,110 L80,80Z", shade(c, -0.25))}
      ${E(200, 0, 18, 110, "#F9E79F")}${R(-80, -64, 50, 30, 8, "#2C2C2C")}${range(5).map((i) => L(`M${-180 + i * 22},-40 L${-180 + i * 22},40`, shade(c, -0.25), 4)).join("")}`;
  },
  batteries(p) {
    const big = p.size === "AA";
    return range(4).map((i) => `<g transform="translate(${-135 + i * 90},0)">${R(-32, big ? -150 : -130, 64, big ? 300 : 260, 12, i % 2 ? "#2C2C2C" : "#E67E22")}
      ${R(-32, big ? -150 : -130, 64, 90, 12, "#F4D03F")}${R(-12, big ? -168 : -148, 24, 20, 4, STEEL)}${T(0, 40, 26, "#fff", p.size)}</g>`).join("");
  },
  speaker(p, c) {
    if (p.party) return `${R(-150, -220, 300, 440, 30, "#1C1C1C")}${C(0, -80, 95, "#2C2C2C")}${C(0, -80, 95, "none", `stroke="${c}" stroke-width="10"`)}${C(0, -80, 40, "#555")}
      ${C(0, 120, 60, "#2C2C2C")}${C(0, 120, 60, "none", 'stroke="#F4D03F" stroke-width="8"')}${R(-120, -200, 240, 20, 6, c)}`;
    return `${R(-180, -110, 360, 220, 90, c)}${R(-150, -90, 300, 180, 70, "url(#dotsDark)")}${C(0, 0, 40, shade(c, -0.3))}${R(-60, -150, 120, 40, 14, shade(c, -0.3))}`;
  },
  mouse(p, c) {
    return `${p.wired ? L("M0,-170 C0,-240 120,-200 160,-260", "#2C2C2C", 10) : ""}${R(-110, -170, 220, 340, 110, c)}${L("M0,-170 L0,-40", shade(c, -0.3), 5)}
      ${L("M-110,-40 Q0,-30 110,-40", shade(c, -0.25), 4)}${R(-12, -130, 24, 54, 12, shade(c, -0.4))}`;
  },
  appliance(p, c) {
    if (p.type === "kettle") return `${P("M-130,-140 L130,-140 L160,170 L-160,170Z", "#ECF0F1", 'stroke="#BDC3C7" stroke-width="5"')}${E(0, 170, 180, 30, "#2C3E50")}${R(-80, -170, 160, 40, 16, c)}
      ${L("M140,-110 Q260,-90 230,60 Q215,130 150,120", c, 26)}${P("M-130,-110 L-230,-170 L-220,-130 L-140,-60Z", "#ECF0F1", 'stroke="#BDC3C7" stroke-width="4"')}${R(-20, -40, 40, 140, 10, "#AED6F1")}`;
    if (p.type === "ricecooker") return `${R(-200, -60, 400, 250, 60, "#F8F9F9", 'stroke="#D5D8DC" stroke-width="5"')}${E(0, -60, 200, 60, c)}${E(0, -75, 160, 40, shade(c, 0.25))}
      ${R(-40, -140, 80, 30, 12, "#2C2C2C")}${R(-80, 40, 160, 60, 14, "#2C3E50")}${C(-40, 70, 9, "#E74C3C")}${C(40, 70, 9, "#2ECC71")}`;
    if (p.type === "iron") return `${P("M-200,100 Q-180,-60 40,-80 L200,-80 Q230,-80 220,-50 L200,100Z", c)}${P("M-210,100 L210,100 L200,140 L-200,140Z", STEEL)}
      ${L("M-40,-80 Q-20,-200 120,-200 Q190,-200 180,-80", shade(c, -0.25), 30)}${C(100, 20, 26, "#ECF0F1")}${L("M200,-140 Q260,-160 260,-220", "#2C2C2C", 8)}`;
    return `${R(-180, -120, 280, 160, 80, c)}${C(100, -40, 80, shade(c, -0.25))}${C(100, -40, 54, "#2C2C2C")}${C(100, -40, 54, "url(#dots)", 'opacity="0.4"')}
      ${R(-120, 20, 90, 200, 30, shade(c, -0.15))}${R(-100, 70, 50, 26, 8, "#ECF0F1")}${L("M-75,220 Q-75,260 -20,260", "#2C2C2C", 8)}`;
  },
  ringlight(p) {
    const legs = L("M0,60 L-160,230 M0,60 L160,230 M0,60 L0,230", "#2C2C2C", 12) + R(-14, -60, 28, 130, 6, "#2C2C2C");
    if (p.tripodOnly) return legs + R(-90, -230, 180, 170, 16, "#2C3E50") + R(-75, -220, 150, 150, 12, "#1C1C1C") + R(-110, -150, 220, 30, 10, "#555");
    return legs + C(0, -150, 140, "none", 'stroke="#FDFEFE" stroke-width="40"') + C(0, -150, 140, "none", 'stroke="#D5D8DC" stroke-width="4"') + C(0, -150, 200, "url(#glow)") + R(-50, -190, 100, 170, 14, "#2C3E50");
  },
  racket(p, c) {
    return `${R(-24, 60, 48, 190, 20, c)}${R(-30, 60, 60, 50, 10, shade(c, -0.3))}${E(0, -100, 150, 170, "none", `stroke="${c}" stroke-width="20"`)}
      ${E(0, -100, 140, 160, "url(#gridDark)")}${C(0, 160, 9, "#E74C3C")}`;
  },
  lights() {
    let s = L("M-230,-80 Q-115,40 0,-60 Q115,40 230,-80", "#2C3E50", 5) + L("M-230,60 Q-115,180 0,80 Q115,180 230,60", "#2C3E50", 5);
    const bulbs = [[-200, -50], [-130, 0], [-60, -20], [20, -40], [90, 0], [160, -20], [-200, 90], [-130, 140], [-60, 120], [20, 100], [90, 140], [160, 120]];
    s += bulbs.map(([x, y], i) => C(x, y + 22, 34, "url(#glow)") + E(x, y + 22, 12, 18, pick(["#F9E79F", "#F7DC6F", "#FCF3CF"], i)) + R(x - 7, y, 14, 10, 2, "#555")).join("");
    return s + R(-260, -100, 60, 40, 8, "#2C3E50");
  },

  // ── automotive ──
  gloves(p) {
    const c = p.color;
    const glove = (x, a) => p.mitt
      ? `<g transform="translate(${x},0) rotate(${a})">${R(-90, -150, 180, 280, 80, c)}${R(-90, -150, 180, 280, 80, "url(#dots)", 'opacity="0.5"')}${R(-80, 110, 160, 60, 14, shade(c, -0.3))}</g>`
      : `<g transform="translate(${x},0) rotate(${a})">${R(-70, -40, 140, 170, 30, c)}${range(4).map((i) => R(-70 + i * 36, -170, 30, 150, 15, c)).join("")}${R(-120, -10, 60, 30, 15, c, 'transform="rotate(-35 -90 0)"')}
          ${R(-75, 110, 150, 40, 10, shade(c, -0.35))}${range(4).map((i) => R(-68 + i * 36, -165, 26, 30, 10, shade(c, -0.3))).join("")}</g>`;
    return p.mitt ? glove(0, -6) : glove(-85, -10) + glove(95, 10);
  },
  toolset(p) {
    const c = p.color;
    let inside;
    if (p.sockets) inside = range(12).map((i) => C(-150 + (i % 6) * 60, -60 + Math.floor(i / 6) * 90, 20 + (i % 6) * 2, STEEL, 'stroke="#7F8C8D" stroke-width="4"') + C(-150 + (i % 6) * 60, -60 + Math.floor(i / 6) * 90, 8, "#555")).join("") + R(-160, 80, 320, 26, 10, STEEL);
    else if (p.screwdrivers) inside = range(6).map((i) => `<g transform="translate(${-140 + i * 56},0)">${R(-14, -110, 28, 100, 12, pick(["#E74C3C", "#F4D03F", "#2E86C1"], i))}${R(-5, -10, 10, 110, 3, STEEL)}</g>`).join("");
    else if (p.repair) inside = R(-150, -90, 120, 180, 16, "#2C2C2C") + T(-90, 10, 22, "#fff", "PATCH") + R(10, -100, 30, 200, 10, STEEL) + R(70, -60, 80, 120, 16, "#E67E22");
    else inside = range(5).map((i) => { const x = -140 + i * 70, len = 170 + i * 12; return `<g transform="translate(${x},0)">${R(-9, -len / 2, 18, len, 7, STEEL)}${C(0, -len / 2, 24, STEEL)}${R(-9, -len / 2 - 28, 18, 26, 0, shade(c, -0.45))}${C(0, len / 2, 19, STEEL)}${C(0, len / 2, 9, shade(c, -0.45))}</g>`; }).join("");
    return `${R(-205, -155, 410, 310, 24, c)}${R(-185, -135, 370, 270, 14, shade(c, -0.45))}${inside}${R(-60, -178, 120, 30, 12, shade(c, -0.3))}`;
  },
  gauge(p, c, k) {
    const col = p.color, ang = -120 + (k * 37) % 200;
    const ticks = range(21).map((i) => { const a = ((-210 + i * 12) * Math.PI) / 180, r1 = i % 5 ? 108 : 98; return L(`M${(Math.cos(a) * r1).toFixed(1)},${(Math.sin(a) * r1 - 40).toFixed(1)} L${(Math.cos(a) * 120).toFixed(1)},${(Math.sin(a) * 120 - 40).toFixed(1)}`, "#333", i % 5 ? 3 : 6); }).join("");
    return `${L("M60,90 C120,170 200,150 210,220", "#2B2D31", 26)}${C(0, -40, 150, col)}${C(0, -40, 128, "#fff")}${ticks}
      ${L("M0,-40 L0,-140", "#E53935", 7, `transform="rotate(${ang} 0 -40)"`)}${C(0, -40, 14, "#333")}${T(0, 40, 22, "#555", "PSI")}${R(-24, 105, 48, 60, 8, STEEL)}`;
  },
  jerry(p) {
    const c = p.color, s = p.big ? 1.12 : 1;
    return `<g transform="scale(${s})">${P("M-140,-150 L80,-150 L140,-90 L140,190 L-140,190 Z", c)}${R(-130, -200, 70, 60, 10, shade(c, -0.3))}
      ${P("M20,-150 L100,-150 L100,-90 L20,-90 Z", "none", `stroke="${shade(c, -0.3)}" stroke-width="18"`)}${R(-110, -40, 220, 150, 14, "#fff")}${T(0, 50, 30, c, p.label, 190)}</g>`;
  },
  spray(p) {
    const c = p.color;
    return `${R(-30, -250, 60, 40, 10, "#ECF0F1")}${R(-60, -220, 120, 60, 14, shade(c, -0.3))}${E(0, -160, 100, 26, STEEL)}${R(-100, -160, 200, 360, 30, c)}
      ${E(0, 200, 100, 24, STEEL)}${R(-100, -60, 200, 150, 0, "#fff")}${T(0, 25, 28, c, p.label, 180)}${L("M-75,-130 L-75,170", "#fff", 10, 'opacity="0.35"')}`;
  },
  helmet(p) {
    const c = p.color;
    if (p.visorOnly) return `${P("M-200,-40 Q-200,-170 0,-170 Q200,-170 200,-40 L180,60 Q0,110 -180,60 Z", "#AED6F1", 'opacity="0.75" stroke="#5DADE2" stroke-width="6"')}${L("M-140,-110 Q-60,-150 40,-140", "#fff", 12, 'opacity="0.8"')}${C(-195, 0, 20, "#2C3E50")}${C(195, 0, 20, "#2C3E50")}`;
    return `${P("M-200,60 Q-210,-220 0,-220 Q210,-220 200,60 L200,140 Q0,190 -200,140 Z", c)}
      ${p.full ? P("M-160,-60 Q0,-110 160,-60 L150,50 Q0,80 -150,50 Z", "#1C2833") + L("M-120,-50 Q-20,-80 80,-60", "#5D6D7E", 10) : P("M-140,-40 Q0,-80 140,-40 L140,0 Q0,-30 -140,0Z", "#1C2833")}
      ${L("M-200,40 Q0,0 200,40", shade(c, -0.3), 6)}${R(-60, -215, 120, 24, 10, shade(c, 0.3))}`;
  },
  sparkplug(p) {
    const one = (x, s) => `<g transform="translate(${x},0) scale(${s})">${R(-12, -230, 24, 40, 6, STEEL)}${R(-40, -190, 80, 170, 30, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"')}
      ${range(4).map((i) => R(-42, -170 + i * 30, 84, 8, 4, "#E5E8E8")).join("")}<polygon points="-60,-20 60,-20 70,20 60,60 -60,60 -70,20" fill="#AAB7B8"/>
      ${R(-34, 60, 68, 110, 6, STEEL)}${range(6).map((i) => L(`M-34,${70 + i * 16} L34,${78 + i * 16}`, "#95A5A6", 4)).join("")}${R(-6, 170, 12, 30, 2, "#7F8C8D")}</g>`;
    return p.set ? one(-140, 0.7) + one(-45, 0.7) + one(50, 0.7) + one(145, 0.7) : one(0, 1);
  },
  tree(p) {
    const c = p.color;
    return `${L("M0,-250 L0,-170", "#BDC3C7", 4)}${P("M0,-170 L90,-60 L50,-60 L120,40 L70,40 L150,150 L20,150 L20,210 L-20,210 L-20,150 L-150,150 L-70,40 L-120,40 L-50,-60 L-90,-60 Z", c)}${T(0, 90, 28, "#fff", "PINE")}`;
  },
  ring(p) {
    const c = p.color;
    if (p.beads) return range(16).map((i) => { const a = (i / 16) * Math.PI * 2; return C(Math.cos(a) * 150, Math.sin(a) * 150, 30, i % 4 === 0 ? "#F4D03F" : i % 2 ? c : shade(c, 0.35)) + C(Math.cos(a) * 150 - 8, Math.sin(a) * 150 - 8, 8, "#fff", 'opacity="0.5"'); }).join("");
    return `${C(0, 0, 190, "none", `stroke="${c}" stroke-width="56"`)}${C(0, 0, 190, "none", 'stroke="url(#dots)" stroke-width="56" opacity="0.3"')}
      ${range(24).map((i) => { const a = (i / 24) * Math.PI * 2; return L(`M${(Math.cos(a) * 165).toFixed(0)},${(Math.sin(a) * 165).toFixed(0)} L${(Math.cos(a) * 215).toFixed(0)},${(Math.sin(a) * 215).toFixed(0)}`, "#555", 3); }).join("")}`;
  },
  triangle() {
    return `${P("M0,-220 L220,170 L-220,170 Z", "#E74C3C")}${P("M0,-120 L130,110 L-130,110 Z", "#FDEDEC")}${P("M0,-70 L80,75 L-80,75 Z", "#E74C3C")}${R(-160, 170, 40, 30, 6, "#2C2C2C")}${R(120, 170, 40, 30, 6, "#2C2C2C")}`;
  },
  mirror() {
    const one = (x, a) => `<g transform="translate(${x},0) rotate(${a})">${L("M0,40 L0,230", "#2C2C2C", 18)}${E(0, -50, 100, 75, "#2C2C2C")}${E(0, -50, 86, 62, "#AED6F1")}${L("M-50,-80 L20,-90", "#fff", 8, 'opacity="0.8"')}</g>`;
    return one(-110, -12) + one(110, 12);
  },
  wiper() {
    return `${R(-230, -20, 460, 30, 10, "#2C2C2C", 'transform="rotate(-8)"')}${R(-230, 10, 460, 14, 6, "#555", 'transform="rotate(-8)"')}${range(6).map((i) => R(-200 + i * 75, -40, 40, 22, 6, "#1C1C1C", 'transform="rotate(-8)"')).join("")}
      ${L("M0,-30 L60,-200", "#2C2C2C", 18)}${C(60, -200, 20, "#555")}`;
  },
  lock(p) {
    const c = p.color;
    return `${L("M-80,-40 L-80,-130 Q-80,-210 0,-210 Q80,-210 80,-130 L80,-40", STEEL, 34)}${R(-150, -60, 300, 240, 36, c)}${C(0, 40, 30, "#2C2C2C")}${R(-10, 50, 20, 60, 6, "#2C2C2C")}`;
  },
  funnel(p) {
    const c = p.color;
    return `${P("M-180,-160 L180,-160 L40,40 L40,200 L-40,200 L-40,40 Z", c)}${E(0, -160, 180, 34, shade(c, -0.25))}${E(0, -160, 160, 24, shade(c, 0.25))}${R(150, -140, 50, 20, 8, shade(c, -0.3))}`;
  },
  pliers(p) {
    const c = p.color;
    return `${P("M-20,-40 L-60,-230 L-20,-240 L20,-60 Z", STEEL)}${P("M20,-40 L60,-230 L20,-240 L-20,-60 Z", "#AAB7B8")}${C(0, -40, 26, "#7F8C8D")}
      ${P("M-20,-20 Q-90,100 -110,230 L-60,235 Q-40,110 10,0Z", c)}${P("M20,-20 Q90,100 110,230 L60,235 Q40,110 -10,0Z", c)}`;
  },

  // ── others ──
  keychain(p, c) {
    let charm;
    if (p.type === "jeepney") charm = `<g transform="translate(0,40) scale(0.6)">${this.jeepney({}, c)}</g>`;
    else if (p.type === "beads") charm = range(7).map((i) => C(0, -50 + i * 34, 18, pick(["#E74C3C", "#F4D03F", "#2E86C1", "#27AE60"], i))).join("") + P("M-30,190 L30,190 L0,240Z", c);
    else {
      const tint = shade(c, 0.7);
      charm = P("M0,-75 L-130,40 Q0,190 130,40 Z", tint, `stroke="${shade(c, 0.3)}" stroke-width="5"`) + range(9).map((i) => { const a = ((200 + i * 17.5) * Math.PI) / 180; return L(`M0,-50 L${(Math.cos(a) * -150).toFixed(1)},${(-50 - Math.sin(a) * 150).toFixed(1)}`, shade(c, 0.2), 3, 'opacity="0.6"'); }).join("") + P("M0,-75 L-130,40 Q0,190 130,40 Z", "url(#pearl)", 'opacity="0.6"');
    }
    return `${C(0, -185, 42, "none", 'stroke="#B9C0C9" stroke-width="10"')}${E(0, -128, 10, 18, "none", 'stroke="#B9C0C9" stroke-width="7"')}${E(0, -96, 10, 18, "none", 'stroke="#B9C0C9" stroke-width="7"')}${charm}`;
  },
  magnet(p, c, k) {
    const card = (x, y, a, i, inner) => `<g transform="translate(${x},${y}) rotate(${a})">${R(-95, -75, 190, 150, 12, "#fff")}${inner(i)}</g>`;
    const scene = (i) => R(-82, -62, 164, 100, 6, shade(pick(COLORS, k + i), 0.55)) + C(40 - i * 20, -30, 16, "#FFD54F") + P("M-82,38 L-30,-20 L10,20 L40,-5 L82,38 Z", "#4C956C") + T(0, 63, 16, shade(c, -0.3), "MUNTINLUPA");
    if (p.type === "stickers") return R(-170, -210, 340, 420, 20, "#FDFEFE", 'stroke="#D5D8DC" stroke-width="4"') + range(6).map((i) => C(-80 + (i % 2) * 160, -120 + Math.floor(i / 2) * 120, 52, pick(COLORS, k + i)) + T(-80 + (i % 2) * 160, -110 + Math.floor(i / 2) * 120, 26, "#fff", ["MNL", "HI", "LOVE", "PH", "OK", "WOW"][i])).join("");
    if (p.type === "cards") return range(3).map((i) => `<g transform="translate(${-60 + i * 60},${-20 + i * 20}) rotate(${-10 + i * 10})">${R(-110, -150, 220, 300, 10, pick(COLORS, k + i * 2))}${R(-90, -130, 180, 180, 6, "#fff", 'opacity="0.9"')}${C(0, -40, 50, pick(COLORS, k + i * 2 + 1))}${T(0, 100, 26, "#fff", "SALAMAT")}</g>`).join("");
    if (p.type === "frame") return R(-180, -220, 360, 440, 20, "#8B5A2B") + R(-150, -190, 300, 380, 8, "#fff") + R(-130, -170, 260, 280, 4, shade(c, 0.5)) + C(60, -100, 30, "#FFD54F") + P("M-130,110 L-40,0 L20,60 L70,20 L130,110Z", "#4C956C");
    return card(-95, -70, -10, 0, scene) + card(100, -40, 8, 1, scene) + card(0, 100, k % 2 ? -4 : 5, 2, scene);
  },
  wallet(p, c) {
    const nat = p.crochet ? "#F5B7B1" : "#C8A26B";
    if (p.coin) {
      return `${P("M-170,-40 Q-170,-170 0,-170 Q170,-170 170,-40 L170,120 Q170,170 120,170 L-120,170 Q-170,170 -170,120Z", nat)}
        ${P("M-170,-40 Q-170,-170 0,-170 Q170,-170 170,-40 L170,120 Q170,170 120,170 L-120,170 Q-170,170 -170,120Z", p.crochet ? "url(#dotsDark)" : "url(#diag)")}
        ${L("M-150,-60 Q0,-90 150,-60", STEEL, 14)}${C(-20, -80, 14, STEEL)}${C(20, -80, 14, STEEL)}`;
    }
    return `${R(-185, -110, 370, 230, 26, nat)}${R(-185, -110, 370, 230, 26, "url(#diag)", 'opacity="0.9"')}
      ${R(-170, -95, 340, 200, 18, "none", 'stroke="#fff" stroke-width="3" stroke-dasharray="10 8" opacity="0.8"')}
      ${P("M-185,-60 Q-185,-110 -135,-110 L135,-110 Q185,-110 185,-60 L185,-10 L0,20 L-185,-10 Z", shade(nat, -0.25))}${C(0, 14, 20, c, 'stroke="#fff" stroke-width="5"')}`;
  },
  abaniko(p) {
    const c = p.color;
    return `${range(11).map((i) => { const a = -75 + i * 15; return `<path d="M0,160 L${(Math.sin((a * Math.PI) / 180) * 260).toFixed(0)},${(160 - Math.cos((a * Math.PI) / 180) * 260).toFixed(0)} L${(Math.sin(((a + 15) * Math.PI) / 180) * 260).toFixed(0)},${(160 - Math.cos(((a + 15) * Math.PI) / 180) * 260).toFixed(0)} Z" fill="${i % 2 ? c : shade(c, -0.15)}"/>`; }).join("")}
      ${range(12).map((i) => { const a = -75 + i * 15; return L(`M0,160 L${(Math.sin((a * Math.PI) / 180) * 262).toFixed(0)},${(160 - Math.cos((a * Math.PI) / 180) * 262).toFixed(0)}`, "#8B5A2B", 5); }).join("")}${C(0, 160, 16, "#5D3A1A")}`;
  },
  notebook(p) {
    const c = p.color;
    return range(2).map((i) => `<g transform="translate(${i * 40 - 20},${-i * 30 + 15}) rotate(${-4 + i * 6})">${R(-150, -200, 300, 380, 14, i ? c : shade(c, -0.2))}
      ${R(-110, -100, 220, 80, 8, "#fff")}${L("M-90,-75 L90,-75 M-90,-45 L60,-45", "#BDC3C7", 4)}
      ${p.spiral ? range(10).map((j) => C(-150, -175 + j * 38, 10, "none", 'stroke="#7F8C8D" stroke-width="6"')).join("") : R(-150, -200, 40, 380, 0, "#1C1C1C", 'opacity="0.35"')}</g>`).join("");
  },
  pens(p, c, k) {
    return range(p.pencils ? 8 : 6).map((i) => {
      const col = pick(p.pencils ? ["#E74C3C", "#F39C12", "#F4D03F", "#27AE60", "#2E86C1", "#8E44AD", "#EC7FA9", "#5D4037"] : ["#2E86C1", "#2C2C2C", "#C0392B", "#27AE60"], i);
      const x = -170 + i * (p.pencils ? 48 : 64);
      return p.pencils
        ? `<g transform="translate(${x},0)">${R(-16, -170, 32, 300, 4, col)}${P("M-16,130 L16,130 L0,190Z", "#F5CBA7")}${P("M-5,172 L5,172 L0,190Z", col)}</g>`
        : `<g transform="translate(${x},0) rotate(${(i - 2.5) * 3})">${R(-14, -180, 28, 300, 14, "#ECF0F1", 'stroke="#BDC3C7" stroke-width="3"')}${R(-14, -180, 28, 60, 10, col)}${R(10, -170, 8, 90, 4, col)}${P("M-10,120 L10,120 L0,170Z", "#7F8C8D")}</g>`;
    }).join("");
  },
  umbrella(p) {
    const c = p.color;
    return `${P("M-230,0 Q-230,-220 0,-220 Q230,-220 230,0 Q195,-30 153,0 Q115,-30 77,0 Q38,-30 0,0 Q-38,-30 -77,0 Q-115,-30 -153,0 Q-195,-30 -230,0Z", c)}
      ${range(5).map((i) => L(`M0,-220 Q${-160 + i * 80},-120 ${-153 + i * 77},0`, shade(c, -0.2), 4)).join("")}
      ${L("M0,-220 L0,170 Q0,220 -50,220 Q-90,220 -90,180", "#2C2C2C", 14)}${p.kids ? C(-80, -100, 26, "#fff", 'opacity="0.8"') + C(90, -80, 20, "#fff", 'opacity="0.8"') : ""}`;
  },
  coasters() {
    return range(4).map((i) => `<g transform="translate(${-30 + i * 22},${90 - i * 40})">${E(0, 10, 170, 60, "#8B5A2B")}${E(0, 0, 170, 60, pick(["#C8955A", "#B5793A", "#D9B98A", "#A0652D"], i))}${E(0, 0, 120, 40, "none", 'stroke="#8B5A2B" stroke-width="3" opacity="0.6"')}</g>`).join("");
  },
  windchime() {
    return `${E(0, -170, 150, 30, "#A0522D")}${L("M0,-250 L0,-200", "#7F8C8D", 4)}
      ${range(7).map((i) => { const x = -120 + i * 40, len = 120 + (i % 3) * 40; return L(`M${x},-160 L${x},${-160 + len}`, "#BDC3C7", 3) + P(`M${x},${-160 + len} l-24,20 q24,50 48,0 Z`, pick(["#FDEBD0", "#FADBD8", "#EBF5FB", "#E8F8F5"], i), 'stroke="#D5D8DC" stroke-width="3"'); }).join("")}`;
  },
  jeepney(p, c) {
    return `${R(-230, -110, 460, 190, 30, "#BDC3C7")}${R(-230, -40, 460, 40, 0, "#C0392B")}${R(-230, 0, 460, 30, 0, "#F4D03F")}
      ${range(5).map((i) => R(-190 + i * 72, -95, 56, 46, 8, "#AED6F1")).join("")}${P("M-230,-110 L-280,-110 L-300,60 L-230,80Z", "#2E86C1")}
      ${R(-260, -170, 140, 60, 10, "#C0392B")}${T(-190, -128, 26, "#fff", "MNTL")}${C(-150, 90, 44, "#2C2C2C")}${C(-150, 90, 18, STEEL)}${C(150, 90, 44, "#2C2C2C")}${C(150, 90, 18, STEEL)}
      ${L("M-260,-170 L-230,-230 M-200,-170 L-180,-230", STEEL, 6)}`;
  },
};

// ── one full image ───────────────────────────────────────
const PATTERNS = ["", "dotsBg", "linesBg", "gridBg"];
function svg(item, k) {
  const [b1, b2] = pick(BG, k * 5 + 3);
  const c = item.params.color || pick(COLORS, k * 5 + 1);
  const pat = PATTERNS[Math.floor(k / 2) % 4];
  const rot = ((k * 37) % 13) - 6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#FFF3B0" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF3B0" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></linearGradient>
    <linearGradient id="pearl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#fff" stop-opacity="0.7"/></linearGradient>
    <pattern id="weave" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0,8 L16,8 M8,0 L8,16" stroke="#8B6B3A" stroke-width="1.5" opacity="0.35"/></pattern>
    <pattern id="stripes" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="12" fill="#fff"/></pattern>
    <pattern id="check" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#000" opacity="0.18"/><rect x="14" y="14" width="14" height="14" fill="#000" opacity="0.18"/></pattern>
    <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2" fill="#fff"/></pattern>
    <pattern id="dotsDark" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="3" fill="#000" opacity="0.25"/></pattern>
    <pattern id="gridDark" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20,0 L0,0 0,20" fill="none" stroke="#000" stroke-width="2" opacity="0.35"/></pattern>
    <pattern id="diag" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="24" fill="${c}" opacity="0.55"/></pattern>
    <pattern id="diagMat" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="15" height="30" fill="#A0652D" opacity="0.35"/></pattern>
    <pattern id="dotsBg" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="3" fill="#000" opacity="0.06"/></pattern>
    <pattern id="linesBg" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(${k % 2 ? 30 : -30})"><rect width="36" height="8" fill="#000" opacity="0.035"/></pattern>
    <pattern id="gridBg" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48,0 L0,0 0,48" fill="none" stroke="#000" stroke-width="1" opacity="0.06"/></pattern>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  ${pat ? `<rect width="800" height="800" fill="url(#${pat})"/>` : ""}
  <ellipse cx="400" cy="705" rx="${280 + (k % 3) * 15}" ry="38" fill="#000" opacity="0.13" filter="url(#blur)"/>
  <g transform="translate(400,410) rotate(${rot}) scale(1.25)">${draw[item.art](item.params, c, k)}</g>
</svg>`;
}

// File-safe name for an item, e.g. "Pork and Beans 230g" -> "pork-and-beans-230g"
export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Draw everything when run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  const OUT = process.env.GEN_OUT;
  if (!OUT) { console.log("Set GEN_OUT to the folder for the images."); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  let k = 0, n = 0;
  for (const [cat, bases] of Object.entries(CATALOG)) {
    for (const item of expandCatalog(bases)) {
      await sharp(Buffer.from(svg(item, k++))).jpeg({ quality: 86 }).toFile(`${OUT}/${slug(item.name)}.jpg`);
      n++;
    }
    console.log(cat, "done");
  }
  console.log(n, "images drawn");
}
