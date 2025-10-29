// Live Betting Component
import { placeLiveBet, getBitcoinPrice, getSolanaPrice, getActiveLiveBets } from '../lib/api';
import { store } from '../lib/store';
import type { DirectionType, TimeframeType } from '../types';

export class LiveBetting {
    private selectedTimeframe: TimeframeType = '15min';
    private selectedDirection: DirectionType | null = null;
    private currentChain: 'BTC' | 'SOL' = 'BTC';
    private priceUpdateInterval: number | null = null;
    
    constructor(private containerEl: HTMLElement) {
        this.init();
    }
    
    private init() {
        this.render();
        this.attachEventListeners();
        this.startPriceUpdates();
        this.loadActiveBets();
    }
    
    private render() {
        this.containerEl.innerHTML = `
            <div class="live-betting-container">
                <div class="price-display">
                    <div class="chain-selector">
                        <select id="chainSelector">
                            <option value="BTC">🪙 Bitcoin (BTC)</option>
                            <option value="SOL">🌊 Solana (SOL)</option>
                        </select>
                    </div>
                    <div class="current-price">
                        <h2 id="livePrice">$--,---</h2>
                        <span id="priceChange">+0.00%</span>
                    </div>
                </div>
                
                <div class="betting-controls">
                    <h3>Select Timeframe</h3>
                    <div class="timeframe-buttons">
                        <button class="timeframe-btn" data-timeframe="1min">1 Minute</button>
                        <button class="timeframe-btn active" data-timeframe="15min">15 Minutes</button>
                    </div>
                    
                    <h3>Price Direction</h3>
                    <div class="direction-buttons">
                        <button class="direction-btn" data-direction="UP">📈 HIGHER</button>
                        <button class="direction-btn" data-direction="DOWN">📉 LOWER</button>
                    </div>
                    
                    <div class="amount-input">
                        <label>Bet Amount (BB)</label>
                        <input type="number" id="betAmount" min="1" placeholder="Enter amount">
                        <div class="balance">Balance: <span id="balanceDisplay">-- BB</span></div>
                    </div>
                    
                    <button id="placeBetBtn" class="place-bet-btn">
                        🎯 Place Bet on Blockchain
                    </button>
                </div>
                
                <div class="active-bets">
                    <h3>Active Bets</h3>
                    <div id="activeBetsList"></div>
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
        const timeframeBtns = this.containerEl.querySelectorAll('.timeframe-btn');
        timeframeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                timeframeBtns.forEach(b => b.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.selectedTimeframe = (e.target as HTMLElement).dataset.timeframe as TimeframeType;
            });
        });
        
        // Direction buttons
        const directionBtns = this.containerEl.querySelectorAll('.direction-btn');
        directionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                directionBtns.forEach(b => b.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                this.selectedDirection = (e.target as HTMLElement).dataset.direction as DirectionType;
            });
        });
        
        // Place bet button
        const placeBetBtn = this.containerEl.querySelector('#placeBetBtn');
        placeBetBtn?.addEventListener('click', () => this.handlePlaceBet());
    }
    
    private async updatePrice() {
        try {
            const priceData = this.currentChain === 'BTC' 
                ? await getBitcoinPrice()
                : await getSolanaPrice();
            
            const priceEl = this.containerEl.querySelector('#livePrice');
            const changeEl = this.containerEl.querySelector('#priceChange');
            
            if (priceEl) {
                priceEl.textContent = `$${priceData.price.toLocaleString()}`;
            }
            
            if (changeEl && priceData.change_24h) {
                const change = priceData.change_24h;
                changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeEl.className = change >= 0 ? 'price-up' : 'price-down';
            }
            
            // Update store
            if (this.currentChain === 'BTC') {
                store.setBTCPrice(priceData.price);
            } else {
                store.setSOLPrice(priceData.price);
            }
        } catch (error) {
            console.error('Price update failed:', error);
        }
    }
    
    private startPriceUpdates() {
        this.updatePrice();
        this.priceUpdateInterval = window.setInterval(() => this.updatePrice(), 5000);
    }
    
    private async loadActiveBets() {
        try {
            const bets = await getActiveLiveBets();
            store.setLiveBets(bets);
            this.renderActiveBets(bets);
        } catch (error) {
            console.error('Failed to load active bets:', error);
        }
    }
    
    private renderActiveBets(bets: any[]) {
        const listEl = this.containerEl.querySelector('#activeBetsList');
        if (!listEl) return;
        
        if (bets.length === 0) {
            listEl.innerHTML = '<p class="no-bets">No active bets</p>';
            return;
        }
        
        listEl.innerHTML = bets.map(bet => `
            <div class="bet-item">
                <div>${bet.account} - ${bet.direction} ${bet.amount} BB</div>
                <div class="bet-status">${bet.status}</div>
            </div>
        `).join('');
    }
    
    private async handlePlaceBet() {
        const state = store.getState();
        
        if (!state.currentAccount) {
            alert('Please select an account first');
            return;
        }
        
        if (!this.selectedDirection) {
            alert('Please select a direction (HIGHER or LOWER)');
            return;
        }
        
        const amountInput = this.containerEl.querySelector('#betAmount') as HTMLInputElement;
        const amount = parseInt(amountInput?.value || '0');
        
        if (amount <= 0) {
            alert('Please enter a valid bet amount');
            return;
        }
        
        if (amount > state.currentAccount.balance) {
            alert('Insufficient balance');
            return;
        }
        
        try {
            const bet = await placeLiveBet(
                state.currentAccount.name,
                this.selectedDirection,
                amount,
                this.selectedTimeframe
            );
            
            store.addLiveBet(bet);
            store.updateAccountBalance(
                state.currentAccount.name,
                state.currentAccount.balance - amount
            );
            
            alert(`✅ Bet placed: ${this.currentChain} ${this.selectedDirection} - ${amount} BB`);
            
            // Reset form
            amountInput.value = '';
            this.selectedDirection = null;
            this.containerEl.querySelectorAll('.direction-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            this.loadActiveBets();
        } catch (error) {
            console.error('Bet placement failed:', error);
            alert('Failed to place bet. Please try again.');
        }
    }
    
    destroy() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
    }
}