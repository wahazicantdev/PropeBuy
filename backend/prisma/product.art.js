// ── PRODUCT ART — drawn by code ───────────────────────────
// Draws every demo and evaluation product image with code (SVG turned into
// JPEG by sharp). Nothing is downloaded from the internet. Each image in a
// group gets its own background, pattern, product color, angle and small
// details, so no two products share an image.
// Only needed to make NEW images. The current ones are already on Cloudinary
// and listed in product.photos.json, which `npm run productPhotos` applies.
// Usage (in backend/):  GEN_OUT=<folder> node prisma/product.art.js
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const OUT = process.env.GEN_OUT;
mkdirSync(OUT, { recursive: true });

// ── palettes ─────────────────────────────────────────────
const BG = [
  ["#FDF6EC", "#F3E3C8"], ["#EEF4FA", "#D3E2F0"], ["#F1F7EE", "#D6E8CE"], ["#FBEFF2", "#F0D3DC"],
  ["#F5F3FF", "#DFD8F8"], ["#FFF8E1", "#F9E4A8"], ["#EAF6F6", "#C7E5E3"], ["#F7F7F7", "#E1E1E1"],
  ["#FFF1E6", "#F7D4BA"], ["#EDF2F4", "#D0DAE0"], ["#F4F1EA", "#DED6C3"], ["#EFF7FF", "#C9E0F8"],
];
const COLORS = ["#E4572E", "#2E86AB", "#F3A712", "#4C956C", "#8E5572", "#3D5A80",
  "#EE6C4D", "#2A9D8F", "#C1666B", "#6D597A", "#D4A373", "#264653", "#E76F51", "#5E60CE"];
const NATURAL = ["#C8A26B", "#B88B4A", "#D9B98A", "#A87A3D", "#CFAE7A", "#9C6B30", "#E0C49A", "#B5915C"];
const SOAP = ["#BFD8B8", "#F2E3A6", "#D9C2E9", "#F5C6C6", "#C9A27E", "#A8D5E2", "#E8D5B5", "#B8E0C5", "#F6D1A9", "#D6E6A7"];

