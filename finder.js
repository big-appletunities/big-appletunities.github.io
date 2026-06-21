const csvPath = "data/appletunities.csv";
const searchInput = document.getElementById("searchInput");
const categoryFilters = document.getElementById("categoryFilters");
const subjectFilters = document.getElementById("subjectFilters");
const costFilters = document.getElementById("costFilters");
const audienceFilters = document.getElementById("audienceFilters");
const resultsGrid = document.getElementById("resultsGrid");
const resultsCount = document.getElementById("resultsCount");

let rows = [];
let activeCategory = "All";
let activeSubject = "All";
let activeCost = "All";
let activeAudience = "All";
let searchTerm = "";

function parseDeadline(deadlineStr) {
  if (!deadlineStr) return new Date(9999, 11, 31); // Far future date for empty deadlines
  
  // Handle MM/DD/YY format
  const parts = deadlineStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1; // JavaScript months are 0-based
    const day = parseInt(parts[1]);
    const year = 2000 + parseInt(parts[2]); // Convert YY to YYYY
    return new Date(year, month, day);
  }
  
  // Fallback for other formats
  return new Date(deadlineStr);
}

async function loadAppletunities() {
  try {
    const response = await fetch(csvPath);
    const csvText = await response.text();
    rows = parseCSV(csvText);
    
    // Filter out entries with N/A in Cost or Subject
    rows = rows.filter(entry => entry.Cost !== "N/A" && entry.Subject !== "N/A");
    
    // Sort rows by deadline (earliest first)
    rows.sort((a, b) => {
      const dateA = parseDeadline(a.Deadline);
      const dateB = parseDeadline(b.Deadline);
      return dateA - dateB;
    });
    
    renderCategoryFilters(rows);
    renderSubjectFilters(rows);
    renderCostFilters(rows);
    renderAudienceFilters(rows);
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

function truncateDescription(description, maxLength = 150) {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength).trim() + "...";
}

function showDescriptionModal(title, fullDescription, link, instaLink) {
  // Remove any existing modals first
  const existingModal = document.querySelector('.description-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  const modal = document.createElement('div');
  modal.className = 'description-modal';
  modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background-color: rgba(0, 0, 0, 0.5) !important; display: flex !important; justify-content: center !important; align-items: center !important; z-index: 9999 !important;';
  
  modal.innerHTML = `
    <div class="modal-content" style="background: white; border-radius: 12px; max-width: 600px; max-height: 80vh; width: 90%; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); overflow: hidden;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #ddd; background: #f8f0e2;">
        <h2 style="margin: 0; color: #6e2d23; font-size: 1.5rem; font-weight: 700;">${title}</h2>
        <button class="modal-close" style="background: none; border: none; font-size: 2rem; color: #6e2d23; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto; color: #6e2d23; line-height: 1.6;">
        <p>${fullDescription}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 15px;">
          ${link && link !== "N/A" ? `<a class="modal-link" href="${link}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 8px 16px; background: #f37a52; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Website link</a>` : ''}
          ${instaLink && instaLink !== "N/A" ? `<a class="modal-link" href="${instaLink}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 8px 16px; background: #f37a52; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Instagram Link</a>` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal when clicking close button or outside modal
  modal.querySelector('.modal-close').addEventListener('click', () => {
    if (modal.parentNode) {
      document.body.removeChild(modal);
    }
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (modal.parentNode) {
        document.body.removeChild(modal);
      }
    }
  });
}

function renderCategoryFilters(entries) {
  const categories = ["All", ...new Set(entries.map((entry) => entry.Category).filter(val => val && val !== "N/A"))];

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

function renderSubjectFilters(entries) {
  const subjects = ["All", ...new Set(entries.map((entry) => entry.Subject).filter(val => val && val !== "N/A"))];

  subjectFilters.innerHTML = subjects
    .map(
      (subject) => `
        <button class="chip ${subject === activeSubject ? "active" : ""}" data-subject="${subject}">
          ${subject}
        </button>
      `
    )
    .join("");

  subjectFilters.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeSubject = button.dataset.subject;
      renderSubjectFilters(rows);
      renderResults();
    });
  });
}

