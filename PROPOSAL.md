# Proposal: built-in "Auto-hide toolbars" option for Firefox

## Problem
Firefox only auto-hides its toolbars in full-screen mode, which also hides the OS taskbar/panel and window controls. Users who want the *maximum page area* in a normal window have no supported way to do it. Extensions cannot touch browser chrome, and the `userChrome.css` workaround needs an `about:config` pref and breaks across releases.

## Prior art
Vivaldi's **UI Auto-hide** (Settings → Appearance) hides the whole interface or any selection of toolbars (tab bar, panel, address bar, status bar, bookmarks bar) until the pointer reaches a window edge, with an option to apply it only in full screen.

## Why now
Vertical tabs (Firefox 136+) move tabs to the side, leaving a single top toolbar. Hiding it frees a full row of vertical space on every page, which matters most on laptops and ultrawide-short displays.

## Proposed behavior
- Settings → Browser Layout: "Auto-hide toolbars" with per-toolbar checkboxes (nav bar, tab strip when horizontal, bookmarks bar).
- Reveal when the pointer touches the top edge; overlay the page (no layout shift); keep open while the URL bar is focused or a menu/panel is open.
- Optional: only in full screen (current behavior, but without hiding the taskbar).

## Working prototype
This repository implements it in ~20 lines of CSS (`css/userChrome.css`): the toolbox shrinks to a few-pixel strip, grows on `:hover` / `:focus-within` / `:has([open])`, overlays content with `position: fixed` and a solid background. Key gotchas found while building it: Firefox's own `z-index` rules for the toolbox (0) and tabbox (2) beat unprivileged user styles unless `!important`; a `transform`-hidden toolbox does not receive hover reliably, a real few-pixel-high box does.

## Where to propose
- Mozilla Connect (ideas): https://connect.mozilla.org/
- Bugzilla enhancement bug, product *Firefox*, component *Toolbars and Customization*.
