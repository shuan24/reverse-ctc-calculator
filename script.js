document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userInput = document.getElementById('userInput');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultContainer = document.getElementById('resultContainer');
    const summaryDiv = document.getElementById('summary');
    const breakdownBody = document.querySelector('#breakdownTable tbody');
    const tipsDiv = document.getElementById('tips');
    const loader = document.getElementById('loader');
    const errorContainer = document.getElementById('errorContainer');
    const chartContainer = document.getElementById('chartContainer');
    const salaryChartCanvas = document.getElementById('salaryChart');
    
    // Global variables
    let currentQuery = '';
    let salaryChart = null;

    // Event Listeners
    calculateBtn.addEventListener('click', handleSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });

    function handleSubmit() {
        currentQuery = userInput.value.trim();
        if (!currentQuery) {
            showError('Kuchh to likho yaar!');
            return;
        }
        
        // Clear previous results
        hideElement(resultContainer);
        hideElement(errorContainer);
        hideElement(chartContainer);
        showElement(loader);
        
        // Destroy existing chart
        if (salaryChart) {
            salaryChart.destroy();
            salaryChart = null;
        }
        
        // Make API request
        fetch('https://shuan24.pythonanywhere.com/calculate', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query: currentQuery })
        })
        .then(response => response.json())
        .then(data => {
            hideElement(loader);
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            if (data.clarification) {
                showClarificationPrompt(data.clarification);
                return;
            }
            
            displayResults(data);
            showElement(resultContainer);
        })
        .catch(error => {
            hideElement(loader);
            showError('Server error. Please try again later.');
            console.error('API Error:', error);
        });
    }

    function showClarificationPrompt(message) {
        resultContainer.innerHTML = `
            <div class="clarification-box">
                <p>${message}</p>
                <div class="clarification-options">
                    <button id="annualBtn" class="clarify-btn">Annual</button>
                    <button id="monthlyBtn" class="clarify-btn">Monthly</button>
                </div>
            </div>
        `;
        showElement(resultContainer);
        
        // Add event listeners to buttons
        document.getElementById('annualBtn').addEventListener('click', () => {
            resubmitQuery('annual');
        });
        
        document.getElementById('monthlyBtn').addEventListener('click', () => {
            resubmitQuery('monthly');
        });
    }

    function resubmitQuery(unit) {
        // Append unit to original query
        const clarifiedQuery = `${currentQuery} ${unit}`;
        userInput.value = clarifiedQuery;
        handleSubmit();
    }

    function displayResults(data) {
        // Summary
        summaryDiv.innerHTML = data.summary;
        
        // Breakdown table
        breakdownBody.innerHTML = '';
        data.breakdown.forEach(item => {
            const row = document.createElement('tr');
            const formattedAmount = formatCurrency(item.amount);
            row.innerHTML = `<td>${item.component}</td><td>${formattedAmount}</td>`;
            breakdownBody.appendChild(row);
        });
        
        // Tips
        tipsDiv.innerHTML = `<strong>📌 Pro Tips:</strong><ul>${
            data.tips.map(tip => `<li>${tip}</li>`).join('')
        }</ul>`;
        
        // Handle chart request
        if (data.chart_requested) {
            createSalaryChart(data.breakdown);
            showElement(chartContainer);
            tipsDiv.innerHTML += `<p>📊 Chart ban raha hai — ek second! 👇</p>`;
        }
    }

    function createSalaryChart(breakdown) {
        const ctx = salaryChartCanvas.getContext('2d');
        
        // Prepare chart data
        const labels = [];
        const amounts = [];
        const backgroundColors = [];
        
        breakdown.forEach(item => {
            // Only include significant components
            if (Math.abs(item.amount) > 100) {
                labels.push(item.component);
                amounts.push(Math.abs(item.amount));
                
                // Assign colors based on component type
                backgroundColors.push(getColorForComponent(item.component, item.amount));
            }
        });
        
        // Create chart
        salaryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: amounts,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Salary Breakdown',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
        
        // Add PDF button after chart renders
        setTimeout(addPdfButton, 500);
    }
    
    function addPdfButton() {
        // Remove existing button if any
        const existingBtn = document.getElementById('pdfBtn');
        if (existingBtn) existingBtn.remove();
        
        // Create new button
        const pdfBtn = document.createElement('button');
        pdfBtn.id = 'pdfBtn';
        pdfBtn.textContent = 'Download PDF Report';
        pdfBtn.classList.add('pdf-btn');
        chartContainer.appendChild(pdfBtn);
        
        pdfBtn.addEventListener('click', generatePDF);
    }
    
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Salary Breakdown Report', 105, 15, null, null, 'center');
        
        // Add summary
        doc.setFontSize(12);
        const summary = summaryDiv.textContent;
        doc.text(summary, 20, 25);
        
        // Add chart image
        const chartImage = salaryChartCanvas.toDataURL('image/png');
        doc.addImage(chartImage, 'PNG', 20, 35, 170, 100);
        
        // Add breakdown table
        doc.text('Monthly Breakdown:', 20, 145);
        let yPos = 150;
        
        const breakdownRows = document.querySelectorAll('#breakdownTable tbody tr');
        breakdownRows.forEach(row => {
            const cols = row.querySelectorAll('td');
            doc.text(`${cols[0].textContent}: ${cols[1].textContent}`, 20, yPos);
            yPos += 7;
        });
        
        // Add tips
        yPos += 10;
        doc.text('Tips:', 20, yPos);
        yPos += 7;
        
        const tips = document.querySelectorAll('#tips li');
        tips.forEach(tip => {
            doc.text(`• ${tip.textContent}`, 20, yPos);
            yPos += 7;
        });
        
        // Save PDF
        doc.save('salary-breakdown-report.pdf');
    }

    function showError(message) {
        errorContainer.textContent = message;
        showElement(errorContainer);
    }
    
    function formatCurrency(amount) {
        // Handle negative amounts
        const isNegative = amount < 0;
        const absAmount = Math.abs(amount);
        
        // Format based on amount size
        if (absAmount >= 10000000) { // Crores
            const cr = absAmount / 10000000;
            return `${isNegative ? '-' : ''}₹${cr.toFixed(2)} crore`;
        } else if (absAmount >= 100000) { // Lakhs
            const lakh = absAmount / 100000;
            return `${isNegative ? '-' : ''}₹${lakh.toFixed(2)} lakh`;
        } else if (absAmount >= 1000) { // Thousands
            const k = absAmount / 1000;
            return `${isNegative ? '-' : ''}₹${k.toFixed(1)}k`;
        } else {
            return `${isNegative ? '-' : ''}₹${Math.round(absAmount).toLocaleString('en-IN')}`;
        }
    }
    
    function getColorForComponent(component, amount) {
        const comp = component.toLowerCase();
        if (amount < 0) return '#ef4444'; // Red for deductions
        if (comp.includes('hra')) return '#3b82f6'; // Blue for HRA
        if (comp.includes('basic')) return '#10b981'; // Green for Basic
        if (comp.includes('pf')) return '#8b5cf6'; // Purple for PF
        return '#f59e0b'; // Yellow for others
    }
    
    function showElement(element) {
        element.classList.remove('hidden');
    }
    
    function hideElement(element) {
        element.classList.add('hidden');
    }
});
