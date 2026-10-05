"use strict";

const DEFAULTS = {
  enabled: false,
  tabs: true,
  nav: true,
  bookmarks: true,
  sidebar: false,
  fullscreenOnly: false,
  bgMode: "solid", // solid | blur
  bgColor: "",     // vazio = cor da barra do tema
  bgOpacity: 75,    // % (só no modo blur)
  delay: 250,       // ms antes de esconder
  strip: 6,         // px da faixa que detecta o mouse
};

const TOP = { tabs: "#TabsToolbar", nav: "#nav-bar", bookmarks: "#PersonalToolbar" };
const REVEAL = ":hover, :focus-within, :has([open])";
const idle = "#navigator-toolbox:not(:hover):not(:focus-within):not(:has([open]))";

function buildCSS(s) {
  const root = s.fullscreenOnly ? ":root[inFullscreen]" : ":root";
  const keys = Object.keys(TOP).filter(k => s[k]);
  const css = [];

  if (keys.length === 3) {
    // Tudo escondido: a barra encolhe para uma faixa (altura real, hover confiável)
    // e cresce por cima da página, sem empurrar o conteúdo.
    const base = s.bgColor || "var(--toolbar-bgcolor, #1c1b22)";
    const bg = s.bgMode === "blur"
      ? `background-color: color-mix(in srgb, ${base} ${s.bgOpacity}%, transparent) !important;
  backdrop-filter: blur(18px) saturate(140%) !important;`
      : `background-color: ${base} !important;`;
    css.push(`
${root} #navigator-toolbox {
  position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important;
  z-index: 1000 !important; max-height: 300px !important; transition: max-height .15s ease !important;
}
${root} ${idle} {
  max-height: ${s.strip}px !important; overflow: hidden !important;
  -moz-window-dragging: no-drag !important; transition-delay: ${s.delay}ms !important;
}
${root} ${idle} > * { opacity: 0 !important; }
${root} #navigator-toolbox:is(${REVEAL}) {
  ${bg}
  box-shadow: 0 4px 14px rgba(0, 0, 0, .35) !important;
}`);
  } else if (keys.length) {
    // Parcial: as barras escolhidas colapsam e expandem ao passar o mouse na barra de cima.
    css.push(`${root} #navigator-toolbox { min-height: 3px; }`);
    for (const k of keys) {
      css.push(`
${root} ${TOP[k]} { max-height: 80px; transition: max-height .15s ease, opacity .15s ease; }
${root} ${idle} ${TOP[k]} {
  max-height: 0 !important; min-height: 0 !important; overflow: hidden !important;
  opacity: 0; pointer-events: none; border: 0 !important;
}`);
    }
  }

  if (s.sidebar) {
    // Firefox 157: coluna de abas/launcher = #sidebar-container; painel = #sidebar-box
    css.push(`
${root} #browser { position: relative; }
${root} #sidebar-launcher-splitter, ${root} #sidebar-splitter { display: none !important; }
${root} #sidebar-container, ${root} #sidebar-box {
  position: absolute !important; top: 0; bottom: 0; z-index: 900;
  transform: translateX(calc(-100% + 4px)); transition: transform .15s ease .25s;
}
${root} #sidebar-container { left: 0; }
${root} #sidebar-box { left: var(--uc-sidebar-main-width, 52px); }
${root} #sidebar-container:is(:hover, :focus-within, :has([open])),
${root} #sidebar-box:is(:hover, :focus-within),
${root} #sidebar-container:hover ~ #sidebar-box { transform: none; transition-delay: 0s; }`);
  }
  return css.join("\n");
}

async function settings() {
  return { ...DEFAULTS, ...(await browser.storage.local.get()) };
}

async function apply() {
  const s = await settings();
  browser.browserAction.setBadgeText({ text: s.enabled ? "" : "off" });
  if (!browser.chromeCSS) return; // sem Experiment API: só o fallback de tela cheia
  if (s.enabled) await browser.chromeCSS.setCSS(buildCSS(s));
  else await browser.chromeCSS.clear();
}

async function toggle() {
  const s = await settings();
  if (!browser.chromeCSS) {
    // Fallback: F11 esconde/mostra a UI ao encostar o mouse no topo.
    const win = await browser.windows.getCurrent();
    await browser.windows.update(win.id, { state: win.state === "fullscreen" ? "normal" : "fullscreen" });
    return;
  }
  await browser.storage.local.set({ enabled: !s.enabled });
}

browser.browserAction.onClicked.addListener(toggle);
browser.commands.onCommand.addListener(c => c === "toggle-autohide" && toggle());
browser.storage.onChanged.addListener(apply);
apply();
