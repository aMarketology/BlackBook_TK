// Tech Markets Page
export function renderTechPage() {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
        <div class="page-header">
            <h1>💻 Tech Markets</h1>
            <p>Technology products, launches, and innovation predictions</p>
        </div>

        <div class="markets-grid">
            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">🤖</span>
                    <span class="market-category">ai</span>
                </div>
                <h3 class="market-title">GPT-5 Launch in 2025?</h3>
                <p class="market-description">Will OpenAI release GPT-5 before end of 2025?</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Deadline</span>
                        <span class="stat-value">Dec 31, 2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">89,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">2.8x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">1.5x</span>
                    </button>
                </div>
            </div>

            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">🥽</span>
                    <span class="market-category">vr</span>
                </div>
                <h3 class="market-title">Apple Vision Pro 2 Announced in 2025?</h3>
                <p class="market-description">Second generation Apple Vision Pro announcement</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Timeline</span>
                        <span class="stat-value">2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">52,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">1.9x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">2.0x</span>
                    </button>
                </div>
            </div>

            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">🚀</span>
                    <span class="market-category">space</span>
                </div>
                <h3 class="market-title">Starship Reaches Mars Orbit in 2025?</h3>
                <p class="market-description">SpaceX Starship successfully reaches Mars orbit</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Mission Window</span>
                        <span class="stat-value">2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">76,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">4.5x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">1.2x</span>
                    </button>
                </div>
            </div>

            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">⚡</span>
                    <span class="market-category">gaming</span>
                </div>
                <h3 class="market-title">Nintendo Switch 2 Released Before Summer?</h3>
                <p class="market-description">Next-gen Nintendo console launch timing</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Deadline</span>
                        <span class="stat-value">June 21, 2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">43,000 BB</span>
                    </div>
                </div>
                <div class="market-options">
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>Yes</span>
                        <span class="odds">1.7x</span>
                    </button>
                    <button class="option-btn" onclick="alert('Betting coming soon!')">
                        <span>No</span>
                        <span class="odds">2.2x</span>
                    </button>
                </div>
            </div>

            <div class="market-card">
                <div class="market-header">
                    <span class="market-icon">🔋</span>
                    <span class="market-category">energy</span>
                </div>
                <h3 class="market-title">Solid-State Battery Breakthrough Announced?</h3>
                <p class="market-description">Major solid-state battery technology announcement in 2025</p>
                <div class="market-stats">
                    <div class="stat">
                        <span class="stat-label">Timeline</span>
                        <span class="stat-value">2025</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">35,000 BB</span>
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
        </div>
    `;
}
