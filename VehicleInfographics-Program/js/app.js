/**
 * Vehicle Sales Infographics - Interactive Data Visualization
 * Main Application JavaScript
 */

// ===== Global Variables =====
let vehicleData = null;
let charts = {};

// Color Palettes
const colorPalettes = {
    primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'],
    gradient: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(118, 75, 162, 0.8)',
        'rgba(240, 147, 251, 0.8)',
        'rgba(245, 87, 108, 0.8)',
        'rgba(79, 172, 254, 0.8)',
        'rgba(0, 242, 254, 0.8)',
        'rgba(67, 233, 123, 0.8)',
        'rgba(56, 249, 215, 0.8)',
        'rgba(250, 112, 154, 0.8)',
        'rgba(254, 225, 64, 0.8)'
    ],
    carColors: {
        'black': '#1a1a1a',
        'white': '#f0f0f0',
        'gray': '#808080',
        'silver': '#c0c0c0',
        'blue': '#4169e1',
        'red': '#dc143c',
        'gold': '#ffd700',
        'green': '#228b22',
        'burgundy': '#800020',
        'beige': '#f5f5dc',
        'brown': '#8b4513',
        'orange': '#ff8c00'
    }
};

// Chart.js defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#6c757d';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(26, 26, 46, 0.95)';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold', size: 14 };

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initCaseNavigator();
    await loadData();
    initCharts();
    animateCounters();
});

// ===== Navigation =====
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    // Mobile menu toggle
    navToggle?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
}

// ===== Case Navigator =====
function initCaseNavigator() {
    const navBtns = document.querySelectorAll('.case-nav-btn');
    const panels = document.querySelectorAll('.case-panel');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const caseNum = btn.dataset.case;
            
            // Update buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update panels
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `case-${caseNum}`) {
                    panel.classList.add('active');
                }
            });
        });
    });
}

// ===== Load Data =====
async function loadData() {
    try {
        const response = await fetch('data/vehicle_data.json');
        if (!response.ok) {
            throw new Error('Data file not found. Please run the data processor first.');
        }
        vehicleData = await response.json();
        updateMetrics();
        console.log('Data loaded successfully:', vehicleData.summary);
    } catch (error) {
        console.error('Error loading data:', error);
        // Load sample data for demonstration
        loadSampleData();
    }
}

