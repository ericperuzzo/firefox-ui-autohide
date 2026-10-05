"use strict";
const DEFAULTS = { enabled: false, tabs: true, nav: true, bookmarks: true, sidebar: false, fullscreenOnly: false, bgMode: "solid", bgColor: "", bgOpacity: 75, delay: 250, strip: 6 };
const boxes = [...document.querySelectorAll("input[type=checkbox], input[type=range], input[type=number], select")];

(async () => {
  const s = { ...DEFAULTS, ...(await browser.storage.local.get()) };
  for (const b of boxes) {
    const val = () => b.type === "checkbox" ? b.checked : b.type === "range" || b.type === "number" ? Number(b.value) : b.value;
    if (b.type === "checkbox") b.checked = s[b.id]; else b.value = s[b.id] || (b.type === "color" ? "#1c1b22" : "");
    b.addEventListener("change", () => browser.storage.local.set({ [b.id]: val() }));
  }
  const bg = await browser.runtime.getBackgroundPage();
  if (!bg.browser.chromeCSS) document.getElementById("warn").style.display = "block";
})();

// cor personalizada: o seletor de cor sempre devolve um valor, então há um botão para voltar ao tema
document.getElementById("bgColor").addEventListener("input", e => browser.storage.local.set({ bgColor: e.target.value }));
document.getElementById("themeColor").addEventListener("click", async () => {
  await browser.storage.local.set({ bgColor: "" });
  document.getElementById("bgColor").value = "#1c1b22";
});
