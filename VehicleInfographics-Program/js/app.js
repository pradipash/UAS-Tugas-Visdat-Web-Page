/**
 * Vehicle Sales Infographic - Scrollytelling App
 * Interactive scroll-driven data visualization
 */

// Global variables
let vehicleData = null;
let charts = {};
let countersAnimated = {};

// ===== Initialize Application =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  initScrollProgress();
  initNavigation();
  initScrollAnimations();
  initCharts();
  initCounters();
  initScrollTopButton();
});

// ===== Load Data =====
async function loadData() {
  try {
    const response = await fetch("data/vehicle_data.json");
    vehicleData = await response.json();
    console.log("Data loaded successfully:", vehicleData.summary);
    updateStaticContent();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// ===== Update Static Content =====
function updateStaticContent() {
  if (!vehicleData) return;

  const summary = vehicleData.summary;

  // Hero section floating stats
  const heroStats = document.querySelectorAll(".float-stat .counter");
  if (heroStats.length >= 3) {
    heroStats[0].setAttribute("data-target", summary.total_vehicles);
    heroStats[1].setAttribute("data-target", summary.total_makes);
    heroStats[2].setAttribute("data-target", summary.total_states);
  }

  // Data intro section
  updateElement("#totalRecords", formatNumber(summary.total_vehicles));
  updateElement("#uniqueMakes", summary.total_makes);
  updateElement("#uniqueModels", summary.total_models);
  updateElement("#avgPrice", formatCurrency(summary.avg_price));
  updateElement("#totalColumns", "16");

  // Age vs Price section
  if (vehicleData.age_vs_price) {
    const ageData = vehicleData.age_vs_price;
    const years = ageData.years;
    const prices = ageData.mean_prices;
    // Newest car (2015) price vs oldest
    const newestIdx = years.indexOf(Math.max(...years));
    const newCarPrice = prices[newestIdx] || summary.avg_price * 1.3;
    const oldCarPrice = prices[0] || summary.avg_price * 0.5;
    const depreciation = (
      ((newCarPrice - oldCarPrice) / newCarPrice) *
      100
    ).toFixed(0);

    updateElement("#newCarPrice", formatCurrency(newCarPrice));
    updateElement("#oldCarPrice", formatCurrency(oldCarPrice));
    updateElement("#depreciationRate", Math.abs(depreciation) + "%");
  }

  // Body type section
  if (vehicleData.body_type) {
    const bodyData = vehicleData.body_type;
    const types = bodyData.types;
    const counts = bodyData.counts;
    const suvIdx = types.findIndex((t) => t.toLowerCase().includes("suv"));
    const sedanIdx = types.findIndex((t) => t.toLowerCase().includes("sedan"));

    if (suvIdx >= 0) updateElement("#suvCount", formatNumber(counts[suvIdx]));
    if (sedanIdx >= 0)
      updateElement("#sedanCount", formatNumber(counts[sedanIdx]));

    // Find dominant body type
    const maxIdx = counts.indexOf(Math.max(...counts));
    updateElement("#dominantBodyType", types[maxIdx]);
  }

  // Color section
  if (vehicleData.colors) {
    populateColorBars();
  }

  // Top makes section
  if (vehicleData.top_makes) {
    populateBrandPodium();
  }

  // Condition section
  if (vehicleData.condition_price) {
    const condData = vehicleData.condition_price;
    const conditions = condData.conditions;
    const avgPrices = condData.avg_prices;
    // Find condition 5 and condition 1
    const excellentIdx = conditions.indexOf(5.0);
    const poorIdx = conditions.indexOf(1.0);

    if (excellentIdx >= 0)
      updateElement("#condPrice5", formatCurrency(avgPrices[excellentIdx]));
    if (poorIdx >= 0)
      updateElement("#condPrice1", formatCurrency(avgPrices[poorIdx]));

    if (excellentIdx >= 0 && poorIdx >= 0) {
      const multiplier = (avgPrices[excellentIdx] / avgPrices[poorIdx]).toFixed(
        1
      );
      updateElement("#conditionMultiplier", multiplier + "x");
    }
  }

  // Odometer section
  if (vehicleData.odometer_price) {
    populateMileageJourney();
  }

  // State sales section
  if (vehicleData.state_sales) {
    populateStateRanking();
  }

  // Transmission section
  if (vehicleData.transmission) {
    const transData = vehicleData.transmission;
    const types = transData.types;
    const counts = transData.counts;
    const total = counts.reduce((sum, c) => sum + c, 0);
    const autoIdx = types.findIndex((t) => t.toLowerCase().includes("auto"));
    const manualIdx = types.findIndex((t) => t.toLowerCase() === "manual");

    if (autoIdx >= 0) {
      const autoPercent = ((counts[autoIdx] / total) * 100).toFixed(1);
      updateElement("#autoPercent", autoPercent + "%");
      updateElement("#autoCount", formatNumber(counts[autoIdx]) + " vehicles");
    }
    if (manualIdx >= 0) {
      const manualPercent = ((counts[manualIdx] / total) * 100).toFixed(1);
      updateElement("#manualPercent", manualPercent + "%");
      updateElement(
        "#manualCount",
        formatNumber(counts[manualIdx]) + " vehicles"
      );
    }
  }

  // Premium models section
  if (vehicleData.top_models_price) {
    populatePremiumList();
  }

  // Conclusion section
  updateElement("#finalRecords", formatNumber(summary.total_vehicles));
  updateElement("#finalMakes", summary.total_makes);
  updateElement("#finalStudyCases", "12");
}

// ===== Helper Functions =====
function updateElement(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  return num.toLocaleString();
}

function formatCurrency(num) {
  return "$" + Math.round(num).toLocaleString();
}

// ===== Scroll Progress Bar =====
function initScrollProgress() {
  const progressBar = document.querySelector(".scroll-progress-bar");

  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = scrollPercent + "%";
  });
}

