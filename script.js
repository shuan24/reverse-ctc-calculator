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
      body: JSON.stringify({ in_hand: desiredSalary }) // using consistent key
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
        <canvas id="salaryChart" width="400" height="400" style="margin-top: 30px;"></canvas>
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

// Draw pie chart using Chart.js
function drawChart(data) {
  const ctx = document.getElementById("salaryChart").getContext("2d");

  const chartData = {
    labels: [
      "In-Hand Salary",
      "Income Tax",
      "Employee EPF",
      "Employer EPF",
      "Professional Tax"
    ],
    datasets: [{
      label: "Salary Breakdown",
      data: [
        data.desired_in_hand,
        data.monthly_tax,
        data.employee_epf,
        data.employer_epf,
        data.professional_tax
      ],
      backgroundColor: [
        "#4caf50", // green
        "#f44336", // red
        "#2196f3", // blue
        "#ff9800", // orange
        "#9c27b0"  // purple
      ],
      borderWidth: 1
    }]
  };

  new Chart(ctx, {
    type: "pie",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Monthly Salary Component Breakdown'
        }
      }
    }
  });
}