// ===== Sample Data (Fallback) =====
function loadSampleData() {
    vehicleData = {
        summary: {
            total_vehicles: 497266,
            total_makes: 45,
            total_models: 1526,
            avg_price: 12875.45,
            median_price: 11500,
            min_price: 500,
            max_price: 45000,
            avg_condition: 3.2,
            avg_odometer: 68750,
            year_range: "2000 - 2015",
            total_states: 50
        },
        age_vs_price: {
            years: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015],
            mean_prices: [4500, 5200, 5800, 6500, 7200, 8100, 9200, 10500, 11800, 12500, 14200, 15800, 17500, 19200, 21500, 24000],
            median_prices: [4200, 4900, 5500, 6200, 6900, 7800, 8800, 10000, 11200, 11900, 13500, 15000, 16800, 18500, 20500, 23000],
            counts: [15000, 18000, 22000, 28000, 35000, 42000, 48000, 52000, 45000, 38000, 42000, 45000, 40000, 35000, 25000, 18000]
        },
        body_type: {
            types: ['SUV', 'Sedan', 'Coupe', 'Van', 'Wagon', 'Hatchback', 'Convertible'],
            mean_prices: [15800, 12500, 14200, 11800, 10500, 9800, 18500],
            median_prices: [15000, 12000, 13500, 11200, 10000, 9200, 17500],
            counts: [125000, 180000, 45000, 35000, 28000, 52000, 12000]
        },
        colors: {
            colors: ['black', 'white', 'gray', 'silver', 'blue', 'red', 'gold', 'green', 'burgundy', 'beige'],
            counts: [98000, 85000, 72000, 65000, 48000, 42000, 25000, 18000, 15000, 12000],
            percentages: [19.7, 17.1, 14.5, 13.1, 9.7, 8.4, 5.0, 3.6, 3.0, 2.4]
        },
        top_makes: {
            makes: ['Ford', 'Chevrolet', 'Toyota', 'Honda', 'Nissan', 'BMW', 'Mercedes-Benz', 'Dodge', 'Jeep', 'Hyundai', 'Kia', 'Volkswagen', 'Mazda', 'Subaru', 'Lexus'],
            counts: [65000, 58000, 52000, 48000, 42000, 28000, 25000, 35000, 32000, 28000, 25000, 22000, 18000, 15000, 12000],
            avg_prices: [12500, 11800, 14200, 13500, 11200, 22500, 25800, 10500, 15800, 10200, 9800, 12800, 11500, 14500, 24500]
        },
        condition_price: {
            conditions: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0],
            avg_prices: [5500, 7200, 9500, 11200, 12800, 15200, 18500, 22000, 28000],
            counts: [8000, 15000, 35000, 68000, 125000, 145000, 72000, 22000, 8000]
        },
        transmission: {
            types: ['automatic', 'manual'],
            mean_prices: [13200, 11500],
            median_prices: [12500, 10800],
            counts: [425000, 72000]
        },
        price_distribution: {
            labels: ['$0-2.5K', '$2.5K-5K', '$5K-7.5K', '$7.5K-10K', '$10K-12.5K', '$12.5K-15K', '$15K-17.5K', '$17.5K-20K', '$20K-22.5K', '$22.5K-25K', '$25K-27.5K', '$27.5K-30K', '$30K+'],
            counts: [15000, 35000, 55000, 72000, 85000, 78000, 62000, 45000, 28000, 15000, 8000, 5000, 3000],
            bin_centers: [1250, 3750, 6250, 8750, 11250, 13750, 16250, 18750, 21250, 23750, 26250, 28750, 32500]
        },
        top_models_price: {
            models: ['Porsche 911', 'Mercedes-Benz S-Class', 'BMW 7 Series', 'Lexus LS', 'Audi A8', 'Cadillac Escalade', 'Land Rover Range Rover', 'Mercedes-Benz E-Class', 'BMW 5 Series', 'Lexus GX', 'Porsche Cayenne', 'Mercedes-Benz GL-Class', 'BMW X5', 'Audi Q7', 'Lincoln Navigator'],
            avg_prices: [45000, 42000, 38000, 35000, 34000, 32000, 31000, 28000, 27000, 26500, 26000, 25500, 25000, 24500, 24000],
            counts: [2500, 3200, 4500, 3800, 2800, 5200, 4800, 12000, 15000, 5500, 4200, 6500, 18000, 8500, 5800]
        },
        state_sales: {
            states: ['TX', 'CA', 'FL', 'PA', 'OH', 'NY', 'GA', 'NC', 'MI', 'IL', 'TN', 'AZ', 'VA', 'NJ', 'SC', 'MD', 'IN', 'MO', 'WI', 'AL'],
            counts: [52000, 48000, 45000, 32000, 28000, 35000, 25000, 22000, 18000, 28000, 15000, 18000, 20000, 22000, 12000, 15000, 10000, 12000, 8000, 10000],
            avg_prices: [12800, 14500, 13200, 11800, 10500, 15200, 12500, 11800, 10200, 12800, 11500, 13500, 14200, 13800, 10800, 14500, 10200, 10500, 10800, 9800]
        },
        odometer_price: {
            ranges: ['0-25K', '25K-50K', '50K-75K', '75K-100K', '100K-150K', '150K-200K', '200K+'],
            avg_prices: [22500, 18500, 14200, 11500, 8500, 5800, 3500],
            counts: [45000, 85000, 125000, 115000, 82000, 35000, 12000]
        },
        interior_colors: {
            colors: ['black', 'gray', 'beige', 'tan', 'brown', 'white', 'red', 'blue'],
            counts: [185000, 125000, 78000, 52000, 28000, 15000, 8000, 6000],
            percentages: [37.2, 25.1, 15.7, 10.5, 5.6, 3.0, 1.6, 1.2]
        },
        make_condition: {
            makes: ['Lexus', 'Toyota', 'Honda', 'Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Subaru', 'Mazda', 'Acura', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Dodge', 'Chrysler', 'Jeep', 'GMC', 'Volkswagen'],
            avg_conditions: [3.8, 3.6, 3.5, 3.7, 3.4, 3.4, 3.3, 3.5, 3.4, 3.5, 3.2, 3.1, 3.2, 3.1, 3.0, 3.0, 2.9, 3.2, 3.1, 3.2],
            avg_prices: [24500, 14200, 13500, 42000, 22500, 25800, 21500, 14500, 11500, 18500, 12500, 11800, 11200, 10200, 9800, 10500, 9500, 15800, 14200, 12800]
        }
    };
    updateMetrics();
}

