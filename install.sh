#!/usr/bin/env bash
# UI Auto-hide installer for Firefox on Linux (native, Flatpak and Snap).
# Usage: ./install.sh [--uninstall] [PROFILE_DIR]
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/css/userChrome.css"
PREF='user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);'
MODE=install
if [ "${1:-}" = "--uninstall" ]; then MODE=uninstall; shift; fi

profiles() {
  for root in "$HOME/.mozilla/firefox" \
              "$HOME/.var/app/org.mozilla.firefox/.mozilla/firefox" \
              "$HOME/.var/app/org.mozilla.firefox/config/mozilla/firefox" \
              "$HOME/snap/firefox/common/.mozilla/firefox"; do
    if [ -d "$root" ]; then
      find "$root" -maxdepth 1 -type d \( -name '*.default-release' -o -name '*.default' \)
    fi
  done
}

if [ -n "${1:-}" ]; then PROFILES="$1"; else PROFILES="$(profiles)"; fi
[ -n "$PROFILES" ] || { echo "No Firefox profile found. Pass the profile folder (about:support > Profile Folder)." >&2; exit 1; }

while IFS= read -r p; do
  [ -d "$p" ] || { echo "Not a directory: $p" >&2; exit 1; }
  if [ "$MODE" = install ]; then
    mkdir -p "$p/chrome"
    if [ -f "$p/chrome/userChrome.css" ] && ! cmp -s "$SRC" "$p/chrome/userChrome.css"; then
      cp "$p/chrome/userChrome.css" "$p/chrome/userChrome.css.bak.$(date +%s)"
      echo "Backed up existing userChrome.css"
    fi
    cp "$SRC" "$p/chrome/userChrome.css"
    grep -qF "$PREF" "$p/user.js" 2>/dev/null || echo "$PREF" >> "$p/user.js"
    echo "Installed in: $p"
  else
    rm -f "$p/chrome/userChrome.css"
    echo "Removed userChrome.css from: $p"
  fi
done <<< "$PROFILES"
echo "Restart Firefox to apply."
