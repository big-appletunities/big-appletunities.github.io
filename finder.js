const csvPath = "data/appletunities.csv";
const searchInput = document.getElementById("searchInput");
const categoryFilters = document.getElementById("categoryFilters");
const resultsGrid = document.getElementById("resultsGrid");
const resultsCount = document.getElementById("resultsCount");

let rows = [];
let activeCategory = "All";
let searchTerm = "";

async function loadAppletunities() {
  try {
    const response = await fetch(csvPath);
    const csvText = await response.text();
    rows = parseCSV(csvText);
    renderCategoryFilters(rows);
    renderResults();
  } catch (error) {
    resultsCount.textContent = "Dataset could not be loaded.";
    resultsGrid.innerHTML = `<div class="empty-state">Unable to read ${csvPath}.</div>`;
    console.error(error);
  }
}

function parseCSV(csvText) {
  const data = [];
  const lines = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      if (field.length || row.length) {
        row.push(field.trim());
        lines.push(row);
      }

      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.trim());
    lines.push(row);
  }

  const [headers, ...records] = lines;

  records.forEach((record) => {
    if (!record.some(Boolean)) {
      return;
    }

    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = record[index] ?? "";
    });
    data.push(entry);
  });

  return data;
}

function renderCategoryFilters(entries) {
  const categories = ["All", ...new Set(entries.map((entry) => entry.Category).filter(Boolean))];

  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button class="chip ${category === activeCategory ? "active" : ""}" data-category="${category}">
          ${category}
        </button>
      `
    )
    .join("");

  categoryFilters.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderCategoryFilters(rows);
      renderResults();
    });
  });
}

function renderResults() {
  const filteredRows = rows.filter((entry) => {
    const matchesCategory = activeCategory === "All" || entry.Category === activeCategory;
    const haystack = [entry.Name, entry.Borough, entry.Audience, entry.Description, entry.Category]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  resultsCount.textContent = `${filteredRows.length} appletunities shown`;

  if (!filteredRows.length) {
    resultsGrid.innerHTML =
      '<div class="empty-state">No appletunities matched this filter combination.</div>';
    return;
  }

  resultsGrid.innerHTML = filteredRows
    .map(
      (entry) => `
        <article class="results-card">
          <div class="results-meta">
            <span>${entry.Category}</span>
            <span>${entry.Borough}</span>
            <span>${entry.Audience}</span>
          </div>
          <h3>${entry.Name}</h3>
          <p>${entry.Description}</p>
          <p><strong>Season:</strong> ${entry.Season}</p>
          <a class="results-link" href="${entry.Link}" target="_blank" rel="noreferrer">View source</a>
        </article>
      `
    )
    .join("");
}

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderResults();
});

loadAppletunities();
