/**
 * Vehicle Sales Infographic - Scrollytelling App
 * Interactive scroll-driven data visualization
 */

// Global variables
let vehicleData = null;
let charts = {};
let countersAnimated = {};
let modalChart = null;

// Register Chart.js plugins
Chart.register(ChartDataLabels);

// ===== Initialize Application =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  initScrollProgress();
  initNavigation();
  initScrollAnimations();
  initCharts();
  initCounters();
  initScrollTopButton();
  initModalEvents();
});

// ===== Modal Functions =====
function initModalEvents() {
  const modal = document.getElementById("chartDetailModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeChartModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeChartModal();
    });
  }
}

function openChartModal(title, stats, chartConfig, hint) {
  const modal = document.getElementById("chartDetailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalStats = modal.querySelector(".modal-stats");
  const modalHint = document.getElementById("modalHint");

  modalTitle.textContent = title;
  modalHint.textContent = hint || "Click on chart elements to explore";

  // Build stats HTML
  modalStats.innerHTML = stats
    .map(
      (s) => `
    <div class="modal-stat">
      <span class="stat-label">${s.label}</span>
      <span class="stat-value">${s.value}</span>
    </div>
  `
    )
    .join("");

  // Create modal chart
  if (modalChart) modalChart.destroy();
  const ctx = document.getElementById("modalChart");
  if (ctx && chartConfig) {
    modalChart = new Chart(ctx, chartConfig);
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeChartModal() {
  const modal = document.getElementById("chartDetailModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
  if (modalChart) {
    modalChart.destroy();
    modalChart = null;
  }
}

// ===== Reset Zoom Function =====
function resetAgePriceZoom() {
  if (charts["2"]) {
    charts["2"].resetZoom();
  }
}

// Make functions available globally
window.closeChartModal = closeChartModal;
window.resetAgePriceZoom = resetAgePriceZoom;

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

  // Brand Quality section
  if (vehicleData.make_condition) {
    const makeData = vehicleData.make_condition;
    updateElement("#topQualityBrand", makeData.makes[0]);
    updateElement("#topQualityScore", makeData.avg_conditions[0].toFixed(1));
  }

  // Premium models section
  if (vehicleData.top_models_price) {
    populatePremiumList();
  }

  // Conclusion section
  updateElement("#finalRecords", formatNumber(summary.total_vehicles));
  updateElement("#finalMakes", summary.total_makes);
  updateElement("#finalStudyCases", "10");
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

// ===== Navigation Sidebar =====
function initNavigation() {
  const sections = document.querySelectorAll(".story-section");
  const navItems = document.querySelectorAll(".nav-item");
  const navToggle = document.getElementById("navToggle");
  const storyNav = document.getElementById("storyNav");

  // Mobile toggle
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      storyNav.classList.toggle("open");
    });
  }

  // Click to navigate
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const sectionIndex = parseInt(item.getAttribute("data-section"));
      if (sections[sectionIndex]) {
        sections[sectionIndex].scrollIntoView({ behavior: "smooth" });
      }
      // Close mobile nav
      storyNav.classList.remove("open");
    });
  });

  // Update active item on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute("data-section");
          navItems.forEach((item) => {
            const itemSection = item.getAttribute("data-section");
            item.classList.toggle("active", itemSection === sectionId);
          });
        }
      });
    },
    { threshold: 0.3, rootMargin: "0px 0px -20% 0px" }
  );

  sections.forEach((section) => observer.observe(section));

  // Additional scroll listener to handle last section
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;

        // If scrolled to bottom, activate last section
        if (scrollTop + clientHeight >= scrollHeight - 50) {
          const lastSection = sections[sections.length - 1];
          const lastSectionId = lastSection?.getAttribute("data-section");
          if (lastSectionId) {
            navItems.forEach((item) => {
              const itemSection = item.getAttribute("data-section");
              item.classList.toggle("active", itemSection === lastSectionId);
            });
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  });
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
      const bgColor = colorMap[color.toLowerCase()] || "#dc2626";
      const percent = colorPercents[i].toFixed(1);

      return `
            <div class="color-bar">
                <span class="color-bar-label">${color}</span>
                <div class="color-bar-track">
                    <div class="color-bar-fill color-bar-${i}" style="background: ${bgColor};"></div>
                </div>
                <span class="color-bar-value">${percent}%</span>
            </div>
        `;
    })
    .join("");

  // Animate color bars after a delay
  setTimeout(() => {
    colorNames.slice(0, 8).forEach((color, i) => {
      const width = ((colorCounts[i] / maxCount) * 100).toFixed(1);
      const bar = container.querySelector(`.color-bar-${i}`);
      if (bar) {
        bar.style.width = width + "%";
      }
    });
  }, 100);

  // Update top colors list
  const topColorsContainer = document.querySelector(".top-colors");
  if (topColorsContainer) {
    topColorsContainer.innerHTML = colorNames
      .slice(0, 3)
      .map((color, i) => {
        const bgColor = colorMap[color.toLowerCase()] || "#dc2626";
        const percent = colorPercents[i].toFixed(1);
        const colorClass = `top-color-${color.toLowerCase()}`;
        return `
                <div class="top-color ${colorClass}">
                    <div class="color-swatch"></div>
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

  // Font Awesome icons for podium positions
  const podiumIcons = {
    first: '<i class="fas fa-trophy"></i>',
    second: '<i class="fas fa-medal"></i>',
    third: '<i class="fas fa-award"></i>'
  };

  const classNames = ["first", "second", "third"];
  for (let i = 0; i < 3; i++) {
    const element = document.querySelector(`.podium-item.${classNames[i]}`);
    if (element && makes[i]) {
      element.querySelector(".brand-logo").innerHTML =
        podiumIcons[classNames[i]];
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
        <div class="premium-item premium-item-${index + 1} fade-in-up">
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
    case "10":
      createBrandQualityChart();
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
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#dc2626",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const year = years[idx];
          const price = prices[idx];
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const diff = (((price - avgPrice) / avgPrice) * 100).toFixed(1);

          openChartModal(
            `Year ${year} Analysis`,
            [
              { label: "Year", value: year },
              { label: "Avg Price", value: formatCurrency(price) },
              {
                label: "vs Overall",
                value: (diff > 0 ? "+" : "") + diff + "%"
              },
              {
                label: "Data Points",
                value: formatNumber(vehicleData.summary.total_vehicles)
              }
            ],
            {
              type: "bar",
              data: {
                labels: ["Selected Year", "Overall Average"],
                datasets: [
                  {
                    data: [price, avgPrice],
                    backgroundColor: ["#dc2626", "#ef4444"]
                  }
                ]
              },
              options: {
                plugins: {
                  legend: { display: false },
                  datalabels: { display: false }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (v) => "$" + (v / 1000).toFixed(0) + "K"
                    }
                  }
                }
              }
            },
            `${year} vehicles had an average price of ${formatCurrency(price)}`
          );
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `Price: $${context.parsed.y.toLocaleString()}`
          }
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "xy"
          },
          pan: {
            enabled: true,
            mode: "xy"
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
    "#dc2626",
    "#ef4444",
    "#f97316",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
    "#06b6d4"
  ];

  const total = counts.reduce((a, b) => a + b, 0);

  charts["3"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: types,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 15
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const type = types[idx];
          const count = counts[idx];
          const percent = ((count / total) * 100).toFixed(1);
          const avgPrice =
            vehicleData.body_type.mean_prices?.[idx] ||
            vehicleData.summary.avg_price;

          openChartModal(
            `${type} Vehicles`,
            [
              { label: "Total Units", value: formatNumber(count) },
              { label: "Market Share", value: percent + "%" },
              { label: "Avg Price", value: formatCurrency(avgPrice) },
              { label: "Rank", value: "#" + (idx + 1) }
            ],
            {
              type: "pie",
              data: {
                labels: [type, "Others"],
                datasets: [
                  {
                    data: [count, total - count],
                    backgroundColor: [colors[idx], "#374151"]
                  }
                ]
              },
              options: {
                plugins: {
                  legend: { position: "bottom" },
                  datalabels: { display: false }
                }
              }
            },
            `${type} represents ${percent}% of all vehicle sales`
          );
        }
      },
      plugins: {
        legend: {
          position: "right",
          labels: {
            padding: 15,
            font: { size: 12 }
          },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.index;
            const chart = legend.chart;
            const meta = chart.getDatasetMeta(0);
            meta.data[index].hidden = !meta.data[index].hidden;
            chart.update();
          }
        },
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 11 },
          formatter: (value, ctx) => {
            const percent = ((value / total) * 100).toFixed(0);
            return percent > 5 ? percent + "%" : "";
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
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
  const total = counts.reduce((a, b) => a + b, 0);

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
            gradient.addColorStop(0, "#dc2626");
            gradient.addColorStop(1, "#ef4444");
            return gradient;
          },
          borderRadius: 8,
          hoverBackgroundColor: "#f97316"
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const brand = makes[idx];
          const count = counts[idx];
          const percent = ((count / total) * 100).toFixed(1);

          openChartModal(
            `${brand} Analysis`,
            [
              { label: "Total Sales", value: formatNumber(count) },
              { label: "Market Share", value: percent + "%" },
              {
                label: "Rank",
                value:
                  "#" + (idx + 1) + " of " + vehicleData.summary.total_makes
              },
              {
                label: "Avg per Model",
                value: formatNumber(Math.round(count / 10))
              }
            ],
            {
              type: "bar",
              data: {
                labels: makes.slice(0, 5),
                datasets: [
                  {
                    data: counts.slice(0, 5),
                    backgroundColor: makes
                      .slice(0, 5)
                      .map((m, i) => (i === idx ? "#dc2626" : "#374151"))
                  }
                ]
              },
              options: {
                indexAxis: "y",
                plugins: {
                  legend: { display: false },
                  datalabels: { display: false }
                }
              }
            },
            `${brand} is ranked #${idx + 1} with ${percent}% market share`
          );
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "end",
          color: "#fff",
          font: { weight: "bold", size: 10 },
          formatter: (value) => formatNumber(value)
        },
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
  const conditionLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

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
          borderRadius: 6,
          hoverBackgroundColor: "#10b981"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const condition = conditions[idx];
          const price = avgPrices[idx];
          const minPrice = Math.min(...avgPrices);
          const maxPrice = Math.max(...avgPrices);
          const multiplier = (price / minPrice).toFixed(1);

          openChartModal(
            `Condition ${condition.toFixed(1)} - ${
              conditionLabels[idx] || "N/A"
            }`,
            [
              { label: "Rating", value: condition.toFixed(1) + "/5.0" },
              { label: "Avg Price", value: formatCurrency(price) },
              { label: "vs Lowest", value: multiplier + "x" },
              { label: "Quality", value: conditionLabels[idx] || "N/A" }
            ],
            {
              type: "bar",
              data: {
                labels: conditionLabels,
                datasets: [
                  {
                    label: "Average Price",
                    data: avgPrices,
                    backgroundColor: avgPrices.map((p, i) =>
                      i === idx ? "#dc2626" : "rgba(16, 185, 129, 0.6)"
                    ),
                    borderRadius: 6
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                  datalabels: { display: false }
                },
                scales: {
                  y: {
                    ticks: {
                      color: "#94a3b8",
                      callback: (v) => "$" + (v / 1000).toFixed(0) + "K"
                    },
                    grid: { color: "rgba(255, 255, 255, 0.05)" }
                  },
                  x: {
                    ticks: { color: "#94a3b8" },
                    grid: { display: false }
                  }
                }
              }
            },
            `${
              conditionLabels[idx]
            } condition vehicles average ${formatCurrency(price)}`
          );
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#fff",
          font: { weight: "bold", size: 10 },
          formatter: (value) => "$" + (value / 1000).toFixed(0) + "K"
        },
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

async function createGeographyChart() {
  const ctx = document.getElementById("geoChart");
  if (!ctx || !vehicleData?.state_sales) return;

  const statesData = vehicleData.state_sales;
  const allStates = statesData.states;
  const allCounts = statesData.counts;

  // Fetch US states GeoJSON
  const response = await fetch(
    "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
  );
  const us = await response.json();
  const nation = ChartGeo.topojson.feature(us, us.objects.states).features;

  // State centroids (latitude, longitude) - adjusted for visual alignment
  const stateCentroids = {
    AL: { lat: 32.3, lng: -86.7 },
    AK: { lat: 63.5, lng: -153.0 },
    AZ: { lat: 33.8, lng: -111.7 },
    AR: { lat: 34.5, lng: -92.4 },
    CA: { lat: 36.7, lng: -119.4 },
    CO: { lat: 38.5, lng: -105.5 },
    CT: { lat: 41.2, lng: -72.7 },
    DE: { lat: 38.6, lng: -75.5 },
    FL: { lat: 28.1, lng: -82.4 },
    GA: { lat: 32.2, lng: -83.4 },
    HI: { lat: 20.3, lng: -156.3 },
    ID: { lat: 43.9, lng: -114.6 },
    IL: { lat: 39.5, lng: -89.2 },
    IN: { lat: 39.4, lng: -86.3 },
    IA: { lat: 41.5, lng: -93.5 },
    KS: { lat: 38.0, lng: -98.4 },
    KY: { lat: 37.4, lng: -85.7 },
    LA: { lat: 30.5, lng: -92.0 },
    ME: { lat: 44.9, lng: -69.2 },
    MD: { lat: 38.6, lng: -76.8 },
    MA: { lat: 41.8, lng: -71.5 },
    MI: { lat: 43.8, lng: -85.4 },
    MN: { lat: 45.8, lng: -94.3 },
    MS: { lat: 32.3, lng: -89.7 },
    MO: { lat: 37.8, lng: -92.4 },
    MT: { lat: 46.5, lng: -109.6 },
    NE: { lat: 41.0, lng: -99.8 },
    NV: { lat: 38.8, lng: -116.6 },
    NH: { lat: 43.2, lng: -71.5 },
    NJ: { lat: 39.8, lng: -74.7 },
    NM: { lat: 33.9, lng: -106.1 },
    NY: { lat: 42.5, lng: -75.5 },
    NC: { lat: 35.1, lng: -79.4 },
    ND: { lat: 47.0, lng: -100.3 },
    OH: { lat: 40.0, lng: -82.8 },
    OK: { lat: 35.2, lng: -97.5 },
    OR: { lat: 43.5, lng: -120.5 },
    PA: { lat: 40.5, lng: -77.8 },
    RI: { lat: 41.3, lng: -71.5 },
    SC: { lat: 33.5, lng: -80.9 },
    SD: { lat: 43.9, lng: -100.2 },
    TN: { lat: 35.4, lng: -86.3 },
    TX: { lat: 31.0, lng: -99.4 },
    UT: { lat: 38.8, lng: -111.7 },
    VT: { lat: 43.6, lng: -72.7 },
    VA: { lat: 37.1, lng: -78.8 },
    WA: { lat: 47.0, lng: -120.5 },
    WV: { lat: 38.5, lng: -80.5 },
    WI: { lat: 44.2, lng: -89.7 },
    WY: { lat: 42.5, lng: -107.5 },
    DC: { lat: 38.5, lng: -77.0 }
  };

  // State code to full name mapping
  const stateNames = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    DC: "District of Columbia"
  };

  // Create state-to-count map
  const stateMap = {};
  allStates.forEach((state, i) => {
    stateMap[state.toUpperCase()] = allCounts[i];
  });

  const maxCount = Math.max(...allCounts);
  const minRadius = 15;
  const maxRadius = 55;

  // Bubble data with lat/lng coordinates
  const bubbleData = Object.keys(stateCentroids)
    .map((stateCode) => {
      const coords = stateCentroids[stateCode];
      const count = stateMap[stateCode] || 0;
      const ratio = count / maxCount;
      const r = minRadius + ratio * (maxRadius - minRadius);
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        value: count,
        r: r,
        state: stateCode,
        fullName: stateNames[stateCode] || stateCode
      };
    })
    .filter((d) => d.value > 0); // Only show states with data

  charts["8"] = new Chart(ctx, {
    type: "bubbleMap",
    data: {
      labels: bubbleData.map((d) => d.state),
      datasets: [
        {
          label: "Vehicle Sales",
          outline: nation,
          showOutline: true,
          outlineBackgroundColor: "#1a1a1a",
          outlineBorderColor: "rgba(255, 255, 255, 0.3)",
          outlineBorderWidth: 0.5,
          data: bubbleData,
          backgroundColor: (context) => {
            if (context.dataIndex == null) return "rgba(220, 38, 38, 0.3)";
            const value = context.dataset.data[context.dataIndex]?.value || 0;
            const ratio = value / maxCount;
            const opacity = 0.3 + ratio * 0.6; // 0.3 to 0.9 opacity
            return `rgba(220, 38, 38, ${opacity})`;
          },
          borderColor: (context) => {
            if (context.dataIndex == null) return "rgba(220, 38, 38, 0.5)";
            const value = context.dataset.data[context.dataIndex]?.value || 0;
            const ratio = value / maxCount;
            const opacity = 0.5 + ratio * 0.5; // 0.5 to 1.0 opacity
            return `rgba(220, 38, 38, ${opacity})`;
          },
          borderWidth: 1,
          hoverBackgroundColor: "rgba(249, 115, 22, 0.9)",
          hoverBorderColor: "#fff",
          hoverBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const clickedData = bubbleData[index];
          const state = clickedData.state;
          const count = clickedData.value;

          if (count > 0) {
            const stateIndex = allStates.findIndex(
              (s) => s.toUpperCase() === state
            );
            const rank = stateIndex >= 0 ? stateIndex + 1 : "?";
            const percent = (
              (count / vehicleData.summary.total_vehicles) *
              100
            ).toFixed(1);

            openChartModal(
              `${state} State Analysis`,
              [
                { label: "Total Sales", value: formatNumber(count) },
                { label: "National Share", value: percent + "%" },
                { label: "Rank", value: "#" + rank + " of 51" },
                {
                  label: "vs #1 State",
                  value: ((count / allCounts[0]) * 100).toFixed(0) + "%"
                }
              ],
              {
                type: "bar",
                data: {
                  labels: allStates.slice(0, 5).map((s) => s.toUpperCase()),
                  datasets: [
                    {
                      label: "Sales",
                      data: allCounts.slice(0, 5),
                      backgroundColor: allStates
                        .slice(0, 5)
                        .map((s) =>
                          s.toUpperCase() === state
                            ? "#dc2626"
                            : "rgba(220, 38, 38, 0.5)"
                        ),
                      borderRadius: 6,
                      datalabels: { display: false }
                    }
                  ]
                },
                options: {
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: true,
                  layout: { padding: { left: 10, right: 10 } },
                  plugins: {
                    legend: { display: false },
                    datalabels: false
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: "#94a3b8",
                        callback: (v) => formatNumber(v)
                      },
                      grid: { color: "rgba(255, 255, 255, 0.05)" }
                    },
                    y: {
                      ticks: { color: "#94a3b8" },
                      grid: { display: false }
                    }
                  }
                }
              },
              `${state} accounts for ${percent}% of total US vehicle sales`
            );
          }
        }
      },
      interaction: {
        mode: "point",
        intersect: true
      },
      plugins: {
        legend: {
          display: false
        },
        datalabels: {
          display: true,
          formatter: (value, context) => {
            return context.dataset.data[context.dataIndex]?.state || "";
          },
          color: "#fff",
          font: (context) => {
            const r = context.dataset.data[context.dataIndex]?.r || 8;
            const size = Math.max(8, Math.round(r * 0.45));
            return {
              weight: "bold",
              size: size
            };
          },
          textStrokeColor: "rgba(0, 0, 0, 0.9)",
          textStrokeWidth: 2
        },
        tooltip: {
          enabled: true,
          mode: "point",
          intersect: true,
          backgroundColor: "rgba(24, 24, 27, 0.95)",
          titleColor: "#fff",
          bodyColor: "#94a3b8",
          borderColor: "#dc2626",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            title: (context) => {
              if (!context || !context[0]) return "";
              const d = context[0].dataset.data[context[0].dataIndex];
              return d?.fullName || d?.state || "";
            },
            label: (context) => {
              const d = context.dataset.data[context.dataIndex];
              if (!d) return "";
              const percent = (
                (d.value / vehicleData.summary.total_vehicles) *
                100
              ).toFixed(1);
              return `${formatNumber(d.value)} sales (${percent}%)`;
            }
          }
        }
      },
      scales: {
        projection: {
          axis: "x",
          projection: "albersUsa"
        },
        size: {
          axis: "x",
          size: [20, 65],
          mode: "area"
        }
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
  const colors = ["#dc2626", "#f97316", "#10b981", "#f59e0b"];
  const total = counts.reduce((a, b) => a + b, 0);

  charts["9"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: types,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 15
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const type = types[idx];
          const count = counts[idx];
          const percent = ((count / total) * 100).toFixed(1);

          openChartModal(
            `${type} Transmission`,
            [
              { label: "Total Units", value: formatNumber(count) },
              { label: "Market Share", value: percent + "%" },
              { label: "Type", value: type },
              {
                label: "Popularity",
                value: idx === 0 ? "Most Popular" : "#" + (idx + 1)
              }
            ],
            {
              type: "pie",
              data: {
                labels: [type, "Others"],
                datasets: [
                  {
                    data: [count, total - count],
                    backgroundColor: [colors[idx], "#374151"]
                  }
                ]
              },
              options: {
                plugins: {
                  legend: { position: "bottom" },
                  datalabels: { display: false }
                }
              }
            },
            `${type} transmission represents ${percent}% of all vehicles`
          );
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20 },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.index;
            const chart = legend.chart;
            const meta = chart.getDatasetMeta(0);
            meta.data[index].hidden = !meta.data[index].hidden;
            chart.update();
          }
        },
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 12 },
          formatter: (value, ctx) => {
            const percent = ((value / total) * 100).toFixed(0);
            return percent > 5 ? percent + "%" : "";
          }
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

