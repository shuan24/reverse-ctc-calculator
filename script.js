async function calculate() {
    const query = document.getElementById('queryInput').value.trim();
    if (!query) {
        alert("Kripya apna salary query enter karein");
        return;
    }

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p>Calculating... ⏳</p>';
    
    try {
        const response = await fetch('https://shuan24.pythonanywhere.com/calculate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({query})
        });
        
        const data = await response.json();
        displayResult(data);
    } catch (error) {
        resultDiv.innerHTML = `<p class="error">Error: Kuch gadbad ho gayi. Kripya phir try karein.</p>`;
    }
}

function displayResult(data) {
    const resultDiv = document.getElementById('result');
    
    if (data.query_type === "ctc_to_inhand") {
        resultDiv.innerHTML = `
            <div class="result-card">
                <h3>Result: ₹${formatNumber(data.ctc)} CTC</h3>
                <p>Aapka in-hand salary hoga: <span class="highlight">₹${formatNumber(data.inhand_salary)}/year</span>
                (approx ₹${formatNumber(data.inhand_salary/12)}/month)</p>
                
                <h4>Salary Breakdown:</h4>
                <table class="salary-breakdown">
                    <tr>
                        <th>Component</th>
                        <th>Amount (Yearly)</th>
                    </tr>
                    <tr>
                        <td>Basic Salary</td>
                        <td>₹${formatNumber(data.basic)}</td>
                    </tr>
                    <tr>
                        <td>HRA</td>
                        <td>₹${formatNumber(data.hra)}</td>
                    </tr>
                    <tr>
                        <td>Other Allowances</td>
                        <td>₹${formatNumber(data.other_allowances)}</td>
                    </tr>
                    <tr>
                        <td>Gross Salary</td>
                        <td>₹${formatNumber(data.gross_salary)}</td>
                    </tr>
                    <tr>
                        <td colspan="2"><strong>Deductions:</strong></td>
                    </tr>
                    <tr>
                        <td>Employee PF</td>
                        <td>₹${formatNumber(data.employee_pf)}</td>
                    </tr>
                    <tr>
                        <td>Professional Tax</td>
                        <td>₹${formatNumber(data.professional_tax)}</td>
                    </tr>
                    <tr>
                        <td>Income Tax</td>
                        <td>₹${formatNumber(data.income_tax)}</td>
                    </tr>
                    <tr>
                        <td>Total Deductions</td>
                        <td>₹${formatNumber(data.employee_pf + data.professional_tax + data.income_tax)}</td>
                    </tr>
                    <tr>
                        <td><strong>In-hand Salary</strong></td>
                        <td><strong>₹${formatNumber(data.inhand_salary)}</strong></td>
                    </tr>
                </table>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="result-card">
                <h3>Result: ₹${formatNumber(data.inhand_salary)}/year In-hand Target</h3>
                <p>Aapko chahiye: <span class="highlight">₹${formatNumber(data.ctc)} CTC</span>
                (approx ₹${formatNumber(data.ctc/12)}/month)</p>
                
                <h4>Breakdown:</h4>
                <p>₹${formatNumber(data.ctc)} CTC mein se:</p>
                <ul>
                    <li>Basic: ₹${formatNumber(data.basic)}</li>
                    <li>HRA: ₹${formatNumber(data.hra)}</li>
                    <li>Other Allowances: ₹${formatNumber(data.other_allowances)}</li>
                    <li>Employer PF: ₹${formatNumber(data.employer_pf)}</li>
                    <li>Gratuity: ₹${formatNumber(data.gratuity)}</li>
                </ul>
                
                <p>Deductions ke baad in-hand: ₹${formatNumber(data.inhand_salary)}</p>
            </div>
        `;
    }
}

function formatNumber(num) {
    return num.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });
}
