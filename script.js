// script.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("salaryForm");
  const input = document.getElementById("netSalary");
  const output = document.getElementById("output");

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const salary = parseFloat(input.value.trim());

    output.innerHTML = ""; // Clear previous output

    if (isNaN(salary) || salary <= 0) {
      output.innerHTML = `<div class="error">❌ Please enter a valid positive salary amount.</div>`;
      return;
    }

    output.innerHTML = `<div class="loading">⏳ Calculating...</div>`;

    try {
      const response = await fetch("https://shuan24.pythonanywhere.com/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ net_salary: salary }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Something went wrong");
      }

      output.innerHTML = `
        <div class="result">
          <h3>CTC Breakdown:</h3>
          <ul>
            <li><strong>Desired In-Hand (Monthly):</strong> ${formatINR(data.desired_inhand)}</li>
            <li><strong>Estimated Gross Salary (Monthly):</strong> ${formatINR(data.estimated_gross_monthly)}</li>
            <li><strong>Monthly Income Tax:</strong> ${formatINR(data.monthly_tax)}</li>
            <li><strong>Monthly EPF (Employee):</strong> ${formatINR(data.monthly_epf_employee)}</li>
            <li><strong>Monthly EPF (Employer):</strong> ${formatINR(data.monthly_epf_employer)}</li>
            <li><strong>Professional Tax:</strong> ${formatINR(data.professional_tax)}</li>
            <li><strong>Estimated Annual CTC:</strong> <mark>${formatINR(data.estimated_annual_ctc)}</mark></li>
          </ul>
        </div>
      `;
    } catch (error) {
      output.innerHTML = `<div class="error">❌ ${error.message}</div>`;
    }
  });
});
