# Break the habbit (Chrome extension)

This is a minimal Chrome (Manifest V3) extension that blocks configured domains (and their subdomains) by showing a full-screen overlay.

## Install (Load unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder (`break-the-habbit-chrome-extension`)

## What it does

- Runs a content script on `<all_urls>`
- If the current hostname matches your blocked list (exact domain or any subdomain), shows an overlay with a centered **Close** button

## Configure blocked domains

1. Open `chrome://extensions`
2. Find **Break the habbit** → **Details**
3. Open **Extension options**
4. Add one domain per line (e.g. `example.com`)
