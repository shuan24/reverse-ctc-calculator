document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultContainer = document.getElementById('resultContainer');
    const summaryDiv = document.getElementById('summary');
    const breakdownBody = document.querySelector('#breakdownTable tbody');
    const tipsDiv = document.getElementById('tips');
    const loader = document.getElementById('loader');
    const errorContainer = document.getElementById('errorContainer');

    calculateBtn.addEventListener('click', handleSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });

    function handleSubmit() {
        const query = userInput.value.trim();
        if (!query) return;
        
        // Clear previous results
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        loader.classList.remove('hidden');
        
        fetch('https://shuan24.pythonanywhere.com/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            
            displayResults(data);
            loader.classList.add('hidden');
            resultContainer.classList.remove('hidden');
        })
        .catch(error => {
            showError('Server error. Please try again later.');
            loader.classList.add('hidden');
        });
    }

    function displayResults(data) {
        // Summary
        summaryDiv.innerHTML = `<p>${data.summary}</p>`;
        
        // Breakdown table
        breakdownBody.innerHTML = '';
        data.breakdown.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.component}</td><td>₹${formatNumber(item.amount)}</td>`;
            breakdownBody.appendChild(row);
        });
        
        // Tips
        tipsDiv.innerHTML = `<strong>📌 Pro Tips:</strong><ul>${
            data.tips.map(tip => `<li>${tip}</li>`).join('')
        }</ul>`;
        
        // Handle chart request
        const chartContainer = document.getElementById('chartContainer');
        if (data.chart_requested) {
            chartContainer.classList.remove('hidden');
            createSalaryChart(data.breakdown);
        } else {
            chartContainer.classList.add('hidden');
        }
    }

    function createSalaryChart(breakdown) {
        const ctx = document.getElementById('salaryChart').getContext('2d');
        
        // Destroy existing chart if any
        if (window.salaryChart) {
            window.salaryChart.destroy();
        }
        
        // Prepare chart data
        const labels = [];
        const amounts = [];
        const backgroundColors = [];
        
        breakdown.forEach(item => {
            // Only include significant components
            if (Math.abs(item.amount) > 1000) {
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
                                return `${label}: ₹${value.toLocaleString('en-IN')}`;
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
    }
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    function formatNumber(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
});
