const assert = require("node:assert/strict");
const test = require("node:test");

const {
  BOOKMARK_BAR_ID,
  collectBookmarkLinks,
  filterBookmarkSuggestions,
  findBookmarkByUrl,
  getDisplayHostname,
  normalizeGoodLink,
  normalizeGoodLinks,
  selectOverlayGoodLinks,
} = require("../good-links-utils.js");

test("normalizeGoodLink: accepts http and https links and falls back title to hostname", () => {
  assert.deepEqual(normalizeGoodLink("https://Example.com/path#later"), {
    url: "https://example.com/path",
    title: "example.com",
  });

  assert.deepEqual(normalizeGoodLink("http://example.com", "Example"), {
    url: "http://example.com/",
    title: "Example",
  });
});

test("normalizeGoodLink: rejects non-web URLs", () => {
  assert.equal(normalizeGoodLink("javascript:alert(1)"), null);
  assert.equal(normalizeGoodLink("mailto:test@example.com"), null);
});

test("normalizeGoodLinks: deduplicates by normalized URL", () => {
  assert.deepEqual(
    normalizeGoodLinks([
      { url: "https://example.com", title: "One" },
      { url: "https://example.com/", title: "Two" },
      { url: "https://example.com/page", title: "Three" },
    ]),
    [
      { url: "https://example.com/", title: "One" },
      { url: "https://example.com/page", title: "Three" },
    ]
  );
});

test("collectBookmarkLinks: recursively collects bookmark bar links and skips invalid URLs", () => {
  assert.equal(BOOKMARK_BAR_ID, "1");

  assert.deepEqual(
    collectBookmarkLinks([
      {
        title: "Bookmarks bar",
        children: [
          { title: "Readable", url: "https://example.com/read" },
          {
            title: "Folder",
            children: [
              { title: "Nested", url: "https://nested.example.com/" },
              { title: "Mail", url: "mailto:test@example.com" },
            ],
          },
        ],
      },
    ]),
    [
      { url: "https://example.com/read", title: "Readable" },
      { url: "https://nested.example.com/", title: "Nested" },
    ]
  );
});

test("filterBookmarkSuggestions: matches title and URL while excluding existing links", () => {
  const bookmarks = [
    { url: "https://example.com/alpha", title: "Alpha" },
    { url: "https://example.com/beta", title: "Beta" },
    { url: "https://another.com/story", title: "Long story" },
  ];

  assert.deepEqual(
    filterBookmarkSuggestions(bookmarks, "story", [{ url: "https://example.com/beta", title: "Beta" }]),
    [{ url: "https://another.com/story", title: "Long story" }]
  );

  assert.deepEqual(filterBookmarkSuggestions(bookmarks, "exa", [], 1), [
    { url: "https://example.com/alpha", title: "Alpha" },
  ]);
});

test("findBookmarkByUrl: matches normalized bookmark URLs", () => {
  const bookmarks = [{ url: "https://example.com/", title: "Example" }];
  assert.deepEqual(findBookmarkByUrl(bookmarks, "https://example.com"), {
    url: "https://example.com/",
    title: "Example",
  });
  assert.equal(findBookmarkByUrl(bookmarks, "https://nope.com"), null);
});

test("selectOverlayGoodLinks: keeps only the first requested links", () => {
  assert.deepEqual(
    selectOverlayGoodLinks(
      [
        { url: "https://one.example/", title: "One" },
        { url: "https://two.example/", title: "Two" },
        { url: "https://three.example/", title: "Three" },
      ],
      2
    ),
    [
      { url: "https://one.example/", title: "One" },
      { url: "https://two.example/", title: "Two" },
    ]
  );
});

test("getDisplayHostname: extracts hostname for UI display", () => {
  assert.equal(getDisplayHostname("https://example.com/path?q=1"), "example.com");
  assert.equal(getDisplayHostname("not-a-url"), "not-a-url");
});
