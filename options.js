const STORAGE_KEY = "blockedDomains";
const { normalizeTextareaToLines } = BreakTheHabbitDomainUtils;

function setStatus(text) {
  const status = document.getElementById("status");
  status.textContent = text;
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
