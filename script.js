document.addEventListener('DOMContentLoaded', function() {
    // Debugging: Confirm script loaded
    debugLog("Script loaded successfully");
    
    // Get all DOM elements
    const elements = {
        userInput: document.getElementById('userInput'),
        calculateBtn: document.getElementById('calculateBtn'),
        resultContainer: document.getElementById('resultContainer'),
        summary: document.getElementById('summary'),
        breakdownBody: document.querySelector('#breakdownTable tbody'),
        tips: document.getElementById('tips'),
        loader: document.getElementById('loader'),
        errorContainer: document.getElementById('errorContainer'),
        chartContainer: document.getElementById('chartContainer'),
        salaryChart: document.getElementById('salaryChart'),
        debugContainer: document.getElementById('debugContainer')
    };
    
    // Debugging: Check elements exist
    debugLog("Elements found:", Object.keys(elements).filter(key => elements[key] !== null));
    
    // Event listeners
    if (elements.calculateBtn) {
        elements.calculateBtn.addEventListener('click', handleSubmit);
        debugLog("Calculate button event listener added");
    } else {
        debugLog("Calculate button not found!", true);
    }
    
    if (elements.userInput) {
        elements.userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSubmit();
        });
    }

    function handleSubmit() {
        debugLog("--- SUBMIT STARTED ---");
        const query = elements.userInput ? elements.userInput.value.trim() : '';
        debugLog("User query: " + query);
        
        if (!query) {
            showError('Kuchh to likho yaar!');
            return;
        }
        
        // Clear previous results
        hideElement(elements.resultContainer);
        hideElement(elements.errorContainer);
        hideElement(elements.chartContainer);
        showElement(elements.loader);
        
        // Reset debug container
        elements.debugContainer.innerHTML = '';
        
        // Make API request
        const apiUrl = 'https://shuan24.pythonanywhere.com/calculate';
        debugLog("Calling API: " + apiUrl);
        
        fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query })
        })
        .then(response => {
            debugLog("API response status: " + response.status);
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            debugLog("API response data:", data);
            hideElement(elements.loader);
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            displayResults(data);
            showElement(elements.resultContainer);
        })
        .catch(error => {
            console.error("API Error:", error);
            hideElement(elements.loader);
            showError(`Error: ${error.message || 'Server se connect nahi ho paya'}`);
            debugLog("API Error: " + error.message, true);
        });
    }

    function displayResults(data) {
        // Summary
        if (elements.summary) {
            elements.summary.innerHTML = data.summary;
        }
        
        // Breakdown table
        if (elements.breakdownBody) {
            elements.breakdownBody.innerHTML = '';
            data.breakdown.forEach(item => {
                const row = document.createElement('tr');
                const amount = formatCurrency(item.amount);
                row.innerHTML = `<td>${item.component}</td><td>${amount}</td>`;
                elements.breakdownBody.appendChild(row);
            });
        }
        
        // Tips
        if (elements.tips) {
            elements.tips.innerHTML = `<strong>📌 Pro Tips:</strong><ul>${
                data.tips.map(tip => `<li>${tip}</li>`).join('')
            }</ul>`;
        }
        
        // Handle chart request
        if (data.chart_requested && elements.chartContainer && elements.salaryChart) {
            showElement(elements.chartContainer);
            createSalaryChart(data.breakdown);
        }
    }

    function createSalaryChart(breakdown) {
        debugLog("Creating salary chart");
        const ctx = elements.salaryChart.getContext('2d');
        
        // Destroy existing chart
        if (window.salaryChart) {
            window.salaryChart.destroy();
        }
        
        // Prepare chart data
        const labels = [];
        const amounts = [];
        const backgroundColors = [];
        
        breakdown.forEach(item => {
            // Only include significant components
            if (Math.abs(item.amount) > 100) {
                labels.push(item.component);
                amounts.push(Math.abs(item.amount));
                
                // Assign colors
                backgroundColors.push(getColorForComponent(item.component, item.amount));
            }
        });
        
        // Create chart
        try {
            window.salaryChart = new Chart(ctx, {
                type: 'pie',
                data: { labels, datasets: [{ data: amounts, backgroundColor: backgroundColors, borderWidth: 1 }] },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${formatCurrency(context.raw)}`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Salary Breakdown',
                            font: { size: 16 }
                        }
                    }
                }
            });
            
            // Add PDF button after chart renders
            setTimeout(setupPDFExport, 500);
        } catch (error) {
            debugLog("Chart error: " + error.message, true);
        }
    }
    
    function setupPDFExport() {
        debugLog("Setting up PDF export");
        // Remove existing button if any
        const existingBtn = document.getElementById('pdfBtn');
        if (existingBtn) existingBtn.remove();
        
        // Create new button
        const pdfBtn = document.createElement('button');
        pdfBtn.id = 'pdfBtn';
        pdfBtn.textContent = 'Download PDF Report';
        pdfBtn.classList.add('pdf-btn');
        elements.chartContainer.appendChild(pdfBtn);
        
        pdfBtn.addEventListener('click', generatePDF);
    }
    
    function generatePDF() {
        debugLog("Generating PDF");
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(18);
            doc.text('Salary Breakdown Report', 105, 15, null, null, 'center');
            
            // Add summary
            doc.setFontSize(12);
            const summary = elements.summary.textContent;
            doc.text(summary, 20, 25);
            
            // Add chart image
            const chartCanvas = elements.salaryChart;
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
        } catch (error) {
            debugLog("PDF error: " + error.message, true);
        }
    }

    function showError(message) {
        if (elements.errorContainer) {
            elements.errorContainer.textContent = message;
            showElement(elements.errorContainer);
        }
    }
    
    function formatCurrency(amount) {
        // Convert to number if needed
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '₹0';
        
        const isNegative = numAmount < 0;
        const absAmount = Math.abs(numAmount);
        
        // Format based on amount size
        return isNegative ? 
            `-₹${Math.round(absAmount).toLocaleString('en-IN')}` : 
            `₹${Math.round(absAmount).toLocaleString('en-IN')}`;
    }
    
    function getColorForComponent(component, amount) {
        const comp = component.toLowerCase();
        if (amount < 0) return '#ef4444'; // Red for deductions
        if (comp.includes('hra')) return '#3b82f6'; // Blue for HRA
        if (comp.includes('basic')) return '#10b981'; // Green for Basic
        if (comp.includes('pf')) return '#8b5cf6'; // Purple for PF
        return '#f59e0b'; // Yellow for others
    }
    
    function showElement(el) {
        if (el) el.classList.remove('hidden');
    }
    
    function hideElement(el) {
        if (el) el.classList.add('hidden');
    }
    
    function debugLog(message, isError = false) {
        console.log(message);
        if (elements.debugContainer) {
            const msgElement = document.createElement('div');
            msgElement.textContent = message;
            msgElement.style.color = isError ? 'red' : 'green';
            elements.debugContainer.appendChild(msgElement);
        }
    }
});
