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

      // Render Pie Chart
      renderSalaryChart({
        inHand: data.desired_in_hand,
        tax: data.monthly_tax,
        epfEmployee: data.employee_epf,
        epfEmployer: data.employer_epf,
        profTax: data.professional_tax
      });
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

// Chart.js Pie Chart Renderer
let salaryPieChart = null;

function renderSalaryChart(components) {
  const ctx = document.getElementById('salaryChart').getContext('2d');

  // Destroy old chart if exists
  if (salaryPieChart) {
    salaryPieChart.destroy();
  }

  salaryPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [
        'Take-Home Salary',
        'Employee EPF',
        'Employer EPF',
        'Income Tax',
        'Professional Tax'
      ],
      datasets: [{
        data: [
          components.inHand,
          components.epfEmployee,
          components.epfEmployer,
          components.tax,
          components.profTax
        ],
        backgroundColor: [
          '#4caf50',  // green
          '#2196f3',  // blue
          '#ffeb3b',  // yellow
          '#f44336',  // red
          '#9c27b0'   // purple
        ],
        borderWidth: 1,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Monthly Salary Component Breakdown',
          font: {
            size: 18
          }
        }
      }
    }
  });
}
