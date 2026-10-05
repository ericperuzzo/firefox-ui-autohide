"use strict";
/* global ExtensionAPI, Services, Ci */

// Injeta uma folha de estilo de usuário em todas as janelas do Firefox
// (equivalente ao userChrome.css, mas controlável em tempo de execução).
this.chromeCSS = class extends ExtensionAPI {
  getAPI() {
    const SHEET = Ci.nsIDOMWindowUtils.USER_SHEET;
    let currentURI = null;

    const windows = () => Array.from(Services.wm.getEnumerator("navigator:browser"));
    const load = (win, uri) => {
      try { win.windowUtils.loadSheetUsingURIString(uri, SHEET); } catch (e) { /* janela fechando */ }
    };
    const unload = (win, uri) => {
      try { win.windowUtils.removeSheetUsingURIString(uri, SHEET); } catch (e) { /* já removida */ }
    };

    const listener = {
      onOpenWindow(xulWin) {
        const win = xulWin.docShell.domWindow;
        win.addEventListener("load", () => {
          const type = win.document.documentElement.getAttribute("windowtype");
          if (type === "navigator:browser" && currentURI) load(win, currentURI);
        }, { once: true });
      },
      onCloseWindow() {},
    };
    Services.wm.addListener(listener);

    const clear = () => {
      if (currentURI) windows().forEach(w => unload(w, currentURI));
      currentURI = null;
    };
    this.cleanup = () => { clear(); Services.wm.removeListener(listener); };

    return {
      chromeCSS: {
        async setCSS(css) {
          clear();
          currentURI = "data:text/css;charset=utf-8," + encodeURIComponent(css);
          windows().forEach(w => load(w, currentURI));
        },
        async clear() { clear(); },
      },
    };
  }

  onShutdown() {
    if (this.cleanup) this.cleanup();
  }
};