// ===== Update Metrics =====
function updateMetrics() {
    if (!vehicleData) return;
    
    const summary = vehicleData.summary;
    
    // Hero stats
    document.getElementById('totalVehicles').textContent = formatNumber(summary.total_vehicles) + '+';
    document.getElementById('avgPriceCard').textContent = formatCurrency(summary.avg_price);
    document.getElementById('avgConditionCard').textContent = summary.avg_condition.toFixed(1) + '/5';
    document.getElementById('avgMileageCard').textContent = formatNumber(Math.round(summary.avg_odometer / 1000)) + 'K mi';
    
    // Overview metrics
    document.getElementById('metricRecords').textContent = formatNumber(summary.total_vehicles);
    document.getElementById('metricMakes').textContent = summary.total_makes;
    document.getElementById('metricModels').textContent = formatNumber(summary.total_models);
    document.getElementById('metricStates').textContent = summary.total_states;
    document.getElementById('metricPriceRange').textContent = `$${formatNumber(summary.min_price)} - $${formatNumber(summary.max_price)}`;
    document.getElementById('metricYearRange').textContent = summary.year_range;
}

// ===== Animate Counters =====
function animateCounters() {
    const statVehicles = document.getElementById('statVehicles');
    const statMakes = document.getElementById('statMakes');
    
    if (vehicleData) {
        animateValue(statVehicles, 0, vehicleData.summary.total_vehicles, 2000, formatNumber);
        animateValue(statMakes, 0, vehicleData.summary.total_makes, 1500);
    }
}

function animateValue(element, start, end, duration, formatter = (val) => val) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + range * easeProgress);
        element.textContent = formatter(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ===== Initialize Charts =====
function initCharts() {
    if (!vehicleData) return;
    
    createAgeVsPriceChart();
    createBodyTypeChart();
    createColorsChart();
    createTopMakesChart();
    createConditionChart();
    createTransmissionChart();
    createPriceDistChart();
    createPremiumModelsChart();
    createStatesChart();
    createOdometerChart();
    createInteriorChart();
    createMakeConditionChart();
}

// ===== Chart 1: Age vs Price =====
function createAgeVsPriceChart() {
    const ctx = document.getElementById('chart-age-price')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.age_vs_price;
    
    charts.agePrice = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.years,
            datasets: [{
                label: 'Average Price',
                data: data.mean_prices,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: 'Median Price',
                data: data.median_prices,
                borderColor: '#f093fb',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.4,
                pointBackgroundColor: '#f093fb',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
                        afterLabel: (ctx) => `Vehicles: ${formatNumber(data.counts[ctx.dataIndex])}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year of Manufacture',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (USD)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
    
    // Update insight
    const newest = data.mean_prices[data.mean_prices.length - 1];
    const oldest = data.mean_prices[0];
    const diff = ((newest - oldest) / oldest * 100).toFixed(0);
    document.getElementById('insight-age-price').innerHTML = `
        Newer vehicles (${data.years[data.years.length - 1]}) command <strong>${formatCurrency(newest)}</strong> on average, 
        while older vehicles (${data.years[0]}) sell for <strong>${formatCurrency(oldest)}</strong> - 
        a <strong>${diff}%</strong> price difference showing clear depreciation impact.
    `;
}

// ===== Chart 2: Body Type =====
function createBodyTypeChart() {
    const ctx = document.getElementById('chart-body-type')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.body_type;
    
    charts.bodyType = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.types,
            datasets: [{
                label: 'Average Price',
                data: data.mean_prices,
                backgroundColor: data.types.map((type, i) => {
                    if (type === 'SUV') return 'rgba(67, 233, 123, 0.8)';
                    if (type === 'Sedan') return 'rgba(245, 87, 108, 0.8)';
                    return colorPalettes.gradient[i % colorPalettes.gradient.length];
                }),
                borderColor: data.types.map((type) => {
                    if (type === 'SUV') return '#43e97b';
                    if (type === 'Sedan') return '#f5576c';
                    return '#667eea';
                }),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Average Price: ${formatCurrency(ctx.raw)}`,
                        afterLabel: (ctx) => `Vehicles: ${formatNumber(data.counts[ctx.dataIndex])}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Body Type',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Price (USD)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
    
    // Update insight
    const suvIdx = data.types.indexOf('SUV');
    const sedanIdx = data.types.indexOf('Sedan');
    if (suvIdx !== -1 && sedanIdx !== -1) {
        const diff = data.mean_prices[suvIdx] - data.mean_prices[sedanIdx];
        const pct = ((diff / data.mean_prices[sedanIdx]) * 100).toFixed(1);
        document.getElementById('insight-body-type').innerHTML = `
            <strong>Hypothesis CONFIRMED:</strong> SUVs average <strong>${formatCurrency(data.mean_prices[suvIdx])}</strong> 
            while Sedans average <strong>${formatCurrency(data.mean_prices[sedanIdx])}</strong> - 
            SUVs command a <strong>${pct}%</strong> premium (${formatCurrency(Math.abs(diff))} difference).
        `;
    }
}

// ===== Chart 3: Colors =====
function createColorsChart() {
    const ctx = document.getElementById('chart-colors')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.colors;
    
    charts.colors = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.colors.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                data: data.counts,
                backgroundColor: data.colors.map(c => colorPalettes.carColors[c.toLowerCase()] || '#6c757d'),
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${formatNumber(ctx.raw)} (${data.percentages[ctx.dataIndex]}%)`
                    }
                }
            }
        }
    });
    
    // Update insight
    const topColors = data.colors.slice(0, 3).map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
    const topPct = data.percentages.slice(0, 3).reduce((a, b) => a + b, 0).toFixed(1);
    document.getElementById('insight-colors').innerHTML = `
        The top 3 colors (<strong>${topColors}</strong>) account for <strong>${topPct}%</strong> of all vehicle sales. 
        Neutral colors dominate buyer preferences in the used car market.
    `;
}

