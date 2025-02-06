const API_KEY = 'AIzaSyBY8KjikQfk3F3NDZfOCMLB9Ka2MW33Nlg';

function calculateDangerLevel(analysis) {
    const riskWords = ['phishing', 'scam', 'dangerous', 'fraud', 'malicious', 'warning'];
    const dangerScore = riskWords.reduce((score, word) => 
        analysis.toLowerCase().includes(word) ? score + 20 : score, 0);
    return Math.min(dangerScore, 100);
}

function setDangerMeter(score) {
    const meterElement = document.getElementById('danger-meter');
    meterElement.style.width = `${score}%`;
    if (score < 30) {
        meterElement.style.backgroundColor = '#4caf50'; // Green
    } else if (score < 70) {
        meterElement.style.backgroundColor = '#ff9800'; // Orange
    } else {
        meterElement.style.backgroundColor = '#f44336'; // Red
    }
}

async function checkPhishing(url) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Analyze this URL for phishing risks. Provide risk assessment and key observations. URL give 30 words responce and dont give ** symbols: ${url}` }]
                    }]
                })
            }
        );
  
        const data = await response.json();
        const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to analyze URL';
        return analysis;
    } catch (error) {
        return `Error: ${error.message} `;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const resultDiv = document.getElementById('result');
    const urlDiv = document.getElementById('url');

    // Get current tab's URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    
    // Display URL
    urlDiv.textContent = "Please wait checking the url" ;

    // Perform phishing check
    const phishingResult = await checkPhishing(url);
    const styledResult = phishingResult.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

// Use innerHTML to render styled content
resultDiv.innerHTML = styledResult;
  //  resultDiv.textContent = phishingResult;

    // Set danger meter
    const dangerScore = calculateDangerLevel(phishingResult);
    setDangerMeter(dangerScore);
});