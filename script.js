let currentChart;  // For managing chart instance
let currentData = {};  // Global chart data store
let currentView = "monthly";  // monthly or annual
let currentChartType = "pie";  // pie or bar

document.getElementById("salaryForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const desiredSalary = parseFloat(document.getElementById("desiredSalary").value);
  const outputDiv = document.getElementById("output");

  if (isNaN(desiredSalary) || desiredSalary <= 0) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid positive number.</p>`;
    return;
  }

  outputDiv.innerHTML = `<p class="loading">⏳ Calculating...</p>`;

  try {
    const response = await fetch("https://shuan24.pythonanywhere.com/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ in_hand: desiredSalary })
    });

    const data = await response.json();

    if (data.error) {
      outputDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
    } else {
      currentData = data;

      outputDiv.innerHTML = `
        <h3>Results</h3>
        <ul class="result">
          <li><strong>Desired In-Hand (Monthly):</strong> ${formatINR(data.desired_in_hand)}</li>
          <li><strong>Gross Monthly Salary:</strong> ${formatINR(data.gross_monthly)}</li>
          <li><strong>Monthly Income Tax:</strong> ${formatINR(data.monthly_tax)}</li>
          <li><strong>Employee EPF:</strong> ${formatINR(data.employee_epf)}</li>
          <li><strong>Employer EPF:</strong> ${formatINR(data.employer_epf)}</li>
          <li><strong>Professional Tax:</strong> ${formatINR(data.professional_tax)}</li>
          <li><strong>Total Annual CTC:</strong> ${formatINR(data.annual_ctc)}</li>
        </ul>
      `;

      drawChart(data);
    }
  } catch (error) {
    outputDiv.innerHTML = `<p class="error">❌ Failed to connect to backend. Please try again later.</p>`;
  }
});

// Format currency in Indian style with rupee symbol
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

function drawChart(data) {
  const ctx = document.getElementById("salaryChart").getContext("2d");

  if (currentChart) currentChart.destroy();

  let labels, values, title;

  if (currentView === "monthly") {
    labels = ["In-Hand Salary", "Income Tax", "Employee EPF", "Professional Tax"];
    values = [
      data.desired_in_hand,
      data.monthly_tax,
      data.employee_epf,
      data.professional_tax
    ];
    title = "Monthly Salary Breakdown";
  } else {
    labels = ["In-Hand Salary", "Income Tax", "Employee EPF", "Professional Tax"];
    values = [
      data.desired_in_hand * 12,
      data.monthly_tax * 12,
      data.employee_epf * 12,
      data.professional_tax * 12
    ];
    title = "Annual Salary Breakdown";
  }

  const backgroundColors = [
    "#4caf50", // In-Hand
    "#f44336", // Tax
    "#ff9800", // EPF
    "#2196f3"  // PT
  ];

  const config = {
    type: currentChartType,
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 18
          }
        },
        legend: {
          position: 'bottom'
        },
        datalabels: {
          color: '#fff',
          formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percent = ((value / total) * 100).toFixed(1);
            return percent + "%";
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    },
    plugins: [ChartDataLabels]
  };

  currentChart = new Chart(ctx, config);
}

// Toggle buttons
document.getElementById("chartTypeToggle").addEventListener("change", () => {
  currentChartType = document.getElementById("chartTypeToggle").checked ? "bar" : "pie";
  if (Object.keys(currentData).length > 0) drawChart(currentData);
});

document.getElementById("viewToggle").addEventListener("change", () => {
  currentView = document.getElementById("viewToggle").checked ? "annual" : "monthly";
  if (Object.keys(currentData).length > 0) drawChart(currentData);
});
