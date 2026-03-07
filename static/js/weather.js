/**
 * Open-Meteo Weather Widget for Aberdeen
 * Fetches current conditions and 3-day forecast — no API key needed
 */
(function () {
  const LAT = 57.1497;
  const LON = -2.0943;
  const LOCATION = "Aberdeen";

  const weatherCodes = {
    0: { desc: "Clear sky", icon: "☀️" },
    1: { desc: "Mainly clear", icon: "🌤️" },
    2: { desc: "Partly cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Foggy", icon: "🌫️" },
    48: { desc: "Rime fog", icon: "🌫️" },
    51: { desc: "Light drizzle", icon: "🌦️" },
    53: { desc: "Drizzle", icon: "🌦️" },
    55: { desc: "Heavy drizzle", icon: "🌧️" },
    61: { desc: "Light rain", icon: "🌧️" },
    63: { desc: "Rain", icon: "🌧️" },
    65: { desc: "Heavy rain", icon: "🌧️" },
    71: { desc: "Light snow", icon: "🌨️" },
    73: { desc: "Snow", icon: "❄️" },
    75: { desc: "Heavy snow", icon: "❄️" },
    77: { desc: "Snow grains", icon: "❄️" },
    80: { desc: "Light showers", icon: "🌦️" },
    81: { desc: "Showers", icon: "🌧️" },
    82: { desc: "Heavy showers", icon: "⛈️" },
    85: { desc: "Snow showers", icon: "🌨️" },
    86: { desc: "Heavy snow showers", icon: "🌨️" },
    95: { desc: "Thunderstorm", icon: "⛈️" },
    96: { desc: "Thunderstorm + hail", icon: "⛈️" },
    99: { desc: "Thunderstorm + heavy hail", icon: "⛈️" },
  };

  function getWeatherInfo(code) {
    return weatherCodes[code] || { desc: "Unknown", icon: "🌡️" };
  }

  function formatDay(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[d.getDay()];
  }

  async function fetchWeather() {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=Europe%2FLondon&forecast_days=4`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API error");
      return await res.json();
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      return null;
    }
  }

  function isFrostWarning(tempMin) {
    return tempMin <= 2;
  }

  function renderWidget(data) {
    const container = document.getElementById("weather-widget");
    if (!container) return;

    if (!data) {
      container.innerHTML = `<div class="weather-error">🌡️ Weather temporarily unavailable</div>`;
      return;
    }

    const current = data.current;
    const daily = data.daily;
    const currentWeather = getWeatherInfo(current.weather_code);

    // Check for frost in the next few days
    const frostDays = daily.temperature_2m_min
      .slice(0, 4)
      .filter((t) => isFrostWarning(t));
    const frostWarning =
      frostDays.length > 0
        ? `<div class="frost-warning">🥶 Frost warning! Lows near ${Math.min(...daily.temperature_2m_min.slice(0, 4)).toFixed(0)}°C — protect tender plants!</div>`
        : "";

    let forecastHTML = "";
    for (let i = 1; i < 4; i++) {
      const dayWeather = getWeatherInfo(daily.weather_code[i]);
      const frost = isFrostWarning(daily.temperature_2m_min[i])
        ? ' <span class="frost-badge">🥶</span>'
        : "";
      forecastHTML += `
        <div class="forecast-day">
          <div class="forecast-day-name">${formatDay(daily.time[i])}</div>
          <div class="forecast-icon">${dayWeather.icon}</div>
          <div class="forecast-temps">
            <span class="temp-high">${daily.temperature_2m_max[i].toFixed(0)}°</span>
            <span class="temp-low">${daily.temperature_2m_min[i].toFixed(0)}°</span>
            ${frost}
          </div>
          <div class="forecast-rain">${daily.precipitation_probability_max[i]}% 💧</div>
        </div>`;
    }

    container.innerHTML = `
      <div class="weather-card">
        <div class="weather-header">
          <span class="weather-location">📍 ${LOCATION}</span>
          <span class="weather-updated">Updated: ${new Date(current.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div class="weather-current">
          <div class="weather-main">
            <span class="weather-icon-large">${currentWeather.icon}</span>
            <span class="weather-temp">${current.temperature_2m.toFixed(1)}°C</span>
          </div>
          <div class="weather-details">
            <div>${currentWeather.desc}</div>
            <div>Feels like ${current.apparent_temperature.toFixed(0)}°C</div>
            <div>💨 ${current.wind_speed_10m.toFixed(0)} km/h</div>
            <div>💧 ${current.relative_humidity_2m}% humidity</div>
          </div>
        </div>
        ${frostWarning}
        <div class="weather-forecast">
          ${forecastHTML}
        </div>
      </div>`;
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
      const data = await fetchWeather();
      renderWidget(data);
    });
  } else {
    fetchWeather().then(renderWidget);
  }
})();
