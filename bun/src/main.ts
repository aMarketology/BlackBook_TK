/**
 * BlackBook L1 Desktop App - Simplifieasync function lasync function loasync function loadAccounts() {
    try {
        log('🔗 Connecting to BlackBook L1...', 'info');
        console.log('📡 Calling BackendService.getAllAccounts()...');
        accounts = await BackendService.getAllAccounts();
        console.log(`✅ BackendService returned ${accounts.length} accounts:`, accounts);
        
        if (accounts.length === 8) {
            log('✅ Blockchain Connection: YES', 'success');
            log('✅ 8 Accounts Loaded: YES', 'success');
        } else {
            log(`⚠️ Found ${accounts.length} accounts (expected 8)`, 'warning');
        }
        
        console.log('📢 About to call renderAccounts()');
        renderAccounts();
    } catch (error) {
        console.error('❌ loadAccounts error:', error);
        log(`❌ Failed to connect to blockchain: ${error}`, 'error');
    }
}  try {
        log('🔗 Connecting to BlackBook L1...', 'info');
        accounts = await BackendService.getAllAccounts();
        
        if (accounts.length === 8) {
            log('✅ Blockchain Connection: YES', 'success');
            log('✅ 8 Accounts Loaded: YES', 'success');
        } else {
            log(`⚠️ Found ${accounts.length} accounts (expected 8)`, 'warning');
        }
        
        renderAccounts();
        
        // Refresh transfers module with updated accounts
        TransfersModule.refresh(accounts);
    } catch (error) {
        log(`❌ Failed to connect to blockchain: ${error}`, 'error');
    }    try {
        log('🔗 Connecting to BlackBook L1...', 'info');
        accounts = await BackendService.getAllAccounts();
        
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
}unication via BackendService abstraction layer
 */

import { BackendService } from './lib/backend_service';
import { debugConsole } from './lib/debug_console';
import { formatVolume } from './lib/polymarket';
import { UIBuilder } from './lib/ui_builder';
import TransfersModule from './lib/transfers';

// ============================================
// INTERFACES
// ============================================

export interface Account {
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
        accounts = await BackendService.getAllAccounts();
        
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
        markets = await BackendService.getMarkets() as Market[];
        log(`✅ Loaded ${markets.length} markets`, 'success');
        renderMarkets();
    } catch (error) {
        log(`❌ Failed to load markets: ${error}`, 'error');
    }
}

async function updatePrices() {
    try {
        log('📈 Fetching live prices from CoinGecko...', 'info');
        const prices = await BackendService.getPrices();
        
        UIBuilder.updatePrices(prices.btc, prices.sol);
        log(`✅ Updated prices - BTC: $${prices.btc.toFixed(2)}, SOL: $${prices.sol.toFixed(2)}`, 'success');
    } catch (error) {
        log(`⚠️ Price update failed: ${error}`, 'warning');
    }
}

async function loadPolymarketEvents() {
    try {
        const polyEl = document.getElementById('polymarketEvents');
        if (!polyEl) {
            log('⚠️ Polymarket Events element not found', 'warning');
            return;
        }
        
        log('🔮 Fetching Polymarket events...', 'info');
        
        // Call via BackendService - which uses Rust backend to bypass CORS
        const polymarketData: any[] = await BackendService.getPolymarketEvents();
        log(`✅ Loaded ${polymarketData.length} Polymarket events`, 'success');
        
        if (polymarketData.length > 0) {
            polyEl.innerHTML = polymarketData.map(m => `
                <div class="market-card">
                    <h3>${m.question}</h3>
                    <p>${m.description || 'No description'}</p>
                    <div class="market-prices">
                        <div class="price-column">
                            <span class="label">${m.outcomes[0] || 'YES'}</span>
                            <span class="price">${(m.outcome_prices[0] * 100).toFixed(0)}¢</span>
                        </div>
                        <div class="price-column">
                            <span class="label">${m.outcomes[1] || 'NO'}</span>
                            <span class="price">${(m.outcome_prices[1] * 100).toFixed(0)}¢</span>
                        </div>
                    </div>
                    <div class="market-volume">Vol: ${formatVolume(m.volume_24h || m.volume || 0)}</div>
                </div>
            `).join('');
        } else {
            polyEl.innerHTML = '<p class="loading">No Polymarket events available</p>';
        }
    } catch (error) {
        log(`⚠️ Polymarket fetch failed: ${error}`, 'warning');
        const polyEl = document.getElementById('polymarketEvents');
        if (polyEl) {
            polyEl.innerHTML = `<p class="loading">Error loading Polymarket events: ${error}</p>`;
        }
    }
}

