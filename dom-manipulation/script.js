let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
  { text: "It's not whether you get knocked down, it's whether you get up.", category: "Resilience" }
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function showRandomQuote() {
  const category = document.getElementById("categoryFilter").value;
  let filteredQuotes = quotes;

  if (category !== "all") {
    filteredQuotes = quotes.filter(q => q.category === category);
  }

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerText = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const q = filteredQuotes[randomIndex];
  document.getElementById("quoteDisplay").innerText = `"${q.text}" — ${q.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(q));
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    alert("Quote added!");
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("Please enter both quote and category!");
  }
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
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid file format!");
      }
    } catch (e) {
      alert("Error reading JSON file!");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    categoryFilter.value = savedFilter;
    filterQuotes();
  }
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const display = document.getElementById("quoteDisplay");
  display.innerHTML = "";

  let filteredQuotes = quotes;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    display.innerText = "No quotes found for this category.";
    return;
  }

  filteredQuotes.forEach(q => {
    const div = document.createElement("div");
    div.innerText = `"${q.text}" — ${q.category}`;
    display.appendChild(div);
  });
}

window.onload = function() {
  populateCategories();
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerText = `"${q.text}" — ${q.category}`;
  }
};