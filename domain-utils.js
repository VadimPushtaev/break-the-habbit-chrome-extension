(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BreakTheHabbitDomainUtils = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function normalizeDomainEntry(raw) {
    const trimmed = String(raw || "")
      .trim()
      .toLowerCase();
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

  function parseBlockedDomains(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(normalizeDomainEntry)
      .filter(Boolean);
  }

  function normalizeTextareaToLines(text) {
    const seen = new Set();
    const lines = String(text || "")
      .split(/\r?\n/)
      .map(normalizeDomainEntry)
      .filter(Boolean)
      .filter((domain) => {
        if (seen.has(domain)) return false;
        seen.add(domain);
        return true;
      });

    return lines.join("\n");
  }

  function isHostnameBlocked(hostname, blockedDomains) {
    return Boolean(getMatchedBlockedDomain(hostname, blockedDomains));
  }

  function getMatchedBlockedDomain(hostname, blockedDomains) {
    const host = String(hostname || "").toLowerCase();
    if (!host) return null;

    for (const domain of blockedDomains || []) {
      if (!domain) continue;
      if (host === domain) return domain;
      if (host.endsWith(`.${domain}`)) return domain;
    }
    return null;
  }

  return {
    getMatchedBlockedDomain,
    isHostnameBlocked,
    normalizeDomainEntry,
    normalizeTextareaToLines,
    parseBlockedDomains,
  };
});