// Mix a hex color toward white (amt > 0) or black (amt < 0)
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)),
  );
  return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join("");
};
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
const FONT = `font-family="Arial, Helvetica, sans-serif" font-weight="bold"`;
const T = (x, y, size, fill, text, extra = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" ${FONT} ${extra}>${text}</text>`;

// ── product drawings, local coordinates around (0,0), about 400px wide ──
const draw = {
  sardines(c, k) {
    const n = 1 + (k % 3);
    let s = "";
    for (let i = n - 1; i >= 0; i--) {
      const y = -i * 70 + (n - 1) * 30, dx = i * 18 * (k % 2 ? 1 : -1);
      const body = i === 0 ? "#C9CED6" : "#AEB4BE";
      s += `<g transform="translate(${dx},${y})">
        <rect x="-170" y="-70" width="340" height="160" rx="48" fill="${shade(body, -0.25)}"/>
        <rect x="-170" y="-80" width="340" height="150" rx="48" fill="${body}"/>
        <rect x="-150" y="-62" width="300" height="114" rx="36" fill="${i === 0 ? c : shade(c, -0.25)}"/>
        <ellipse cx="-30" cy="-5" rx="70" ry="26" fill="#fff" opacity="0.92"/>
        <path d="M30,-5 L80,-32 L80,22 Z" fill="#fff" opacity="0.92"/>
        <circle cx="-75" cy="-10" r="5" fill="${c}"/>
        ${T(0, 44, 24, "#fff", "SARDINES")}
        <circle cx="128" cy="-58" r="16" fill="none" stroke="#8C939E" stroke-width="6"/></g>`;
    }
    return s;
  },
  rice(c, k) {
    return `<path d="M-150,-120 Q-175,60 -160,190 L160,190 Q175,60 150,-120 Q140,-160 100,-170 L-100,-170 Q-140,-160 -150,-120Z" fill="#EFE6D2" stroke="#D8CBAE" stroke-width="4"/>
      <path d="M-150,-120 Q-175,60 -160,190 L160,190 Q175,60 150,-120 Q140,-160 100,-170 L-100,-170 Q-140,-160 -150,-120Z" fill="url(#weave)"/>
      <path d="M-70,-170 Q-90,-230 -40,-215 Q0,-250 40,-215 Q90,-230 70,-170Z" fill="#E6DAC0" stroke="#D8CBAE" stroke-width="4"/>
      <rect x="-80" y="-182" width="160" height="16" rx="8" fill="${shade(c, -0.2)}"/>
      <rect x="-115" y="-50" width="230" height="160" rx="18" fill="${c}"/>
      ${T(0, 15, 50, "#fff", "RICE")}${T(0, 62, 32, "#fff", "5 KG")}
      ${[-60, -30, 0, 30, 60].map((x, i) => `<ellipse cx="${x}" cy="88" rx="7" ry="12" fill="#fff" opacity="0.85" transform="rotate(${(i - 2) * 15} ${x} 88)"/>`).join("")}
      ${k % 2 ? `<path d="M-115,130 L115,130" stroke="${shade(c, -0.2)}" stroke-width="10"/>` : ""}`;
  },
  coffee(c, k) {
    const n = 5 + (k % 3);
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 9;
      s += `<g transform="rotate(${a} 0 170)"><rect x="-24" y="-190" width="48" height="300" rx="6" fill="${i % 2 ? c : shade(c, -0.15)}"/>
        <rect x="-24" y="-190" width="48" height="22" fill="${shade(c, -0.35)}"/>
        <circle cx="0" cy="-60" r="15" fill="#fff"/><circle cx="0" cy="-60" r="9" fill="#6B3E26"/></g>`;
    }
    const mx = k % 2 ? 120 : -120;
    return s + `<g transform="translate(${mx},120)"><path d="M-60,-40 L60,-40 L50,70 Q48,85 30,85 L-30,85 Q-48,85 -50,70Z" fill="#fff" stroke="#DDD" stroke-width="3"/>
      <path d="M58,-15 Q100,-10 92,30 Q85,55 52,50" fill="none" stroke="#fff" stroke-width="14"/>
      <ellipse cx="0" cy="-40" rx="60" ry="14" fill="#6B3E26"/>
      <path d="M-20,-60 Q-35,-85 -15,-105 M10,-60 Q-5,-90 18,-112" stroke="#fff" stroke-width="6" fill="none" opacity="0.8" stroke-linecap="round"/></g>`;
  },
  shirt(c, k) {
    const body = "M-70,-170 Q0,-130 70,-170 L190,-110 L150,-30 L110,-50 L110,180 L-110,180 L-110,-50 L-150,-30 L-190,-110 Z";
    const stripes = k % 4 === 1 ? `<path d="${body}" fill="url(#stripes)" opacity="0.5"/>` : "";
    const pocket = k % 3 === 2 ? `<rect x="35" y="-60" width="50" height="55" rx="6" fill="none" stroke="${shade(c, -0.25)}" stroke-width="4"/>` : "";
    return `<path d="${body}" fill="${c}"/>${stripes}${pocket}
      <path d="M-70,-170 Q0,-112 70,-170" fill="none" stroke="${shade(c, -0.3)}" stroke-width="12"/>
      <path d="M-110,-50 L-150,-30 M110,-50 L150,-30" stroke="${shade(c, -0.2)}" stroke-width="4"/>
      <path d="M-60,40 Q-20,60 -40,120 M50,10 Q70,80 40,150" stroke="${shade(c, -0.2)}" stroke-width="3" fill="none" opacity="0.5"/>`;
  },
  shorts(c, k) {
    const side = k % 2 ? `<path d="M-160,-110 L-175,150 M160,-110 L175,150" stroke="#fff" stroke-width="10" opacity="0.8"/>` : "";
    return `<path d="M-150,-120 L150,-120 L178,150 L25,172 L0,30 L-25,172 L-178,150 Z" fill="${c}"/>${side}
      <rect x="-155" y="-160" width="310" height="46" rx="12" fill="${shade(c, -0.25)}"/>
      <path d="M-15,-114 Q-30,-60 -50,-40 M15,-114 Q30,-60 50,-40" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="-50" cy="-38" r="7" fill="#fff"/><circle cx="50" cy="-38" r="7" fill="#fff"/>
      <path d="M0,-114 L0,30" stroke="${shade(c, -0.2)}" stroke-width="3"/>`;
  },
  polo(c, k) {
    const white = k % 4 === 3 ? "#EEF1F5" : "#FAFAF7";
    const body = "M-70,-170 L70,-170 L190,-110 L150,-30 L110,-50 L110,180 L-110,180 L-110,-50 L-150,-30 L-190,-110 Z";
    return `<path d="${body}" fill="${white}" stroke="#D9DCE1" stroke-width="4"/>
      <path d="M-70,-170 L0,-120 L-50,-100 Z M70,-170 L0,-120 L50,-100 Z" fill="${white}" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>
      <rect x="-14" y="-120" width="28" height="110" rx="4" fill="${white}" stroke="#D9DCE1" stroke-width="3"/>
      <circle cx="0" cy="-90" r="6" fill="${c}"/><circle cx="0" cy="-55" r="6" fill="${c}"/>${k % 2 ? `<circle cx="0" cy="-20" r="6" fill="${c}"/>` : ""}
      <path d="M150,-30 L190,-110 M-150,-30 L-190,-110" stroke="${c}" stroke-width="10"/>
      <circle cx="65" cy="-60" r="14" fill="${c}" opacity="0.85"/>`;
  },
  fan(c, k) {
    const spin = k * 23;
    const lines = Array.from({ length: 18 }, (_, i) => {
      const a = (i * 20 * Math.PI) / 180;
      return `<line x1="0" y1="-60" x2="${(Math.cos(a) * 150).toFixed(1)}" y2="${(-60 + Math.sin(a) * 150).toFixed(1)}" stroke="#9AA3AF" stroke-width="3"/>`;
    }).join("");
    return `<ellipse cx="0" cy="190" rx="120" ry="28" fill="${shade(c, -0.25)}"/><ellipse cx="0" cy="180" rx="120" ry="28" fill="${c}"/>
      <rect x="-14" y="40" width="28" height="145" fill="${shade(c, -0.15)}"/>
      <g transform="rotate(${spin} 0 -60)">${[0, 120, 240].map((a) => `<ellipse cx="0" cy="-130" rx="42" ry="72" fill="${shade(c, 0.35)}" opacity="0.95" transform="rotate(${a} 0 -60)"/>`).join("")}</g>
      ${lines}<circle cx="0" cy="-60" r="152" fill="none" stroke="#8B95A1" stroke-width="8"/>
      <circle cx="0" cy="-60" r="32" fill="${shade(c, -0.3)}"/><circle cx="0" cy="-60" r="12" fill="#fff" opacity="0.6"/>`;
  },
  cable(c, k) {
    const w = (k % 5) * 25;
    const plug = (x, y, a, tip) => `<g transform="translate(${x},${y}) rotate(${a})"><rect x="-22" y="-40" width="44" height="80" rx="10" fill="${shade(c, -0.3)}"/>
      <rect x="${tip ? -10 : -16}" y="-72" width="${tip ? 20 : 32}" height="34" rx="${tip ? 8 : 3}" fill="#C0C6CE"/></g>`;
    return `<path d="M-160,140 C${-60 - w},-240 ${60 + w},240 160,-120" fill="none" stroke="${c}" stroke-width="18" stroke-linecap="round"/>
      <path d="M-160,140 C${-60 - w},-240 ${60 + w},240 160,-120" fill="none" stroke="#fff" stroke-width="4" opacity="0.25" stroke-linecap="round"/>
      ${plug(-160, 175, 180, false)}${plug(175, -150, 20, true)}`;
  },
  bulb(c, k) {
    const glow = shade(pick(["#FFD54F", "#FFF59D", "#FFE0B2", "#FFFDE7"], k), 0);
    return `<circle cx="0" cy="-50" r="${185 + (k % 3) * 10}" fill="url(#glow)"/>
      <circle cx="0" cy="-60" r="120" fill="#FFFFFF" stroke="#E2E5EA" stroke-width="4"/>
      <path d="M-62,40 Q-55,80 -50,110 L50,110 Q55,80 62,40 Z" fill="#FFFFFF" stroke="#E2E5EA" stroke-width="4"/>
      <rect x="-30" y="-80" width="60" height="40" rx="8" fill="${glow}" stroke="${shade(glow, -0.2)}" stroke-width="3"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="-52" y="${110 + i * 18}" width="104" height="14" rx="5" fill="${i % 2 ? "#A9B0BA" : "#C7CDD5"}"/>`).join("")}
      <path d="M-30,182 L30,182 L12,205 L-12,205Z" fill="#3B3F46"/>
      <rect x="-40" y="122" width="80" height="6" fill="${c}" opacity="0.8"/>
      <path d="M-70,-120 Q-90,-80 -80,-40" stroke="#fff" stroke-width="12" fill="none" opacity="0.8" stroke-linecap="round"/>`;
  },
  basket(c, k) {
    const nat = pick(NATURAL, k);
    const band = k % 3 === 0 ? `<rect x="-158" y="40" width="316" height="26" fill="${c}" opacity="0.9"/>` : "";
    const handles = k % 2
      ? `<path d="M-180,-70 Q-230,-60 -190,-20" stroke="${shade(nat, -0.3)}" stroke-width="14" fill="none"/><path d="M180,-70 Q230,-60 190,-20" stroke="${shade(nat, -0.3)}" stroke-width="14" fill="none"/>`
      : `<path d="M-120,-70 Q0,-250 120,-70" stroke="${shade(nat, -0.3)}" stroke-width="16" fill="none"/>`;
    return `${handles}<path d="M-175,-60 L175,-60 L135,175 L-135,175 Z" fill="${nat}"/>
      <path d="M-175,-60 L175,-60 L135,175 L-135,175 Z" fill="url(#check)" opacity="0.55"/>${band}
      <rect x="-188" y="-84" width="376" height="36" rx="16" fill="${shade(nat, -0.25)}"/>
      <rect x="-188" y="-84" width="376" height="36" rx="16" fill="url(#stripes)" opacity="0.25"/>`;
  },
  hanger(c, k) {
    const n = 3 + (k % 3);
    let s = "";
    for (let i = n - 1; i >= 0; i--) {
      const col = pick(COLORS, k * 3 + i);
      s += `<g transform="translate(${(i - (n - 1) / 2) * 26},${i * 14})">
        <path d="M0,-130 C0,-150 0,-150 0,-150 C0,-185 32,-195 34,-168" fill="none" stroke="#B9C0C9" stroke-width="9" stroke-linecap="round"/>
        <path d="M0,-130 L-175,25 Q-185,40 -165,40 L165,40 Q185,40 175,25 Z" fill="none" stroke="${col}" stroke-width="16" stroke-linejoin="round"/></g>`;
    }
    return s;
  },
  bin(c, k) {
    return `<path d="M-170,-90 L170,-90 L148,170 L-148,170 Z" fill="${shade(c, 0.45)}" opacity="0.85" stroke="${shade(c, -0.1)}" stroke-width="5"/>
      ${[-100, -50, 0, 50, 100].map((x) => `<path d="M${x},-80 L${x * 0.88},160" stroke="${shade(c, 0.2)}" stroke-width="5" opacity="0.6"/>`).join("")}
      ${k % 2 ? `<rect x="-120" y="-40" width="110" height="150" rx="10" fill="${pick(COLORS, k + 5)}" opacity="0.35"/>` : `<circle cx="60" cy="60" r="60" fill="${pick(COLORS, k + 4)}" opacity="0.3"/>`}
      <rect x="-188" y="-130" width="376" height="46" rx="12" fill="${c}"/>
      <rect x="-150" y="-118" width="60" height="16" rx="8" fill="${shade(c, -0.35)}"/><rect x="90" y="-118" width="60" height="16" rx="8" fill="${shade(c, -0.35)}"/>`;
  },
  soap(c, k) {
    const sc = pick(SOAP, k);
    const leaf = (x, y, a, s) => `<path d="M0,0 Q40,-40 0,-110 Q-40,-40 0,0Z" fill="#5E9C5B" transform="translate(${x},${y}) rotate(${a}) scale(${s})"/><path d="M0,0 L0,-100" stroke="#3F7A3D" stroke-width="3" transform="translate(${x},${y}) rotate(${a}) scale(${s})"/>`;
    const second = k % 3 === 1 ? `<rect x="-120" y="-150" width="280" height="150" rx="45" fill="${shade(pick(SOAP, k + 3), -0.08)}"/>` : "";
    return `${second}<rect x="-155" y="-70" width="310" height="175" rx="48" fill="${shade(sc, -0.18)}"/>
      <rect x="-155" y="-80" width="310" height="160" rx="48" fill="${sc}"/>
      <path d="M0,40 Q50,-10 0,-60 Q-50,-10 0,40Z" fill="${shade(sc, -0.15)}"/><path d="M0,35 L0,-50" stroke="${shade(sc, -0.25)}" stroke-width="4"/>
      ${leaf(k % 2 ? 175 : -175, 120, k % 2 ? 25 : -25, 0.9)}${leaf(k % 2 ? 140 : -140, 140, k % 2 ? 60 : -60, 0.7)}`;
  },
  toothpaste(c, k) {
    return `<path d="M-210,-58 L-185,-58 Q100,-78 140,-52 L140,52 Q100,78 -185,58 L-210,58 Z" fill="#FFFFFF" stroke="#E0E3E8" stroke-width="4"/>
      <rect x="-222" y="-62" width="40" height="124" rx="4" fill="#F1F3F6" stroke="#E0E3E8" stroke-width="3"/>
      ${[-40, -20, 0, 20, 40].map((y) => `<line x1="-218" y1="${y}" x2="-186" y2="${y}" stroke="#D3D7DD" stroke-width="3"/>`).join("")}
      <path d="M-120,-62 Q0,-70 100,-56 L100,56 Q0,70 -120,62 Z" fill="${c}"/>
      <path d="M-120,${k % 2 ? -10 : 10} Q0,${k % 2 ? 10 : -10} 100,0" stroke="#fff" stroke-width="10" fill="none"/>
      ${T(-10, -18, 30, "#fff", "FRESH")}
      <rect x="140" y="-38" width="70" height="76" rx="12" fill="${shade(c, -0.25)}"/>
      ${[0, 1, 2, 3].map((i) => `<line x1="${152 + i * 15}" y1="-34" x2="${152 + i * 15}" y2="34" stroke="${shade(c, -0.45)}" stroke-width="3"/>`).join("")}`;
  },
  alcohol(c, k) {
    const liq = shade(c, 0.55);
    return `<rect x="-36" y="-150" width="72" height="70" fill="${shade(liq, 0.3)}" stroke="${shade(c, 0.2)}" stroke-width="3"/>
      <rect x="-48" y="-205" width="96" height="62" rx="12" fill="${shade(c, -0.25)}"/>
      ${k % 2 ? `<rect x="-58" y="-180" width="116" height="16" rx="6" fill="${shade(c, -0.4)}"/>` : ""}
      <path d="M-36,-82 Q-110,-70 -110,-10 L-110,170 Q-110,195 -85,195 L85,195 Q110,195 110,170 L110,-10 Q110,-70 36,-82 Z" fill="${liq}" stroke="${shade(c, 0.1)}" stroke-width="4"/>
      <rect x="-92" y="-10" width="184" height="150" rx="14" fill="#fff"/>
      <rect x="-14" y="10" width="28" height="70" fill="${c}"/><rect x="-35" y="31" width="70" height="28" fill="${c}"/>
      ${T(0, 115, 36, c, "70%")}
      <path d="M-85,-30 L-85,160" stroke="#fff" stroke-width="10" opacity="0.6" stroke-linecap="round"/>`;
  },
  microfiber(c, k) {
    const cols = [c, pick(COLORS, k + 3), pick(COLORS, k + 7)];
    let s = "";
    [2, 1, 0].forEach((i) => {
      const y = 100 - i * 0 - (2 - i) * 78, x = (i - 1) * 14 * (k % 2 ? 1 : -1);
      s += `<g transform="translate(${x},${y})"><rect x="-170" y="-40" width="340" height="80" rx="24" fill="${cols[i]}"/>
        <rect x="-170" y="-40" width="340" height="80" rx="24" fill="url(#dots)" opacity="0.35"/>
        <path d="M-170,-16 Q-200,0 -170,16" fill="none" stroke="${shade(cols[i], -0.3)}" stroke-width="6"/>
        <rect x="-170" y="22" width="340" height="18" rx="9" fill="${shade(cols[i], -0.2)}"/></g>`;
    });
    return s;
  },
  toolset(c, k) {
    const wrench = (x, len, a) => `<g transform="translate(${x},0) rotate(${a})"><rect x="-9" y="${-len / 2}" width="18" height="${len}" rx="7" fill="#C3C9D1"/>
      <circle cx="0" cy="${-len / 2}" r="24" fill="#C3C9D1"/><rect x="-9" y="${-len / 2 - 28}" width="18" height="26" fill="${shade(c, -0.45)}"/>
      <circle cx="0" cy="${len / 2}" r="19" fill="#C3C9D1"/><circle cx="0" cy="${len / 2}" r="9" fill="${shade(c, -0.45)}"/></g>`;
    const n = 4 + (k % 3);
    let w = "";
    for (let i = 0; i < n; i++) w += wrench(-140 + (i * 280) / (n - 1), 170 + i * 12, k % 2 ? 0 : 6);
    return `<rect x="-205" y="-155" width="410" height="310" rx="24" fill="${c}"/>
      <rect x="-185" y="-135" width="370" height="270" rx="14" fill="${shade(c, -0.45)}"/>${w}
      <rect x="-60" y="-178" width="120" height="30" rx="12" fill="${shade(c, -0.3)}"/>`;
  },
  gauge(c, k) {
    const ang = -120 + (k * 37) % 200;
    const ticks = Array.from({ length: 21 }, (_, i) => {
      const a = ((-210 + i * 12) * Math.PI) / 180, r1 = i % 5 ? 108 : 98;
      return `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1 - 40).toFixed(1)}" x2="${(Math.cos(a) * 120).toFixed(1)}" y2="${(Math.sin(a) * 120 - 40).toFixed(1)}" stroke="#333" stroke-width="${i % 5 ? 3 : 6}"/>`;
    }).join("");
    return `<path d="M60,90 C120,170 200,150 210,220" stroke="#2B2D31" stroke-width="26" fill="none" stroke-linecap="round"/>
      <circle cx="0" cy="-40" r="150" fill="${c}"/><circle cx="0" cy="-40" r="128" fill="#fff"/>${ticks}
      <line x1="0" y1="-40" x2="0" y2="-140" stroke="#E53935" stroke-width="7" stroke-linecap="round" transform="rotate(${ang} 0 -40)"/>
      <circle cx="0" cy="-40" r="14" fill="#333"/>${T(0, 40, 22, "#555", "PSI")}
      <rect x="-24" y="105" width="48" height="60" rx="8" fill="#C3C9D1"/>`;
  },
  keychain(c, k) {
    const tint = shade(c, 0.7);
    const ridges = Array.from({ length: 9 }, (_, i) => {
      const a = ((200 + i * 17.5) * Math.PI) / 180;
      return `<line x1="0" y1="-50" x2="${(Math.cos(a) * -150).toFixed(1)}" y2="${(-50 - Math.sin(a) * 150).toFixed(1)}" stroke="${shade(c, 0.2)}" stroke-width="3" opacity="0.6"/>`;
    }).join("");
    return `<circle cx="0" cy="-185" r="42" fill="none" stroke="#B9C0C9" stroke-width="10"/>
      <ellipse cx="0" cy="-128" rx="10" ry="18" fill="none" stroke="#B9C0C9" stroke-width="7"/>
      <ellipse cx="0" cy="-96" rx="10" ry="18" fill="none" stroke="#B9C0C9" stroke-width="7"/>
      <path d="M0,-75 L-130,40 Q0,190 130,40 Z" fill="${tint}" stroke="${shade(c, 0.3)}" stroke-width="5" stroke-linejoin="round"/>${ridges}
      <path d="M0,-75 L-130,40 Q0,190 130,40 Z" fill="url(#pearl)" opacity="0.6"/>
      ${k % 2 ? `<circle cx="0" cy="70" r="16" fill="${c}"/>` : `<path d="M-30,80 Q0,100 30,80" stroke="${c}" stroke-width="6" fill="none"/>`}`;
  },
  magnet(c, k) {
    const one = (x, y, a, i) => {
      const sky = shade(pick(COLORS, k + i), 0.55);
      return `<g transform="translate(${x},${y}) rotate(${a})"><rect x="-95" y="-75" width="190" height="150" rx="12" fill="#fff"/>
        <rect x="-82" y="-62" width="164" height="100" rx="6" fill="${sky}"/>
        <circle cx="${40 - i * 20}" cy="-30" r="16" fill="#FFD54F"/>
        <path d="M-82,38 L-30,-20 L10,20 L40,-5 L82,38 Z" fill="#4C956C"/>
        ${T(0, 63, 16, shade(c, -0.3), "MUNTINLUPA")}</g>`;
    };
    return one(-95, -70, -10 + (k % 4) * 3, 0) + one(100, -40, 8, 1) + one(0, 100, k % 2 ? -4 : 5, 2);
  },
  wallet(c, k) {
    const nat = pick(NATURAL, k + 2);
    return `<rect x="-185" y="-110" width="370" height="230" rx="26" fill="${nat}"/>
      <rect x="-185" y="-110" width="370" height="230" rx="26" fill="url(#diag)" opacity="0.9"/>
      <rect x="-170" y="-95" width="340" height="200" rx="18" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 8" opacity="0.8"/>
      <path d="M-185,-60 Q-185,-110 -135,-110 L135,-110 Q185,-110 185,-60 L185,-10 L0,${k % 2 ? 30 : 10} L-185,-10 Z" fill="${shade(nat, -0.25)}"/>
      <circle cx="0" cy="${k % 2 ? 22 : 4}" r="20" fill="${c}" stroke="#fff" stroke-width="5"/>`;
  },
  peanut(c, k) {
    const pb = pick(["#B97A3C", "#A86B30", "#C4874A", "#B07436"], k);
    return `<rect x="-118" y="-200" width="236" height="66" rx="16" fill="${c}"/>
      ${[-80, -40, 0, 40, 80].map((x) => `<line x1="${x}" y1="-196" x2="${x}" y2="-138" stroke="${shade(c, -0.25)}" stroke-width="4"/>`).join("")}
      <rect x="-135" y="-140" width="270" height="330" rx="52" fill="${pb}"/>
      <rect x="-135" y="-40" width="270" height="150" fill="#FFF6E5"/>
      <g transform="translate(0,15) rotate(${k % 2 ? -20 : 20})"><ellipse cx="-22" cy="0" rx="30" ry="24" fill="#D9A55B"/><ellipse cx="22" cy="0" rx="30" ry="24" fill="#D9A55B"/>
        <ellipse cx="0" cy="0" rx="22" ry="16" fill="#D9A55B"/></g>
      ${T(0, 85, 26, c, "PEANUT BUTTER")}
      <path d="M-105,-110 L-105,160" stroke="#fff" stroke-width="14" opacity="0.25" stroke-linecap="round"/>`;
  },
};

