// Home Page (Live Betting)
import { LiveBetting } from '../components/LiveBetting';

let liveBettingComponent: LiveBetting | null = null;

export function renderHomePage() {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
        <div class="page-header">
            <h1>🔴 LIVE Price Market Betting</h1>
            <p>Real-time BTC and SOL price predictions</p>
        </div>
        <div id="liveMarketContainer"></div>
    `;

    // Initialize live betting component
    const liveContainer = document.getElementById('liveMarketContainer');
    if (liveContainer) {
        liveBettingComponent = new LiveBetting(liveContainer);
    }
}

// Cleanup function
export function destroyHomePage() {
    if (liveBettingComponent) {
        // Any cleanup needed
        liveBettingComponent = null;
    }
}
