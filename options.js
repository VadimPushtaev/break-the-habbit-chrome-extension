const STORAGE_KEY = "blockedDomains";

function setStatus(text) {
  const status = document.getElementById("status");
  status.textContent = text;
}

function normalizeDomainEntry(raw) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  let candidate = trimmed;

  if (candidate.startsWith("*.")) candidate = candidate.slice(2);
  if (candidate.startsWith(".")) candidate = candidate.slice(1);

  if (candidate.includes("://")) {
    try {
      return new URL(candidate).hostname || null;
    } catch {
      return null;
    }
  }

  candidate = candidate.split("/")[0];
  candidate = candidate.split("?")[0];
  candidate = candidate.split("#")[0];
  candidate = candidate.split(":")[0];

  return candidate || null;
}

function normalizeTextareaToLines(text) {
  const seen = new Set();
  const lines = text
    .split(/\r?\n/)
    .map(normalizeDomainEntry)
    .filter(Boolean)
    .filter((d) => {
      if (seen.has(d)) return false;
      seen.add(d);
      return true;
    });

  return lines.join("\n");
}

async function load() {
  const { [STORAGE_KEY]: blockedDomains = "" } = await chrome.storage.sync.get({
    [STORAGE_KEY]: "",
  });
  document.getElementById("domains").value = blockedDomains;
}

async function save() {
  const textarea = document.getElementById("domains");
  const normalized = normalizeTextareaToLines(textarea.value);
  textarea.value = normalized;

  await chrome.storage.sync.set({ [STORAGE_KEY]: normalized });
  setStatus("Saved.");
  window.setTimeout(() => setStatus(""), 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  document.getElementById("save").addEventListener("click", save);
});

