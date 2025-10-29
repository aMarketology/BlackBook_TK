// Crypto Markets Page
export function renderCryptoPage() {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
        <div class="page-header">
            <h1>₿ Crypto Markets</h1>
            <p>Cryptocurrency price predictions and trading markets</p>
        </div>

        <div class="crypto-filters">
            <button class="filter-btn active" onclick="filterCryptoTimeframe('1h')">1 Hour</button>
            <button class="filter-btn" onclick="filterCryptoTimeframe('24h')">24 Hours</button>
            <button class="filter-btn" onclick="filterCryptoTimeframe('7d')">7 Days</button>
            <button class="filter-btn" onclick="filterCryptoTimeframe('30d')">30 Days</button>
        </div>

        <div class="markets-grid">
            <div class="market-card crypto-market">
                <div class="market-header">
                    <span class="market-icon">₿</span>
                    <span class="market-category">Bitcoin</span>
                </div>
                <h3 class="market-title">Will BTC break $110K this week?</h3>
                <p class="market-description">Bitcoin price prediction for next 7 days</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Current Price</span>
                        <span class="stat-value" id="cryptoBtcPrice">$0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">45,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">2.1x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">1.8x</span>
                    </button>
                </div>
            </div>

            <div class="market-card crypto-market">
                <div class="market-header">
                    <span class="market-icon">◎</span>
                    <span class="market-category">Solana</span>
                </div>
                <h3 class="market-title">Will SOL reach $300 this month?</h3>
                <p class="market-description">Solana price prediction for November 2025</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Current Price</span>
                        <span class="stat-value" id="cryptoSolPrice">$0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">32,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">3.2x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">1.4x</span>
                    </button>
                </div>
            </div>

            <div class="market-card crypto-market">
                <div class="market-header">
                    <span class="market-icon">Ξ</span>
                    <span class="market-category">Ethereum</span>
                </div>
                <h3 class="market-title">Will ETH flip BTC in market cap?</h3>
                <p class="market-description">The Flippening - Ethereum vs Bitcoin market cap</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Timeline</span>
                        <span class="stat-value">By 2026</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">68,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">5.5x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">1.2x</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Update prices from store
    updateCryptoPrices();
}

function updateCryptoPrices() {
    // This will be updated by the main price subscription
    const event = new CustomEvent('requestPriceUpdate');
    window.dispatchEvent(event);
}

// Global filter function
(window as any).filterCryptoTimeframe = function(timeframe: string) {
    // Remove active from all buttons
    document.querySelectorAll('.crypto-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active to clicked button
    const buttons = document.querySelectorAll('.crypto-filters .filter-btn');
    buttons.forEach(btn => {
        if (btn.textContent?.includes(timeframe)) {
            btn.classList.add('active');
        }
    });
    
    console.log(`Filtering crypto markets by ${timeframe}`);
};
