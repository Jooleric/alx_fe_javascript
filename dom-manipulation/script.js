/* ========= Dynamic Quote Generator ========= */

/* ---------- Utility ---------- */
function byId(id) {
  return document.getElementById(id);
}

function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function notifyUser(message) {
  const quoteCard = byId("quoteCard");
  if (!quoteCard) return;
  const notice = document.createElement("div");
  notice.textContent = message;
  notice.style.background = "#fff7cc";
  notice.style.border = "1px solid #f3d774";
  notice.style.padding = "8px 10px";
  notice.style.borderRadius = "6px";
  notice.style.margin = "8px 0";
  quoteCard.prepend(notice);
  setTimeout(() => notice.remove(), 3000);
}

/* ---------- Storage ---------- */
let quotes = JSON.parse(localStorage.getItem("quotes") || "[]");
if (!quotes.length) {
  quotes = [
    { id: generateId(), text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { id: generateId(), text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
    { id: generateId(), text: "It's not whether you get knocked down, it's whether you get up.", category: "Resilience" },
  ];
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function normalizeQuotes(list) {
  return (list || []).map(q => ({
    id: q.id || generateId(),
    text: String(q.text || ""),
    category: String(q.category || "General"),
  })).filter(q => q.text.trim() !== "");
}

/* ---------- Category ---------- */
function populateCategories() {
  const sel = byId("categorySelect");
  if (!sel) return;
  const saved = localStorage.getItem("selectedCategory") || "all";
  sel.innerHTML = `<option value="all">All Categories</option>`;
  const cats = Array.from(new Set(quotes.map(q => q.category))).sort();
  cats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
  sel.value = saved;
}

function filterQuotes() {
  const sel = byId("categorySelect");
  if (!sel) return;
  const selected = sel.value;
  localStorage.setItem("selectedCategory", selected);
}

/* ---------- Display Quote ---------- */
function showRandomQuote() {
  const sel = byId("categorySelect");
  const selected = sel ? sel.value : "all";
  const pool = selected === "all" ? quotes : quotes.filter(q => q.category === selected);

  if (!pool.length) {
    byId("quoteText").textContent = "No quotes found for this category.";
    byId("quoteCategory").textContent = "";
    return;
  }

  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];

  byId("quoteText").textContent = `"${q.text}"`;
  byId("quoteCategory").textContent = `— ${q.category}`;

  // Save last viewed quote
  sessionStorage.setItem("lastQuote", JSON.stringify(q));
}

/* ---------- Add Quote ---------- */
function createAddQuoteForm() {
  const formArea = byId("formArea");
  if (!formArea) return;

  formArea.innerHTML = `
    <form id="addQuoteForm">
      <input type="text" id="newQuoteText" placeholder="Your quote" required />
      <input type="text" id="newQuoteCategory" placeholder="Category" required />
      <button type="submit">Add Quote</button>
    </form>
  `;

  const form = byId("addQuoteForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addQuote();
  });
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

  const newQuote = { id: generateId(), text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  filterQuotes();
  notifyUser("Quote added successfully!");

  textEl.value = "";
  catEl.value = "";
}

/* ---------- Export / Import ---------- */
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
      quotes.push(...normalizeQuotes(parsed));
      saveQuotes();
      populateCategories();
      filterQuotes();
      notifyUser("Quotes imported successfully!");
    } catch {
      alert("Error reading JSON file.");
    }
  };
  reader.readAsText(file);
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  filterQuotes();

  // Load last quote
  const lastQuoteRaw = sessionStorage.getItem("lastQuote");
  if (lastQuoteRaw) {
    try {
      const q = JSON.parse(lastQuoteRaw);
      byId("quoteText").textContent = `"${q.text}"`;
      byId("quoteCategory").textContent = `— ${q.category}`;
    } catch {}
  } else {
    showRandomQuote();
  }

  // Event listeners
  byId("newQuote")?.addEventListener("click", showRandomQuote);
  byId("toggleForm")?.addEventListener("click", createAddQuoteForm);
  byId("exportBtn")?.addEventListener("click", exportToJsonFile);
  byId("importFile")?.addEventListener("change", importFromJsonFile);
});
