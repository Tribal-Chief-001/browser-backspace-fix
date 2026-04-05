# ⌫ browser-backspace-fix

> Restore the Backspace key as a Back button in Edge and Chrome — 
> replaces the removed `edge://flags` option in Edge 140+.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Size](https://img.shields.io/badge/size-20KB-brightgreen)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)

---

## Why does this exist?

Microsoft Edge removed the `Assigns the Backspace key to go back a page` 
flag in Edge 140. Existing store alternatives are bloated (1MB+) and 
likely contain trackers. This extension does one thing, in ~150 lines of 
hand-written JS, zero dependencies, zero tracking.

**20KB vs 1MB. You do the math.**

---

## Features

- ⌫ **Backspace** → Go Back
- ⏩ Safe in inputs — won't fire while typing in any text field
- 🧩 **Shadow DOM aware** — works inside web components (Notion, Linear etc.)
- 🖼️ **iframe safe** — navigates the top-level page, not the iframe
- ⌨️ **IME safe** — won't fire during Japanese/Chinese/Korean composition
- 🔁 **Hold-proof** — holding backspace only navigates once, not repeatedly
- 🌍 Works on **Edge, Chrome, Brave, Opera**
- 🔘 Toggle on/off from the toolbar popup

---

## Tested Edge Cases (27 scenarios)

| Scenario | Behaviour |
|---|---|
| Regular browsing | ✅ Navigates back |
| Typing in input/textarea | ✅ Types normally |
| Google Docs / Notion (contenteditable) | ✅ Types normally |
| Holding backspace | ✅ Only goes back once |
| IME composition (Japanese etc.) | ✅ Safe |
| Inside an iframe | ✅ Navigates top-level page |
| Shadow DOM inputs | ✅ Detected correctly |
| `document.designMode = 'on'` | ✅ Safe |
| `role="textbox"` ARIA widgets | ✅ Safe |
| `input[readonly]` | ✅ Navigates back |
| Date/time pickers | ✅ Types normally |

---

## Install (unpacked)

1. Download the zip from [Releases](../../releases)
2. Extract it
3. Go to `edge://extensions` or `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** → select the extracted folder
6. Done ✅

---

## How it works

A content script listens for `keydown` in capture phase. On plain Backspace 
(no modifiers, no repeat, no IME composition), it checks the focused element 
using a shadow-DOM-piercing lookup. If it's not an editable context, it calls 
`history.back()`. For cross-origin iframes, it routes through a background 
service worker using `chrome.tabs.goBack()` to always hit the top-level frame.

---

## Size comparison

| Extension | Size | Open Source | Trackers |
|---|---|---|---|
| **browser-backspace-fix** | **~20KB** | ✅ | ❌ |
| Bspace (Edge store) | ~1MB | ❌ | ❓ |

---

## License

MIT © [Tribal-Chief-001](https://github.com/Tribal-Chief-001)
