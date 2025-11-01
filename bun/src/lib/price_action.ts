/**
 * Price Action Module
 * Real-time price betting on Bitcoin and Solana
 */

import { BackendService } from './backend_service';
import { debugConsole } from './debug_console';

interface PriceBet {
    id: string;
    asset: 'BTC' | 'SOL';
    account: string;
    direction: 'HIGHER' | 'LOWER';
    amount: number;
    startPrice: number;
    endPrice: number | null;
    duration: 60 | 900; // 1 minute (60s) or 15 minutes (900s)
    startTime: number;
    endTime: number;
    status: 'ACTIVE' | 'WON' | 'LOST';
}

class PriceActionModule {
    private activeBets: Map<string, PriceBet> = new Map();
    private currentPrices = { btc: 0, sol: 0 };

    initialize(_accounts: any[]) {
        // Accounts are passed but we get the selected account from DOM
        this.startPriceUpdates();
    }

    private async startPriceUpdates() {
        // Update prices every 5 seconds
        setInterval(async () => {
            try {
                const prices = await BackendService.getPrices();
                this.currentPrices = prices;
                this.updatePriceDisplay();
                this.checkActiveBets();
            } catch (error) {
                console.error('Price update failed:', error);
            }
        }, 5000);

        // Initial price fetch
        try {
            const prices = await BackendService.getPrices();
            this.currentPrices = prices;
            this.updatePriceDisplay();
        } catch (error) {
            console.error('Initial price fetch failed:', error);
        }
    }

