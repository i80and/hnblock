"use strict";

const manageEl = document.getElementById("manage");

async function main() {
  manageEl.onclick = () => {
    chrome.runtime.openOptionsPage();
  };

  const listEl = document.getElementById("list");
  const hintEl = document.getElementById("hint");
  const result = await chrome.storage.local.get("blocked");
  const blocked = result.blocked || [];

  if (blocked.length === 0) {
    return;
  }
  hintEl.textContent = "Blocked users:";
  for (const uid of blocked) {
    const label = document.createElement("label");
    label.append(document.createTextNode(uid + " "));
    const unblock = document.createElement("button");
    unblock.textContent = "unblock";
    unblock.onclick = async () => {
      const cur = (await chrome.storage.local.get("blocked")).blocked || [];
      await chrome.storage.local.set({ blocked: cur.filter((x) => x !== uid) });
      window.close();
    };
    label.append(unblock);
    listEl.append(label);
  }
}

main();