async function placeBet(marketId: string, outcome: string, amount: number) {
    try {
        if (!selectedAccount) {
            log('❌ No account selected', 'error');
            return;
        }
        
        log(`🎯 Placing ${outcome} bet for ${amount} BB on market ${marketId}...`, 'info');
        await BackendService.placeBet(marketId, selectedAccount.name, amount, outcome);
        
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
    console.log(`🎯 renderAccounts called with ${accounts.length} accounts`, accounts);
    UIBuilder.populateAccountsList(accounts);
    UIBuilder.populateTransferSelects(accounts);
    updateAccountsToggleDisplay();
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
    UIBuilder.updateSelectedAccount(selectedAccount);
    updateAccountsToggleDisplay();
    closeAccountsDropdown();
}

function updateAccountsToggleDisplay() {
    const toggleBtn = document.getElementById('accountsToggle');
    const displayName = document.getElementById('selectedAccountName');
    
    if (toggleBtn && displayName) {
        if (selectedAccount) {
            displayName.textContent = selectedAccount.name;
        } else {
            displayName.textContent = 'Select Account';
        }
    }
}

function toggleAccountsDropdown() {
    const dropdown = document.getElementById('accountsDropdown');
    const toggle = document.getElementById('accountsToggle');
    
    console.log('Toggle clicked - dropdown hidden:', dropdown?.classList.contains('hidden'));
    
    if (dropdown && toggle) {
        dropdown.classList.toggle('hidden');
        toggle.classList.toggle('active');
        
        console.log('After toggle - dropdown hidden:', dropdown.classList.contains('hidden'));
    }
}

function closeAccountsDropdown() {
    const dropdown = document.getElementById('accountsDropdown');
    const toggle = document.getElementById('accountsToggle');
    
    if (dropdown && toggle) {
        dropdown.classList.add('hidden');
        toggle.classList.remove('active');
    }
}

// ============================================
// INITIALIZATION
// ============================================

// ============================================
// PAGE SWITCHING
// ============================================

function switchPage(page: string) {
    const mainContainer = document.getElementById('mainContainer') as HTMLElement;
    const transfersContainer = document.getElementById('transfersContainer') as HTMLElement;
    
    if (page === 'transfers') {
        log('🔄 Opening Transfers Page...', 'info');
        if (mainContainer) mainContainer.classList.add('hidden');
        if (transfersContainer) {
            transfersContainer.classList.remove('hidden');
            // Initialize transfers module when switching to transfers page
            TransfersModule.populateTransferSelects();
            TransfersModule.updateTransferStats();
        }
    } else if (page === 'markets') {
        log('📊 Returning to Markets...', 'info');
        if (mainContainer) mainContainer.classList.remove('hidden');
        if (transfersContainer) transfersContainer.classList.add('hidden');
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    console.log('🚀 Starting app initialization...');
    
    try {
        // Build UI
        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ App container not found');
            return;
        }
        
        console.log('✅ Building UI...');
        app.appendChild(UIBuilder.buildApp());
        console.log('✅ UI built successfully');
        
        // Setup event listeners
        console.log('✅ Setting up event listeners...');
        setupEventListeners();
        
        // Initialize debug console with welcome message
        log('🎯 Welcome to the BlackBook', 'success');
        log('⚡ Initializing BlackBook L1 Desktop App...', 'info');
        
        // Load data
        await loadAccounts();
        
        // Initialize transfers module with loaded accounts
        TransfersModule.initialize(accounts);
        
        await loadMarkets();
        
        // Fetch real market prices and Polymarket data
        await updatePrices();
        await loadPolymarketEvents();
        
        // Update prices every 30 seconds
        setInterval(updatePrices, 30000);
        
        log('✅ App initialized successfully!', 'success');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        log(`❌ Failed to initialize: ${error}`, 'error');
    }
}

function setupEventListeners() {
    // Home button - click title to return to home
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            switchPage('markets');
            debugConsole.log('🏠 Returning to home page', 'info');
        });
    }
    
    // Blockchain button - click to return to home
    const blockchainBtn = document.getElementById('blockchainBtn');
    if (blockchainBtn) {
        blockchainBtn.addEventListener('click', () => {
            switchPage('markets');
            debugConsole.log('🏠 Returning to home page', 'info');
        });
    }
    
    // Accounts dropdown
    const toggle = document.getElementById('accountsToggle');
    if (toggle) {
        toggle.addEventListener('click', toggleAccountsDropdown);
    }
    
    // Account selection
    const accountsList = document.getElementById('accountsList');
    if (accountsList) {
        accountsList.addEventListener('click', (e: any) => {
            if (e.target.classList.contains('account-item')) {
                const accountName = e.target.dataset.account;
                selectAccount(accountName);
            }
        });
    }
    
    // Transfers button
    const transfersBtn = document.getElementById('transfersBtn');
    if (transfersBtn) {
        transfersBtn.addEventListener('click', () => {
            switchPage('transfers');
            TransfersModule.updateTransferStats();
        });
    }
    
    // Home button - return to home/markets page
    const homeNavBtn = document.getElementById('homeNavBtn');
    if (homeNavBtn) {
        homeNavBtn.addEventListener('click', () => {
            switchPage('markets');
            debugConsole.log('🏠 Returning to home page', 'info');
        });
    }
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => switchPage('markets'));
    }
    
    // TransfersModule handles all transfer form event listeners
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e: any) => {
        const selector = document.querySelector('.accounts-selector');
        if (selector && !selector.contains(e.target)) {
            closeAccountsDropdown();
        }
    });
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Expose functions globally for inline event handlers
(window as any).selectAccount = selectAccount;
(window as any).placeBet = placeBet;
(window as any).toggleAccountsDropdown = toggleAccountsDropdown;
(window as any).switchPage = switchPage;
