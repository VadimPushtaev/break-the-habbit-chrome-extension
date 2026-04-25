(() => {
  const OVERLAY_ID = "break-the-habbit-overlay";
  const STORAGE_KEY = "blockedDomains";
  const OPACITY_KEY = "overlayOpacity";
  const GOOD_LINKS_KEY = "goodLinks";
  const LOCAL_STATS_KEY = "blockedSiteStats";
  const DEFAULT_OVERLAY_OPACITY = 0.92;
  const { getMatchedBlockedDomain, parseBlockedDomains } = BreakTheHabbitDomainUtils;
  const { getDisplayHostname, getFaviconUrl, selectOverlayGoodLinks } =
    BreakTheHabbitGoodLinksUtils;
  const { getBlockedSiteStatsSummary, getNextBlockedSiteStats } = BreakTheHabbitStatsUtils;

  if (document.getElementById(OVERLAY_ID)) return;

  function normalizeOverlayOpacity(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_OVERLAY_OPACITY;
    return Math.min(1, Math.max(0, parsed));
  }

  function createStatCard({ idSuffix, label, value, severity }) {
    const card = document.createElement("div");
    card.className = `${OVERLAY_ID}-stat ${OVERLAY_ID}-severity-${severity}`;

    const labelElement = document.createElement("p");
    labelElement.className = `${OVERLAY_ID}-stat-label`;
    labelElement.id = `${OVERLAY_ID}-${idSuffix}-label`;
    labelElement.textContent = label;

    const valueElement = document.createElement("p");
    valueElement.className = `${OVERLAY_ID}-stat-value`;
    valueElement.id = `${OVERLAY_ID}-${idSuffix}-value`;
    valueElement.textContent = value;

    card.appendChild(labelElement);
    card.appendChild(valueElement);
    return card;
  }

  function createBetterLookSection(goodLinks) {
    if (!goodLinks.length) return null;

    const section = document.createElement("section");
    section.id = `${OVERLAY_ID}-better-look`;

    const heading = document.createElement("p");
    heading.className = `${OVERLAY_ID}-section-title`;
    heading.textContent = "Better look at";
    section.appendChild(heading);

    const list = document.createElement("div");
    list.id = `${OVERLAY_ID}-good-links`;

    goodLinks.forEach((link) => {
      const linkElement = document.createElement("a");
      linkElement.className = `${OVERLAY_ID}-good-link`;
      linkElement.href = link.url;

      const favicon = document.createElement("img");
      favicon.className = `${OVERLAY_ID}-good-link-favicon`;
      favicon.src = getFaviconUrl(link.url, 32);
      favicon.alt = "";
      favicon.width = 20;
      favicon.height = 20;
      favicon.loading = "lazy";

      const text = document.createElement("span");
      text.className = `${OVERLAY_ID}-good-link-text`;

      const title = document.createElement("span");
      title.className = `${OVERLAY_ID}-good-link-title`;
      title.textContent = link.title;

      const host = document.createElement("span");
      host.className = `${OVERLAY_ID}-good-link-host`;
      host.textContent = getDisplayHostname(link.url);

      text.appendChild(title);
      text.appendChild(host);
      linkElement.appendChild(favicon);
      linkElement.appendChild(text);
      linkElement.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.assign(link.url);
      });
      list.appendChild(linkElement);
    });

    section.appendChild(list);
    return section;
  }

  function blockPage(overlayOpacity, visitStats, goodLinks, onOverlayClosed) {
    if (document.getElementById(OVERLAY_ID)) return;

    const normalizedOpacity = normalizeOverlayOpacity(overlayOpacity);
    const style = document.createElement("style");
    style.id = `${OVERLAY_ID}-style`;
    style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      top: -5vh;
      left: -5vw;
      width: 110vw;
      height: 110vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, ${normalizedOpacity});
      color: #fff;
      font: 600 14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      z-index: 2147483647;
      pointer-events: auto;
    }
    #${OVERLAY_ID} * {
      box-sizing: border-box;
    }
    #${OVERLAY_ID}-panel {
      width: min(520px, calc(100vw - 48px));
      padding: 24px 20px 20px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 18px;
      background:
        linear-gradient(180deg, rgba(24, 24, 24, 0.95), rgba(10, 10, 10, 0.92));
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
      text-align: left;
    }
    #${OVERLAY_ID}-title {
      font-size: 22px;
      line-height: 1.2;
      margin: 0 0 8px;
    }
    #${OVERLAY_ID}-subtitle {
      margin: 0 0 18px;
      color: rgba(255, 255, 255, 0.72);
      font-size: 14px;
      line-height: 1.45;
    }
    #${OVERLAY_ID}-stats {
      display: grid;
      gap: 12px;
      margin-bottom: 18px;
    }
    .${OVERLAY_ID}-stat {
      padding: 14px 14px 15px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.05);
    }
    .${OVERLAY_ID}-stat-label {
      margin: 0 0 6px;
      font-size: 12px;
      line-height: 1.3;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.62);
    }
    .${OVERLAY_ID}-stat-value {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
      font-weight: 700;
    }
    .${OVERLAY_ID}-severity-neutral {
      background: rgba(148, 163, 184, 0.12);
      border-color: rgba(148, 163, 184, 0.26);
    }
    .${OVERLAY_ID}-severity-neutral .${OVERLAY_ID}-stat-value {
      color: #dbe4ef;
    }
    .${OVERLAY_ID}-severity-good {
      background: rgba(74, 222, 128, 0.14);
      border-color: rgba(74, 222, 128, 0.3);
    }
    .${OVERLAY_ID}-severity-good .${OVERLAY_ID}-stat-value {
      color: #86efac;
    }
    .${OVERLAY_ID}-severity-warning {
      background: rgba(250, 204, 21, 0.14);
      border-color: rgba(250, 204, 21, 0.28);
    }
    .${OVERLAY_ID}-severity-warning .${OVERLAY_ID}-stat-value {
      color: #fde047;
    }
    .${OVERLAY_ID}-severity-bad {
      background: rgba(251, 146, 60, 0.16);
      border-color: rgba(251, 146, 60, 0.28);
    }
    .${OVERLAY_ID}-severity-bad .${OVERLAY_ID}-stat-value {
      color: #fdba74;
    }
    .${OVERLAY_ID}-severity-very-bad {
      background: rgba(248, 113, 113, 0.16);
      border-color: rgba(248, 113, 113, 0.32);
    }
    .${OVERLAY_ID}-severity-very-bad .${OVERLAY_ID}-stat-value {
      color: #fca5a5;
    }
    #${OVERLAY_ID}-actions {
      display: flex;
      justify-content: flex-end;
    }
    #${OVERLAY_ID}-better-look {
      margin-bottom: 18px;
    }
    .${OVERLAY_ID}-section-title {
      margin: 0 0 10px;
      font-size: 12px;
      line-height: 1.3;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.62);
    }
    #${OVERLAY_ID}-good-links {
      display: grid;
      gap: 10px;
    }
    .${OVERLAY_ID}-good-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 13px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      text-decoration: none;
      transition: background 120ms ease, border-color 120ms ease;
    }
    .${OVERLAY_ID}-good-link:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.16);
    }
    .${OVERLAY_ID}-good-link:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.7);
      outline-offset: 2px;
    }
    .${OVERLAY_ID}-good-link-favicon {
      width: 20px;
      height: 20px;
      border-radius: 5px;
      flex: 0 0 auto;
    }
    .${OVERLAY_ID}-good-link-text {
      display: grid;
      gap: 3px;
      min-width: 0;
    }
    .${OVERLAY_ID}-good-link-title,
    .${OVERLAY_ID}-good-link-host {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .${OVERLAY_ID}-good-link-title {
      font-size: 14px;
      font-weight: 600;
    }
    .${OVERLAY_ID}-good-link-host {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.66);
    }
    #${OVERLAY_ID}-close {
      appearance: none;
      border: 1px solid rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      padding: 10px 14px;
      border-radius: 12px;
      font: 600 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      cursor: pointer;
    }
    #${OVERLAY_ID}-close:hover {
      background: rgba(255, 255, 255, 0.18);
    }
    #${OVERLAY_ID}-close:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.7);
      outline-offset: 2px;
    }
  `;

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Site blocked by Break the habbit");

    const panel = document.createElement("div");
    panel.id = `${OVERLAY_ID}-panel`;

    const title = document.createElement("p");
    title.id = `${OVERLAY_ID}-title`;
    title.textContent = "This site is blocked by Break the habbit.";

    const subtitle = document.createElement("p");
    subtitle.id = `${OVERLAY_ID}-subtitle`;
    subtitle.textContent = "Opening it too often or coming back too quickly pushes the numbers into worse colors.";

    const stats = document.createElement("div");
    stats.id = `${OVERLAY_ID}-stats`;
    stats.appendChild(
      createStatCard({
        idSuffix: "count",
        label: "Opened today",
        value: String(visitStats.countToday),
        severity: visitStats.countSeverity,
      })
    );
    stats.appendChild(
      createStatCard({
        idSuffix: "last-opened",
        label: "Last opened",
        value: visitStats.lastOpenedText,
        severity: visitStats.recencySeverity,
      })
    );

    const actions = document.createElement("div");
    actions.id = `${OVERLAY_ID}-actions`;

    const closeButton = document.createElement("button");
    closeButton.id = `${OVERLAY_ID}-close`;
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.tabIndex = -1;

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(stats);
    const betterLookSection = createBetterLookSection(goodLinks);
    if (betterLookSection) {
      panel.appendChild(betterLookSection);
    }
    actions.appendChild(closeButton);
    panel.appendChild(actions);
    overlay.appendChild(panel);

    const restoreScroll = () => {
      const root = document.documentElement;
      if (!root) return;

      if (root.dataset.breakTheHabbitOriginalOverflow !== undefined) {
        root.style.overflow = root.dataset.breakTheHabbitOriginalOverflow;
        delete root.dataset.breakTheHabbitOriginalOverflow;
      }

      const body = document.body;
      if (body && body.dataset.breakTheHabbitOriginalOverflow !== undefined) {
        body.style.overflow = body.dataset.breakTheHabbitOriginalOverflow;
        delete body.dataset.breakTheHabbitOriginalOverflow;
      }
    };

    const cleanup = () => {
      overlay.remove();
      style.remove();
      restoreScroll();
    };

    let isClosing = false;
    closeButton.addEventListener("pointerup", async (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (isClosing) return;
      isClosing = true;
      closeButton.disabled = true;
      try {
        await onOverlayClosed();
      } finally {
        cleanup();
      }
    });

    const root = document.documentElement;
    if (root && root.dataset.breakTheHabbitOriginalOverflow === undefined) {
      root.dataset.breakTheHabbitOriginalOverflow = root.style.overflow || "";
      root.style.overflow = "hidden";
    }
    const body = document.body;
    if (body && body.dataset.breakTheHabbitOriginalOverflow === undefined) {
      body.dataset.breakTheHabbitOriginalOverflow = body.style.overflow || "";
      body.style.overflow = "hidden";
    }

    (document.head || document.documentElement).appendChild(style);
    document.documentElement.appendChild(overlay);
  }

  async function getBlockedVisitStats(blockedDomain) {
    const { [LOCAL_STATS_KEY]: rawStats = {} } = await chrome.storage.local.get({
      [LOCAL_STATS_KEY]: {},
    });
    const statsByDomain =
      rawStats && typeof rawStats === "object" && !Array.isArray(rawStats) ? rawStats : {};

    return getBlockedSiteStatsSummary(statsByDomain[blockedDomain]);
  }

  async function recordBlockedVisit(blockedDomain) {
    const { [LOCAL_STATS_KEY]: rawStats = {} } = await chrome.storage.local.get({
      [LOCAL_STATS_KEY]: {},
    });
    const statsByDomain =
      rawStats && typeof rawStats === "object" && !Array.isArray(rawStats) ? rawStats : {};
    const now = Date.now();
    const { updatedEntry } = getNextBlockedSiteStats(statsByDomain[blockedDomain], now);

    await chrome.storage.local.set({
      [LOCAL_STATS_KEY]: {
        ...statsByDomain,
        [blockedDomain]: updatedEntry,
      },
    });
  }

  async function main() {
    const {
      [STORAGE_KEY]: blockedDomainsText = "",
      [OPACITY_KEY]: overlayOpacity = DEFAULT_OVERLAY_OPACITY,
      [GOOD_LINKS_KEY]: storedGoodLinks = [],
    } = await chrome.storage.sync.get({
      [STORAGE_KEY]: "",
      [OPACITY_KEY]: DEFAULT_OVERLAY_OPACITY,
      [GOOD_LINKS_KEY]: [],
    });
    const blockedDomains = parseBlockedDomains(blockedDomainsText);
    if (!blockedDomains.length) return;

    const matchedBlockedDomain = getMatchedBlockedDomain(window.location.hostname, blockedDomains);
    if (!matchedBlockedDomain) return;

    const visitStats = await getBlockedVisitStats(matchedBlockedDomain);
    const goodLinks = selectOverlayGoodLinks(storedGoodLinks, 5);
    blockPage(overlayOpacity, visitStats, goodLinks, () => recordBlockedVisit(matchedBlockedDomain));
  }

  main();
})();
