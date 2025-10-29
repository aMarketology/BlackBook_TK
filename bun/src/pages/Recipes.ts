// Recipes (Receipts) Page - Platform Activity Feed
import { getMarketActivities } from '../lib/api';
import { showToast } from '../lib/utils';

interface MarketActivity {
    id: string;
    activity_type: string;
    market_id: string | null;
    market_title: string | null;
    actor: string | null;
    amount: number | null;
    details: string;
    timestamp: number;
}

export async function renderRecipesPage() {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
        <div class="page-header">
            <h1>📜 Recipes (Platform Activity)</h1>
            <p>All prediction market transactions and AI events</p>
        </div>

        <div class="recipes-filters">
            <button class="filter-btn active" data-filter="all">All Activity</button>
            <button class="filter-btn" data-filter="ai_event_added">🤖 AI Events</button>
            <button class="filter-btn" data-filter="bet_placed">🎲 Bets</button>
            <button class="filter-btn" data-filter="market_created">📊 Markets</button>
        </div>

        <div id="recipesContainer" class="recipes-list">
            <p style="text-align: center; padding: 40px; color: #65676b;">Loading activities...</p>
        </div>
    `;

    try {
        const activities = await getMarketActivities();
        renderActivitiesList(activities, 'all');
        setupFilters(activities);
    } catch (error) {
        console.error('Failed to load activities:', error);
        showToast('Failed to load activities', 'error');
        const recipesContainer = document.getElementById('recipesContainer');
        if (recipesContainer) {
            recipesContainer.innerHTML = `
                <div class="empty-state">
                    <p style="color: #e41e3f;">Failed to load activities</p>
                    <p style="color: #8a8d91;">Make sure the backend is running</p>
                </div>
            `;
        }
    }
}

function setupFilters(activities: MarketActivity[]) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter') || 'all';
            renderActivitiesList(activities, filter);
        });
    });
}

function renderActivitiesList(activities: MarketActivity[], filter: string = 'all') {
    const recipesContainer = document.getElementById('recipesContainer');
    if (!recipesContainer) return;

    let filtered = activities;
    if (filter !== 'all') {
        filtered = activities.filter(a => a.activity_type === filter);
    }

    if (filtered.length === 0) {
        recipesContainer.innerHTML = `
            <div class="empty-state">
                <p>No ${filter === 'all' ? '' : filter.replace('_', ' ')} activities yet</p>
                <p style="color: #8a8d91; font-size: 14px;">AI events and market activities will appear here</p>
            </div>
        `;
        return;
    }

    const activitiesHTML = filtered.map(activity => createActivityCard(activity)).join('');
    recipesContainer.innerHTML = activitiesHTML;
}

function createActivityCard(activity: MarketActivity): string {
    const typeIcons: Record<string, string> = {
        ai_event_added: '🤖',
        bet_placed: '🎲',
        market_created: '📊',
        market_resolved: '✅',
        transfer: '💸'
    };

    const typeColors: Record<string, string> = {
        ai_event_added: '#9b59b6',
        bet_placed: '#3498db',
        market_created: '#2ecc71',
        market_resolved: '#f39c12',
        transfer: '#e74c3c'
    };

    const icon = typeIcons[activity.activity_type] || '📝';
    const color = typeColors[activity.activity_type] || '#95a5a6';
    const date = new Date(activity.timestamp * 1000).toLocaleString();
    const timeAgo = getTimeAgo(activity.timestamp * 1000);

    return `
        <div class="recipe-card" style="border-left: 4px solid ${color}">
            <div class="recipe-header">
                <span class="recipe-icon">${icon}</span>
                <span class="recipe-type">${activity.activity_type.replace('_', ' ').toUpperCase()}</span>
                <span class="recipe-time">${timeAgo}</span>
            </div>
            <div class="recipe-body">
                ${activity.market_title ? `<h4 class="recipe-title">${activity.market_title}</h4>` : ''}
                <p class="recipe-description">${activity.details}</p>
                <div class="recipe-meta">
                    ${activity.actor ? `<span class="recipe-actor">👤 ${activity.actor}</span>` : ''}
                    ${activity.amount ? `<span class="recipe-amount" style="color: ${color}">${activity.amount} BB</span>` : ''}
                    ${activity.market_id ? `<span class="recipe-market-id">📊 ${activity.market_id.slice(0, 16)}...</span>` : ''}
                </div>
                <div class="recipe-timestamp">${date}</div>
            </div>
        </div>
    `;
}

function getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}
