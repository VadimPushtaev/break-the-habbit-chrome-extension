(() => {
  const OVERLAY_ID = "break-the-habbit-overlay";

  if (document.getElementById(OVERLAY_ID)) return;

  const STORAGE_KEY = "blockedDomains";
  const { isHostnameBlocked, parseBlockedDomains } = BreakTheHabbitDomainUtils;

  function blockPage() {
    if (document.getElementById(OVERLAY_ID)) return;

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
      background: rgba(0, 0, 0, 0.92);
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
      padding: 20px 18px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.35);
      text-align: center;
    }
    #${OVERLAY_ID}-title {
      font-size: 16px;
      line-height: 1.3;
      margin: 0 0 14px;
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

    const closeButton = document.createElement("button");
    closeButton.id = `${OVERLAY_ID}-close`;
    closeButton.type = "button";
    closeButton.textContent = "Close";

    panel.appendChild(title);
    panel.appendChild(closeButton);
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
      document.removeEventListener("keydown", onKeyDown, true);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") cleanup();
    };

    closeButton.addEventListener("click", cleanup);

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
    document.addEventListener("keydown", onKeyDown, true);

    const focusClose = () => {
      try {
        closeButton.focus({ preventScroll: true });
      } catch {
        closeButton.focus();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", focusClose, { once: true });
    } else {
      focusClose();
    }
  }

  async function main() {
    const { [STORAGE_KEY]: blockedDomainsText = "" } =
      await chrome.storage.sync.get({ [STORAGE_KEY]: "" });
    const blockedDomains = parseBlockedDomains(blockedDomainsText);
    if (!blockedDomains.length) return;

    if (isHostnameBlocked(window.location.hostname, blockedDomains)) {
      blockPage();
    }
  }

  main();
})();
