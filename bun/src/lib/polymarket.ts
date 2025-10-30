/**
 * Polymarket API Integration
 * Fetches real prediction market events from Polymarket
 * Using the Gamma API: https://gamma-api.polymarket.com
 */

export interface PolymarketEvent {
    id: string;
    title: string;
    description: string;
    outcome_prices: number[];
    outcomes: string[];
    volume_24h: number;
    volume: number;
    active: boolean;
}

export interface PolymarketMarket {
    id: string;
    question: string;
    description: string;
    outcomes: string[];
    outcomesPrices: number[];
    volume24h: number;
    volume: number;
    active: boolean;
}

const POLYMARKET_API = 'https://gamma-api.polymarket.com/markets';

/**
 * Fetch recent active markets from Polymarket
 * Limit to 7 markets
 */
export async function getPolymarketEvents(): Promise<PolymarketMarket[]> {
    try {
        const response = await fetch(`${POLYMARKET_API}?limit=50&active=true`);

        if (!response.ok) {
            throw new Error(`Polymarket API error: ${response.status}`);
        }

        const data = await response.json();

        // Filter and transform the data
        const markets: PolymarketMarket[] = (data || [])
            .slice(0, 7)
            .map((market: any) => ({
                id: market.id || market.condition_id || `market_${Math.random()}`,
                question: market.question || 'Unknown Market',
                description: market.description || '',
                outcomes: market.outcomes || ['YES', 'NO'],
                outcomesPrices: market.outcome_prices || [0.5, 0.5],
                volume24h: market.volume_24h || 0,
                volume: market.volume || 0,
                active: market.active !== false,
            }));

        return markets;
    } catch (error) {
        console.error('❌ Polymarket API fetch failed:', error);
        throw error;
    }
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
    if (volume >= 1_000_000) {
        return `$${(volume / 1_000_000).toFixed(1)}M`;
    }
    if (volume >= 1_000) {
        return `$${(volume / 1_000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
}

/**
 * Get color for outcome price (lower = more likely NO/red, higher = more likely YES/green)
 */
export function getPriceColor(price: number): string {
    if (price > 0.65) return '#2bbb3d'; // Green - likely YES
    if (price > 0.55) return '#f39c12'; // Orange - slightly likely YES
    if (price > 0.45) return '#888888'; // Gray - neutral
    if (price > 0.35) return '#f39c12'; // Orange - slightly likely NO
    return '#e63946'; // Red - likely NO
}

/**
 * Get label for outcome price
 */
export function getPriceLabel(price: number): string {
    if (price > 0.65) return 'Likely';
    if (price > 0.55) return 'Slightly';
    if (price > 0.45) return 'Neutral';
    if (price > 0.35) return 'Slightly';
    return 'Likely';
}
