# HN Blocker

**WARNING: THIS ENTIRE THING IS 100% VIBE CODED. DO NOT TRUST IT.**

A crude Firefox extension that blocks Hacker News users: it hides their
comments and stories on classic `news.ycombinator.com` pages, and adds a
**Block / Unblock** button to their profile pages.

## What it does

- **Comment hiding:** every `tr.comtr` row whose user link points to a
  blocked user is hidden, replaced by a grey
  `Comment by <user> hidden (HN Blocker)` marker row. Because HN nests
  replies inside the parent comment's row, hiding a comment also hides the
  whole reply chain under it — that's the crude part.
- **Story hiding:** if a blocked user posted a story (via the `by` link in
  the story row), the whole story row is hidden with a marker.
- **Profile pages:** visiting `user?id=<user>` shows a `Block <user>` button
  next to the username (or `Unblock <user>` if already blocked). A blocked
  profile also shows a banner at the top.
- **Popup:** the toolbar icon lists all blocked users with one-click
  unblock buttons.
- **Storage:** the blocklist lives in `chrome.storage.local` under the key
  `blocked` (a string array of user ids). No server, no analytics, no
  network access of its own.

## Files

| file           | purpose                                             |
| -------------- | --------------------------------------------------- |
| `manifest.json`| MV3 manifest; content script on `news.ycombinator.com` and `news.yc.com`, options page |
| `content.js`   | hides rows, injects markers, profile button/banner  |
| `popup.html` / `popup.js` | quick unblock + link to options page   |
| `options.html` / `options.js` | view/edit the blocklist (add, unblock, profile links) |

## Loading it in Firefox

No system changes required. Two options:

1. **Temporary (easiest, until browser restart):**
   open `about:debugging#firefox` → *Temporary Add-ons* → *Load Temporary
   Add-on…* → pick this directory.

2. **Persistent:** zip the four files (keep `manifest.json` at the zip
   root), then in `about:addons` click the gear → *Install Add-on From
   File…* → pick the zip. Firefox will warn that it's unsigned; accept it
   (it only works in non-strict ESR releases, e.g. Firefox Developer
   Edition/Nightly, or desktop Firefox with the policy to allow unsigned).

## Test

`samplepage.html` in this directory is a saved comment page where `<user>`
posts. Open it with the extension loaded and `<user>` blocked — all 8 of
their comments are replaced by marker rows. `sampleprofile.html` is their
profile page — it gets the Block button.

## Limitations (it's crude)

- Classic HTML pages only. HN's React pages (inbox, item pages on some
  layouts) don't have `tr.comtr` rows, so nothing gets hidden there.
- Hiding is cosmetic: the blocked user's text is still in the DOM, and
  nothing stops you from viewing source.
- No per-thread or per-story scope, no sync across browsers.