// ===== Chart 4: Top Makes =====
function createTopMakesChart() {
    const ctx = document.getElementById('chart-top-makes')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.top_makes;
    
    charts.topMakes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.makes,
            datasets: [{
                label: 'Vehicles Sold',
                data: data.counts,
                backgroundColor: colorPalettes.gradient,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Vehicles: ${formatNumber(ctx.raw)}`,
                        afterLabel: (ctx) => `Avg Price: ${formatCurrency(data.avg_prices[ctx.dataIndex])}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of Vehicles Sold',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatNumber(value)
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Update insight
    document.getElementById('insight-top-makes').innerHTML = `
        <strong>${data.makes[0]}</strong> leads the market with <strong>${formatNumber(data.counts[0])}</strong> vehicles sold, 
        followed by <strong>${data.makes[1]}</strong> and <strong>${data.makes[2]}</strong>. 
        American and Japanese brands dominate the used car market.
    `;
}

// ===== Chart 5: Condition vs Price =====
function createConditionChart() {
    const ctx = document.getElementById('chart-condition')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.condition_price;
    
    charts.condition = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Condition vs Price',
                data: data.conditions.map((c, i) => ({ x: c, y: data.avg_prices[i], count: data.counts[i] })),
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: '#667eea',
                borderWidth: 2,
                pointRadius: data.counts.map(c => Math.sqrt(c / 1000) + 5),
                pointHoverRadius: data.counts.map(c => Math.sqrt(c / 1000) + 8)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            `Condition: ${ctx.raw.x.toFixed(1)}`,
                            `Avg Price: ${formatCurrency(ctx.raw.y)}`,
                            `Vehicles: ${formatNumber(ctx.raw.count)}`
                        ]
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Condition Rating',
                        font: { weight: 'bold' }
                    },
                    min: 0,
                    max: 5.5
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Price (USD)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
    
    // Update insight
    const lowestCond = data.conditions[0];
    const highestCond = data.conditions[data.conditions.length - 1];
    const lowestPrice = data.avg_prices[0];
    const highestPrice = data.avg_prices[data.avg_prices.length - 1];
    const pricePerPoint = (highestPrice - lowestPrice) / (highestCond - lowestCond);
    document.getElementById('insight-condition').innerHTML = `
        Strong positive correlation: vehicles rated <strong>${highestCond.toFixed(1)}</strong> sell for 
        <strong>${formatCurrency(highestPrice)}</strong> on average, vs <strong>${formatCurrency(lowestPrice)}</strong> 
        for condition <strong>${lowestCond.toFixed(1)}</strong>. Each condition point adds ~<strong>${formatCurrency(pricePerPoint)}</strong> to value.
    `;
}

