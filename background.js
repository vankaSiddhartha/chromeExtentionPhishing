const API_KEY = 'AIzaSyBY8KjikQfk3F3NDZfOCMLB9Ka2MW33Nlg';
// Store your API key securely
let scanningInProgress = new Set();

async function checkPhishingInBackground(url, tabId) {
    if (scanningInProgress.has(url)) {
        return;
    }
    
    scanningInProgress.add(url);
    
    try {
        // Quick check first
        const quickCheckResult = performQuickCheck(url);
        if (quickCheckResult.isSuspicious) {
            updateBadge('⚠️', '#FFA500', tabId);
        }

        // Full scan using both APIs
        const [flaskResponse, geminiResponse] = await Promise.all([
            fetch('http://localhost:3000/predict', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ url })
            }),
            fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Analyze this URL for phishing risks. Give a brief assessment in 20 words: ${url}` }]
                    }]
                })
            })
        ]);

        const [flaskData, geminiData] = await Promise.all([
            flaskResponse.json(),
            geminiResponse.json()
        ]);

        const phishingRisk = flaskData.is_phishing;
        const aiAnalysis = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        // Update badge based on risk
        if (flaskData.is_phishing) {
            updateBadge('❌', '#EF4444', tabId);
            await blockPhishingPage(tabId);
        } else if (quickCheckResult.isSuspicious) {
            updateBadge('⚠️', '#F59E0B', tabId);
        } else {
            updateBadge('✓', '#10B981', tabId);
        }

        // Store result
        chrome.storage.local.set({
            [url]: {
                timestamp: Date.now(),
                risk: phishingRisk,
                analysis: aiAnalysis,
                suspiciousPatterns: quickCheckResult.reasons
            }
        });

    } catch (error) {
        console.error('Scanning error:', error);
        updateBadge('!', '#6B7280', tabId);
    } finally {
        scanningInProgress.delete(url);
    }
}

function performQuickCheck(url) {
    const suspiciousPatterns = [
        {
            pattern: /^http:\/\//i,
            description: 'Insecure HTTP connection'
        },
        {
            pattern: /\.(tk|ml|ga|cf|gq|pw)$/i,
            description: 'Suspicious top-level domain'
        },
        {
            pattern: /^[0-9]+\./,
            description: 'IP address-based URL'
        },
        {
            pattern: /(login|signin|account|secure|banking).+(\.com\.|\.net\.)/i,
            description: 'Suspicious login-related subdomain'
        },
        {
            pattern: /paypal|amazon|apple|microsoft|google|facebook/i,
            description: 'Potential brand impersonation'
        }
    ];

    const matches = suspiciousPatterns
        .filter(({ pattern }) => pattern.test(url))
        .map(({ description }) => description);

    return {
        isSuspicious: matches.length > 0,
        reasons: matches
    };
}

function updateBadge(text, color, tabId) {
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
}

async function blockPhishingPage(tabId) {
    try {
        await chrome.tabs.update(tabId, {
            url: chrome.runtime.getURL('blocked.html')
        });
    } catch (error) {
        console.error('Error blocking page:', error);
    }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
            checkPhishingInBackground(tab.url, tabId);
        }
    }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        checkPhishingInBackground(tab.url, tab.id);
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAnalysis') {
        chrome.storage.local.get([request.url], (result) => {
            sendResponse(result[request.url] || null);
        });
        return true;
    }
});