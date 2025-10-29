// Live Betting Component
import { placeLiveBet, getBitcoinPrice, getSolanaPrice, getActiveLiveBets, getLiveBTCMarket } from '../lib/api';
import { store } from '../lib/store';
import { showToast, formatSeconds } from '../lib/utils';
import type { DirectionType, TimeframeType } from '../types';

export class LiveBetting {
    private selectedTimeframe: TimeframeType = '15min';
    private selectedDirection: DirectionType | null = null;
    private currentChain: 'BTC' | 'SOL' = 'BTC';
    private priceUpdateInterval: number | null = null;
    private countdownInterval: number | null = null;
    private btcPrice: number = 0;
    private solPrice: number = 0;
    
    constructor(private containerEl: HTMLElement) {
        this.init();
    }
    
    private async init() {
        this.render();
        this.attachEventListeners();
        await this.startPriceUpdates();
        await this.loadActiveBets();
    }
    
    private render() {
        this.containerEl.innerHTML = `
            <div class="content-header">
                <h2>🔴 LIVE Price Market</h2>
                <p style="color: #65676b; font-size: 14px;">Bet on whether the price will be HIGHER or LOWER in your chosen timeframe</p>
            </div>
            
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,.1); margin-bottom: 20px;">
                <!-- Chain Selector -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <label style="font-weight: 600; color: #1c1e21; margin-right: 12px;">Select Asset:</label>
                        <select id="chainSelector" style="padding: 10px 15px; font-size: 14px; border: 2px solid #1877f2; border-radius: 6px; background: white; cursor: pointer; font-weight: 600;">
                            <option value="BTC">🪙 Bitcoin (BTC)</option>
                            <option value="SOL">🌊 Solana (SOL)</option>
                        </select>
                    </div>
                    <div style="text-align: right; font-size: 13px; color: #65676b;">
                        Last Updated: <span id="lastPriceUpdate">--:--:--</span> UTC
                    </div>
                </div>
                
                <!-- Price Display -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; color: white; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <div style="font-size: 14px; opacity: 0.9;">Current <span id="chainDisplayName">Bitcoin</span> Price</div>
                            <div id="livePriceDisplay" style="font-size: 64px; font-weight: 700; line-height: 1;">$--,---</div>
                        </div>
                        <div style="text-align: right;">
                            <div id="livePriceChange" style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">+0.00%</div>
                            <div id="livePriceSymbol" style="font-size: 18px; opacity: 0.9;">₿ BTC</div>
                        </div>
                    </div>
                    
                    <!-- Price Trend Indicator -->
                    <div style="display: flex; gap: 3px; margin-top: 15px;">
                        <div id="priceTrendBar1" style="flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px;"></div>
                        <div id="priceTrendBar2" style="flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px;"></div>
                        <div id="priceTrendBar3" style="flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px;"></div>
                        <div id="priceTrendBar4" style="flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px;"></div>
                        <div id="priceTrendBar5" style="flex: 1; height: 3px; background: rgba(255,255,255,0.5); border-radius: 2px;"></div>
                    </div>
                </div>
                
                <!-- Network Status -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background: #f0f2f5; border-radius: 8px; padding: 12px; font-size: 13px;">
                        <div style="color: #65676b; margin-bottom: 4px;">Blockchain Network</div>
                        <div style="font-weight: 600; color: #1c1e21;">🟢 Layer 1 Connected</div>
                    </div>
                    <div style="background: #f0f2f5; border-radius: 8px; padding: 12px; font-size: 13px;">
                        <div style="color: #65676b; margin-bottom: 4px;">Active Bets</div>
                        <div style="font-weight: 600; color: #1c1e21;" id="activeBetCount">0 active</div>
                    </div>
                </div>
            </div>

            <!-- Betting Section -->
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,.1);">
                <h3 style="margin-bottom: 25px; color: #1c1e21; font-size: 20px;">🎯 Place Your Bet</h3>
                
                <!-- Timeframe Selector -->
                <div style="margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #1c1e21;">Select Timeframe:</label>
                        <div id="timeframeCountdown" style="font-size: 13px; color: #667eea; font-weight: 600; display: none;">
                            ⏰ <span id="countdownTimer">15:00</span> remaining
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button id="timeframe1min" class="timeframe-btn" style="padding: 14px; background: #f0f2f5; color: #1c1e21; border: 2px solid #ccd0d5; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 15px;">
                            ⏱️ 1 Minute
                        </button>
                        <button id="timeframe15min" class="timeframe-btn active" style="padding: 14px; background: #1877f2; color: white; border: 2px solid #1877f2; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 15px;">
                            ⏱️ 15 Minutes
                        </button>
                    </div>
                </div>
                
                <!-- Direction Selection -->
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #1c1e21;">Price Direction:</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <button id="betHigher" class="direction-btn" style="padding: 16px; background: #f0f2f5; color: #1c1e21; border: 2px solid #ccd0d5; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 15px;">
                            📈 HIGHER
                        </button>
                        <button id="betLower" class="direction-btn" style="padding: 16px; background: #f0f2f5; color: #1c1e21; border: 2px solid #ccd0d5; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 15px;">
                            📉 LOWER
                        </button>
                    </div>
                </div>
                
                <!-- Bet Amount Input -->
                <div style="margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #1c1e21;">Bet Amount (BlackBook Tokens):</label>
                        <div id="balanceDisplay" style="font-size: 13px; color: #667eea; font-weight: 600;">Balance: -- BB</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="number" id="betAmount" placeholder="Enter amount..." min="1" max="10000" step="1" style="grid-column: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; transition: border 0.3s;">
                        <div style="background: #f0f2f5; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: center; font-size: 13px;">
                            <div style="color: #65676b; margin-bottom: 3px;">Potential Payout</div>
                            <div style="font-weight: 600; color: #1c1e21;" id="potentialPayout">0 BB</div>
                        </div>
                    </div>
                </div>
                
                <!-- Place Bet Button -->
                <button id="placeBetBtn" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #31a24c 0%, #2a8c3e 100%); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 16px; transition: all 0.3s; box-shadow: 0 4px 12px rgba(49, 162, 76, 0.3);">
                    🎯 Place Bet on Blockchain
                </button>
                <div style="text-align: center; font-size: 11px; color: #999; margin-top: 12px;">
                    ✓ Bet stored on Layer 1 blockchain | Gas-optimized | Instant settlement
                </div>
            </div>
        `;
    }
    
