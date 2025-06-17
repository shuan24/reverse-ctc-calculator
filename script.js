// Tab toggle logic
const tabCTC = document.getElementById('tabCTC');
const tabReverse = document.getElementById('tabReverse');
const normalForm = document.getElementById('normalForm');
const salaryForm = document.getElementById('salaryForm');
const resultsContainer = document.getElementById('resultsContainer');

tabCTC.addEventListener('click', () => {
  tabCTC.classList.add('active-tab');
  tabReverse.classList.remove('active-tab');
  normalForm.style.display = 'block';
  salaryForm.style.display = 'none';
  resultsContainer.classList.add('hidden');
});

tabReverse.addEventListener('click', () => {
  tabReverse.classList.add('active-tab');
  tabCTC.classList.remove('active-tab');
  normalForm.style.display = 'none';
  salaryForm.style.display = 'block';
  resultsContainer.classList.add('hidden');
});

// Basic % slider handlers
document.getElementById('basicPercentNormal').addEventListener('input', function() {
  document.getElementById('basicPercentNormalValue').textContent = this.value + '%';
});

document.getElementById('hraPercentNormal').addEventListener('input', function() {
  document.getElementById('hraPercentNormalValue').textContent = this.value + '%';
});

document.getElementById('basicPercentReverse').addEventListener('input', function() {
  document.getElementById('basicPercentReverseValue').textContent = this.value + '%';
});

// Form submission handlers
normalForm.addEventListener('submit', function(e) {
  e.preventDefault();
  calculateCTCToInhand();
});

salaryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  calculateInhandToCTC();
});

// Format currency in Indian Rupees
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Render tax slabs
function renderTaxSlabs(slabs) {
  const container = document.getElementById('taxSlabsContainer');
  container.innerHTML = '';
  
  slabs.forEach(slab => {
    const row = document.createElement('div');
    row.className = 'slab-row';
    
    row.innerHTML = `
      <span>${slab.range}</span>
      <span>${slab.rate}</span>
      <span>${slab.amount}</span>
    `;
    
    container.appendChild(row);
  });
}

// CTC to In-hand calculation
async function calculateCTCToInhand() {
  // Get input values
  const ctc = parseFloat(document.getElementById('inputCTC').value) || 0;
  const basicPercent = parseFloat(document.getElementById('basicPercentNormal').value) / 100;
  const hraPercent = parseFloat(document.getElementById('hraPercentNormal').value) / 100;
  const bonus = parseFloat(document.getElementById('bonusNormal').value) || 0;
  const allowances = parseFloat(document.getElementById('otherAllowancesNormal').value) || 0;
  const employeePF = parseFloat(document.getElementById('employeePFNormal').value) || 0;
  const employerPF = parseFloat(document.getElementById('employerPFNormal').value) || 0;
  
  // Show loading state
  resultsContainer.classList.add('hidden');
  document.getElementById('resultTitle').textContent = "Calculating...";
  
  try {
    const response = await fetch('https://shuan24.pythonanywhere.com/ctc-to-inhand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ctc: ctc,
        basic_percent: basicPercent * 100, // convert to percentage
        hra_percent: hraPercent * 100,
        bonus: bonus,
        other_allowances: allowances,
        employee_pf: employeePF,
        employer_pf: employerPF
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      alert(`Error: ${data.error}`);
      return;
    }
    
    // Update UI with results
    document.getElementById('resultTitle').textContent = "Salary Breakdown (CTC to In-hand)";
    document.getElementById('resultMainTitle').textContent = "Monthly In-hand";
    document.getElementById('resultMainValue').textContent = formatINR(data.monthly_inhand);
    document.getElementById('resultAnnualValue').textContent = formatINR(data.annual_inhand);
    
    // Components
    document.getElementById('basicValue').textContent = formatINR(data.components.basic);
    document.getElementById('hraValue').textContent = formatINR(data.components.hra);
    document.getElementById('bonusValue').textContent = formatINR(data.components.bonus);
    document.getElementById('allowancesValue').textContent = formatINR(data.components.other_allowances);
    document.getElementById('grossValue').textContent = formatINR(data.components.gross_salary);
    
    // Deductions
    document.getElementById('epfValue').textContent = formatINR(data.components.employee_pf);
    document.getElementById('employerPFValue').textContent = formatINR(data.components.employer_pf);
    document.getElementById('ptValue').textContent = formatINR(data.components.professional_tax);
    document.getElementById('taxValue').textContent = formatINR(data.components.income_tax);
    document.getElementById('totalDeductionsValue').textContent = formatINR(data.total_deductions);
    
    // Tax breakdown
    const taxSlabs = data.tax_breakdown.map(item => {
      return {
        range: item.range || item.description || "Tax",
        rate: item.rate || "-",
        amount: formatINR(item.tax)
      };
    });
    
    renderTaxSlabs(taxSlabs);
    document.getElementById('totalTaxValue').textContent = formatINR(data.components.income_tax);
    
    resultsContainer.classList.remove('hidden');
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to calculate salary. Please try again.');
  }
}

