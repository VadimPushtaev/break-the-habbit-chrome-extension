const assert = require("node:assert/strict");
const test = require("node:test");

const {
  COUNT_SEVERITY,
  RECENCY_SEVERITY,
  formatElapsedTime,
  getCountSeverity,
  getLocalDayKey,
  getNextBlockedSiteStats,
  getRecencySeverity,
} = require("../stats-utils.js");

test("getLocalDayKey: uses local calendar date", () => {
  assert.equal(getLocalDayKey(new Date("2026-04-24T11:22:33")), "2026-04-24");
});

test("getNextBlockedSiteStats: starts tracking from 1 for a new day", () => {
  const { previousLastOpenedAt, updatedEntry } = getNextBlockedSiteStats(null, "2026-04-24T11:22:33");

  assert.equal(previousLastOpenedAt, null);
  assert.deepEqual(updatedEntry, {
    dayKey: "2026-04-24",
    countToday: 1,
    lastOpenedAt: new Date("2026-04-24T11:22:33").getTime(),
  });
});

test("getNextBlockedSiteStats: increments count within the same day and preserves previous timestamp", () => {
  const existingEntry = {
    dayKey: "2026-04-24",
    countToday: 4,
    lastOpenedAt: new Date("2026-04-24T09:00:00").getTime(),
  };

  const { previousLastOpenedAt, updatedEntry } = getNextBlockedSiteStats(
    existingEntry,
    "2026-04-24T10:30:00"
  );

  assert.equal(previousLastOpenedAt, existingEntry.lastOpenedAt);
  assert.deepEqual(updatedEntry, {
    dayKey: "2026-04-24",
    countToday: 5,
    lastOpenedAt: new Date("2026-04-24T10:30:00").getTime(),
  });
});

test("getNextBlockedSiteStats: resets count when the day changes", () => {
  const existingEntry = {
    dayKey: "2026-04-23",
    countToday: 9,
    lastOpenedAt: new Date("2026-04-23T22:00:00").getTime(),
  };

  const { updatedEntry } = getNextBlockedSiteStats(existingEntry, "2026-04-24T08:00:00");

  assert.deepEqual(updatedEntry, {
    dayKey: "2026-04-24",
    countToday: 1,
    lastOpenedAt: new Date("2026-04-24T08:00:00").getTime(),
  });
});

test("getCountSeverity: maps threshold bands correctly", () => {
  assert.equal(getCountSeverity(1), COUNT_SEVERITY.GOOD);
  assert.equal(getCountSeverity(2), COUNT_SEVERITY.WARNING);
  assert.equal(getCountSeverity(3), COUNT_SEVERITY.BAD);
  assert.equal(getCountSeverity(4), COUNT_SEVERITY.BAD);
  assert.equal(getCountSeverity(5), COUNT_SEVERITY.VERY_BAD);
});

test("getRecencySeverity: treats shorter intervals as worse", () => {
  assert.equal(getRecencySeverity(Number.NaN), RECENCY_SEVERITY.NEUTRAL);
  assert.equal(getRecencySeverity(59 * 60 * 1000), RECENCY_SEVERITY.VERY_BAD);
  assert.equal(getRecencySeverity(60 * 60 * 1000), RECENCY_SEVERITY.BAD);
  assert.equal(getRecencySeverity(3 * 60 * 60 * 1000), RECENCY_SEVERITY.WARNING);
  assert.equal(getRecencySeverity(12 * 60 * 60 * 1000), RECENCY_SEVERITY.GOOD);
});

test("formatElapsedTime: handles first visit and human-readable ranges", () => {
  assert.equal(formatElapsedTime(Number.NaN), "First recorded visit");
  assert.equal(formatElapsedTime(30 * 1000), "Just now");
  assert.equal(formatElapsedTime(60 * 1000), "1 minute ago");
  assert.equal(formatElapsedTime(2 * 60 * 60 * 1000), "2 hours ago");
  assert.equal(formatElapsedTime(3 * 24 * 60 * 60 * 1000), "3 days ago");
});
