"use strict";

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const addForm = document.getElementById("add-form");
const addInput = document.getElementById("add-input");

let myId = null;

function makeRow(uid) {
  const tr = document.createElement("tr");

  const nameTd = document.createElement("td");
  const link = document.createElement("a");
  link.textContent = uid;
  link.href = "https://news.ycombinator.com/user?id=" + encodeURIComponent(uid);
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  nameTd.append(link);
  if (uid === myId) {
    nameTd.append(document.createTextNode(" (you)"));
  }

  const unblockTd = document.createElement("td");
  const unblock = document.createElement("button");
  unblock.textContent = "Unblock";
  unblock.onclick = async () => {
    const cur = (await chrome.storage.local.get("blocked")).blocked || [];
    await chrome.storage.local.set({ blocked: cur.filter((x) => x !== uid) });
  };
  unblockTd.append(unblock);

  tr.append(nameTd, unblockTd);
  return tr;
}

async function render() {
  const result = await chrome.storage.local.get(["blocked", "me"]);
  myId = result.me;
  const blocked = result.blocked || [];
  listEl.replaceChildren(...blocked.map(makeRow));
  emptyEl.hidden = blocked.length > 0;
}

addForm.onsubmit = async (e) => {
  e.preventDefault();
  const uid = addInput.value.trim();
  if (!uid) {
    return;
  }
  if (uid === myId) {
    addInput.value = "";
    alert("You can't block yourself.");
    return;
  }
  const cur = (await chrome.storage.local.get("blocked")).blocked || [];
  if (!cur.includes(uid)) {
    await chrome.storage.local.set({ blocked: [...cur, uid] });
  }
  addInput.value = "";
  await render();
};

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blocked) {
    render();
  }
});

render();