// ===== Navigation Dots =====
function initNavigation() {
  const sections = document.querySelectorAll(".story-section");
  const navDots = document.querySelectorAll(".nav-dot");

  // Click to navigate
  navDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      sections[index].scrollIntoView({ behavior: "smooth" });
    });
  });

  // Update active dot on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(sections).indexOf(entry.target);
          navDots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
          });
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((section) => observer.observe(section));
}

// ===== Scroll Animations =====
function initScrollAnimations() {
  const sections = document.querySelectorAll(".story-section");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");

          // Trigger chart animations
          const sectionId = entry.target.getAttribute("data-section");
          if (sectionId) {
            animateChartForSection(sectionId);
          }
        }
      });
    },
    { threshold: 0.2 }
  );

  sections.forEach((section) => observer.observe(section));
}

// ===== Counter Animation =====
function initCounters() {
  const counters = document.querySelectorAll(".counter");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !countersAnimated[entry.target.id]) {
          animateCounter(entry.target);
          countersAnimated[entry.target.id] = true;
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute("data-target"));
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(easeProgress * target);

    element.textContent = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatNumber(target);
    }
  }

  requestAnimationFrame(update);
}

// ===== Populate Dynamic Content =====
function populateColorBars() {
  const container = document.querySelector(".color-bars");
  if (!container || !vehicleData.colors) return;

  const colorsData = vehicleData.colors;
  const colorNames = colorsData.colors;
  const colorCounts = colorsData.counts;
  const colorPercents = colorsData.percentages;
  const maxCount = Math.max(...colorCounts);

  const colorMap = {
    black: "#1a1a1a",
    white: "#f8f8f8",
    gray: "#808080",
    silver: "#c0c0c0",
    blue: "#3b82f6",
    red: "#ef4444",
    brown: "#92400e",
    green: "#22c55e",
    gold: "#fbbf24",
    beige: "#d4b896",
    orange: "#f97316",
    yellow: "#eab308",
    purple: "#a855f7",
    burgundy: "#800020"
  };

  container.innerHTML = colorNames
    .slice(0, 8)
    .map((color, i) => {
      const width = ((colorCounts[i] / maxCount) * 100).toFixed(1);
      const bgColor = colorMap[color.toLowerCase()] || "#6366f1";
      const percent = colorPercents[i].toFixed(1);

      return `
            <div class="color-bar">
                <span class="color-bar-label">${color}</span>
                <div class="color-bar-track">
                    <div class="color-bar-fill" style="--width: ${width}%; background: ${bgColor};"></div>
                </div>
                <span class="color-bar-value">${percent}%</span>
            </div>
        `;
    })
    .join("");

  // Update top colors list
  const topColorsContainer = document.querySelector(".top-colors");
  if (topColorsContainer) {
    topColorsContainer.innerHTML = colorNames
      .slice(0, 3)
      .map((color, i) => {
        const bgColor = colorMap[color.toLowerCase()] || "#6366f1";
        const percent = colorPercents[i].toFixed(1);
        return `
                <div class="top-color">
                    <div class="color-swatch" style="--color: ${bgColor};"></div>
                    <span class="color-name">${color}</span>
                    <span class="color-percent">${percent}%</span>
                </div>
            `;
      })
      .join("");
  }
}

