document.addEventListener('DOMContentLoaded', () => {
    // Get all DOM elements
    const userInput = document.getElementById('userInput');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultContainer = document.getElementById('resultContainer');
    const summaryDiv = document.getElementById('summary');
    const breakdownBody = document.querySelector('#breakdownTable tbody');
    const tipsDiv = document.getElementById('tips');
    const loader = document.getElementById('loader');
    const errorContainer = document.getElementById('errorContainer');
    const chartContainer = document.getElementById('chartContainer');
    const salaryChart = document.getElementById('salaryChart');
    
    // Debugging: Log that script loaded
    console.log("Salary Calculator script loaded");

    // Event listeners
    calculateBtn.addEventListener('click', handleSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });

    function handleSubmit() {
        console.log("Calculate button clicked");
        const query = userInput.value.trim();
        console.log("User query:", query);
        
        if (!query) {
            showError('Kuchh to likho yaar!');
            return;
        }
        
        // Clear previous results
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        chartContainer.classList.add('hidden');
        loader.classList.remove('hidden');
        
        // Destroy existing chart if exists
        if (window.salaryChart) {
            window.salaryChart.destroy();
        }
        
        // Make API request
        fetch('https://shuan24.pythonanywhere.com/calculate', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query })
        })
        .then(response => {
            console.log("API response status:", response.status);
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API response data:", data);
            loader.classList.add('hidden');
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            displayResults(data);
            resultContainer.classList.remove('hidden');
        })
        .catch(error => {
            console.error("API Error:", error);
            loader.classList.add('hidden');
            showError(`Error: ${error.message || 'Server se connect nahi ho paya'}`);
        });
    }

    function displayResults(data) {
        // Summary
        summaryDiv.innerHTML = data.summary;
        
        // Breakdown table
        breakdownBody.innerHTML = '';
        data.breakdown.forEach(item => {
            const row = document.createElement('tr');
            const amount = formatCurrency(item.amount);
            row.innerHTML = `<td>${item.component}</td><td>${amount}</td>`;
            breakdownBody.appendChild(row);
        });
        
        // Tips
        tipsDiv.innerHTML = `<strong>📌 Pro Tips:</strong><ul>${
            data.tips.map(tip => `<li>${tip}</li>`).join('')
        }</ul>`;
        
        // Handle chart request
        if (data.chart_requested) {
            chartContainer.classList.remove('hidden');
            createSalaryChart(data.breakdown);
        }
    }

    function createSalaryChart(breakdown) {
        const ctx = salaryChart.getContext('2d');
        
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
                if (item.amount < 0) {
                    backgroundColors.push('#ef4444'); // Red for deductions
                } else if (item.component.includes('HRA')) {
                    backgroundColors.push('#3b82f6'); // Blue for HRA
                } else if (item.component.includes('Basic')) {
                    backgroundColors.push('#10b981'); // Green for Basic
                } else if (item.component.includes('PF')) {
                    backgroundColors.push('#8b5cf6'); // Purple for PF
                } else {
                    backgroundColors.push('#f59e0b'); // Yellow for others
                }
            }
        });
        
        // Create chart
        window.salaryChart = new Chart(ctx, {
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
        setTimeout(setupPDFExport, 500);
    }
    
    function setupPDFExport() {
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
        const chartCanvas = document.getElementById('salaryChart');
        const chartImage = chartCanvas.toDataURL('image/png');
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
        errorContainer.classList.remove('hidden');
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
});
