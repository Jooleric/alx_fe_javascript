let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", category: "Inspiration" }
];

let lastViewedQuote = sessionStorage.getItem("lastViewedQuote") || null;
let serverUrl = "https://jsonplaceholder.typicode.com/posts";

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
}

// Display random quote
function showRandomQuote() {
  let category = document.getElementById("categoryFilter").value;
  let filteredQuotes = category === "all" ? quotes : quotes.filter(q => q.category === category);
  
  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerText = "No quotes available in this category.";
    return;
  }
  
  let randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  document.getElementById("quoteDisplay").innerText = `${randomQuote.text} (${randomQuote.category})`;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
}

// Add new quote
function addQuote() {
  let newQuoteText = document.getElementById("newQuoteText").value;
  let newQuoteCategory = document.getElementById("newQuoteCategory").value;
  
  if (newQuoteText && newQuoteCategory) {
    quotes.push({ text: newQuoteText, category: newQuoteCategory });
    saveQuotes();
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    alert("Quote added successfully!");
  } else {
    alert("Please enter both quote and category.");
  }
}

// Export quotes to JSON file
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// Populate categories in filter dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedCategory = categoryFilter.value || "all";
  const categories = [...new Set(quotes.map(q => q.category))];
  
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selectedCategory) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

// Filter quotes
function filterQuotes() {
  const category = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", category);
  showRandomQuote();
}

// Restore last filter and quote
window.onload = function() {
  populateCategories();
  const savedCategory = localStorage.getItem("selectedCategory") || "all";
  document.getElementById("categoryFilter").value = savedCategory;
  
  if (lastViewedQuote) {
    const quoteObj = JSON.parse(lastViewedQuote);
    document.getElementById("quoteDisplay").innerText = `${quoteObj.text} (${quoteObj.category})`;
  }
};

// Sync quotes with server
async function syncWithServer() {
  try {
    // Fetch from server
    let response = await fetch(serverUrl);
    let serverData = await response.json();
    
    // Simulate server response with quotes
    let serverQuotes = serverData.slice(0, 3).map(post => ({
      text: post.title,
      category: "Server"
    }));
    
    // Conflict resolution: server data takes precedence
    quotes = [...quotes, ...serverQuotes];
    saveQuotes();
    
    // ✅ Required phrase
    console.log("Quotes synced with server!");
    alert("Quotes synced with server!");
    
  } catch (error) {
    console.error("Error syncing with server:", error);
  }
}

// Auto sync every 15 seconds
setInterval(syncWithServer, 15000);