function populateBrandPodium() {
  if (!vehicleData.top_makes) return;

  const makesData = vehicleData.top_makes;
  const makes = makesData.makes;
  const counts = makesData.counts;

  const brandEmojis = {
    ford: "🚙",
    chevrolet: "🚗",
    toyota: "🚘",
    honda: "🏎️",
    nissan: "🚐",
    jeep: "🚕",
    gmc: "🛻",
    ram: "🚚",
    bmw: "🏎️",
    "mercedes-benz": "🚘",
    audi: "🚗",
    lexus: "🚙",
    dodge: "🚗",
    hyundai: "🚙",
    kia: "🚗"
  };

  const classNames = ["first", "second", "third"];
  for (let i = 0; i < 3; i++) {
    const element = document.querySelector(`.podium-item.${classNames[i]}`);
    if (element && makes[i]) {
      const emoji = brandEmojis[makes[i].toLowerCase()] || "🚗";
      element.querySelector(".brand-logo").textContent = emoji;
      element.querySelector(".brand-name").textContent = makes[i];
      element.querySelector(".brand-count").textContent =
        formatNumber(counts[i]) + " vehicles";
    }
  }
}

function populateMileageJourney() {
  const container = document.querySelector(".journey-track");
  if (!container || !vehicleData.odometer_price) return;

  const odometerData = vehicleData.odometer_price;
  const ranges = odometerData.ranges;
  const avgPrices = odometerData.avg_prices;

  // Keep the existing structure but update values
  const pointElements = container.querySelectorAll(".journey-point");
  ranges.slice(0, 5).forEach((range, index) => {
    if (pointElements[index]) {
      const priceEl = pointElements[index].querySelector(".price");
      const milesEl = pointElements[index].querySelector(".miles");
      if (priceEl) priceEl.textContent = formatCurrency(avgPrices[index]);
      if (milesEl) milesEl.textContent = range;
    }
  });

  // Update mileage stats
  updateElement("#avgMileage", formatNumber(vehicleData.summary.avg_odometer));

  if (avgPrices.length >= 2) {
    const priceDropPercent = (
      ((avgPrices[0] - avgPrices[avgPrices.length - 1]) / avgPrices[0]) *
      100
    ).toFixed(0);
    updateElement("#mileagePriceDrop", priceDropPercent + "%");
  }
}

function populateStateRanking() {
  const container = document.querySelector(".ranking-list");
  if (!container || !vehicleData.state_sales) return;

  const statesData = vehicleData.state_sales;
  const states = statesData.states;
  const counts = statesData.counts;

  container.innerHTML = states
    .slice(0, 7)
    .map(
      (state, index) => `
        <div class="ranking-item">
            <span class="ranking-number">#${index + 1}</span>
            <span class="ranking-state">${state.toUpperCase()}</span>
            <span class="ranking-count">${formatNumber(
              counts[index]
            )} sales</span>
        </div>
    `
    )
    .join("");
}

function populatePremiumList() {
  const container = document.querySelector(".premium-list");
  if (!container || !vehicleData.top_models_price) return;

  const modelsData = vehicleData.top_models_price;
  const models = modelsData.models;
  const avgPrices = modelsData.avg_prices;
  const counts = modelsData.counts;

  container.innerHTML = models
    .slice(0, 5)
    .map(
      (model, index) => `
        <div class="premium-item fade-in-up" style="--delay: ${index * 0.1}s;">
            <span class="premium-rank">#${index + 1}</span>
            <div class="premium-info">
                <div class="premium-model">${model}</div>
                <div class="premium-count">${formatNumber(
                  counts[index]
                )} units sold</div>
            </div>
            <span class="premium-price">${formatCurrency(
              avgPrices[index]
            )}</span>
        </div>
    `
    )
    .join("");
}

// ===== Charts =====
function initCharts() {
  // Set Chart.js defaults
  Chart.defaults.color = "#94a3b8";
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15, 23, 42, 0.9)";
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

function animateChartForSection(sectionId) {
  if (charts[sectionId]) return; // Already created

  switch (sectionId) {
    case "2":
      createAgePriceChart();
      break;
    case "3":
      createBodyTypeChart();
      break;
    case "5":
      createBrandsChart();
      break;
    case "6":
      createConditionChart();
      break;
    case "8":
      createGeographyChart();
      break;
    case "9":
      createTransmissionChart();
      break;
  }
}

