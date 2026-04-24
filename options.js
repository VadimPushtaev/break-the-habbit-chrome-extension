const STORAGE_KEY = "blockedDomains";
const OPACITY_KEY = "overlayOpacity";
const GOOD_LINKS_KEY = "goodLinks";
const DEFAULT_OVERLAY_OPACITY = 0.92;
const BOOKMARK_SUGGESTION_LIMIT = 8;
const { normalizeTextareaToLines } = BreakTheHabbitDomainUtils;
const {
  BOOKMARK_BAR_ID,
  collectBookmarkLinks,
  filterBookmarkSuggestions,
  findBookmarkByUrl,
  getDisplayHostname,
  getFaviconUrl,
  normalizeGoodLink,
  normalizeGoodLinks,
} = BreakTheHabbitGoodLinksUtils;

let goodLinks = [];
let bookmarkLinks = [];
let statusTimerId = 0;

function setStatus(text, tone = "info", timeoutMs = 0) {
  const status = document.getElementById("status");
  status.textContent = text;
  status.dataset.state = tone;

  if (statusTimerId) {
    window.clearTimeout(statusTimerId);
    statusTimerId = 0;
  }

  if (timeoutMs > 0) {
    statusTimerId = window.setTimeout(() => {
      status.textContent = "";
      status.dataset.state = "";
      statusTimerId = 0;
    }, timeoutMs);
  }
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

function createLinkMeta(link, faviconSize) {
  const meta = document.createElement("div");
  meta.className = "link-meta";

  const favicon = document.createElement("img");
  favicon.className = "link-favicon";
  favicon.src = getFaviconUrl(link.url, faviconSize);
  favicon.alt = "";
  favicon.width = faviconSize;
  favicon.height = faviconSize;
  favicon.loading = "lazy";

  const text = document.createElement("div");
  text.className = "link-text";

  const title = document.createElement("div");
  title.className = "link-title";
  title.textContent = link.title;

  const url = document.createElement("div");
  url.className = "link-url";
  url.textContent = getDisplayHostname(link.url);

  text.appendChild(title);
  text.appendChild(url);
  meta.appendChild(favicon);
  meta.appendChild(text);
  return meta;
}

function renderGoodLinks() {
  const list = document.getElementById("good-links-list");
  list.textContent = "";

  if (!goodLinks.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No good links saved yet.";
    list.appendChild(emptyState);
    return;
  }

  goodLinks.forEach((link) => {
    const item = document.createElement("div");
    item.className = "link-row";
    item.setAttribute("role", "listitem");

    item.appendChild(createLinkMeta(link, 18));

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary-button";
    removeButton.dataset.url = link.url;
    removeButton.textContent = "Remove";

    item.appendChild(removeButton);
    list.appendChild(item);
  });
}

function renderBookmarkSuggestions() {
  const suggestionsContainer = document.getElementById("bookmark-suggestions");
  const query = document.getElementById("good-link-input").value;
  suggestionsContainer.textContent = "";

  if (!query.trim()) {
    const helper = document.createElement("p");
    helper.className = "empty-state compact";
    helper.textContent = "Type a title or URL to search your Bookmarks Bar.";
    suggestionsContainer.appendChild(helper);
    return;
  }

  const suggestions = filterBookmarkSuggestions(
    bookmarkLinks,
    query,
    goodLinks,
    BOOKMARK_SUGGESTION_LIMIT
  );

  if (!suggestions.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state compact";
    emptyState.textContent = "No matching bookmarks found.";
    suggestionsContainer.appendChild(emptyState);
    return;
  }

  suggestions.forEach((link) => {
    const item = document.createElement("div");
    item.className = "link-row";
    item.setAttribute("role", "listitem");

    item.appendChild(createLinkMeta(link, 16));

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "secondary-button";
    addButton.dataset.url = link.url;
    addButton.dataset.title = link.title;
    addButton.textContent = "Use";

    item.appendChild(addButton);
    suggestionsContainer.appendChild(item);
  });
}

function addGoodLink(candidate) {
  const beforeLength = goodLinks.length;
  goodLinks = normalizeGoodLinks([...goodLinks, candidate]);
  if (goodLinks.length === beforeLength) {
    setStatus("That good link is already saved.", "warning", 1800);
    return false;
  }

  renderGoodLinks();
  renderBookmarkSuggestions();
  setStatus("Good link added. Click Save to keep it.", "info", 1800);
  return true;
}

function addGoodLinkFromInput() {
  const input = document.getElementById("good-link-input");
  const bookmarkMatch = findBookmarkByUrl(bookmarkLinks, input.value);
  const candidate = normalizeGoodLink(input.value, bookmarkMatch ? bookmarkMatch.title : "");

  if (!candidate) {
    setStatus("Enter a valid http or https URL.", "error", 2200);
    return;
  }

  if (addGoodLink(candidate)) {
    input.value = "";
    renderBookmarkSuggestions();
  }
}

async function loadBookmarks() {
  try {
    const nodes = await chrome.bookmarks.getSubTree(BOOKMARK_BAR_ID);
    bookmarkLinks = collectBookmarkLinks(nodes);
  } catch {
    bookmarkLinks = [];
    setStatus("Bookmarks could not be loaded.", "warning", 2200);
  }
}

async function load() {
  const {
    [STORAGE_KEY]: blockedDomains = "",
    [OPACITY_KEY]: overlayOpacity = DEFAULT_OVERLAY_OPACITY,
    [GOOD_LINKS_KEY]: storedGoodLinks = [],
  } = await chrome.storage.sync.get({
    [STORAGE_KEY]: "",
    [OPACITY_KEY]: DEFAULT_OVERLAY_OPACITY,
    [GOOD_LINKS_KEY]: [],
  });
  document.getElementById("domains").value = blockedDomains;
  setOpacityValue(overlayOpacity);
  goodLinks = normalizeGoodLinks(storedGoodLinks);
  renderGoodLinks();

  await loadBookmarks();
  renderBookmarkSuggestions();
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
    [GOOD_LINKS_KEY]: goodLinks,
  });
  setStatus("Saved.", "success", 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  document.getElementById("save").addEventListener("click", save);
  document.getElementById("add-good-link").addEventListener("click", addGoodLinkFromInput);
  document
    .getElementById("overlay-opacity")
    .addEventListener("input", (event) => {
      setOpacityDisplay(normalizeOverlayOpacity(event.target.value));
    });
  document.getElementById("good-link-input").addEventListener("input", renderBookmarkSuggestions);
  document.getElementById("good-link-input").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addGoodLinkFromInput();
  });
  document.getElementById("bookmark-suggestions").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-url]");
    if (!button) return;
    addGoodLink({ url: button.dataset.url, title: button.dataset.title || "" });
  });
  document.getElementById("good-links-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-url]");
    if (!button) return;

    goodLinks = goodLinks.filter((link) => link.url !== button.dataset.url);
    renderGoodLinks();
    renderBookmarkSuggestions();
    setStatus("Good link removed. Click Save to keep it.", "info", 1800);
  });
});