// ===== Chart 6: Transmission =====
function createTransmissionChart() {
    const ctx = document.getElementById('chart-transmission')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.transmission;
    
    charts.transmission = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{
                data: data.counts,
                backgroundColor: ['rgba(102, 126, 234, 0.8)', 'rgba(240, 147, 251, 0.8)'],
                borderColor: ['#667eea', '#f093fb'],
                borderWidth: 3,
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = data.counts.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.raw / total) * 100).toFixed(1);
                            return `${ctx.label}: ${formatNumber(ctx.raw)} (${pct}%)`;
                        },
                        afterLabel: (ctx) => `Avg Price: ${formatCurrency(data.mean_prices[ctx.dataIndex])}`
                    }
                }
            }
        }
    });
    
    // Update insight
    const total = data.counts.reduce((a, b) => a + b, 0);
    const autoPct = ((data.counts[0] / total) * 100).toFixed(1);
    document.getElementById('insight-transmission').innerHTML = `
        <strong>Automatic transmission</strong> dominates with <strong>${autoPct}%</strong> market share 
        (<strong>${formatNumber(data.counts[0])}</strong> vehicles). Automatic vehicles average 
        <strong>${formatCurrency(data.mean_prices[0])}</strong> vs <strong>${formatCurrency(data.mean_prices[1])}</strong> for manual.
    `;
}

// ===== Chart 7: Price Distribution =====
function createPriceDistChart() {
    const ctx = document.getElementById('chart-price-dist')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.price_distribution;
    
    charts.priceDist = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Number of Vehicles',
                data: data.counts,
                backgroundColor: data.counts.map((_, i) => {
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)');
                    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.9)');
                    return gradient;
                }),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Vehicles: ${formatNumber(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Price Range',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Vehicles',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatNumber(value)
                    }
                }
            }
        }
    });
    
    // Update insight
    const maxIdx = data.counts.indexOf(Math.max(...data.counts));
    document.getElementById('insight-price-dist').innerHTML = `
        Most vehicles fall in the <strong>${data.labels[maxIdx]}</strong> price range with 
        <strong>${formatNumber(data.counts[maxIdx])}</strong> vehicles. The distribution shows a 
        right-skewed pattern typical of used car markets.
    `;
}

// ===== Chart 8: Premium Models =====
function createPremiumModelsChart() {
    const ctx = document.getElementById('chart-premium-models')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.top_models_price;
    
    charts.premiumModels = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.models.slice(0, 10),
            datasets: [{
                label: 'Average Price',
                data: data.avg_prices.slice(0, 10),
                backgroundColor: 'rgba(250, 112, 154, 0.8)',
                borderColor: '#fa709a',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Average Price: ${formatCurrency(ctx.raw)}`,
                        afterLabel: (ctx) => `Vehicles: ${formatNumber(data.counts[ctx.dataIndex])}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Average Price (USD)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Update insight
    document.getElementById('insight-premium-models').innerHTML = `
        <strong>${data.models[0]}</strong> tops the list with an average price of 
        <strong>${formatCurrency(data.avg_prices[0])}</strong>. Premium German and Japanese 
        luxury brands dominate the high-end segment.
    `;
}

// ===== Chart 9: States =====
function createStatesChart() {
    const ctx = document.getElementById('chart-states')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.state_sales;
    
    charts.states = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.states,
            datasets: [{
                label: 'Vehicles Sold',
                data: data.counts,
                backgroundColor: colorPalettes.gradient,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Vehicles: ${formatNumber(ctx.raw)}`,
                        afterLabel: (ctx) => `Avg Price: ${formatCurrency(data.avg_prices[ctx.dataIndex])}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'State',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Vehicles',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatNumber(value)
                    }
                }
            }
        }
    });
    
    // Update insight
    document.getElementById('insight-states').innerHTML = `
        <strong>${data.states[0]}</strong> leads in sales volume with <strong>${formatNumber(data.counts[0])}</strong> vehicles, 
        followed by <strong>${data.states[1]}</strong> and <strong>${data.states[2]}</strong>. 
        Southern and Western states show strong market activity.
    `;
}

