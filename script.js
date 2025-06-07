async function calculateCTC() {
  const salary = document.getElementById("netSalary").value;
  const output = document.getElementById("output");

  output.innerHTML = "Calculating...";

  try {
    const response = await fetch("https://shuan24.pythonanywhere.com/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ net_salary: parseFloat(salary) })
    });

    if (!response.ok) throw new Error("Failed to fetch results.");

    const result = await response.json();

    output.innerHTML = `
      <h4>Results</h4>
      <p><strong>Desired In-Hand (Monthly):</strong> ₹${result.desired_inhand}</p>
      <p><strong>Gross Monthly Salary:</strong> ₹${result.estimated_gross_monthly}</p>
      <p><strong>Monthly Income Tax:</strong> ₹${result.monthly_tax}</p>
      <p><strong>Employee EPF:</strong> ₹${result.monthly_epf_employee}</p>
      <p><strong>Employer EPF:</strong> ₹${result.monthly_epf_employer}</p>
      <p><strong>Professional Tax:</strong> ₹${result.professional_tax}</p>
      <p><strong>Total Annual CTC:</strong> ₹${result.estimated_annual_ctc}</p>
    `;
  } catch (error) {
    output.innerHTML = "Error: " + error.message;
  }
}