    private attachEventListeners() {
        // Chain selector
        const chainSelector = this.containerEl.querySelector('#chainSelector') as HTMLSelectElement;
        chainSelector?.addEventListener('change', (e) => {
            this.currentChain = (e.target as HTMLSelectElement).value as 'BTC' | 'SOL';
            this.updatePrice();
        });
        
        // Timeframe buttons
        const timeframe1min = this.containerEl.querySelector('#timeframe1min');
        const timeframe15min = this.containerEl.querySelector('#timeframe15min');
        
        timeframe1min?.addEventListener('click', () => this.selectTimeframe('1min'));
        timeframe15min?.addEventListener('click', () => this.selectTimeframe('15min'));
        
        // Direction buttons
        const betHigher = this.containerEl.querySelector('#betHigher');
        const betLower = this.containerEl.querySelector('#betLower');
        
        betHigher?.addEventListener('click', () => this.selectDirection('HIGHER' as DirectionType));
        betLower?.addEventListener('click', () => this.selectDirection('LOWER' as DirectionType));
        
        // Amount input
        const betAmount = this.containerEl.querySelector('#betAmount');
        betAmount?.addEventListener('input', () => this.updateBetPreview());
        
        // Place bet button
        const placeBetBtn = this.containerEl.querySelector('#placeBetBtn');
        placeBetBtn?.addEventListener('click', () => this.handlePlaceBet());
    }
    
    private selectTimeframe(timeframe: TimeframeType) {
        this.selectedTimeframe = timeframe;
        
        const btn1min = this.containerEl.querySelector('#timeframe1min') as HTMLElement;
        const btn15min = this.containerEl.querySelector('#timeframe15min') as HTMLElement;
        
        if (btn1min && btn15min) {
            if (timeframe === '1min') {
                btn1min.style.background = '#1877f2';
                btn1min.style.borderColor = '#1877f2';
                btn1min.style.color = 'white';
                btn15min.style.background = '#f0f2f5';
                btn15min.style.borderColor = '#ccd0d5';
                btn15min.style.color = '#1c1e21';
            } else {
                btn15min.style.background = '#1877f2';
                btn15min.style.borderColor = '#1877f2';
                btn15min.style.color = 'white';
                btn1min.style.background = '#f0f2f5';
                btn1min.style.borderColor = '#ccd0d5';
                btn1min.style.color = '#1c1e21';
            }
        }
        
        const countdown = this.containerEl.querySelector('#timeframeCountdown') as HTMLElement;
        if (countdown) countdown.style.display = 'block';
        
        this.startCountdown();
    }
    
