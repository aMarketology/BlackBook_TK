/**
 * Price Fetching Module
 * Real-time price data from CoinGecko API with 60-second cache
 * No mock data - throws error if API unavailable
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

interface PriceCache {
    btc: number;
    sol: number;
    timestamp: number;
}

let cache: PriceCache | null = null;

/**
 * Fetch current prices for BTC and SOL from CoinGecko
 * Throws error if API is unavailable
 * Uses 60-second cache to minimize rate limiting
 */
export async function getPrices(): Promise<{ btc: number; sol: number }> {
    const now = Date.now();

    // Check cache validity
    if (cache && now - cache.timestamp < CACHE_DURATION_MS) {
        return {
            btc: cache.btc,
            sol: cache.sol,
        };
    }

    try {
        const params = new URLSearchParams({
            ids: 'bitcoin,solana',
            vs_currencies: 'usd',
        });

        const response = await fetch(`${COINGECKO_API}?${params}`);

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.bitcoin?.usd || !data.solana?.usd) {
            throw new Error('Invalid CoinGecko response: missing price data');
        }

        const btc = data.bitcoin.usd;
        const sol = data.solana.usd;

        // Update cache
        cache = {
            btc,
            sol,
            timestamp: now,
        };

        return { btc, sol };
    } catch (error) {
        console.error('❌ Price fetch failed:', error);
        throw error; // No fallback - throw error so UI can show it
    }
}

/**
 * Get cached prices if available, otherwise throw error
 */
export function getCachedPrices(): { btc: number; sol: number } | null {
    if (!cache) {
        return null;
    }

    const now = Date.now();
    if (now - cache.timestamp >= CACHE_DURATION_MS) {
        cache = null;
        return null;
    }

    return {
        btc: cache.btc,
        sol: cache.sol,
    };
}

/**
 * Format price for display (USD with 2 decimals)
 */
export function formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
}

/**
 * Get time until cache expires (in seconds)
 */
export function getCacheTimeRemaining(): number {
    if (!cache) {
        return 0;
    }

    const now = Date.now();
    const elapsed = now - cache.timestamp;
    const remaining = Math.max(0, CACHE_DURATION_MS - elapsed);

    return Math.ceil(remaining / 1000);
}
