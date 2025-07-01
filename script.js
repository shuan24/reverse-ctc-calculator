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
        
        // Handle chart/PDF request
        if (data.chart_requested) {
            tipsDiv.innerHTML += `<p>📊 Chart ban raha hai — ek second! 👇</p>`;
            // Chart generation would go here
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