    private selectDirection(direction: DirectionType) {
        this.selectedDirection = direction;
        
        const btnHigher = this.containerEl.querySelector('#betHigher') as HTMLElement;
        const btnLower = this.containerEl.querySelector('#betLower') as HTMLElement;
        
        if (btnHigher && btnLower) {
            if (direction === 'UP') {
                btnHigher.style.background = '#31a24c';
                btnHigher.style.borderColor = '#31a24c';
                btnHigher.style.color = 'white';
                btnLower.style.background = '#f0f2f5';
                btnLower.style.borderColor = '#ccd0d5';
                btnLower.style.color = '#1c1e21';
            } else {
                btnLower.style.background = '#e4163a';
                btnLower.style.borderColor = '#e4163a';
                btnLower.style.color = 'white';
                btnHigher.style.background = '#f0f2f5';
                btnHigher.style.borderColor = '#ccd0d5';
                btnHigher.style.color = '#1c1e21';
            }
        }
        
        this.updateBetPreview();
    }
    
    private updateBetPreview() {
        const amountInput = this.containerEl.querySelector('#betAmount') as HTMLInputElement;
        const amount = parseInt(amountInput?.value || '0');
        
        const payoutEl = this.containerEl.querySelector('#potentialPayout');
        if (payoutEl) {
            const payout = amount * 2; // 2x payout
            payoutEl.textContent = `${payout} BB`;
        }
    }
    
    private startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        const totalSeconds = this.selectedTimeframe === '1min' ? 60 : 900;
        let secondsLeft = totalSeconds;
        
        const timerEl = this.containerEl.querySelector('#countdownTimer');
        
        const updateTimer = () => {
            if (timerEl) {
                timerEl.textContent = formatSeconds(secondsLeft);
            }
            
            secondsLeft--;
            if (secondsLeft < 0) {
                secondsLeft = totalSeconds;
            }
        };
        
