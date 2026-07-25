/* =========================================================
   AiBirf Market Pulse — chart rendering (Chart.js)
   ========================================================= */
const Charts = (function () {
  let priceChartInstance = null;
  let forecastChartInstance = null;
  const sparkInstances = {};

  const gridColor = "rgba(255,255,255,0.06)";
  const mutedColor = "#8890a6";

  function renderSparkline(canvasEl, closes, tone) {
    const key = canvasEl.dataset.key || canvasEl.id;
    if (sparkInstances[key]) sparkInstances[key].destroy();

    const color = tone === "up" ? "#23a26d" : (tone === "down" ? "#d64545" : "#7c86a3");
    sparkInstances[key] = new Chart(canvasEl, {
      type: "line",
      data: {
        labels: closes.map((_, i) => i),
        datasets: [{
          data: closes,
          borderColor: color,
          borderWidth: 1.6,
          pointRadius: 0,
          tension: 0.25,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });
  }

  function renderPriceChart(canvasEl, dates, closes, indicatorSeries) {
    if (priceChartInstance) priceChartInstance.destroy();

    priceChartInstance = new Chart(canvasEl, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Close",
            data: closes,
            borderColor: "#edeff5",
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.15
          },
          {
            label: "SMA 20",
            data: indicatorSeries.sma20,
            borderColor: "#c89b3c",
            borderWidth: 1.3,
            pointRadius: 0,
            tension: 0.15
          },
          {
            label: "SMA 50",
            data: indicatorSeries.sma50,
            borderColor: "#7c86a3",
            borderWidth: 1.3,
            pointRadius: 0,
            tension: 0.15,
            borderDash: [4, 3]
          },
          {
            label: "Upper Band",
            data: indicatorSeries.bollinger.upper,
            borderColor: "rgba(140,150,175,0.35)",
            borderWidth: 1,
            pointRadius: 0,
            fill: false
          },
          {
            label: "Lower Band",
            data: indicatorSeries.bollinger.lower,
            borderColor: "rgba(140,150,175,0.35)",
            borderWidth: 1,
            pointRadius: 0,
            fill: "-1",
            backgroundColor: "rgba(140,150,175,0.06)"
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: mutedColor, boxWidth: 12, font: { family: "IBM Plex Mono", size: 11 } } },
          tooltip: { mode: "index", intersect: false }
        },
        scales: {
          x: { ticks: { color: mutedColor, maxTicksLimit: 8 }, grid: { color: gridColor } },
          y: { ticks: { color: mutedColor }, grid: { color: gridColor } }
        }
      }
    });
  }

  function renderForecastChart(canvasEl, historyDates, historyCloses, forecastPoints) {
    if (forecastChartInstance) forecastChartInstance.destroy();

    const tailHistory = historyCloses.slice(-30);
    const tailDates = historyDates.slice(-30);

    const forecastLabels = forecastPoints.map((_, i) => `+${i + 1}d`);
    const labels = [...tailDates, ...forecastLabels];

    const historySeries = [...tailHistory, ...new Array(forecastPoints.length).fill(null)];
    const centralSeries = [...new Array(tailHistory.length - 1).fill(null), tailHistory[tailHistory.length - 1], ...forecastPoints.map(p => p.central)];
    const upperSeries = [...new Array(tailHistory.length - 1).fill(null), tailHistory[tailHistory.length - 1], ...forecastPoints.map(p => p.upper)];
    const lowerSeries = [...new Array(tailHistory.length - 1).fill(null), tailHistory[tailHistory.length - 1], ...forecastPoints.map(p => p.lower)];

    forecastChartInstance = new Chart(canvasEl, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "History", data: historySeries, borderColor: "#edeff5", borderWidth: 1.8, pointRadius: 0, tension: 0.15 },
          { label: "Projected", data: centralSeries, borderColor: "#c89b3c", borderWidth: 1.8, borderDash: [5, 3], pointRadius: 0, tension: 0.15 },
          { label: "Upper range", data: upperSeries, borderColor: "rgba(200,155,60,0.25)", borderWidth: 1, pointRadius: 0, fill: false },
          { label: "Lower range", data: lowerSeries, borderColor: "rgba(200,155,60,0.25)", borderWidth: 1, pointRadius: 0, fill: "-1", backgroundColor: "rgba(200,155,60,0.08)" }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: mutedColor, boxWidth: 12, font: { family: "IBM Plex Mono", size: 11 } } }
        },
        scales: {
          x: { ticks: { color: mutedColor, maxTicksLimit: 8 }, grid: { color: gridColor } },
          y: { ticks: { color: mutedColor }, grid: { color: gridColor } }
        }
      }
    });
  }

  return { renderSparkline, renderPriceChart, renderForecastChart };
})();
