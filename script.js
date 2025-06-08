document.getElementById("salaryForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const desiredSalary = parseFloat(document.getElementById("desired_inhand").value);
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
      body: JSON.stringify({ net_salary: desired_inhand })  // ✅ FIXED KEY HERE
    });

    const data = await response.json();

    if (data.error) {
      outputDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
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