// ── one full image ───────────────────────────────────────
const PATTERNS = ["", "dotsBg", "linesBg", "gridBg"];
function svg(group, k) {
  const [b1, b2] = pick(BG, k * 5 + group.length);
  const c = pick(COLORS, k * 5 + group.length * 3);
  const pat = PATTERNS[Math.floor(k / 2) % 4];
  const rot = ((k * 37) % 17) - 8;
  const BOOST = { sardines: 1.3, cable: 1.2, toothpaste: 1.15, keychain: 1.1, coffee: 1.05 };
  const scale = (1.22 + ((k * 13) % 9) / 100) * (BOOST[group] || 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#FFF3B0" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient>
    <linearGradient id="pearl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#fff" stop-opacity="0.7"/></linearGradient>
    <pattern id="weave" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0,8 L16,8 M8,0 L8,16" stroke="#C9B994" stroke-width="1.5" opacity="0.5"/></pattern>
    <pattern id="stripes" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="12" fill="#fff"/></pattern>
    <pattern id="check" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#000" opacity="0.18"/><rect x="14" y="14" width="14" height="14" fill="#000" opacity="0.18"/></pattern>
    <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2" fill="#fff"/></pattern>
    <pattern id="diag" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="24" fill="${c}" opacity="0.55"/></pattern>
    <pattern id="dotsBg" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="3" fill="#000" opacity="0.06"/></pattern>
    <pattern id="linesBg" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(${k % 2 ? 30 : -30})"><rect width="36" height="8" fill="#000" opacity="0.035"/></pattern>
    <pattern id="gridBg" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48,0 L0,0 0,48" fill="none" stroke="#000" stroke-width="1" opacity="0.06"/></pattern>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  ${pat ? `<rect width="800" height="800" fill="url(#${pat})"/>` : ""}
  <ellipse cx="400" cy="705" rx="${280 + (k % 3) * 15}" ry="38" fill="#000" opacity="0.13" filter="url(#blur)"/>
  <g transform="translate(400,420) rotate(${rot}) scale(${scale})">${draw[group](c, k)}</g>
</svg>`;
}

// ── how many of each (bigger of dev/prod counts, plus spares) ──
const COUNTS = {
  sardines: 10, rice: 10, coffee: 10, shirt: 38, shorts: 10, polo: 10, fan: 10, cable: 38,
  bulb: 10, basket: 38, hanger: 10, bin: 10, soap: 38, toothpaste: 10, alcohol: 10,
  microfiber: 38, toolset: 10, gauge: 10, keychain: 10, magnet: 10, wallet: 10, peanut: 38,
};
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
for (const [group, count] of Object.entries(COUNTS)) {
  if (ONLY && !ONLY.includes(group)) continue;
  const files = [];
  for (let k = 0; k < count; k++) {
    const file = `${OUT}/${group}_${String(k).padStart(2, "0")}.jpg`;
    await sharp(Buffer.from(svg(group, k))).jpeg({ quality: 86 }).toFile(file);
    files.push(file);
  }
  // Contact sheet: 8 per row at 200px, to check by eye
  const cols = 8, cell = 200, rows = Math.ceil(files.length / cols);
  const tiles = await Promise.all(files.map((f) => sharp(f).resize(cell - 6, cell - 6).toBuffer()));
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: "#ffffff" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * cell + 3, top: Math.floor(i / cols) * cell + 3 })))
    .jpeg({ quality: 80 })
    .toFile(`${OUT}/_sheet_${group}.jpg`);
  console.log(group, count);
}
