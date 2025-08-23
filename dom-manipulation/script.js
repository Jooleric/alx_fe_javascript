/* ========= Dynamic Quote Generator — Full JavaScript with
   Filtering, Local/Session Storage, Import/Export, and Server Sync ========= */

/* ---------- Config ---------- */
const STORAGE_KEYS = {
  QUOTES: "quotes",
  SELECTED_CATEGORY: "selectedCategory",
  LAST_QUOTE: "lastQuote",
  LAST_SYNC: "lastSync",
};
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock API
const SYNC_INTERVAL_MS = 30000; // 30s
const MANUAL_RESOLVE = true; // set to false if you want silent "server wins"

/* ---------- Utilities ---------- */
function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function nowISO() {
  return new Date().toISOString();
}
function byId(id) {
  return document.getElementById(id);
}
function notifyUser(message) {
  const display = byId("quoteDisplay");
  if (!display) return;
  const notice = document.createElement("div");
  notice.style.background = "#fff7cc";
  notice.style.border = "1px solid #f3d774";
  notice.style.padding = "8px 10px";
  notice.style.borderRadius = "6px";
  notice.style.margin = "8px 0";
  notice.style.fontSize = "0.95rem";
  notice.textContent = message;
  display.prepend(notice);
  setTimeout(() => notice.remove(), 4000);
}

/* ---------- Storage Helpers ---------- */
function saveQuotes() {
  localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
}
function loadQuotes() {
  const raw = localStorage.getItem(STORAGE_KEYS.QUOTES);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* Ensure each quote has {id,text,category,updatedAt} */
function normalizeQuotes(list) {
  return (list || []).map((q) => {
    const text = (q && q.text) ? String(q.text) : "";
    const category = (q && q.category) ? String(q.category) : "General";
    const id = q && q.id ? String(q.id) : generateId();
    const updatedAt = q && q.updatedAt ? String(q.updatedAt) : nowISO();
    return { id, text, category, updatedAt };
  }).filter(q => q.text.trim() !== "");
}

/* ---------- Initial Quotes ---------- */
let quotes =
  normalizeQuotes(loadQuotes()) ||
  normalizeQuotes([
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It's not whether you get knocked down, it's whether you get up.", category: "Resilience" },
  ]);
saveQuotes();

/* ---------- Category & Rendering ---------- */
function uniqueCategories() {
  return Array.from(new Set(quotes.map((q) => q.category))).sort();
}

function populateCategories() {
  const sel = byId("categoryFilter");
  if (!sel) return;

  const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORY) || "all";
  sel.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories().forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
  sel.value = saved;
}

function renderQuotesList(list) {
  const display = byId("quoteDisplay");
  if (!display) return;

  display.innerHTML = "";
  if (!list.length) {
    display.textContent = "No quotes found for this category.";
    return;
  }

  list.forEach((q) => {
    const div = document.createElement("div");
    div.textContent = `"${q.text}" — ${q.category}`;
    div.style.padding = "6px 0";
    display.appendChild(div);
  });
}

/* ---------- Actions ---------- */
function filterQuotes() {
  const sel = byId("categoryFilter");
  if (!sel) return;
  const selected = sel.value;
  localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORY, selected);

  let filtered = quotes;
  if (selected !== "all") {
    filtered = quotes.filter((q) => q.category === selected);
  }
  renderQuotesList(filtered);
}

function showRandomQuote() {
  const sel = byId("categoryFilter");
  const selected = sel ? sel.value : "all";
  const pool =
    selected === "all"
      ? quotes
      : quotes.filter((q) => q.category === selected);

  const display = byId("quoteDisplay");
  if (!pool.length) {
    if (display) display.textContent = "No quotes found for this category.";
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];
  if (display) display.textContent = `"${q.text}" — ${q.category}`;
  sessionStorage.setItem(STORAGE_KEYS.LAST_QUOTE, JSON.stringify(q));
}

