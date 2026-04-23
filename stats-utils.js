(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BreakTheHabbitStatsUtils = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const COUNT_SEVERITY = {
    GOOD: "good",
    WARNING: "warning",
    BAD: "bad",
    VERY_BAD: "very-bad",
  };

  const RECENCY_SEVERITY = {
    NEUTRAL: "neutral",
    GOOD: "good",
    WARNING: "warning",
    BAD: "bad",
    VERY_BAD: "very-bad",
  };

  function padNumber(value) {
    return String(value).padStart(2, "0");
  }

  function getLocalDayKey(date = new Date()) {
    const normalizedDate = date instanceof Date ? date : new Date(date);
    return [
      normalizedDate.getFullYear(),
      padNumber(normalizedDate.getMonth() + 1),
      padNumber(normalizedDate.getDate()),
    ].join("-");
  }

  function getNextBlockedSiteStats(entry, now = Date.now()) {
    const nowDate = now instanceof Date ? now : new Date(now);
    const nowTimestamp = nowDate.getTime();
    const dayKey = getLocalDayKey(nowDate);
    const currentEntry = entry && typeof entry === "object" ? entry : {};
    const previousLastOpenedAt =
      typeof currentEntry.lastOpenedAt === "number" ? currentEntry.lastOpenedAt : null;
    const existingCount =
      currentEntry.dayKey === dayKey && Number.isFinite(currentEntry.countToday)
        ? Math.max(0, Math.floor(currentEntry.countToday))
        : 0;

    return {
      previousLastOpenedAt,
      updatedEntry: {
        dayKey,
        countToday: existingCount + 1,
        lastOpenedAt: nowTimestamp,
      },
    };
  }

  function getCountSeverity(countToday) {
    const normalizedCount = Math.max(0, Number(countToday) || 0);
    if (normalizedCount >= 5) return COUNT_SEVERITY.VERY_BAD;
    if (normalizedCount >= 3) return COUNT_SEVERITY.BAD;
    if (normalizedCount >= 2) return COUNT_SEVERITY.WARNING;
    return COUNT_SEVERITY.GOOD;
  }

  function getRecencySeverity(elapsedMs) {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return RECENCY_SEVERITY.NEUTRAL;
    if (elapsedMs < 60 * 60 * 1000) return RECENCY_SEVERITY.VERY_BAD;
    if (elapsedMs < 3 * 60 * 60 * 1000) return RECENCY_SEVERITY.BAD;
    if (elapsedMs < 12 * 60 * 60 * 1000) return RECENCY_SEVERITY.WARNING;
    return RECENCY_SEVERITY.GOOD;
  }

  function formatElapsedTime(elapsedMs) {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
      return "First recorded visit";
    }

    const totalMinutes = Math.max(0, Math.floor(elapsedMs / (60 * 1000)));
    if (totalMinutes < 1) return "Just now";
    if (totalMinutes < 60) {
      return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"} ago`;
    }

    const totalHours = Math.floor(totalMinutes / 60);
    if (totalHours < 24) {
      return `${totalHours} hour${totalHours === 1 ? "" : "s"} ago`;
    }

    const totalDays = Math.floor(totalHours / 24);
    return `${totalDays} day${totalDays === 1 ? "" : "s"} ago`;
  }

  return {
    COUNT_SEVERITY,
    RECENCY_SEVERITY,
    formatElapsedTime,
    getCountSeverity,
    getLocalDayKey,
    getNextBlockedSiteStats,
    getRecencySeverity,
  };
});
