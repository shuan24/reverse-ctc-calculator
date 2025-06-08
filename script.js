let salaryChart; // Global reference for Chart.js

document.getElementById("salaryForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const desiredSalary = parseFloat(document.getElementById("desiredSalary").value);
  const outputDiv = document.getElementById("output");
  const chartCanvas = document.getElementById("salaryChart");

  if (isNaN(desiredSalary) || desiredSalary <= 0) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid positive number.</p>`;
    chartCanvas.style.display = "none";
    return;
  }

  outputDiv.innerHTML = `<p class="loading">⏳ Calculating...</p>`;
  chartCanvas.style.display = "none";

  try {
    const response = await fetch("https://shuan24.pythonanywhere.com/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ net_salary: desiredSalary }) // ✅ Correct key
    });

    const data = await response.json();

    if (data.error) {
      outputDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
      chartCanvas.style.display = "none";
    } else {
      outputDiv.innerHTML = `
        <h3>Results</h3>
        <ul class="result">
          <li><strong>Desired In-Hand (Monthly):</strong> ${formatINR(data.desired_inhand)}</li>
          <li><strong>Gross Monthly Salary:</strong> ${formatINR(data.estimated_gross_monthly)}</li>
          <li><strong>Monthly Income Tax:</strong> ${formatINR(data.monthly_tax)}</li>
          <li><strong>Employee EPF:</strong> ${formatINR(data.monthly_epf_employee)}</li>
          <li><strong>Employer EPF:</strong> ${formatINR(data.monthly_epf_employer)}</li>
          <li><strong>Professional Tax:</strong> ${formatINR(data.professional_tax)}</li>
          <li><strong>Total Annual CTC:</strong> ${formatINR(data.estimated_annual_ctc)}</li>
        </ul>
      `;

      // Display pie chart
      renderChart({
        in_hand: data.desired_inhand,
        employee_epf: data.monthly_epf_employee,
        employer_epf: data.monthly_epf_employer,
        tax: data.monthly_tax,
        professional_tax: data.professional_tax
      });
    }
  } catch (error) {
    outputDiv.innerHTML = `<p class="error">❌ Failed to connect to backend. Please try again later.</p>`;
    chartCanvas.style.display = "none";
  }
});

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Chart.js logic
function renderChart(components) {
  const canvas = document.getElementById("salaryChart");
  const ctx = canvas.getContext("2d");
  canvas.style.display = "block";

  const chartData = {
    labels: ["In-Hand", "Employee EPF", "Employer EPF", "Income Tax", "Professional Tax"],
    datasets: [{
      data: [
        components.in_hand,
        components.employee_epf,
        components.employer_epf,
        components.tax,
        components.professional_tax
      ],
      backgroundColor: ["#4caf50", "#2196f3", "#03a9f4", "#f44336", "#ff9800"],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom"
      }
    }
  };

  if (salaryChart) {
    salaryChart.destroy();
  }

  salaryChart = new Chart(ctx, {
    type: "pie",
    data: chartData,
    options: chartOptions
  });
}
