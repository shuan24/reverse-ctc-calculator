let currentChart;
let currentData = {};
let currentView = "monthly";
let currentChartType = "pie";

// 📌 Reverse CTC: In-Hand → CTC
document.getElementById("salaryForm").addEventListener("submit", async e => {
  e.preventDefault();
  const desiredSalary = parseFloat(document.getElementById("desiredSalary").value);
  const basicPercent = parseFloat(document.getElementById("basicPercentReverse").value) / 100;
  const outputDiv = document.getElementById("output");
  
  if (isNaN(desiredSalary) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid salary</p>`;
    return;
  }
  
  outputDiv.innerHTML = `<p class="loading">⏳ Calculating...</p>`;
  document.getElementById("taxBreakdown").classList.add("hidden");
  
  try {
    const res = await fetch("https://shuan24.pythonanywhere.com/calculate", {  
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        in_hand: desiredSalary,
        basic_percent: basicPercent 
      })
    });
    
    const data = await res.json();
    if (data.error) {
      outputDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
    } else {
      currentData = data;
      displayResults(data);
      drawChart(data);
      if (data.tax_breakdown) {
        renderTaxBreakdown(data.tax_breakdown);
      }
    }
  } catch (err) {
    outputDiv.innerHTML = `<p class="error">❌ Failed to connect. Try again later.</p>`;
    console.error(err);
  }
});

// 📌 Normal CTC: CTC → In-Hand
document.getElementById("normalForm").addEventListener("submit", async e => {
  e.preventDefault();
  const annualCTC = parseFloat(document.getElementById("inputCTC").value);
  const basicPercent = parseFloat(document.getElementById("basicPercentNormal").value) / 100;
  const outputDiv = document.getElementById("output");
  
  if (isNaN(annualCTC)) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid CTC</p>`;
    return;
  }
  
  outputDiv.innerHTML = `<p class="loading">⏳ Calculating...</p>`;
  document.getElementById("taxBreakdown").classList.add("hidden");
  
  try {
    const res = await fetch("https://shuan24.pythonanywhere.com/calculate_inhand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ctc: annualCTC,
        basic_percent: basicPercent
      })
    });
    
    const data = await res.json();
    if (data.error) {
      outputDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
    } else {
      currentData = {
        in_hand_monthly: data.in_hand_monthly,
        gross_monthly: data.gross_monthly,
        monthly_tax: data.monthly_tax,
        employee_epf: data.employee_epf,
        employer_epf: data.employer_epf,
        professional_tax: data.professional_tax,
        gratuity_annual: data.gratuity_annual,
        annual_ctc: data.annual_ctc,
        tax_breakdown: data.tax_breakdown
      };
      displayResults(currentData);
      drawChart(currentData);
      if (data.tax_breakdown) {
        renderTaxBreakdown(data.tax_breakdown);
      }
    }
  } catch (err) {
    outputDiv.innerHTML = `<p class="error">❌ Calculation failed. Try again later.</p>`;
    console.error(err);
  }
});

// 📌 Chart type toggle
document.getElementById("chartToggle").addEventListener("change", () => {
  currentChartType = document.getElementById("chartToggle").checked ? "bar" : "pie";
  if (Object.keys(currentData).length) drawChart(currentData);
});

// 📌 View mode toggle
document.getElementById("viewToggle").addEventListener("change", () => {
  currentView = document.getElementById("viewToggle").checked ? "annual" : "monthly";
  if (Object.keys(currentData).length) drawChart(currentData);
});

// 📌 Render results
function displayResults(data) {
  const isReverse = data.desired_in_hand !== undefined;
  
  document.getElementById("output").innerHTML = `
    <h3>Results</h3>
    <ul class="result">
      ${isReverse ? 
        `<li><strong>Desired In-Hand:</strong> ${formatINR(data.desired_in_hand)}/month</li>` : 
        `<li><strong>In-Hand Salary:</strong> ${formatINR(data.in_hand_monthly)}/month</li>`}
      <li><strong>Gross Salary:</strong> ${formatINR(data.gross_monthly)}/month</li>
      <li><strong>Income Tax:</strong> ${formatINR(data.monthly_tax)}/month</li>
      <li><strong>Employee EPF:</strong> ${formatINR(data.employee_epf)}/month</li>
      <li><strong>Employer EPF:</strong> ${formatINR(data.employer_epf)}/month</li>
      <li><strong>Professional Tax:</strong> ${formatINR(data.professional_tax)}/month</li>
      <li><strong>Gratuity:</strong> ${formatINR(data.gratuity_annual)}/year</li>
      <li class="highlight"><strong>Total CTC:</strong> ${formatINR(data.annual_ctc)}/year</li>
    </ul>
  `;
}

// 📊 Draw chart
function drawChart(data) {
  const ctx = document.getElementById("salaryChart").getContext("2d");
  if (currentChart) currentChart.destroy();

  const inHandValue = data.in_hand_monthly || data.desired_in_hand;
  const labels = ["Take‑Home", "Income Tax", "Employee EPF", "Prof. Tax"];
  const rawValues = [inHandValue, data.monthly_tax, data.employee_epf, data.professional_tax];
  const values = currentView === "monthly" ? rawValues : rawValues.map(v => v * 12);
  const title = currentView === "monthly" ? "Monthly Breakdown" : "Annual Breakdown";

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
        title: { 
          display: true, 
          text: title, 
          font: { size: 18 },
          padding: { top: 10, bottom: 20 }
        },
        legend: { position: "bottom" },
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 14 },
          formatter: (v, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            return ((v / total) * 100).toFixed(1) + "%";
          }
        }
      },
      animation: { animateRotate: true, animateScale: true },
      maintainAspectRatio: false
    },
    plugins: [ChartDataLabels]
  });
}

// 📈 Render tax breakdown
function renderTaxBreakdown(breakdown) {
  const container = document.getElementById("taxBreakdown");
  const tbody = document.querySelector("#taxTable tbody");
  
  tbody.innerHTML = "";
  container.classList.remove("hidden");
  
  breakdown.forEach(item => {
    const row = document.createElement("tr");
    
    if (item.description) {
      // Special row for rebate/cess
      row.innerHTML = `
        <td colspan="2"><strong>${item.description}</strong></td>
        <td>${formatINR(item.tax)}</td>
      `;
    } else {
      // Regular slab row
      const slabRange = item.end === 0 ? 
        `Above ${formatINR(item.start)}` :
        `${formatINR(item.start)} - ${formatINR(item.end)}`;
      
      const taxRate = item.rate < 0 ? 
        "Rebate" : 
        `${(item.rate * 100).toFixed(0)}%`;
      
      row.innerHTML = `
        <td>${slabRange}</td>
        <td>${taxRate}</td>
        <td>${formatINR(item.tax)}</td>
      `;
    }
    
    tbody.appendChild(row);
  });
  
  // Add total row
  const totalTax = breakdown.reduce((sum, item) => sum + item.tax, 0);
  const totalRow = document.createElement("tr");
  totalRow.classList.add("total-row");
  totalRow.innerHTML = `
    <td colspan="2"><strong>Total Tax</strong></td>
    <td><strong>${formatINR(totalTax)}</strong></td>
  `;
  tbody.appendChild(totalRow);
}

// 💱 Format INR currency
function formatINR(amount) {
  // Handle very large numbers with abbreviations
  if (amount >= 10000000) {
    return '₹' + (amount / 10000000).toFixed(1) + ' Cr';
  }
  if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(1) + ' L';
  }
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency", 
    currency: "INR", 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