    private updatePriceDisplay() {
        // Update Price Action page prices
        const btcPriceEl = document.getElementById('btcPriceAction');
        const solPriceEl = document.getElementById('solPriceAction');

        if (btcPriceEl) {
            btcPriceEl.textContent = `$${this.currentPrices.btc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        if (solPriceEl) {
            solPriceEl.textContent = `$${this.currentPrices.sol.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Also update header prices (if on Price Action page)
        const btcHeaderEl = document.getElementById('btcPrice');
        const solHeaderEl = document.getElementById('solPrice');

        if (btcHeaderEl) {
            btcHeaderEl.textContent = `$${this.currentPrices.btc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        if (solHeaderEl) {
            solHeaderEl.textContent = `$${this.currentPrices.sol.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        console.log(`📊 Updated price display - BTC: $${this.currentPrices.btc}, SOL: $${this.currentPrices.sol}`);
    }

    async placePriceBet(
        asset: 'BTC' | 'SOL',
        direction: 'HIGHER' | 'LOWER',
        amount: number,
        duration: 60 | 900,
        account: string
    ): Promise<void> {
        const betId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startPrice = asset === 'BTC' ? this.currentPrices.btc : this.currentPrices.sol;
        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);

        const bet: PriceBet = {
            id: betId,
            asset,
            account,
            direction,
            amount,
            startPrice,
            endPrice: null,
            duration,
            startTime,
            endTime,
            status: 'ACTIVE'
        };

        // Place bet on blockchain (deduct balance)
        try {
            const marketId = `${asset}_${direction}_${duration}`;
            await BackendService.placeBet(marketId, account, amount, direction);
            
            this.activeBets.set(betId, bet);
            this.renderActiveBets();
            
            debugConsole.log(
                `🎯 Price bet placed: ${amount} BB on ${asset} ${direction} (${duration}s)`,
                'success'
            );

            // Set timer to resolve bet
            setTimeout(() => {
                this.resolveBet(betId);
            }, duration * 1000);

        } catch (error) {
            debugConsole.log(`❌ Failed to place price bet: ${error}`, 'error');
            throw error;
        }
    }

    private async resolveBet(betId: string) {
        const bet = this.activeBets.get(betId);
        if (!bet || bet.status !== 'ACTIVE') return;

        const endPrice = bet.asset === 'BTC' ? this.currentPrices.btc : this.currentPrices.sol;
        bet.endPrice = endPrice;

        const priceIncreased = endPrice > bet.startPrice;
        const won = (bet.direction === 'HIGHER' && priceIncreased) || 
                    (bet.direction === 'LOWER' && !priceIncreased);

        bet.status = won ? 'WON' : 'LOST';

        if (won) {
            // Winner gets 2x payout (1x return + 1x profit)
            const payout = bet.amount * 2;
            try {
                // Record win on blockchain
                await BackendService.recordBetWin(bet.account, payout, betId);
                
                debugConsole.log(
                    `🎉 Price bet WON! ${bet.asset} went ${bet.direction}. Payout: ${payout} BB`,
                    'success'
                );
            } catch (error) {
                debugConsole.log(`❌ Failed to record win: ${error}`, 'error');
            }
        } else {
            // Record loss on blockchain
            try {
                await BackendService.recordBetLoss(bet.account, bet.amount, betId);
                
                debugConsole.log(
                    `❌ Price bet LOST. ${bet.asset} went ${priceIncreased ? 'HIGHER' : 'LOWER'}`,
                    'error'
                );
            } catch (error) {
                debugConsole.log(`❌ Failed to record loss: ${error}`, 'error');
            }
        }

        this.renderActiveBets();
    }

    private checkActiveBets() {
        const now = Date.now();
        for (const [betId, bet] of this.activeBets.entries()) {
            if (bet.status === 'ACTIVE' && now >= bet.endTime) {
                this.resolveBet(betId);
            }
        }
    }

    private renderActiveBets() {
        const container = document.getElementById('activePriceBets');
        if (!container) return;

        const bets = Array.from(this.activeBets.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 10); // Show last 10 bets

        if (bets.length === 0) {
            container.innerHTML = '<p class="empty-state">No active price bets</p>';
            return;
        }

        container.innerHTML = bets.map(bet => {
            const now = Date.now();
            const remainingMs = Math.max(0, bet.endTime - now);
            const remainingSeconds = Math.floor(remainingMs / 1000);
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            
            const priceChange = bet.endPrice 
                ? ((bet.endPrice - bet.startPrice) / bet.startPrice * 100).toFixed(2)
                : '...';
            
            const statusClass = bet.status === 'WON' ? 'won' : bet.status === 'LOST' ? 'lost' : 'active';
            const statusIcon = bet.status === 'WON' ? '🎉' : bet.status === 'LOST' ? '❌' : '⏳';

            return `
                <div class="price-bet-card ${statusClass}">
                    <div class="bet-header">
                        <span class="bet-asset">${bet.asset}</span>
                        <span class="bet-direction ${bet.direction.toLowerCase()}">${bet.direction}</span>
                        <span class="bet-status">${statusIcon} ${bet.status}</span>
                    </div>
                    <div class="bet-details">
                        <div class="bet-row">
                            <span>Start Price:</span>
                            <span>$${bet.startPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        ${bet.endPrice ? `
                        <div class="bet-row">
                            <span>End Price:</span>
                            <span>$${bet.endPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div class="bet-row">
                            <span>Change:</span>
                            <span class="${parseFloat(priceChange as string) > 0 ? 'positive' : 'negative'}">${priceChange}%</span>
                        </div>
                        ` : `
                        <div class="bet-row">
                            <span>Time Left:</span>
                            <span>${minutes}:${seconds.toString().padStart(2, '0')}</span>
                        </div>
                        `}
                        <div class="bet-row">
                            <span>Amount:</span>
                            <span>${bet.amount} BB</span>
                        </div>
                        <div class="bet-row">
                            <span>Duration:</span>
                            <span>${bet.duration === 60 ? '1 min' : '15 min'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    buildUI(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'price-action-container';
        container.innerHTML = `
            <div class="page-header">
                <h2>⚡ Price Action Betting</h2>
                <p class="subtitle">Bet on Bitcoin and Solana price movements</p>
            </div>

            <div class="price-grid">
                <!-- Bitcoin Card -->
                <div class="price-card">
                    <div class="price-header">
                        <h3>₿ Bitcoin</h3>
                        <div class="current-price">
                            <span class="price-label">Current Price</span>
                            <span class="price-value" id="btcCurrentPrice">$0.00</span>
                        </div>
                    </div>

                    <div class="betting-panel">
                        <h4>Place Bet</h4>
                        
                        <div class="direction-buttons">
                            <button class="btn-direction higher" data-asset="BTC" data-direction="HIGHER">
                                📈 HIGHER
                            </button>
                            <button class="btn-direction lower" data-asset="BTC" data-direction="LOWER">
                                📉 LOWER
                            </button>
                        </div>

                        <div class="timeframe-buttons">
                            <button class="btn-timeframe" data-duration="60">1 Minute</button>
                            <button class="btn-timeframe active" data-duration="900">15 Minutes</button>
                        </div>

                        <div class="amount-input-group">
                            <label>Bet Amount (BB)</label>
                            <input type="number" id="btcBetAmount" class="amount-input" placeholder="10" min="1" value="10">
                        </div>
                    </div>
                </div>

                <!-- Solana Card -->
                <div class="price-card">
                    <div class="price-header">
                        <h3>◎ Solana</h3>
                        <div class="current-price">
                            <span class="price-label">Current Price</span>
                            <span class="price-value" id="solCurrentPrice">$0.00</span>
                        </div>
                    </div>

                    <div class="betting-panel">
                        <h4>Place Bet</h4>
                        
                        <div class="direction-buttons">
                            <button class="btn-direction higher" data-asset="SOL" data-direction="HIGHER">
                                📈 HIGHER
                            </button>
                            <button class="btn-direction lower" data-asset="SOL" data-direction="LOWER">
                                📉 LOWER
                            </button>
                        </div>

                        <div class="timeframe-buttons">
                            <button class="btn-timeframe" data-duration="60">1 Minute</button>
                            <button class="btn-timeframe active" data-duration="900">15 Minutes</button>
                        </div>

                        <div class="amount-input-group">
                            <label>Bet Amount (BB)</label>
                            <input type="number" id="solBetAmount" class="amount-input" placeholder="10" min="1" value="10">
                        </div>
                    </div>
                </div>
            </div>

            <div class="active-bets-section">
                <h3>🎯 Active Bets</h3>
                <div id="activePriceBets" class="active-bets-grid">
                    <p class="empty-state">No active price bets</p>
                </div>
            </div>
        `;

        // Setup event listeners
        this.setupEventListeners(container);

        return container;
    }

    private setupEventListeners(container: HTMLElement) {
        // Timeframe toggle
        container.querySelectorAll('.btn-timeframe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const card = target.closest('.price-card');
                if (!card) return;

                card.querySelectorAll('.btn-timeframe').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
            });
        });

        // Direction buttons (place bet)
        container.querySelectorAll('.btn-direction').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const asset = target.dataset.asset as 'BTC' | 'SOL';
                const direction = target.dataset.direction as 'HIGHER' | 'LOWER';
                const card = target.closest('.price-card');
                if (!card) return;

                const activeTimeframe = card.querySelector('.btn-timeframe.active') as HTMLElement;
                const duration = parseInt(activeTimeframe?.dataset.duration || '900') as 60 | 900;

                const amountInput = card.querySelector('.amount-input') as HTMLInputElement;
                const amount = parseFloat(amountInput.value || '10');

                if (isNaN(amount) || amount <= 0) {
                    debugConsole.log('❌ Invalid bet amount', 'error');
                    return;
                }

                // Get selected account from global state
                const selectedAccountEl = document.getElementById('selectedAccountName');
                const accountName = selectedAccountEl?.textContent;

                if (!accountName || accountName === 'Select Account') {
                    debugConsole.log('❌ Please select an account first', 'error');
                    return;
                }

                try {
                    await this.placePriceBet(asset, direction, amount, duration, accountName);
                } catch (error) {
                    debugConsole.log(`❌ Bet failed: ${error}`, 'error');
                }
            });
        });
    }
}

export default new PriceActionModule();
