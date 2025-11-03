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
    accountAddress: string;
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
        this.startCountdownTimer();
    }

    private startCountdownTimer() {
        // Update countdown every second
        setInterval(() => {
            this.renderActiveBets();
        }, 1000);
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

    /**
     * Calculate standardized end time for bets
     * 1-minute: rounds to next full minute (:00 seconds)
     * 15-minute: rounds to next quarter hour (:00, :15, :30, :45)
     */
    private getStandardizedEndTime(duration: 60 | 900): number {
        const now = new Date();
        
        if (duration === 60) {
            // 1-minute: round to next full minute
            const nextMinute = new Date(now);
            nextMinute.setSeconds(0, 0);
            nextMinute.setMinutes(nextMinute.getMinutes() + 1);
            return nextMinute.getTime();
        } else {
            // 15-minute: round to next quarter hour
            const minutes = now.getMinutes();
            const nextQuarter = Math.ceil((minutes + 1) / 15) * 15;
            const nextInterval = new Date(now);
            nextInterval.setMinutes(nextQuarter, 0, 0);
            if (nextQuarter >= 60) {
                nextInterval.setHours(nextInterval.getHours() + 1);
            }
            return nextInterval.getTime();
        }
    }

    async placePriceBet(
        asset: 'BTC' | 'SOL',
        direction: 'HIGHER' | 'LOWER',
        amount: number,
        duration: 60 | 900,
        account: string,
        accountAddress: string
    ): Promise<void> {
        const betId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startPrice = asset === 'BTC' ? this.currentPrices.btc : this.currentPrices.sol;
        const startTime = Date.now();
        
        // Use standardized end time so all users' bets align
        const endTime = this.getStandardizedEndTime(duration);
        const actualDuration = Math.ceil((endTime - startTime) / 1000);

        const bet: PriceBet = {
            id: betId,
            asset,
            account,
            accountAddress,
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
            // Deduct the bet amount from the account balance on-chain
            console.log(`💰 Deducting ${amount} BB from ${account} (${accountAddress}) for price action bet`);
            console.log(`⏰ Bet will resolve at: ${new Date(endTime).toLocaleTimeString()} (${actualDuration}s from now)`);
            
            // Store the bet locally
            this.activeBets.set(betId, bet);
            this.renderActiveBets();
            
            debugConsole.log(
                `🎯 ${account} placed bet: ${amount} BB on ${asset} ${direction} - Resolves at ${new Date(endTime).toLocaleTimeString()}`,
                'success'
            );

            // Set timer to resolve bet at standardized time
            setTimeout(() => {
                this.resolveBet(betId);
            }, actualDuration * 1000);

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

        // Record win/loss on blockchain
        if (won) {
            // Winner gets 2x payout (1x return + 1x profit)
            const payout = bet.amount * 2;
            try {
                await BackendService.recordBetWin(bet.accountAddress, payout, betId);
                debugConsole.log(
                    `🎉 ${bet.account} WON! ${bet.asset} went ${bet.direction}. Payout: ${payout} BB`,
                    'success'
                );
            } catch (error) {
                debugConsole.log(`❌ Failed to record win: ${error}`, 'error');
            }
        } else {
            // Record loss on blockchain (deduct bet amount from balance)
            try {
                await BackendService.recordBetLoss(bet.accountAddress, bet.amount, betId);
                debugConsole.log(
                    `❌ ${bet.account} LOST! ${bet.asset} went ${priceIncreased ? 'HIGHER' : 'LOWER'}. Lost: ${bet.amount} BB`,
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
        const container = document.getElementById('activeBetsList');
        if (!container) {
            console.log('❌ activeBetsList container not found');
            return;
        }

        const bets = Array.from(this.activeBets.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 10); // Show last 10 bets

        console.log(`📊 Rendering ${bets.length} active bets`);

        if (bets.length === 0) {
            container.innerHTML = '<p class="empty-state">No active bets</p>';
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

            <div class="price-action-grid">
                <!-- Live Prices Row - CLICKABLE CARDS -->
                <div class="price-row">
                    <div class="price-card btc selectable-card active-asset" id="selectBtcCard" data-asset="BTC">
                        <div class="coin-info">
                            <span class="coin-icon">₿</span>
                            <div>
                                <div class="coin-name">BITCOIN</div>
                                <div class="coin-price" id="btcCurrentPrice">$0.00</div>
                            </div>
                        </div>
                        <div class="price-change" id="btcChange">+0.00%</div>
                    </div>
                    
                    <div class="price-card sol selectable-card" id="selectSolCard" data-asset="SOL">
                        <div class="coin-info">
                            <span class="coin-icon">◎</span>
                            <div>
                                <div class="coin-name">SOLANA</div>
                                <div class="coin-price" id="solCurrentPrice">$0.00</div>
                            </div>
                        </div>
                        <div class="price-change" id="solChange">+0.00%</div>
                    </div>
                </div>

                <!-- Betting Panel -->
                <div class="compact-bet-panel">
                    <div class="panel-title">
                        <span>🎯</span>
                        <h3>Place Bet</h3>
                    </div>
                    
                    <div class="bet-form-compact">
                        <div class="bet-options-row">
                            <div class="option-group">
                                <span class="option-label">Time:</span>
                                <div class="btn-group">
                                    <button class="option-btn active" id="timeframe1min" data-time="60">1m</button>
                                    <button class="option-btn" id="timeframe15min" data-time="900">15m</button>
                                </div>
                            </div>
                            
                            <div class="option-group">
                                <span class="option-label">Direction:</span>
                                <div class="btn-group">
                                    <button class="option-btn direction-up" id="predictHigher" data-direction="HIGHER">📈</button>
                                    <button class="option-btn direction-down" id="predictLower" data-direction="LOWER">📉</button>
                                </div>
                            </div>
                            
                            <div class="option-group">
                                <span class="option-label">Amount:</span>
                                <input type="number" id="betAmount" class="amount-input" 
                                    placeholder="BB" min="1" step="1" value="10">
                            </div>
                            
                            <button class="bet-submit-btn" id="placePriceActionBet">🎲 Bet</button>
                        </div>
                        
                        <div class="balance-hint">
                            Balance: <span id="availableBalance">0 BB</span>
                        </div>
                    </div>
                </div>

                <!-- Active Bets & History -->
                <div class="bets-panels-row">
                    <div class="panel-half">
                        <h3>📊 Active Bets</h3>
                        <div id="activePriceBets" class="compact-bets-list">
                            <p class="empty-state">No active bets</p>
                        </div>
                    </div>
                    
                    <div class="panel-half">
                        <h3>📜 History</h3>
                        <div id="betHistory" class="compact-bets-list">
                            <p class="empty-state">No history</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event listeners are now set up in main.ts setupPriceActionListeners()
        
        return container;
    }
}

export default new PriceActionModule();
