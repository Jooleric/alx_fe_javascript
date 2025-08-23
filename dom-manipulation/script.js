// ====== Save & Load Helpers ======
function saveQuotes() {
localStorage.setItem("quotes", JSON.stringify(quotes));
}


function loadQuotes() {
const stored = localStorage.getItem("quotes");
if (stored) {
try {
return JSON.parse(stored);
} catch (err) {
console.error("Error parsing quotes from localStorage", err);
return [];
}
}
return [];
}

// ====== Our Quotes ======
function importFromJsonFile(event) {
const fileReader = new FileReader();
fileReader.onload = function(e) {
try {
const importedQuotes = JSON.parse(e.target.result);
if (Array.isArray(importedQuotes)) {
quotes.push(...importedQuotes);
saveQuotes();
populateCategories();
alert("Quotes imported successfully!");
} else {
alert("Invalid JSON format.");
}
} catch (err) {
alert("Error reading JSON file.");
}
};
fileReader.readAsText(event.target.files[0]);
}


// ====== Setup on Page Load ======
document.addEventListener("DOMContentLoaded", () => {
categorySelect = document.getElementById("categorySelect");
quoteTextEl = document.getElementById("quoteText");
quoteCategoryEl = document.getElementById("quoteCategory");
formArea = document.getElementById("formArea");


populateCategories();
categorySelect.value = "__ALL__";


const last = sessionStorage.getItem("lastQuote");
if (last) {
const parsed = JSON.parse(last);
quoteTextEl.textContent = parsed.text;
quoteCategoryEl.textContent = parsed.category;
} else {
showRandomQuote();
}


categorySelect.addEventListener("change", showRandomQuote);
document.getElementById("newQuote").addEventListener("click", showRandomQuote);


const toggleBtn = document.getElementById("toggleForm");
toggleBtn.addEventListener("click", () => {
if (!document.getElementById("addQuoteForm")) {
createAddQuoteForm();
} else {
const form = document.getElementById("addQuoteForm");
const isHidden = form.style.display === "none";
form.style.display = isHidden ? "block" : "none";
toggleBtn.textContent = isHidden ? "Hide Add Quote" : "Add Your Own Quote";
}
});


document.getElementById("exportBtn").addEventListener("click", exportToJsonFile);
document.getElementById("importFile").addEventListener("change", importFromJsonFile);
});