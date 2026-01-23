const STORAGE_KEY = "blockedDomains";
const OPACITY_KEY = "overlayOpacity";
const DEFAULT_OVERLAY_OPACITY = 0.92;
const { normalizeTextareaToLines } = BreakTheHabbitDomainUtils;

function setStatus(text) {
  const status = document.getElementById("status");
  status.textContent = text;
}

function normalizeOverlayOpacity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_OVERLAY_OPACITY;
  return Math.min(1, Math.max(0, parsed));
}

function setOpacityDisplay(value) {
  const output = document.getElementById("overlay-opacity-value");
  output.textContent = Number(value).toFixed(2);
}

function setOpacityValue(value) {
  const input = document.getElementById("overlay-opacity");
  const normalized = normalizeOverlayOpacity(value);
  input.value = normalized;
  setOpacityDisplay(normalized);
}

async function load() {
  const {
    [STORAGE_KEY]: blockedDomains = "",
    [OPACITY_KEY]: overlayOpacity = DEFAULT_OVERLAY_OPACITY,
  } = await chrome.storage.sync.get({
    [STORAGE_KEY]: "",
    [OPACITY_KEY]: DEFAULT_OVERLAY_OPACITY,
  });
  document.getElementById("domains").value = blockedDomains;
  setOpacityValue(overlayOpacity);
}

async function save() {
  const textarea = document.getElementById("domains");
  const normalized = normalizeTextareaToLines(textarea.value);
  textarea.value = normalized;

  const opacityInput = document.getElementById("overlay-opacity");
  const normalizedOpacity = normalizeOverlayOpacity(opacityInput.value);
  opacityInput.value = normalizedOpacity;
  setOpacityDisplay(normalizedOpacity);

  await chrome.storage.sync.set({
    [STORAGE_KEY]: normalized,
    [OPACITY_KEY]: normalizedOpacity,
  });
  setStatus("Saved.");
  window.setTimeout(() => setStatus(""), 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  document.getElementById("save").addEventListener("click", save);
  document
    .getElementById("overlay-opacity")
    .addEventListener("input", (event) => {
      setOpacityDisplay(normalizeOverlayOpacity(event.target.value));
    });
});