function createAgePriceChart() {
  const ctx = document.getElementById("agePriceChart");
  if (!ctx || !vehicleData?.age_vs_price) return;

  const ageData = vehicleData.age_vs_price;
  const years = ageData.years;
  const prices = ageData.mean_prices;

  charts["2"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: years.map((y) => y.toString()),
      datasets: [
        {
          label: "Average Price",
          data: prices,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#6366f1",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `Price: $${context.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { callback: (value) => "$" + (value / 1000).toFixed(0) + "K" }
        },
        x: {
          grid: { display: false }
        }
      },
      animation: {
        duration: 2000,
        easing: "easeOutQuart"
      }
    }
  });
}

function createBodyTypeChart() {
  const ctx = document.getElementById("bodyTypeChart");
  if (!ctx || !vehicleData?.body_type) return;

  const bodyData = vehicleData.body_type;
  const types = bodyData.types;
  const counts = bodyData.counts;
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
    "#06b6d4"
  ];

  charts["3"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: types,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((context.parsed / total) * 100).toFixed(1);
              return `${
                context.label
              }: ${percent}% (${context.parsed.toLocaleString()})`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 2000
      }
    }
  });
}

function createBrandsChart() {
  const ctx = document.getElementById("brandsChart");
  if (!ctx || !vehicleData?.top_makes) return;

  const makesData = vehicleData.top_makes;
  const makes = makesData.makes.slice(0, 10);
  const counts = makesData.counts.slice(0, 10);

  charts["5"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: makes,
      datasets: [
        {
          label: "Sales Volume",
          data: counts,
          backgroundColor: (context) => {
            const gradient = context.chart.ctx.createLinearGradient(
              0,
              0,
              0,
              300
            );
            gradient.addColorStop(0, "#6366f1");
            gradient.addColorStop(1, "#8b5cf6");
            return gradient;
          },
          borderRadius: 8
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.x.toLocaleString()} vehicles`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { callback: (value) => formatNumber(value) }
        },
        y: {
          grid: { display: false }
        }
      },
      animation: {
        duration: 2000,
        delay: (context) => context.dataIndex * 100
      }
    }
  });
}

function createConditionChart() {
  const ctx = document.getElementById("conditionChart");
  if (!ctx || !vehicleData?.condition_price) return;

  const condData = vehicleData.condition_price;
  // Only show condition ratings 1-5 for clarity
  const conditions = condData.conditions.slice(0, 5);
  const avgPrices = condData.avg_prices.slice(0, 5);

  charts["6"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: conditions.map((c) => c.toFixed(1)),
      datasets: [
        {
          label: "Average Price",
          data: avgPrices,
          backgroundColor: (context) => {
            const value = context.parsed.y;
            const max = Math.max(...avgPrices);
            const intensity = value / max;
            return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`;
          },
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Condition Rating: ${items[0].label}`,
            label: (context) =>
              `Avg Price: $${context.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { callback: (value) => "$" + (value / 1000).toFixed(0) + "K" }
        },
        x: {
          grid: { display: false },
          title: {
            display: true,
            text: "Condition Rating",
            color: "#94a3b8"
          }
        }
      },
      animation: {
        duration: 2000,
        easing: "easeOutElastic"
      }
    }
  });
}

function createGeographyChart() {
  const ctx = document.getElementById("geoChart");
  if (!ctx || !vehicleData?.state_sales) return;

  const statesData = vehicleData.state_sales;
  const states = statesData.states.slice(0, 10).map((s) => s.toUpperCase());
  const counts = statesData.counts.slice(0, 10);

  charts["8"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: states,
      datasets: [
        {
          label: "Sales",
          data: counts,
          backgroundColor: "#6366f1",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y.toLocaleString()} sales`
          }
        }
      },
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { callback: (value) => formatNumber(value) }
        },
        x: {
          grid: { display: false }
        }
      },
      animation: {
        duration: 2000,
        delay: (context) => context.dataIndex * 100
      }
    }
  });
}

function createTransmissionChart() {
  const ctx = document.getElementById("transmissionChart");
  if (!ctx || !vehicleData?.transmission) return;

  const transData = vehicleData.transmission;
  const types = transData.types;
  const counts = transData.counts;

  charts["9"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: types,
      datasets: [
        {
          data: counts,
          backgroundColor: ["#6366f1", "#ec4899", "#10b981", "#f59e0b"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${percent}%`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 2000
      }
    }
  });
}

// ===== Scroll Top Button =====
function initScrollTopButton() {
  const btn = document.querySelector(".scroll-top-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}