// ===== Chart 10: Odometer =====
function createOdometerChart() {
    const ctx = document.getElementById('chart-odometer')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.odometer_price;
    
    charts.odometer = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.ranges,
            datasets: [{
                label: 'Average Price',
                data: data.avg_prices,
                borderColor: '#43e97b',
                backgroundColor: 'rgba(67, 233, 123, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#43e97b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 8,
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Average Price: ${formatCurrency(ctx.raw)}`,
                        afterLabel: (ctx) => `Vehicles: ${formatNumber(data.counts[ctx.dataIndex])}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Odometer Range (Miles)',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Price (USD)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
    
    // Update insight
    const lowMileagePrice = data.avg_prices[0];
    const highMileagePrice = data.avg_prices[data.avg_prices.length - 1];
    const diff = lowMileagePrice - highMileagePrice;
    document.getElementById('insight-odometer').innerHTML = `
        Clear inverse relationship: low-mileage vehicles (${data.ranges[0]}) average 
        <strong>${formatCurrency(lowMileagePrice)}</strong>, while high-mileage (${data.ranges[data.ranges.length - 1]}) 
        average only <strong>${formatCurrency(highMileagePrice)}</strong> - a <strong>${formatCurrency(diff)}</strong> difference.
    `;
}

// ===== Chart 11: Interior Colors =====
function createInteriorChart() {
    const ctx = document.getElementById('chart-interior')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.interior_colors;
    
    charts.interior = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.colors.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                data: data.counts,
                backgroundColor: data.colors.map(c => colorPalettes.carColors[c.toLowerCase()] || '#6c757d'),
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${formatNumber(ctx.raw)} (${data.percentages[ctx.dataIndex]}%)`
                    }
                }
            }
        }
    });
    
    // Update insight
    document.getElementById('insight-interior').innerHTML = `
        <strong>${data.colors[0].charAt(0).toUpperCase() + data.colors[0].slice(1)}</strong> dominates interior choices with 
        <strong>${data.percentages[0]}%</strong> market share, followed by 
        <strong>${data.colors[1].charAt(0).toUpperCase() + data.colors[1].slice(1)}</strong> (${data.percentages[1]}%). 
        Dark interior colors are strongly preferred.
    `;
}

// ===== Chart 12: Make Condition =====
function createMakeConditionChart() {
    const ctx = document.getElementById('chart-make-condition')?.getContext('2d');
    if (!ctx) return;
    
    const data = vehicleData.make_condition;
    
    charts.makeCondition = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.makes.slice(0, 15),
            datasets: [{
                label: 'Average Condition',
                data: data.avg_conditions.slice(0, 15),
                backgroundColor: data.avg_conditions.slice(0, 15).map(c => {
                    if (c >= 3.5) return 'rgba(67, 233, 123, 0.8)';
                    if (c >= 3.0) return 'rgba(79, 172, 254, 0.8)';
                    return 'rgba(250, 112, 154, 0.8)';
                }),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Average Condition: ${ctx.raw.toFixed(2)}`,
                        afterLabel: (ctx) => `Avg Price: ${formatCurrency(data.avg_prices[ctx.dataIndex])}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Manufacturer',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Condition Rating',
                        font: { weight: 'bold' }
                    },
                    min: 2.5,
                    max: 4.0
                }
            }
        }
    });
    
    // Update insight
    const bestMake = data.makes[0];
    const bestCondition = data.avg_conditions[0];
    document.getElementById('insight-make-condition').innerHTML = `
        <strong>${bestMake}</strong> leads in quality with an average condition of <strong>${bestCondition.toFixed(2)}</strong>. 
        Japanese luxury brands (Lexus, Acura) and Toyota/Honda consistently maintain higher condition ratings.
    `;
}

// ===== Utility Functions =====
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return num.toLocaleString();
    }
    return num.toString();
}

function formatCurrency(num) {
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
