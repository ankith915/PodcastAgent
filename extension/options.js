const API_BASE = "http://127.0.0.1:8000";

const openaiKey = document.getElementById("openaiKey");
const elevenlabsKey = document.getElementById("elevenlabsKey");
const firecrawlKey = document.getElementById("firecrawlKey");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const statusMsg = document.getElementById("statusMsg");

// Load saved keys on page open
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const result = await chrome.storage.local.get("apiKeys");
    const keys = result.apiKeys || {};
    if (keys.openai_api_key) openaiKey.value = keys.openai_api_key;
    if (keys.elevenlabs_api_key) elevenlabsKey.value = keys.elevenlabs_api_key;
    if (keys.firecrawl_api_key) firecrawlKey.value = keys.firecrawl_api_key;
  } catch {
    // No saved keys yet
  }
});

// Save keys
saveBtn.addEventListener("click", async () => {
  const apiKeys = {
    openai_api_key: openaiKey.value.trim(),
    elevenlabs_api_key: elevenlabsKey.value.trim(),
    firecrawl_api_key: firecrawlKey.value.trim()
  };

  try {
    await chrome.storage.local.set({ apiKeys });
    showStatus("Keys saved successfully.", "success");
  } catch (err) {
    showStatus("Failed to save keys: " + err.message, "error");
  }
});

// Test connection
testBtn.addEventListener("click", async () => {
  showStatus("Testing connection...", "success");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      showStatus("Backend is running and reachable.", "success");
    } else {
      showStatus("Backend returned status " + res.status + ".", "error");
    }
  } catch {
    showStatus("Cannot reach backend. Make sure the server is running at " + API_BASE, "error");
  }
});

function showStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.className = "status-msg show " + type;
}
