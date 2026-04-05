(function () {
  const toggle = document.getElementById("toggle");
  const dot    = document.getElementById("dot");
  const label  = document.getElementById("status-text");

  function applyState(enabled) {
    toggle.checked = enabled;
    if (enabled) {
      dot.className = "status-dot on";
      label.textContent = "Enabled";
    } else {
      dot.className = "status-dot off";
      label.textContent = "Disabled";
    }
  }

  // Load saved state
  chrome.storage.local.get("enabled", (result) => {
    const enabled = result.enabled !== false; // default true
    applyState(enabled);
  });

  // Handle toggle
  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled });
    applyState(enabled);

    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: "SET_ENABLED", value: enabled })
          .catch(() => {}); // ignore tabs where content script isn't injected
      });
    });
  });
})();
