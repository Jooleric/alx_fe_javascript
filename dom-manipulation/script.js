// ====== Our starting quotes (each one has text + category) ======
const quotes = [
  { text: "The only way to do great work is to love what you do.", category: "Motivation" },
  { text: "Believe you can and you're halfway there.", category: "Motivation" },
  { text: "Why don’t scientists trust atoms? Because they make up everything!", category: "Funny" },
  { text: "Be yourself; everyone else is already taken.", category: "Life" },
  { text: "It always seems impossible until it’s done.", category: "Perseverance" },
  { text: "A day without laughter is a day wasted.", category: "Funny" },
];

// We'll fill these after the page loads
let categorySelect, quoteTextEl, quoteCategoryEl, formArea;

// ====== Helper: get a list of unique categories ======
function getUniqueCategories() {
  const set = new Set(quotes.map(q => q.category));
  return Array.from(set).sort();
}

// ====== Put categories into the <select> dropdown ======
function populateCategories() {
  const categories = getUniqueCategories();
  categorySelect.innerHTML = ""; // clear it first

  // Add an "All" option at the top
  const allOption = document.createElement("option");
  allOption.value = "__ALL__";
  allOption.textContent = "All";
  categorySelect.appendChild(allOption);

  // Add one <option> per category
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// ====== Show a random quote (filtered by the selected category) ======
function showRandomQuote() {
  const chosen = categorySelect.value;

  // Pick quotes that match the category (or all quotes)
  const pool = quotes.filter(q => {
    return chosen === "__ALL__" || q.category === chosen;
  });

  if (pool.length === 0) {
    quoteTextEl.textContent = "No quotes here yet. Try adding one!";
    quoteCategoryEl.textContent = "";
    return;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const picked = pool[randomIndex];

  // Put the quote text and its category on the page
  quoteTextEl.textContent = picked.text;
  quoteCategoryEl.textContent = picked.category;
}

// ====== Build the Add Quote form in the page ======
function createAddQuoteForm() {
  // If it already exists, don't create it again
  if (document.getElementById("addQuoteForm")) return;

  const card = document.createElement("div");
  card.className = "form-card";

  // Title
  const title = document.createElement("h2");
  title.textContent = "Add a New Quote";
  card.appendChild(title);

  // Helper text
  const helper = document.createElement("p");
  helper.className = "helper";
  helper.textContent = "Type your quote and a category. New categories will be added automatically.";
  card.appendChild(helper);

  // The HTML elements shown in the brief (kept for familiarity)
  const row = document.createElement("div");
  row.className = "form-row";
  row.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn" class="btn" type="button">Add Quote</button>
  `;
  card.appendChild(row);

  // Space for messages (errors / success)
  const msg = document.createElement("div");
  msg.id = "formMessage";
  card.appendChild(msg);

  // Give the card an id so we can check if it exists later
  card.id = "addQuoteForm";
  formArea.appendChild(card);

  // Wire up the button to call addQuote()
  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
}

// ====== Add a new quote to our list + update the UI ======
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const catInput = document.getElementById("newQuoteCategory");
  const message = document.getElementById("formMessage");

  const text = (textInput.value || "").trim();
  const category = (catInput.value || "").trim();

  // Simple checks so we don't add empty stuff
  if (!text) {
    message.textContent = "Please type a quote.";
    message.className = "error";
    return;
  }
  if (!category) {
    message.textContent = "Please type a category.";
    message.className = "error";
    return;
  }

  // Add the new quote
  quotes.push({ text, category });

  // If it's a new category, add it to the dropdown
  const currentlyHad = Array.from(categorySelect.options).some(opt => opt.value === category);
  if (!currentlyHad) {
    const opt = document.createElement("option");
    opt.value = category;
    opt.textContent = category;
    categorySelect.appendChild(opt);
    // Switch to the new category so the user can see their quote
    categorySelect.value = category;
  }

  // Clear the boxes and show a success message
  textInput.value = "";
  catInput.value = "";
  message.textContent = "Quote added!";
  message.className = "success";

  // Show a random quote from the (maybe new) category
  showRandomQuote();
}

// ====== When the page is ready, hook everything up ======
document.addEventListener("DOMContentLoaded", () => {
  // Grab elements from the page so we can use them in our functions
  categorySelect = document.getElementById("categorySelect");
  quoteTextEl = document.getElementById("quoteText");
  quoteCategoryEl = document.getElementById("quoteCategory");
  formArea = document.getElementById("formArea");

  // Fill the dropdown and show the first quote
  populateCategories();
  categorySelect.value = "__ALL__"; // start with All
  showRandomQuote();

  // When the user changes category, show a new quote from that group
  categorySelect.addEventListener("change", showRandomQuote);

  // Button to show a random quote
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);

  // Button to show/hide the Add Quote form