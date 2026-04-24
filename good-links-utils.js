(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BreakTheHabbitGoodLinksUtils = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const BOOKMARK_BAR_ID = "1";

  function parseWebUrl(rawUrl) {
    try {
      const parsed = new URL(String(rawUrl || "").trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      parsed.hash = "";
      return parsed;
    } catch {
      return null;
    }
  }

  function getDisplayHostname(rawUrl) {
    const parsed = parseWebUrl(rawUrl);
    return parsed ? parsed.hostname : String(rawUrl || "");
  }

  function normalizeGoodLink(rawUrl, rawTitle = "") {
    const parsed = parseWebUrl(rawUrl);
    if (!parsed) return null;

    const title = String(rawTitle || "").trim() || parsed.hostname;
    return {
      url: parsed.toString(),
      title,
    };
  }

  function normalizeGoodLinks(values) {
    const seenUrls = new Set();

    return (values || [])
      .map((value) => {
        if (!value || typeof value !== "object") return null;
        return normalizeGoodLink(value.url, value.title);
      })
      .filter(Boolean)
      .filter((link) => {
        if (seenUrls.has(link.url)) return false;
        seenUrls.add(link.url);
        return true;
      });
  }

  function collectBookmarkLinks(nodes) {
    const normalizedNodes = Array.isArray(nodes) ? nodes : [nodes];
    const links = [];

    function visit(node) {
      if (!node || typeof node !== "object") return;

      if (typeof node.url === "string") {
        const normalized = normalizeGoodLink(node.url, node.title);
        if (normalized) links.push(normalized);
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    }

    normalizedNodes.forEach(visit);
    return normalizeGoodLinks(links);
  }

  function filterBookmarkSuggestions(bookmarks, query, existingLinks, limit = 8) {
    const normalizedQuery = String(query || "")
      .trim()
      .toLowerCase();
    if (!normalizedQuery) return [];

    const existingUrls = new Set(normalizeGoodLinks(existingLinks).map((link) => link.url));
    return normalizeGoodLinks(bookmarks)
      .filter((bookmark) => !existingUrls.has(bookmark.url))
      .filter((bookmark) => {
        const title = bookmark.title.toLowerCase();
        const url = bookmark.url.toLowerCase();
        return title.includes(normalizedQuery) || url.includes(normalizedQuery);
      })
      .slice(0, limit);
  }

  function findBookmarkByUrl(bookmarks, rawUrl) {
    const normalized = normalizeGoodLink(rawUrl);
    if (!normalized) return null;

    return (
      normalizeGoodLinks(bookmarks).find((bookmark) => bookmark.url === normalized.url) || null
    );
  }

  function selectOverlayGoodLinks(values, limit = 5) {
    return normalizeGoodLinks(values).slice(0, Math.max(0, limit));
  }

  function getFaviconUrl(rawUrl, size = 16) {
    const normalized = normalizeGoodLink(rawUrl);
    if (!normalized || !globalThis.chrome || !chrome.runtime) return "";

    const baseUrl = chrome.runtime.getURL("/_favicon/");
    const searchParams = new URLSearchParams({
      pageUrl: normalized.url,
      size: String(size),
    });
    return `${baseUrl}?${searchParams.toString()}`;
  }

  return {
    BOOKMARK_BAR_ID,
    collectBookmarkLinks,
    filterBookmarkSuggestions,
    findBookmarkByUrl,
    getDisplayHostname,
    getFaviconUrl,
    normalizeGoodLink,
    normalizeGoodLinks,
    selectOverlayGoodLinks,
  };
});