// In-hand to CTC calculation
async function calculateInhandToCTC() {
  // Get input values
  const monthlyInhand = parseFloat(document.getElementById('desiredSalary').value) || 0;
  const basicPercent = parseFloat(document.getElementById('basicPercentReverse').value) / 100;
  const bonus = parseFloat(document.getElementById('bonusReverse').value) || 0;
  const allowances = parseFloat(document.getElementById('otherAllowancesReverse').value) || 0;
  const employeePF = parseFloat(document.getElementById('employeePFReverse').value) || 0;
  const employerPF = parseFloat(document.getElementById('employerPFReverse').value) || 0;
  
  // Show loading state
  resultsContainer.classList.add('hidden');
  document.getElementById('resultTitle').textContent = "Calculating...";
  
  try {
    const response = await fetch('https://shuan24.pythonanywhere.com/inhand-to-ctc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        monthly_inhand: monthlyInhand,
        bonus: bonus,
        other_allowances: allowances,
        basic_percent: basicPercent * 100, // convert to percentage
        employee_pf: employeePF,
        employer_pf: employerPF
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      alert(`Error: ${data.error}`);
      return;
    }
    
    // Update UI with results
    document.getElementById('resultTitle').textContent = "CTC Calculation (In-hand to CTC)";
    document.getElementById('resultMainTitle').textContent = "Annual CTC";
    document.getElementById('resultMainValue').textContent = formatINR(data.ctc);
    document.getElementById('resultAnnualValue').textContent = formatINR(data.components.gross_salary);
    
    // Components
    document.getElementById('basicValue').textContent = formatINR(data.components.basic);
    document.getElementById('hraValue').textContent = formatINR(data.components.hra);
    document.getElementById('bonusValue').textContent = formatINR(data.components.bonus);
    document.getElementById('allowancesValue').textContent = formatINR(data.components.other_allowances);
    document.getElementById('grossValue').textContent = formatINR(data.components.gross_salary);
    
    // Deductions
    document.getElementById('epfValue').textContent = formatINR(data.components.employee_pf);
    document.getElementById('employerPFValue').textContent = formatINR(data.components.employer_pf);
    document.getElementById('ptValue').textContent = formatINR(data.components.professional_tax);
    document.getElementById('taxValue').textContent = formatINR(data.components.income_tax);
    document.getElementById('totalDeductionsValue').textContent = formatINR(data.total_deductions);
    
    // Tax breakdown
    const taxSlabs = data.tax_breakdown.map(item => {
      return {
        range: item.range || item.description || "Tax",
        rate: item.rate || "-",
        amount: formatINR(item.tax)
      };
    });
    
    renderTaxSlabs(taxSlabs);
    document.getElementById('totalTaxValue').textContent = formatINR(data.components.income_tax);
    
    resultsContainer.classList.remove('hidden');
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to calculate CTC. Please try again.');
  }
}

// Initialize with sample values
document.getElementById('basicPercentNormalValue').textContent = '40%';
document.getElementById('hraPercentNormalValue').textContent = '50%';
document.getElementById('basicPercentReverseValue').textContent = '40%';
