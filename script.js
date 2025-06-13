let currentChart;            // Chart.js instance
let currentData = {};        // Latest fetched data
let currentView = "monthly"; // "monthly" or "annual"
let currentChartType = "pie"; // "pie" or "bar"

// 📌 Reverse CTC: In-Hand → CTC
document.getElementById("salaryForm").addEventListener("submit", async e => {
  e.preventDefault();
  const desiredSalary = parseFloat(document.getElementById("desiredSalary").value);
  const outputDiv = document.getElementById("output");
  if (isNaN(desiredSalary) || desiredSalary <= 0) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid positive number.</p>`;
    return;
  }
  outputDiv.innerHTML = `<p class="loading">⏳ Calculating...</p>`;
  try {
    const res = await fetch("https://shuan24.pythonanywhere.com/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ in_hand: desiredSalary })
    });
    const data = await res.json();
    if (data.error) {
      outputDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
    } else {
      currentData = data;
      displayResults(data);
      drawChart(data);
    }
  } catch {
    outputDiv.innerHTML = `<p class="error">❌ Failed to connect. Try again later.</p>`;
  }
});

// 📌 Normal CTC: CTC → In-Hand
document.getElementById("normalForm").addEventListener("submit", async e => {
  e.preventDefault();
  const annualCTC = parseFloat(document.getElementById("inputCTC").value);
  const outputDiv = document.getElementById("output");
  if (isNaN(annualCTC) || annualCTC <= 0) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid CTC amount.</p>`;
    return;
  }
  outputDiv.innerHTML = `<p class="loading">⏳ Calculating...</p>`;
  try {
    const res = await fetch("https://shuan24.pythonanywhere.com/calculate_inhand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ctc: annualCTC })
    });
    const data = await res.json();
    if (data.error) {
      outputDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
    } else {
      currentData = {
        desired_in_hand: data.in_hand_monthly,
        gross_monthly: data.gross_monthly,
        monthly_tax: data.monthly_tax,
        employee_epf: data.employee_epf,
        employer_epf: data.employer_epf,
        professional_tax: data.professional_tax,
        annual_ctc: data.annual_ctc
      };
      displayResults(currentData);
      drawChart(currentData);
    }
  } catch {
    outputDiv.innerHTML = `<p class="error">❌ Calculation failed. Try again later.</p>`;
  }
});

// 📌 Calculator mode toggle
document.getElementById("calculatorToggle").addEventListener("change", function () {
  document.getElementById("salaryForm").style.display = this.checked ? "none" : "block";
  document.getElementById("normalForm").style.display = this.checked ? "block" : "none";
  document.getElementById("output").innerHTML = "";
  if (currentChart) currentChart.destroy();
  currentData = {};
});

// 📌 Chart type toggle (Pie ↔ Bar)
document.getElementById("chartToggle").addEventListener("change", () => {
  currentChartType = document.getElementById("chartToggle").checked ? "bar" : "pie";
  if (Object.keys(currentData).length) drawChart(currentData);
});

// 📌 View mode toggle (Monthly ↔ Annual)
document.getElementById("viewToggle").addEventListener("change", () => {
  currentView = document.getElementById("viewToggle").checked ? "annual" : "monthly";
  if (Object.keys(currentData).length) drawChart(currentData);
});

// 📌 Render the textual breakdown result
function displayResults(data) {
  document.getElementById("output").innerHTML = `
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
}

// 📊 Draw the Pie/Bar chart
function drawChart(data) {
  const ctx = document.getElementById("salaryChart").getContext("2d");
  if (currentChart) currentChart.destroy();

  const labels = ["In‑Hand", "Income Tax", "Employee EPF", "Prof. Tax"];
  const rawValues = [
    data.desired_in_hand, data.monthly_tax, data.employee_epf, data.professional_tax
  ];
  const values = currentView === "monthly"
    ? rawValues
    : rawValues.map(v => v * 12);
  const title = currentView === "monthly"
    ? "Monthly Salary Breakdown"
    : "Annual Salary Breakdown";

  currentChart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#2196f3"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: title, font: { size: 18 } },
        legend: { position: "bottom" },
        datalabels: {
          color: "#fff",
          formatter: (v, ctx) => ((v / ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1) + "%"
        }
      },
      animation: { animateRotate: true, animateScale: true }
    },
    plugins: [ChartDataLabels]
  });
}

// 💱 Format INR currency
function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 0
  }).format(amount);
}
