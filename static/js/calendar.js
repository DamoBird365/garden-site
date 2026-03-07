/**
 * Interactive Planting Calendar for NE Scotland
 * Reads from /data/planting-calendar.json and blog post planting data
 */
(function () {
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const COLOURS = {
    sowIndoors: "#FFB347",
    sowOutdoors: "#7BC67E",
    plantOut: "#5B9BD5",
    harvest: "#E8665D",
    planted: "#2D5016",
  };

  async function loadCalendarData() {
    try {
      const res = await fetch("/data/planting-calendar.json");
      if (!res.ok) throw new Error("Failed to load calendar data");
      return await res.json();
    } catch (err) {
      console.error("Calendar data error:", err);
      return null;
    }
  }

  async function loadPlantedData() {
    try {
      const res = await fetch("/index.json");
      if (!res.ok) return [];
      const data = await res.json();
      return data.filter(
        (post) =>
          post.vegetables_planted && post.vegetables_planted.length > 0
      );
    } catch {
      return [];
    }
  }

  function monthToCol(monthNum) {
    // monthNum can be decimal (5.5 = late May)
    return Math.floor(monthNum) - 1;
  }

  function createCalendarGrid(vegetables, plantedPosts) {
    const container = document.getElementById("planting-calendar");
    if (!container) return;

    // Build planted lookup: { "Carrots": [{date, url, title}] }
    const plantedMap = {};
    plantedPosts.forEach((post) => {
      (post.vegetables_planted || []).forEach((veg) => {
        const vegLower = veg.toLowerCase();
        if (!plantedMap[vegLower]) plantedMap[vegLower] = [];
        plantedMap[vegLower].push({
          date: post.date,
          url: post.permalink,
          title: post.title,
        });
      });
    });

    // Current month highlight
    const currentMonth = new Date().getMonth(); // 0-based

    let html = '<div class="calendar-table-wrap"><table class="calendar-table">';

    // Header row
    html += "<thead><tr><th class=\"veg-header\">Vegetable</th>";
    MONTHS.forEach((m, i) => {
      const isCurrent = i === currentMonth ? ' class="current-month"' : "";
      html += `<th${isCurrent}>${m}</th>`;
    });
    html += "</tr></thead><tbody>";

    vegetables.forEach((veg) => {
      const vegLower = veg.name.toLowerCase();
      const hasPlanted = plantedMap[vegLower] && plantedMap[vegLower].length > 0;

      html += `<tr class="veg-row" data-veg="${veg.name}">`;
      html += `<td class="veg-name-cell">${veg.emoji} ${veg.name}${hasPlanted ? ' <span class="planted-badge">🌱</span>' : ""}</td>`;

      for (let m = 0; m < 12; m++) {
        let classes = [];
        let title = [];

        if (veg.sowIndoors && m + 1 >= veg.sowIndoors.start && m + 1 <= veg.sowIndoors.end) {
          classes.push("sow-indoors");
          title.push("Sow indoors");
        }
        if (veg.sowOutdoors && m + 1 >= Math.floor(veg.sowOutdoors.start) && m + 1 <= veg.sowOutdoors.end) {
          classes.push("sow-outdoors");
          title.push("Sow outdoors");
        }
        if (veg.plantOut && m + 1 >= Math.floor(veg.plantOut.start) && m + 1 <= veg.plantOut.end) {
          classes.push("plant-out");
          title.push("Plant out");
        }

        // Handle harvest — can wrap around year (e.g., month 14 = Feb next year)
        if (veg.harvest) {
          const hStart = veg.harvest.start;
          const hEnd = veg.harvest.end;
          if (hEnd <= 12) {
            if (m + 1 >= hStart && m + 1 <= hEnd) {
              classes.push("harvest");
              title.push("Harvest");
            }
          } else {
            // Wraps around: e.g., Oct(10) to Feb(14=2)
            if (m + 1 >= hStart || m + 1 <= hEnd - 12) {
              classes.push("harvest");
              title.push("Harvest");
            }
          }
        }

        // Check if planted this month
        if (plantedMap[vegLower]) {
          const plantedThisMonth = plantedMap[vegLower].filter((p) => {
            const d = new Date(p.date);
            return d.getMonth() === m;
          });
          if (plantedThisMonth.length > 0) {
            classes.push("planted-marker");
            title.push("Planted!");
          }
        }

        const isCurrentMonth = m === currentMonth ? " current-month" : "";
        html += `<td class="${classes.join(" ")}${isCurrentMonth}" title="${title.join(", ")}">${classes.includes("planted-marker") ? "🌱" : ""}</td>`;
      }
      html += "</tr>";
    });

    html += "</tbody></table></div>";
    container.innerHTML = html;

    // Add click handlers for vegetable details
    document.querySelectorAll(".veg-row").forEach((row) => {
      row.addEventListener("click", () => {
        const vegName = row.dataset.veg;
        const veg = vegetables.find((v) => v.name === vegName);
        showVegDetails(veg, plantedMap[vegName.toLowerCase()] || []);
      });
    });
  }

  function buildSummaryCard(title, vegs, cssClass, icon) {
    const items = vegs
      .map((v) => `<span class="summary-veg-tag">${v.emoji} ${v.name}</span>`)
      .join("");
    return `<div class="summary-card summary-card--${cssClass}">
      <h3 class="summary-card-title">${icon} ${title}</h3>
      <div class="summary-veg-list">${items}</div>
    </div>`;
  }

  function createMonthlySummary(vegetables, currentMonth) {
    const container = document.getElementById("monthly-summary");
    if (!container) return;

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthName = MONTH_NAMES[currentMonth];
    const m = currentMonth + 1; // convert to 1-based month number

    const sowIndoors = [];
    const sowOutdoors = [];
    const plantOut = [];
    const harvest = [];

    vegetables.forEach((veg) => {
      // sowIndoors.start is always a whole month; sowOutdoors/plantOut.start may be decimal (e.g. 5.5 = late May)
      if (veg.sowIndoors && m >= veg.sowIndoors.start && m <= veg.sowIndoors.end) {
        sowIndoors.push(veg);
      }
      if (veg.sowOutdoors && m >= Math.floor(veg.sowOutdoors.start) && m <= veg.sowOutdoors.end) {
        sowOutdoors.push(veg);
      }
      if (veg.plantOut && m >= Math.floor(veg.plantOut.start) && m <= veg.plantOut.end) {
        plantOut.push(veg);
      }
      if (veg.harvest) {
        const hStart = veg.harvest.start;
        const hEnd = veg.harvest.end;
        // hEnd > 12 means the harvest window wraps into the next calendar year (e.g. 14 = February)
        if (hEnd <= 12) {
          if (m >= hStart && m <= hEnd) harvest.push(veg);
        } else {
          // Wraps around year (e.g., harvest.end = 14 means February next year)
          if (m >= hStart || m <= hEnd - 12) harvest.push(veg);
        }
      }
    });

    let html = `<div class="monthly-summary">
      <h2 class="monthly-summary-title">🗓️ What to do in ${monthName}</h2>
      <div class="monthly-summary-grid">`;

    if (sowIndoors.length > 0) {
      html += buildSummaryCard("Sow Indoors", sowIndoors, "sow-indoors", "🏠");
    }
    if (sowOutdoors.length > 0) {
      html += buildSummaryCard("Sow Outdoors", sowOutdoors, "sow-outdoors", "🌿");
    }
    if (plantOut.length > 0) {
      html += buildSummaryCard("Plant Out", plantOut, "plant-out", "🌱");
    }
    if (harvest.length > 0) {
      html += buildSummaryCard("Harvest", harvest, "harvest", "🧺");
    }

    if (!sowIndoors.length && !sowOutdoors.length && !plantOut.length && !harvest.length) {
      html += `<p class="monthly-summary-empty">No specific activities scheduled for ${monthName}.</p>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;
  }

  function showVegDetails(veg, plantedPosts) {
    const panel = document.getElementById("veg-details");
    if (!panel) return;

    document.getElementById("veg-name").textContent = `${veg.emoji} ${veg.name}`;
    document.getElementById("veg-notes").textContent = veg.notes;
    document.getElementById("veg-varieties").textContent = (veg.varieties || []).join(", ");

    const postsList = document.getElementById("veg-posts");
    if (plantedPosts.length > 0) {
      postsList.innerHTML = plantedPosts
        .map((p) => `<li><a href="${p.url}">${p.title}</a> (${p.date})</li>`)
        .join("");
    } else {
      postsList.innerHTML = "<li>No posts yet — get planting! 🌱</li>";
    }

    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function init() {
    const [calendarData, plantedPosts] = await Promise.all([
      loadCalendarData(),
      loadPlantedData(),
    ]);

    if (calendarData) {
      const currentMonth = new Date().getMonth(); // 0-based
      createMonthlySummary(calendarData.vegetables, currentMonth);
      createCalendarGrid(calendarData.vegetables, plantedPosts);
    } else {
      const container = document.getElementById("planting-calendar");
      if (container) {
        container.innerHTML = "<p>Unable to load planting calendar data.</p>";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
