let salaryChart;  // global chart instance
let chartMode = 'monthly';  // default mode

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
      return;
    }

    // UI Output
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

      <div style="margin-top: 20px;">
        <button onclick="toggleChart()">Switch to ${chartMode === 'monthly' ? 'Annual' : 'Monthly'} View</button>
        <button onclick="toggleChartType()">Toggle Pie/Bar</button>
      </div>
    `;

    renderChart(data);

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

// Chart rendering logic
let currentChartType = 'pie';

function renderChart(data) {
  const ctx = document.getElementById('salaryChart').getContext('2d');

  if (salaryChart) {
    salaryChart.destroy(); // Destroy existing chart before creating new
  }

  const isMonthly = chartMode === 'monthly';

  const labels = ['In-Hand', 'Income Tax', 'Employee EPF', 'Employer EPF', 'Professional Tax'];
  const values = isMonthly
    ? [
        data.desired_in_hand,
        data.monthly_tax,
        data.employee_epf,
        data.employer_epf,
        data.professional_tax
      ]
    : [
        data.desired_in_hand * 12,
        data.monthly_tax * 12,
        data.employee_epf * 12,
        data.employer_epf * 12,
        data.professional_tax * 12
      ];

  const colors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336'];

  const config = {
    type: currentChartType,
    data: {
      labels: labels,
      datasets: [{
        label: isMonthly ? 'Monthly Breakdown' : 'Annual Breakdown',
        data: values,
        backgroundColor: colors,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const total = tooltipItem.dataset.data.reduce((acc, val) => acc + val, 0);
              const value = tooltipItem.raw;
              const percent = ((value / total) * 100).toFixed(1);
              return `${tooltipItem.label}: ${formatINR(value)} (${percent}%)`;
            }
          }
        },
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: `${isMonthly ? 'Monthly' : 'Annual'} Salary Breakdown`
        }
      }
    }
  };

  salaryChart = new Chart(ctx, config);
}

function toggleChart() {
  chartMode = chartMode === 'monthly' ? 'annual' : 'monthly';
  document.querySelector("button[onclick='toggleChart()']").textContent =
    `Switch to ${chartMode === 'monthly' ? 'Annual' : 'Monthly'} View`;
  document.getElementById("salaryForm").dispatchEvent(new Event("submit"));
}

function toggleChartType() {
  currentChartType = currentChartType === 'pie' ? 'bar' : 'pie';
  document.getElementById("salaryForm").dispatchEvent(new Event("submit"));
}