function renderCostFilters(entries) {
  const costs = ["All", ...new Set(entries.map((entry) => entry.Cost).filter(val => val && val !== "N/A"))];

  costFilters.innerHTML = costs
    .map(
      (cost) => `
        <button class="chip ${cost === activeCost ? "active" : ""}" data-cost="${cost}">
          ${cost}
        </button>
      `
    )
    .join("");

  costFilters.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeCost = button.dataset.cost;
      renderCostFilters(rows);
      renderResults();
    });
  });
}

function renderAudienceFilters(entries) {
  const audiences = ["All", ...new Set(entries.map((entry) => entry.Audience).filter(val => val && val !== "N/A"))];

  audienceFilters.innerHTML = audiences
    .map(
      (audience) => `
        <button class="chip ${audience === activeAudience ? "active" : ""}" data-audience="${audience}">
          ${audience}
        </button>
      `
    )
    .join("");

  audienceFilters.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeAudience = button.dataset.audience;
      renderAudienceFilters(rows);
      renderResults();
    });
  });
}

function renderResults() {
  const filteredRows = rows.filter((entry) => {
    const matchesCategory = activeCategory === "All" || entry.Category === activeCategory;
    const matchesSubject = activeSubject === "All" || entry.Subject === activeSubject;
    const matchesCost = activeCost === "All" || entry.Cost === activeCost;
    const matchesAudience = activeAudience === "All" || entry.Audience === activeAudience;
    const haystack = [entry.Name, entry.Subject, entry.Location, entry.Audience, entry.Description, entry.Category]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSubject && matchesCost && matchesAudience && matchesSearch;
  });

  resultsCount.textContent = `${filteredRows.length} appletunities shown`;

  if (!filteredRows.length) {
    resultsGrid.innerHTML =
      '<div class="empty-state">No appletunities matched this filter combination.</div>';
    return;
  }

  resultsGrid.innerHTML = filteredRows
    .map(
      (entry, index) => `
        <article class="results-card" data-entry-index="${index}">
          <div class="results-meta">
            <span>${entry.Category}</span>
            <span>${entry.Subject}</span>
            ${entry.Cost !== "N/A" ? `<span>${entry.Cost}</span>` : ''}
            ${entry.Location !== "N/A" ? `<span>${entry.Location}</span>` : ''}
            <span>${entry.Audience}</span>
          </div>
          <h3 class="clickable-title">${entry.Name}</h3>
          <p class="clickable-description">${truncateDescription(entry.Description)}</p>
          ${entry.Deadline !== "N/A" ? `<p><strong>Deadline:</strong> ${entry.Deadline}</p>` : ''}
          ${entry.Dates !== "N/A" ? `<p><strong>Dates:</strong> ${entry.Dates}</p>` : ''}
          <div class="results-links">
            ${entry.Link !== "N/A" ? `<a class="results-link" href="${entry.Link}" target="_blank" rel="noreferrer">Website link</a>` : ''}
            ${entry['Insta link'] !== "N/A" ? `<a class="results-link" href="${entry['Insta link']}" target="_blank" rel="noreferrer">Instagram</a>` : ''}
          </div>
        </article>
      `
    )
    .join("");

  // Store the current filtered rows for modal access
  resultsGrid.dataset.filteredRows = JSON.stringify(filteredRows);
}

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderResults();
});

// Event delegation for modal clicks
resultsGrid.addEventListener('click', (e) => {
  if (e.target.classList.contains('clickable-title') || e.target.classList.contains('clickable-description')) {
    const card = e.target.closest('.results-card');
    const index = parseInt(card.dataset.entryIndex);
    const filteredRows = JSON.parse(resultsGrid.dataset.filteredRows);
    const entry = filteredRows[index];
    showDescriptionModal(entry.Name, entry.Description, entry.Link, entry['Insta link']);
  }
});

loadAppletunities();
