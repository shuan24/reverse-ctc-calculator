let salaryChart;
let chartMode = 'monthly';
let currentChartType = 'pie';

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

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

function renderChart(data) {
  const ctx = document.getElementById('salaryChart').getContext('2d');

  if (salaryChart) {
    salaryChart.destroy();
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

  const colors = ['#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#f1c40f'];

  salaryChart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels: labels,
      datasets: [{
        label: isMonthly ? 'Monthly Breakdown' : 'Annual Breakdown',
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
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
      },
      scales: currentChartType === 'bar' ? {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatINR(value);
            }
          }
        }
      } : {}
    }
  });
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
