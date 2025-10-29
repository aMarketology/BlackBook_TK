// All Markets Page
import { getMarkets } from '../lib/api';
import { showToast } from '../lib/utils';
import type { Market } from '../types';

interface BlockchainMarket {
    id: string;
    title: string;
    description: string;
    category: string;
    options: string[];
    is_resolved: boolean;
    winning_option: number | null;
    escrow_address: string;
    created_at: number;
    total_volume: number;
    unique_bettors: string[];
    bet_count: number;
    on_leaderboard: boolean;
}

export async function renderAllMarketsPage() {
    const container = document.getElementById('mainContent');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="page-header">
            <h1>📊 All Markets</h1>
            <p>Browse all active prediction markets</p>
        </div>
        <div style="text-align: center; padding: 40px;">
            <p style="font-size: 18px; color: #65676b;">Loading markets...</p>
        </div>
    `;

    try {
        // Fetch real markets from blockchain
        console.log('Fetching markets from API...');
        const response = await getMarkets();
        console.log('Raw API response:', response);
        console.log('Response type:', typeof response, 'Is array:', Array.isArray(response));
        
        const markets: BlockchainMarket[] = Array.isArray(response) ? response : [];
        console.log('Markets array length:', markets.length);
        
        // Sort by newest first (created_at descending)
        markets.sort((a, b) => b.created_at - a.created_at);
        console.log('Sorted markets:', markets.length, 'items');

        if (markets.length === 0) {
            container.innerHTML = `
                <div class="page-header">
                    <h1>📊 All Markets</h1>
                    <p>Browse all active prediction markets</p>
                </div>
                <div style="text-align: center; padding: 40px;">
                    <p style="font-size: 18px; color: #65676b;">No markets available yet</p>
                    <p style="color: #8a8d91;">AI events will appear here when posted</p>
                </div>
            `;
            return;
        }

        const marketsHTML = markets.map(market => createMarketCard(market)).join('');

        container.innerHTML = `
            <div class="page-header">
                <h1>📊 All Markets</h1>
                <p>Browse all active prediction markets - ${markets.length} total</p>
                <div style="margin-top: 10px;">
                    <a href="http://localhost:3000/ai/events/feed.rss" target="_blank" style="color: #1877f2; text-decoration: none; font-size: 14px;">
                        📡 Subscribe to AI Events RSS Feed
                    </a>
                </div>
            </div>

            <div class="market-filters">
                <input type="text" id="marketSearch" placeholder="🔍 Search markets..." class="search-input">
                <select id="categoryFilter" class="filter-select">
                    <option value="all">All Categories</option>
                    <option value="crypto">Crypto</option>
                    <option value="tech">Tech</option>
                    <option value="business">Business</option>
                    <option value="sports">Sports</option>
                    <option value="politics">Politics</option>
                </select>
                <select id="sortBy" class="filter-select">
                    <option value="newest">Newest First</option>
                    <option value="deadline">Deadline Soon</option>
                    <option value="volume">Highest Volume</option>
                    <option value="popular">Most Popular</option>
                </select>
            </div>

            <div class="markets-grid">
                ${marketsHTML}
            </div>
        `;

        // Add event listeners
        setupFilters(markets);
        
    } catch (error) {
        console.error('Failed to load markets:', error);
        showToast('Failed to load markets', 'error');
        container.innerHTML = `
            <div class="page-header">
                <h1>📊 All Markets</h1>
                <p>Browse all active prediction markets</p>
            </div>
            <div style="text-align: center; padding: 40px;">
                <p style="font-size: 18px; color: #e41e3f;">Failed to load markets</p>
                <p style="color: #8a8d91;">Make sure the backend is running</p>
            </div>
        `;
    }
}

function createMarketCard(market: BlockchainMarket): string {
    const categoryIcons: Record<string, string> = {
        crypto: '₿',
        tech: '💻',
        business: '📈',
        sports: '⚽',
        politics: '🏛️'
    };

    const icon = categoryIcons[market.category] || '📊';
    const createdDate = new Date(market.created_at * 1000).toLocaleDateString();
    const isAiGenerated = market.id.startsWith('ai_market_');
    
    // Extract event deadline
    const extractEventDate = (market: BlockchainMarket): Date | null => {
        const yearMatch = market.title.match(/\b(202[5-9]|203[0-9])\b/);
        if (!yearMatch) return null;
        const year = parseInt(yearMatch[1]);
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const titleLower = market.title.toLowerCase() + ' ' + market.description.toLowerCase();
        for (let i = 0; i < monthNames.length; i++) {
            if (titleLower.includes(monthNames[i])) {
                return new Date(year, i, 15);
            }
        }
        return new Date(year, 11, 31);
    };
    
    const eventDate = extractEventDate(market);
    const eventDateStr = eventDate ? eventDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    const daysUntil = eventDate ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isUpcoming = daysUntil !== null && daysUntil > 0 && daysUntil <= 90;
    
    return `
        <div class="market-card" data-category="${market.category}" data-id="${market.id}">
            <div class="market-header">
                <span class="market-icon">${icon}</span>
                <span class="market-category">${market.category}</span>
                ${isAiGenerated ? '<span class="ai-badge">🤖 AI</span>' : ''}
                ${isUpcoming ? `<span class="deadline-badge">📅 ${eventDateStr}</span>` : ''}
            </div>
            <h3 class="market-title">${market.title}</h3>
            <p class="market-description">${market.description}</p>
            ${daysUntil !== null && daysUntil > 0 ? `<p class="deadline-info">⏰ ${daysUntil} days until event</p>` : ''}
            <div class="market-stats">
                <div class="stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">${market.total_volume.toFixed(2)} BB</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Bettors</span>
                    <span class="stat-value">${market.unique_bettors.length}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Created</span>
                    <span class="stat-value">${createdDate}</span>
                </div>
            </div>
            <div class="market-options">
                ${market.options.map((option, i) => `
                    <button class="option-btn" onclick="placeBet('${market.id}', ${i}, '${option.replace(/'/g, "\\'")}')">
                        <span>${option}</span>
                        <span class="odds">Bet</span>
                    </button>
                `).join('')}
            </div>
            ${market.on_leaderboard ? '<div class="leaderboard-badge">⭐ Trending</div>' : ''}
        </div>
    `;
}

function setupFilters(markets: BlockchainMarket[]) {
    const searchInput = document.getElementById('marketSearch') as HTMLInputElement;
    const categoryFilter = document.getElementById('categoryFilter') as HTMLSelectElement;
    const sortBy = document.getElementById('sortBy') as HTMLSelectElement;

    // Helper function to extract event date from market title/description
    const extractEventDate = (market: BlockchainMarket): Date | null => {
        // Look for year patterns in title (e.g., "2025", "2026", "2027")
        const yearMatch = market.title.match(/\b(202[5-9]|203[0-9])\b/);
        if (!yearMatch) return null;

        const year = parseInt(yearMatch[1]);
        
        // Look for month names
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        const titleLower = market.title.toLowerCase() + ' ' + market.description.toLowerCase();
        
        for (let i = 0; i < monthNames.length; i++) {
            if (titleLower.includes(monthNames[i])) {
                // Found month, create date
                return new Date(year, i, 15); // Use 15th as default day
            }
        }
        
        // If no month found, use December 31st of that year
        return new Date(year, 11, 31);
    };

    const applyFilters = () => {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const category = categoryFilter?.value || 'all';
        const sort = sortBy?.value || 'newest';
        
        // Filter markets
        let filteredMarkets = markets.filter(market => {
            const matchesSearch = market.title.toLowerCase().includes(searchTerm) ||
                                market.description.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || market.category === category;
            return matchesSearch && matchesCategory;
        });

        // Sort markets
        switch (sort) {
            case 'newest':
                filteredMarkets.sort((a, b) => b.created_at - a.created_at);
                break;
            case 'deadline':
                filteredMarkets.sort((a, b) => {
                    const dateA = extractEventDate(a);
                    const dateB = extractEventDate(b);
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return dateA.getTime() - dateB.getTime(); // Soonest first
                });
                break;
            case 'volume':
                filteredMarkets.sort((a, b) => b.total_volume - a.total_volume);
                break;
            case 'popular':
                filteredMarkets.sort((a, b) => b.unique_bettors.length - a.unique_bettors.length);
                break;
        }

        // Re-render markets grid
        const marketsGrid = document.querySelector('.markets-grid');
        if (marketsGrid) {
            marketsGrid.innerHTML = filteredMarkets.map(m => createMarketCard(m)).join('');
        }
    };

    searchInput?.addEventListener('input', applyFilters);
    categoryFilter?.addEventListener('change', applyFilters);
    sortBy?.addEventListener('change', applyFilters);
}

// Global bet function
(window as any).placeBet = function(marketId: string, optionIndex: number, optionName: string) {
    console.log(`Placing bet on market ${marketId}: option ${optionIndex} (${optionName})`);
    showToast(`Betting on "${optionName}" - Coming soon!`, 'info');
};