        updateTimer();
        this.countdownInterval = window.setInterval(updateTimer, 1000);
    }
    
    private async updatePrice() {
        try {
            console.log('💰 [PRICE UPDATE] Fetching price for:', this.currentChain);
            const priceData = this.currentChain === 'BTC' 
                ? await getBitcoinPrice()
                : await getSolanaPrice();
            
            console.log('✅ [PRICE UPDATE] Price data received:', priceData);
            
            if (this.currentChain === 'BTC') {
                this.btcPrice = priceData.price;
                store.setBTCPrice(priceData.price);
                console.log('✅ [PRICE UPDATE] BTC price updated:', priceData.price);
            } else {
                this.solPrice = priceData.price;
                store.setSOLPrice(priceData.price);
                console.log('✅ [PRICE UPDATE] SOL price updated:', priceData.price);
            }
            
            // Update UI
            const priceEl = this.containerEl.querySelector('#livePriceDisplay');
            const changeEl = this.containerEl.querySelector('#livePriceChange');
            const symbolEl = this.containerEl.querySelector('#livePriceSymbol');
            const chainNameEl = this.containerEl.querySelector('#chainDisplayName');
            
            if (priceEl) {
                priceEl.textContent = `$${priceData.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            }
            
            if (changeEl && priceData.change_24h !== undefined) {
                const change = priceData.change_24h;
                changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeEl.className = change >= 0 ? 'price-up' : 'price-down';
            }
            
            if (symbolEl) {
                symbolEl.textContent = this.currentChain === 'BTC' ? '₿ BTC' : '◎ SOL';
            }
            
            if (chainNameEl) {
                chainNameEl.textContent = this.currentChain === 'BTC' ? 'Bitcoin' : 'Solana';
            }
            
            // Update timestamp
            const timeEl = this.containerEl.querySelector('#lastPriceUpdate');
            if (timeEl) {
                const now = new Date();
                timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
            }
        } catch (error) {
            console.error('❌ [PRICE UPDATE] Price update failed');
            console.error('❌ [PRICE UPDATE] Error type:', typeof error);
            console.error('❌ [PRICE UPDATE] Error object:', error);
            console.error('❌ [PRICE UPDATE] Error message:', error instanceof Error ? error.message : String(error));
            console.error('❌ [PRICE UPDATE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        }
    }
    
    private async startPriceUpdates() {
        await this.updatePrice();
        this.priceUpdateInterval = window.setInterval(() => this.updatePrice(), 5000);
    }
    
    private async loadActiveBets() {
        try {
            const bets = await getActiveLiveBets();
            store.setLiveBets(bets);
            
            const countEl = this.containerEl.querySelector('#activeBetCount');
            if (countEl) {
                countEl.textContent = `${bets.length} active`;
            }
        } catch (error) {
            console.error('Failed to load active bets:', error);
        }
    }
    
    private async handlePlaceBet() {
        const state = store.getState();
        
        console.log('🎲 [BET PLACEMENT] Starting bet placement process...');
        console.log('🎲 [BET PLACEMENT] Current state:', state);
        
        if (!state.currentAccount) {
            console.error('❌ [BET PLACEMENT] No account selected');
            showToast('Please select an account first', 'error');
            return;
        }
        
        console.log('✅ [BET PLACEMENT] Account selected:', state.currentAccount.name, 'Balance:', state.currentAccount.balance);
        
        if (!this.selectedDirection) {
            console.error('❌ [BET PLACEMENT] No direction selected');
            showToast('Please select a direction (HIGHER or LOWER)', 'error');
            return;
        }
        
        console.log('✅ [BET PLACEMENT] Direction selected:', this.selectedDirection);
        
        const amountInput = this.containerEl.querySelector('#betAmount') as HTMLInputElement;
        const amount = parseInt(amountInput?.value || '0');
        
        console.log('🎲 [BET PLACEMENT] Amount entered:', amount);
        
        if (amount <= 0) {
            console.error('❌ [BET PLACEMENT] Invalid amount:', amount);
            showToast('Please enter a valid bet amount', 'error');
            return;
        }
        
        if (amount > state.currentAccount.balance) {
            console.error('❌ [BET PLACEMENT] Insufficient balance:', amount, '>', state.currentAccount.balance);
            showToast('Insufficient balance', 'error');
            return;
        }
        
        console.log('✅ [BET PLACEMENT] All validations passed');
        console.log('🎲 [BET PLACEMENT] Bet details:', {
            bettor: state.currentAccount.name,
            asset: this.currentChain,
            direction: this.selectedDirection,
            amount: amount,
            timeframe: this.selectedTimeframe
        });
        
        try {
            console.log('📡 [BET PLACEMENT] Sending API request to placeLiveBet...');
            const bet = await placeLiveBet(
                state.currentAccount.name,
                this.currentChain,
                this.selectedDirection,
                amount,
                this.selectedTimeframe
            );
            
            console.log('✅ [BET PLACEMENT] API response received:', bet);
            
            store.addLiveBet(bet);
            store.updateAccountBalance(
                state.currentAccount.name,
                state.currentAccount.balance - amount
            );
            
            console.log('✅ [BET PLACEMENT] Store updated successfully');
            
            showToast(`✅ Bet placed: ${this.currentChain} ${this.selectedDirection} - ${amount} BB`, 'success');
            
            // Reset form
            amountInput.value = '';
            this.selectedDirection = null;
            
            const btnHigher = this.containerEl.querySelector('#betHigher') as HTMLElement;
            const btnLower = this.containerEl.querySelector('#betLower') as HTMLElement;
            
            if (btnHigher && btnLower) {
                btnHigher.style.background = '#f0f2f5';
                btnHigher.style.borderColor = '#ccd0d5';
                btnHigher.style.color = '#1c1e21';
                btnLower.style.background = '#f0f2f5';
                btnLower.style.borderColor = '#ccd0d5';
                btnLower.style.color = '#1c1e21';
            }
            
            console.log('🎲 [BET PLACEMENT] Loading active bets...');
            await this.loadActiveBets();
            console.log('✅ [BET PLACEMENT] Bet placement complete!');
        } catch (error) {
            console.error('❌ [BET PLACEMENT] Bet placement failed');
            console.error('❌ [BET PLACEMENT] Error type:', typeof error);
            console.error('❌ [BET PLACEMENT] Error object:', error);
            console.error('❌ [BET PLACEMENT] Error message:', error instanceof Error ? error.message : String(error));
            console.error('❌ [BET PLACEMENT] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            console.error('❌ [BET PLACEMENT] Error name:', error instanceof Error ? error.name : 'Unknown');
            
            // Try to extract more details
            if (error && typeof error === 'object') {
                console.error('❌ [BET PLACEMENT] Error keys:', Object.keys(error));
                console.error('❌ [BET PLACEMENT] Error values:', Object.values(error));
                for (const [key, value] of Object.entries(error)) {
                    console.error(`❌ [BET PLACEMENT] Error.${key}:`, value);
                }
            }
            
            showToast('Failed to place bet. Please try again.', 'error');
        }
    }
    
    destroy() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}