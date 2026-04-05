/**
 * background.js
 * Handles the "go back" action from iframes that can't safely call
 * window.top.history.back() due to cross-origin restrictions.
 * Uses chrome.tabs.goBack() which always navigates the TOP-LEVEL frame.
 */

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "GO_BACK" && sender.tab) {
    chrome.tabs.goBack(sender.tab.id);
  }
});
