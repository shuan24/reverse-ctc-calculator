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
  
  if (isNaN(desiredSalary) || desiredSalary <= 0) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid salary amount</p>`;
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
  
  if (isNaN(annualCTC) || annualCTC <= 0) {
    outputDiv.innerHTML = `<p class="error">❌ Please enter a valid CTC amount</p>`;
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
  
  // Show tax breakdown if available
  if (data.tax_breakdown) {
    renderTaxBreakdown(data.tax_breakdown);
  }
}

// 📊 Draw the Pie/Bar chart
function drawChart(data) {
  const ctx = document.getElementById("salaryChart").getContext("2d");
  if (currentChart) currentChart.destroy();

  // Use in-hand or gross salary based on calculator type
  const inHandValue = data.in_hand_monthly || data.desired_in_hand;
  
  const labels = ["Take‑Home", "Income Tax", "Employee EPF", "Prof. Tax"];
  const rawValues = [
    inHandValue, 
    data.monthly_tax, 
    data.employee_epf, 
    data.professional_tax
  ];
  
  const values = currentView === "monthly" ? 
    rawValues : 
    rawValues.map(v => v * 12);
  
  const title = currentView === "monthly" ? 
    "Monthly Salary Breakdown" : 
    "Annual Salary Breakdown";

  // Improved color palette
  const backgroundColors = [
    "rgba(76, 175, 80, 0.9)",    // Take-home - green
    "rgba(244, 67, 54, 0.9)",    // Income tax - red
    "rgba(255, 152, 0, 0.9)",    // EPF - orange
    "rgba(33, 150, 243, 0.9)"    // Prof tax - blue
  ];
  
  const borderColors = [
    "rgba(76, 175, 80, 1)",
    "rgba(244, 67, 54, 1)",
    "rgba(255, 152, 0, 1)",
    "rgba(33, 150, 243, 1)"
  ];
  
  const hoverBackgroundColors = [
    "rgba(76, 175, 80, 1)",
    "rgba(244, 67, 54, 1)",
    "rgba(255, 152, 0, 1)",
    "rgba(33, 150, 243, 1)"
  ];

  currentChart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverBackgroundColor: hoverBackgroundColors,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { 
          display: true, 
          text: title, 
          font: { 
            size: 18,
            weight: 'bold',
            family: "'Inter', sans-serif"
          },
          padding: { top: 10, bottom: 20 },
          color: '#2c3e50'
        },
        legend: { 
          position: "bottom",
          labels: {
            font: {
              size: 14,
              family: "'Inter', sans-serif"
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${formatINR(value)} (${percentage}%)`;
            }
          },
          padding: 12,
          titleFont: {
            size: 14,
            family: "'Inter', sans-serif"
          },
          bodyFont: {
            size: 14,
            family: "'Inter', sans-serif"
          }
        },
        datalabels: {
          color: "#fff",
          font: { 
            weight: "bold", 
            size: 14,
            family: "'Inter', sans-serif"
          },
          textStrokeColor: 'rgba(0,0,0,0.5)',
          textStrokeWidth: 2,
          padding: 6,
          formatter: (v, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            return total > 0 ? Math.round((v / total) * 100) + "%" : "0%";
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      maintainAspectRatio: false,
      // For bar chart specific options
      scales: currentChartType === 'bar' ? {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatINR(value).replace('₹', '');
            },
            font: {
              family: "'Inter', sans-serif",
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 12
            }
          }
        }
      } : {}
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
  
  let totalTax = 0;
  
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
    totalTax += item.tax;
  });
  
  // Add total row
  const totalRow = document.createElement("tr");
  totalRow.classList.add("total-row");
  totalRow.innerHTML = `
    <td colspan="2"><strong>Total Tax</strong></td>
    <td><strong>${formatINR(totalTax)}</strong></td>
  `;
  tbody.appendChild(totalRow);
}

// 💱 Format INR currency (exact amounts)
function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