function createBrandQualityChart() {
  const ctx = document.getElementById("brandQualityChart");
  if (!ctx || !vehicleData?.make_condition) return;

  const makeData = vehicleData.make_condition;
  const makes = makeData.makes.slice(0, 12); // Top 12 brands
  const conditions = makeData.avg_conditions.slice(0, 12);
  const prices = makeData.avg_prices.slice(0, 12);

  // Update the top quality brand display
  updateElement("#topQualityBrand", makes[0]);
  updateElement("#topQualityScore", conditions[0].toFixed(1));

  // Create gradient colors based on condition
  const maxCondition = Math.max(...conditions);
  const minCondition = Math.min(...conditions);

  charts["10"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: makes,
      datasets: [
        {
          label: "Average Condition",
          data: conditions,
          backgroundColor: conditions.map((c) => {
            const normalized =
              (c - minCondition) / (maxCondition - minCondition);
            const r = Math.round(220 - normalized * 100);
            const g = Math.round(38 + normalized * 100);
            const b = Math.round(38);
            return `rgba(${r}, ${g}, ${b}, 0.8)`;
          }),
          borderRadius: 6,
          hoverBackgroundColor: "#dc2626"
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const brand = makes[idx];
          const condition = conditions[idx];
          const price = prices[idx];

          openChartModal(
            `${brand} Quality Analysis`,
            [
              { label: "Avg Condition", value: condition.toFixed(2) },
              { label: "Avg Price", value: formatCurrency(price) },
              {
                label: "Quality Rank",
                value: "#" + (idx + 1) + " of " + makes.length
              },
              {
                label: "Category",
                value:
                  condition > 32
                    ? "Premium"
                    : condition > 28
                    ? "Good"
                    : "Standard"
              }
            ],
            {
              type: "radar",
              data: {
                labels: ["Condition", "Price Value", "Ranking"],
                datasets: [
                  {
                    label: brand,
                    data: [
                      (condition / maxCondition) * 100,
                      (price / Math.max(...prices)) * 100,
                      ((makes.length - idx) / makes.length) * 100
                    ],
                    backgroundColor: "rgba(220, 38, 38, 0.2)",
                    borderColor: "#dc2626",
                    pointBackgroundColor: "#dc2626",
                    pointBorderColor: "#dc2626",
                    datalabels: { display: false }
                  }
                ]
              },
              options: {
                plugins: {
                  legend: { display: false },
                  datalabels: false
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: "#94a3b8", backdropColor: "transparent" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                    pointLabels: { color: "#94a3b8" }
                  }
                }
              }
            },
            `${brand} has an average condition score of ${condition.toFixed(1)}`
          );
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "end",
          color: "#fff",
          font: { weight: "bold", size: 10 },
          formatter: (value) => value.toFixed(1)
        },
        tooltip: {
          callbacks: {
            label: (context) => `Avg Condition: ${context.parsed.x.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          min: Math.floor(minCondition - 2),
          max: Math.ceil(maxCondition + 1),
          title: {
            display: true,
            text: "Average Condition Score",
            color: "#94a3b8"
          }
        },
        y: {
          grid: { display: false }
        }
      },
      animation: {
        duration: 2000,
        delay: (context) => context.dataIndex * 80
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
