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
