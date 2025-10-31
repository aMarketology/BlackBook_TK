/**
 * BlackBook L1 Desktop App - Simplified
 * Direct connection to Rust blockchain via Tauri
 */

import { invoke } from '@tauri-apps/api/tauri';
import { debugConsole } from './lib/debug_console';
import { getPrices, formatPrice } from './lib/prices';
import { getPolymarketEvents, formatVolume } from './lib/polymarket';

// ============================================
// INTERFACES
// ============================================

interface Account {
    name: string;
    address: string;
    balance: number;
}

interface Market {
    id: string;
    title: string;
    description: string;
    yes_price: number;
    no_price: number;
    total_volume: number;
}

// ============================================
// STATE
// ============================================

let selectedAccount: Account | null = null;
let accounts: Account[] = [];
let markets: Market[] = [];

const log = (message: string, type: string = 'info') => debugConsole.log(message, type as any);

// ============================================
// BLOCKCHAIN OPERATIONS
// ============================================

async function loadAccounts() {
    try {
        log('� Connecting to BlackBook L1...', 'info');
        accounts = await invoke('get_accounts') as Account[];
        
        if (accounts.length === 8) {
            log('✅ Blockchain Connection: YES', 'success');
            log('✅ 8 Accounts Loaded: YES', 'success');
        } else {
            log(`⚠️ Found ${accounts.length} accounts (expected 8)`, 'warning');
        }
        
        renderAccounts();
    } catch (error) {
        log(`❌ Failed to connect to blockchain: ${error}`, 'error');
    }
}

async function loadMarkets() {
    try {
        log('📊 Loading prediction markets...', 'info');
        markets = await invoke('get_markets') as Market[];
        log(`✅ Loaded ${markets.length} markets`, 'success');
        renderMarkets();
    } catch (error) {
        log(`❌ Failed to load markets: ${error}`, 'error');
    }
}

async function updatePrices() {
    try {
        log('📈 Fetching live prices from CoinGecko...', 'info');
        const prices = await getPrices();
        
        const btcEl = document.getElementById('btcPrice');
        const solEl = document.getElementById('solPrice');
        
        if (btcEl) btcEl.textContent = formatPrice(prices.btc);
        if (solEl) solEl.textContent = formatPrice(prices.sol);
        
        log(`✅ Updated prices - BTC: ${formatPrice(prices.btc)}, SOL: ${formatPrice(prices.sol)}`, 'success');
    } catch (error) {
        log(`⚠️ Price update failed: ${error}`, 'warning');
        const btcEl = document.getElementById('btcPrice');
        const solEl = document.getElementById('solPrice');
        if (btcEl) btcEl.textContent = 'API Error';
        if (solEl) solEl.textContent = 'API Error';
    }
}

async function loadPolymarketEvents() {
    try {
        log('🔮 Fetching Polymarket events...', 'info');
        const polymarketData = await getPolymarketEvents();
        log(`✅ Loaded ${polymarketData.length} Polymarket events`, 'success');
        
        // Could display these in a separate section, or add to markets
        const polyEl = document.getElementById('polymarketEvents');
        if (polyEl && polymarketData.length > 0) {
            polyEl.innerHTML = polymarketData.map(m => `
                <div class="market-card">
                    <h3>${m.question}</h3>
                    <p>${m.description}</p>
                    <div class="market-prices">
                        <div class="price-column">
                            <span class="label">${m.outcomes[0] || 'YES'}</span>
                            <span class="price">${(m.outcomesPrices[0] * 100).toFixed(0)}¢</span>
                        </div>
                        <div class="price-column">
                            <span class="label">${m.outcomes[1] || 'NO'}</span>
                            <span class="price">${(m.outcomesPrices[1] * 100).toFixed(0)}¢</span>
                        </div>
                    </div>
                    <div class="market-volume">Vol: ${formatVolume(m.volume)}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        log(`⚠️ Polymarket fetch failed: ${error}`, 'warning');
    }
}

async function placeBet(marketId: string, outcome: string, amount: number) {
    try {
        if (!selectedAccount) {
            log('❌ No account selected', 'error');
            return;
        }
        
        log(`🎯 Placing ${outcome} bet for ${amount} BB on market ${marketId}...`, 'info');
        await invoke('place_bet', {
            account: selectedAccount.name,
            market_id: marketId,
            outcome: outcome,
            amount: amount
        });
        
        log(`✅ Bet placed successfully!`, 'success');
        await loadAccounts();
    } catch (error) {
        log(`❌ Bet placement failed: ${error}`, 'error');
    }
}

// ============================================
// UI RENDERING
// ============================================

function renderAccounts() {
    const list = document.getElementById('accountsList');
    if (!list) return;
    
    list.innerHTML = accounts.map(acc => `
        <div class="account-item ${selectedAccount?.name === acc.name ? 'active' : ''}" onclick="selectAccount('${acc.name}')">
            <div class="account-name">${acc.name}</div>
            <div class="account-balance">${acc.balance.toFixed(2)} BB</div>
        </div>
    `).join('');
}

function renderMarkets() {
    const list = document.getElementById('marketsList');
    if (!list) return;
    
    if (markets.length === 0) {
        list.innerHTML = '<p class="empty-state">No markets available</p>';
        return;
    }
    
    list.innerHTML = markets.map(market => `
        <div class="market-card">
            <h3>${market.title}</h3>
            <p>${market.description}</p>
            <div class="market-prices">
                <div class="price-column">
                    <span class="label">YES</span>
                    <span class="price">${(market.yes_price * 100).toFixed(0)}¢</span>
                </div>
                <div class="price-column">
                    <span class="label">NO</span>
                    <span class="price">${(market.no_price * 100).toFixed(0)}¢</span>
                </div>
            </div>
            <div class="market-actions">
                <button onclick="placeBet('${market.id}', 'YES', 10)" class="btn-bet">Bet YES</button>
                <button onclick="placeBet('${market.id}', 'NO', 10)" class="btn-bet">Bet NO</button>
            </div>
        </div>
    `).join('');
}

function selectAccount(accountName: string) {
    selectedAccount = accounts.find(a => a.name === accountName) || null;
    if (selectedAccount) {
        log(`📌 Selected account: ${selectedAccount.name}`, 'info');
    }
    renderAccounts();
    updateAccountInfo();
}

function updateAccountInfo() {
    const addressEl = document.getElementById('selectedAddress');
    const balanceEl = document.getElementById('selectedBalance');
    
    if (selectedAccount) {
        if (addressEl) addressEl.textContent = selectedAccount.address;
        if (balanceEl) balanceEl.textContent = `${selectedAccount.balance.toFixed(2)} BB`;
    } else {
        if (addressEl) addressEl.textContent = '--';
        if (balanceEl) balanceEl.textContent = '0 BB';
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    log('⚡ Initializing BlackBook L1 Desktop App...', 'info');
    await loadAccounts();
    await loadMarkets();
    
    // Fetch real market prices and Polymarket data
    await updatePrices();
    await loadPolymarketEvents();
    
    // Update prices every 30 seconds
    setInterval(updatePrices, 30000);
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Expose functions globally for inline event handlers
(window as any).selectAccount = selectAccount;
(window as any).placeBet = placeBet;