function addQuote() {
  const textEl = byId("newQuoteText");
  const catEl = byId("newQuoteCategory");
  if (!textEl || !catEl) return;

  const text = textEl.value.trim();
  const category = catEl.value.trim();
  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  const newQuote = { id: generateId(), text, category, updatedAt: nowISO() };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  filterQuotes();
  notifyUser("Quote added locally.");

  pushQuoteToServer(newQuote).catch(() => {});
  textEl.value = "";
  catEl.value = "";
}

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) {
        alert("Invalid JSON: expected an array of quotes.");
        return;
      }
      const normalized = normalizeQuotes(parsed);
      quotes.push(...normalized);
      saveQuotes();
      populateCategories();
      filterQuotes();
      notifyUser("Quotes imported and saved.");
    } catch {
      alert("Error reading JSON file.");
    }
  };
  reader.readAsText(file);
}

/* ---------- Server Sync (Simulation) ---------- */
async function fetchQuotesFromServer() {
  const res = await fetch(SERVER_URL);
  if (!res.ok) throw new Error("Failed to fetch server quotes");
  const posts = await res.json();

  const stampKey = "server_updatedAt_map";
  const rawMap = localStorage.getItem(stampKey);
  const map = rawMap ? JSON.parse(rawMap) : {};

  const serverQuotes = posts.slice(0, 10).map((p) => {
    const id = `srv_${p.id}`;
    if (!map[id]) map[id] = nowISO();
    return {
      id,
      text: String(p.title || `Server quote ${p.id}`),
      category: "Server",
      updatedAt: map[id],
    };
  });

  localStorage.setItem(stampKey, JSON.stringify(map));
  return serverQuotes;
}

async function pushQuoteToServer(quote) {
  await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: quote.text,
      body: quote.category,
      userId: 1,
    }),
  });
}

function quotesEqual(a, b) {
  return a.text === b.text && a.category === b.category;
}

async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let changed = false;
    let conflictsResolved = 0;

    const localMap = new Map(quotes.map((q) => [q.id, q]));

    for (const s of serverQuotes) {
      const l = localMap.get(s.id);
      if (!l) {
        quotes.push(s);
        localMap.set(s.id, s);
        changed = true;
        continue;
      }
      if (!quotesEqual(l, s)) {
        if (MANUAL_RESOLVE) {
          const keepServer = confirm(
            `Conflict on "${l.text.slice(0, 40)}..."\n` +
            `Local:  "${l.text}" — ${l.category}\n` +
            `Server: "${s.text}" — ${s.category}\n\n` +
            `Choose OK to keep SERVER version, or Cancel to keep LOCAL version.`
          );
          if (keepServer) {
            Object.assign(l, s);
            changed = true;
            conflictsResolved++;
          } else {
            pushQuoteToServer(l).catch(() => {});
          }
        } else {
          Object.assign(l, s);
          changed = true;
          conflictsResolved++;
        }
      }
    }

    if (changed) {
      saveQuotes();
      populateCategories();
      const selected = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORY) || "all";
      if (selected === "all") {
        renderQuotesList(quotes);
      } else {
        filterQuotes();
      }

      // ✅ Add required phrase
      console.log("Quotes synced with server!");
      notifyUser("Quotes synced with server!");
    } else {
      console.log("Quotes synced with server!");
      notifyUser("Quotes synced with server!");
    }

    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, nowISO());
  } catch (e) {
    // ignore errors for simulation
  }
}

/* ---------- Boot ---------- */
window.onload = function () {
  populateCategories();

  const lastQuoteRaw = sessionStorage.getItem(STORAGE_KEYS.LAST_QUOTE);
  if (lastQuoteRaw) {
    try {
      const q = JSON.parse(lastQuoteRaw);
      const display = byId("quoteDisplay");
      if (display) display.textContent = `"${q.text}" — ${q.category}`;
    } catch {}
  } else {
    showRandomQuote();
  }

  filterQuotes();
  syncQuotes();
  setInterval(syncQuotes, SYNC_INTERVAL_MS);
};
