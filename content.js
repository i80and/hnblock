/* HN Blocker — content script.
 *
 * Crude blocking of HN users on classic (table-based) pages:
 *  - every blocked user's comment rows (tr.comtr) are hidden
 *  - every blocked user's story rows (tr.athing) are hidden
 *  - a small grey marker row is inserted in their place
 *  - profile pages get a Block/Unblock button; blocked profiles get a banner
 *
 * State lives in chrome.storage.local under the "blocked" key (string array).
 */
"use strict";

const registry = {
  hidden: new Map(), // tr element -> true
  markers: [], // tr elements we created
};

/** The id of the currently logged-in user, from the top nav ("#me"). */
function getMyUserId() {
  const me = document.getElementById("me");
  return me ? userAnchorToId(me) : null;
}

// Computed before applyState below runs.
const myId = getMyUserId();

async function rememberMe() {
  if (!myId) {
    return;
  }
  const cur = (await chrome.storage.local.get("me")).me;
  if (cur !== myId) {
    await chrome.storage.local.set({ me: myId });
  }
}

function reset() {
  for (const tr of registry.hidden.keys()) {
    tr.style.display = "";
  }
  registry.hidden.clear();
  for (const m of registry.markers) {
    m.remove();
  }
  registry.markers = [];
}

async function getBlocked() {
  const result = await chrome.storage.local.get("blocked");
  return new Set(result.blocked || []);
}

/** Extract the user id from a user link, or null if it isn't a user link. */
function userAnchorToId(a) {
  try {
    const u = new URL(a.href);
    if (u.pathname !== "/user") {
      return null;
    }
    return u.searchParams.get("id") || u.searchParams.get("name") || null;
  } catch {
    return null;
  }
}

function hideRow(tr, type, uid) {
  if (registry.hidden.has(tr)) {
    return;
  }
  const marker = document.createElement("tr");
  marker.classList.add("hnblocker-marker");
  const td = document.createElement("td");
  td.colSpan = 3;
  td.className = "default";
  td.style.cssText = "color:#888; font-size:11px; padding:2px 0;";
  const b = document.createElement("b");
  b.textContent = uid;
  td.append(document.createTextNode(type + " by "), b, document.createTextNode(" hidden (HN Blocker)"));
  marker.append(td);
  tr.parentNode.insertBefore(marker, tr);
  tr.style.display = "none";
  registry.hidden.set(tr, true);
  registry.markers.push(marker);
}

async function applyState() {
  reset();
  let blocked = await getBlocked();
  // Self-heal: you can't block yourself; drop a stale self-entry if present.
  if (myId && blocked.has(myId)) {
    blocked.delete(myId);
    await chrome.storage.local.set({ blocked: [...blocked] });
  }
  updateProfileUI(blocked);
  // Profile pages just show the button/banner; don't hide their own rows.
  if (location.pathname === "/user" || blocked.size === 0) {
    return;
  }
  const anchors = document.querySelectorAll('a[href*="user?id="], a[href*="user?name="]');
  for (const a of anchors) {
    const uid = userAnchorToId(a);
    if (!uid || uid === myId || !blocked.has(uid)) {
      continue;
    }
    const cTr = a.closest("tr.comtr");
    if (cTr) {
      hideRow(cTr, "Comment", uid);
      continue;
    }
    const sTr = a.closest("tr.athing");
    if (sTr) {
      hideRow(sTr, "Story", uid);
    }
  }
}

function ensureProfileButton(uid, blocked) {
  let btn = document.getElementById("hnblocker-btn");
  if (btn) {
    btn.textContent = blocked.has(uid) ? "Unblock " + uid : "Block " + uid;
    return;
  }
  const link = document.querySelector("#bigbox a.hnuser");
  if (!link) {
    return;
  }
  btn = document.createElement("button");
  btn.id = "hnblocker-btn";
  btn.style.cssText = "margin-top:6px;";
  btn.textContent = blocked.has(uid) ? "Unblock " + uid : "Block " + uid;
  btn.onclick = () => toggleBlocked(uid);
  link.after(btn);
}

async function toggleBlocked(uid) {
  if (uid === myId) {
    return; // you can't block yourself
  }
  const set = await getBlocked();
  if (set.has(uid)) {
    set.delete(uid);
  } else {
    set.add(uid);
  }
  await chrome.storage.local.set({ blocked: [...set] });
  await applyState();
}

function updateProfileUI(blocked) {
  if (location.pathname !== "/user") {
    return;
  }
  const params = new URLSearchParams(location.search);
  const uid = params.get("id") || params.get("name");
  if (!uid || uid === myId) {
    return;
  }
  ensureProfileButton(uid, blocked);

  let banner = document.getElementById("hnblocker-banner");
  if (blocked.has(uid)) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "hnblocker-banner";
      banner.style.cssText =
        "max-width:85%; margin:8px auto 0; padding:8px; background:#f6f6ef; border:1px solid #e0e0d0; color:#a00; text-align:center;";
      document.body.prepend(banner);
    }
    banner.textContent =
      "You have blocked " + uid + ". Their comments and stories are hidden on other pages.";
  } else if (banner) {
    banner.remove();
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blocked) {
    applyState();
  }
});

applyState();
rememberMe();
