/**
 * Backspace = Back Button  v2.0
 * Bug-fixed content script.
 *
 * Fixes vs v1.0:
 *  [C1] e.repeat guard       — holding backspace no longer fires history.back() repeatedly
 *  [C2] e.isComposing guard  — IME input (Japanese, Chinese, Korean, etc.) is safe
 *  [C3] iframe routing       — backspace in any iframe navigates the TOP-LEVEL page,
 *                              not the iframe's own history (via background.js)
 *  [C4] Shadow DOM piercing  — walks shadowRoot chain to find the real focused element
 *  [C5] designMode guard     — document.designMode = 'on' is treated as a typing context
 *  [M1] ARIA roles           — role="textbox|combobox|searchbox|spinbutton" treated as typing
 *  [M2] readonly inputs      — input[readonly] allows navigation (user can't type in it)
 */

(function () {
  "use strict";

  // ─── State ────────────────────────────────────────────────────────────────

  let enabled = true;

  chrome.storage.local.get("enabled", (result) => {
    if (result.enabled === false) enabled = false;
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SET_ENABLED") enabled = msg.value;
  });

  // ─── Shadow DOM piercing ──────────────────────────────────────────────────

  /**
   * Walk the shadow-root chain to find the deepest truly-focused element.
   * document.activeElement stops at the shadow host; we need to go deeper.
   */
  function deepActiveElement(root) {
    root = root || document;
    const el = root.activeElement;
    if (!el) return null;
    // If it hosts a shadow root, recurse into it
    if (el.shadowRoot) return deepActiveElement(el.shadowRoot);
    return el;
  }

  // ─── ARIA roles that represent text-input widgets ─────────────────────────

  const ARIA_TYPING_ROLES = new Set([
    "textbox",
    "combobox",
    "searchbox",
    "spinbutton",
    "listbox",       // open combobox list — backspace might filter
  ]);

  // ─── Input types where backspace should NOT navigate ─────────────────────
  // (i.e., types where the user CAN edit text/values via keyboard)

  const NON_NAVIGATING_INPUT_TYPES = new Set([
    "text", "search", "email", "url", "tel",
    "password", "number",
    "date", "time", "datetime-local", "month", "week",  // date-pickers accept backspace
  ]);

  // ─── Core detection ───────────────────────────────────────────────────────

  /**
   * Returns true if backspace should type/edit rather than navigate.
   */
  function isTypingContext(el) {
    // FIX C5: Entire document in design mode = every element is editable
    if (document.designMode === "on") return true;

    if (!el) return false;

    // Null-safe tag
    const tag = (el.tagName || "").toUpperCase();

    // Top-level non-elements — always navigate
    if (tag === "BODY" || tag === "HTML" || el === document) return false;

    // FIX C4 (shadow DOM) is handled by passing in deepActiveElement()

    // FIX M1: ARIA roles that behave as text inputs
    const role = (el.getAttribute && el.getAttribute("role") || "").toLowerCase();
    if (ARIA_TYPING_ROLES.has(role)) return true;

    // contenteditable (any tag, e.g. div in Notion / Quill / ProseMirror)
    if (el.isContentEditable) return true;

    if (tag === "TEXTAREA") return true;
    if (tag === "SELECT")   return true;

    if (tag === "INPUT") {
      const type = (el.type || "text").toLowerCase();

      // FIX M2: readonly inputs — user cannot type, allow navigation
      if (el.readOnly) return false;
      // Disabled inputs can't be focused in practice but guard anyway
      if (el.disabled) return false;

      return NON_NAVIGATING_INPUT_TYPES.has(type);
    }

    return false;
  }

  // ─── Navigation helper ────────────────────────────────────────────────────

  function goBack() {
    if (window === window.top) {
      // Top-level frame: use history API directly (fastest, no round-trip)
      history.back();
    } else {
      // FIX C3: We are inside an iframe.
      // Try same-origin shortcut first; fall back to background worker
      // for cross-origin frames where window.top access is blocked.
      try {
        window.top.history.back();
      } catch (_) {
        // Cross-origin: ask background.js to call chrome.tabs.goBack()
        chrome.runtime.sendMessage({ type: "GO_BACK" });
      }
    }
  }

  // ─── Main listener ────────────────────────────────────────────────────────

  document.addEventListener(
    "keydown",
    (e) => {
      if (!enabled)           return;
      if (e.key !== "Backspace") return;

      // FIX C1: Ignore key-repeat events (user holding backspace)
      // Without this, history.back() fires ~10× per second while held
      if (e.repeat) return;

      // FIX C2: Ignore events fired during IME composition
      // (Japanese/Chinese/Korean input — the key is mid-composition, not confirmed)
      if (e.isComposing) return;

      // Ignore any modifier combos — only plain Backspace navigates
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

      // FIX C4: Use shadow-DOM-aware active element lookup
      const active = deepActiveElement(document);

      if (isTypingContext(active)) return;

      e.preventDefault();
      goBack();
    },
    true  // capture phase: we see the event before page scripts can stop it
  );
})();
