// ===== Constants =====
const API_BASE = "http://127.0.0.1:8000";
const CONVERT_TIMEOUT_MS = 120000;
const HEALTH_TIMEOUT_MS = 2000;

const FALLBACK_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Mandarin Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
];

// ===== DOM Elements =====
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const apiKeyWarning = document.getElementById("apiKeyWarning");
const errorBanner = document.getElementById("errorBanner");
const errorText = document.getElementById("errorText");
const errorClose = document.getElementById("errorClose");
const urlInput = document.getElementById("urlInput");
const languageSelect = document.getElementById("languageSelect");
const convertBtn = document.getElementById("convertBtn");
const convertBtnText = document.getElementById("convertBtnText");
const loadingArea = document.getElementById("loadingArea");
const loadingText = document.getElementById("loadingText");
const playerArea = document.getElementById("playerArea");
const audioPlayer = document.getElementById("audioPlayer");
const downloadBtn = document.getElementById("downloadBtn");
const summaryArea = document.getElementById("summaryArea");
const summaryToggle = document.getElementById("summaryToggle");
const summaryContent = document.getElementById("summaryContent");
const summaryText = document.getElementById("summaryText");

let audioBlobUrl = null;

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  loadLanguages();
  loadActiveTabUrl();
  checkApiKeys();

  convertBtn.addEventListener("click", handleConvert);
  downloadBtn.addEventListener("click", handleDownload);
  errorClose.addEventListener("click", hideError);
  summaryToggle.addEventListener("click", toggleSummary);

  // Update URL when user switches tabs or navigates
  chrome.tabs.onActivated.addListener(() => loadActiveTabUrl());
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) loadActiveTabUrl();
  });
});

// ===== Health Check =====
async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      setStatus(true, "Backend connected");
    } else {
      setStatus(false, "Backend returned an error");
    }
  } catch {
    setStatus(false, "Backend not running");
  }
}

function setStatus(online, text) {
  statusDot.className = "status-dot " + (online ? "online" : "offline");
  statusText.textContent = text;
}

// ===== Load Languages =====
async function loadLanguages() {
  let languages = FALLBACK_LANGUAGES;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const res = await fetch(`${API_BASE}/api/languages`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        languages = data;
      } else if (data.languages && Array.isArray(data.languages)) {
        languages = data.languages;
      }
    }
  } catch {
    // Use fallback languages
  }

  languageSelect.innerHTML = "";
  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.code || lang;
    option.textContent = lang.label || lang;
    languageSelect.appendChild(option);
  });
}

// ===== Active Tab URL =====
async function loadActiveTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      urlInput.value = tab.url;
    }
  } catch {
    urlInput.placeholder = "Could not get tab URL";
  }
}

// ===== API Keys Check =====
async function checkApiKeys() {
  try {
    const result = await chrome.storage.local.get("apiKeys");
    const keys = result.apiKeys || {};
    const hasAll =
      keys.openai_api_key &&
      keys.elevenlabs_api_key &&
      keys.firecrawl_api_key;

    if (!hasAll) {
      apiKeyWarning.classList.remove("hidden");
    }
  } catch {
    apiKeyWarning.classList.remove("hidden");
  }
}

// ===== Convert =====
async function handleConvert() {
  hideError();

  const url = urlInput.value.trim();
  if (!url || url === "chrome://newtab/" || url.startsWith("chrome://")) {
    showError("Navigate to a blog page first, then try again.");
    return;
  }

  // Get API keys
  let apiKeys = {};
  try {
    const result = await chrome.storage.local.get("apiKeys");
    apiKeys = result.apiKeys || {};
  } catch {
    // Continue without keys - backend will report if they're needed
  }

  if (!apiKeys.openai_api_key && !apiKeys.elevenlabs_api_key && !apiKeys.firecrawl_api_key) {
    showError('Configure API keys in <a href="options.html" target="_blank">Settings</a> first.');
    return;
  }

  const language = languageSelect.value;

  // Show loading state
  setConverting(true);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONVERT_TIMEOUT_MS);

    const res = await fetch(`${API_BASE}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url,
        language: language,
        api_keys: {
          openai: apiKeys.openai_api_key,
          elevenlabs: apiKeys.elevenlabs_api_key,
          firecrawl: apiKeys.firecrawl_api_key,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      let msg = "Conversion failed.";
      try {
        const err = await res.json();
        msg = err.detail || err.error || err.message || msg;
      } catch {
        // Use default message
      }
      showError(msg);
      setConverting(false);
      return;
    }

    const data = await res.json();

    // Decode audio
    if (data.audio_base64) {
      const byteChars = atob(data.audio_base64);
      const byteNumbers = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: "audio/mpeg" });

      // Revoke previous blob URL if any
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
      audioBlobUrl = URL.createObjectURL(blob);

      audioPlayer.src = audioBlobUrl;
      playerArea.classList.remove("hidden");
      playerArea.classList.add("fade-in");
    }

    // Show summary
    if (data.summary) {
      summaryText.textContent = data.summary;
      summaryArea.classList.remove("hidden");
      summaryArea.classList.add("fade-in");
    }
  } catch (err) {
    if (err.name === "AbortError") {
      showError("Request timed out. The conversion took too long.");
    } else {
      showError("Could not reach the backend. Start the backend server first.");
    }
  } finally {
    setConverting(false);
  }
}

function setConverting(active) {
  convertBtn.disabled = active;
  if (active) {
    convertBtnText.textContent = "Converting...";
    loadingArea.classList.remove("hidden");
    loadingArea.classList.add("fade-in");
    playerArea.classList.add("hidden");
    summaryArea.classList.add("hidden");
  } else {
    convertBtnText.textContent = "Convert to Podcast";
    loadingArea.classList.add("hidden");
  }
}

// ===== Download =====
function handleDownload() {
  if (!audioBlobUrl) return;

  const a = document.createElement("a");
  a.href = audioBlobUrl;
  a.download = "podcast.mp3";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ===== Summary Toggle =====
function toggleSummary() {
  summaryToggle.classList.toggle("open");
  summaryContent.classList.toggle("hidden");
}

// ===== Error Handling =====
function showError(message) {
  errorText.innerHTML = message;
  errorBanner.classList.remove("hidden");
}

function hideError() {
  errorBanner.classList.add("hidden");
}
