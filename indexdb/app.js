// Minimal IndexedDB helper (via CDN)
import { get, set, del, keys } from "https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/esm/index.js";

// Keys in IndexedDB will look like: "grocery:<id>"
const $ = (sel) => document.querySelector(sel);
const els = {
  input: $('#itemInput'),
  add:   $('#addBtn'),
  clear: $('#clearBtn'),
  list:  $('#list'),
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2);
}

async function loadAll() {
  const ks = await keys();
  const ours = ks.filter(k => String(k).startsWith('grocery:'));
  const items = [];
  for (const k of ours) items.push(await get(k)); // {id, text, addedAt}
  // newest first
  items.sort((a,b) => b.addedAt - a.addedAt);
  return items;
}

function itemRow(item) {
  const li = document.createElement('li');
  const left = document.createElement('span');
  left.textContent = item.text;
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Delete';
  delBtn.addEventListener('click', async () => {
    await del('grocery:' + item.id);
    render();
  });
  li.appendChild(left);
  li.appendChild(delBtn);
  return li;
}

async function render() {
  const items = await loadAll();
  els.list.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No items yet. Add something above!';
    els.list.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  items.forEach(i => frag.appendChild(itemRow(i)));
  els.list.appendChild(frag);
}

async function addItem() {
  const text = els.input.value.trim();
  if (!text) return;
  const item = { id: uid(), text, addedAt: Date.now() };
  await set('grocery:' + item.id, item);
  els.input.value = '';
  render();
}

els.add.addEventListener('click', addItem);
els.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addItem();
});

els.clear.addEventListener('click', async () => {
  const ks = await keys();
  const ours = ks.filter(k => String(k).startsWith('grocery:'));
  await Promise.all(ours.map(k => del(k)));
  render();
});

// first paint
render();
