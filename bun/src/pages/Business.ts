// Business Markets Page
export function renderBusinessPage() {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
        <div class="page-header">
            <h1>📈 Business Markets</h1>
            <p>Corporate events, earnings, and business predictions</p>
        </div>

        <div class="markets-grid">
            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">🍎</span>
                    <span class="market-category">tech</span>
                </div>
                <h3 class="market-title">Apple Q4 2025 Earnings Beat Estimates?</h3>
                <p class="market-description">Will Apple exceed analyst expectations for Q4 earnings?</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Announcement</span>
                        <span class="stat-value">Jan 2026</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">42,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Beat</span>
                        <span class="odds">1.9x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Miss</span>
                        <span class="odds">2.0x</span>
                    </button>
                </div>
            </div>

            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">🚗</span>
                    <span class="market-category">automotive</span>
                </div>
                <h3 class="market-title">Tesla Delivers 500K+ Vehicles in Q4?</h3>
                <p class="market-description">Tesla quarterly delivery target prediction</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Quarter End</span>
                        <span class="stat-value">Dec 31, 2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">55,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">2.3x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">1.7x</span>
                    </button>
                </div>
            </div>

            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">📦</span>
                    <span class="market-category">e-commerce</span>
                </div>
                <h3 class="market-title">Amazon Acquires Major Retail Chain in 2025?</h3>
                <p class="market-description">Will Amazon make a major retail acquisition?</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Timeline</span>
                        <span class="stat-value">2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">38,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">3.5x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">1.3x</span>
                    </button>
                </div>
            </div>

            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">💼</span>
                    <span class="market-category">finance</span>
                </div>
                <h3 class="market-title">Fed Cuts Interest Rates Before 2026?</h3>
                <p class="market-description">Federal Reserve interest rate decision prediction</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Timeline</span>
                        <span class="stat-value">Q4 2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">71,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">1.6x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">2.4x</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}
