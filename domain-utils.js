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
    const host = String(hostname || "").toLowerCase();
    if (!host) return false;

    for (const domain of blockedDomains || []) {
      if (!domain) continue;
      if (host === domain) return true;
      if (host.endsWith(`.${domain}`)) return true;
    }
    return false;
  }

  return {
    isHostnameBlocked,
    normalizeDomainEntry,
    normalizeTextareaToLines,
    parseBlockedDomains,
  };
});

