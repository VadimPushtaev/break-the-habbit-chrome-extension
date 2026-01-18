const assert = require("node:assert/strict");
const test = require("node:test");

const {
  isHostnameBlocked,
  normalizeDomainEntry,
  normalizeTextareaToLines,
  parseBlockedDomains,
} = require("../domain-utils.js");

test("normalizeDomainEntry: trims, lowercases, strips leading wildcards", () => {
  assert.equal(normalizeDomainEntry("  EXAMPLE.com "), "example.com");
  assert.equal(normalizeDomainEntry("*.Example.com"), "example.com");
  assert.equal(normalizeDomainEntry(".Example.com"), "example.com");
});

test("normalizeDomainEntry: accepts URLs and extracts hostname", () => {
  assert.equal(normalizeDomainEntry("https://news.ycombinator.com/"), "news.ycombinator.com");
  assert.equal(normalizeDomainEntry("http://example.com:8080/path"), "example.com");
});

test("parseBlockedDomains: parses non-empty normalized lines", () => {
  assert.deepEqual(parseBlockedDomains("example.com\n\n*.test.com"), [
    "example.com",
    "test.com",
  ]);
});

test("normalizeTextareaToLines: de-dupes and normalizes", () => {
  assert.equal(
    normalizeTextareaToLines("EXAMPLE.com\nexample.com\n*.Example.com\n"),
    "example.com"
  );
});

test("isHostnameBlocked: matches exact domains", () => {
  assert.equal(isHostnameBlocked("example.com", ["example.com"]), true);
  assert.equal(isHostnameBlocked("example.com", ["test.com"]), false);
});

test("isHostnameBlocked: matches subdomains", () => {
  assert.equal(isHostnameBlocked("a.example.com", ["example.com"]), true);
  assert.equal(isHostnameBlocked("deep.a.example.com", ["example.com"]), true);
  assert.equal(isHostnameBlocked("notexample.com", ["example.com"]), false);
});

