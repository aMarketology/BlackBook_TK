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
import PriceActionModule from './lib/price_action';

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

async function loadActiveMarketsFromRSS() {
    try {
        console.log('📡 Fetching BlackBook events from RSS...');
        const rssMarkets = await BackendService.getBlackbookEvents();
        console.log(`✅ Fetched ${rssMarkets.length} events from RSS`);
        
        if (rssMarkets.length === 0) {
            log('⚠️ No events available', 'warning');
            return;
        }
        
        // Render the RSS markets
        renderActiveMarkets(rssMarkets);
        log(`✅ Loaded ${rssMarkets.length} active markets from event.rss`, 'success');
        
    } catch (error) {
        console.error('❌ Failed to load RSS markets:', error);
        log(`⚠️ Could not load active markets: ${error}`, 'warning');
    }
}

function renderActiveMarkets(rssMarkets: any[]) {
    // Render to the new "Active BlackBook Events" section with betting
    renderBlackbookEvents(rssMarkets);
    
    // Also populate the old marketsList for reference
    const list = document.getElementById('marketsList');
    if (!list) {
        console.log('⚠️ marketsList element not found');
        return;
    }
    
    if (rssMarkets.length === 0) {
        list.innerHTML = '<p class="empty-state">No active markets available</p>';
        return;
    }
    
    list.innerHTML = rssMarkets.map(market => `
        <div class="market-card">
            <div class="market-header">
                <h3>${market.title}</h3>
                <span class="confidence-badge" style="background: hsl(${Math.round(market.confidence * 120)}, 100%, 50%)">
                    ${(market.confidence * 100).toFixed(0)}% confidence
                </span>
            </div>
            <p class="market-description">${market.description}</p>
            <div class="market-options">
                ${market.options.map((option: string) => `
                    <div class="option-pill">${option}</div>
                `).join('')}
            </div>
            <div class="market-footer">
                <a href="${market.link}" target="_blank" class="read-more">Read source →</a>
            </div>
        </div>
    `).join('');
}

function renderBlackbookEvents(rssMarkets: any[]) {
    const eventsContainer = document.getElementById('blackbookEvents');
    if (!eventsContainer) {
        console.log('⚠️ blackbookEvents element not found');
        return;
    }
    
    // Filter events with confidence > 0.5
    const highConfidenceEvents = rssMarkets.filter(market => market.confidence > 0.5);
    
    if (highConfidenceEvents.length === 0) {
        eventsContainer.innerHTML = '<p class="empty-state">No high-confidence events available (need >50%)</p>';
        return;
    }
    
    console.log(`📊 Rendering ${highConfidenceEvents.length} high-confidence BlackBook events`);
    
    eventsContainer.innerHTML = highConfidenceEvents.map((market, idx) => `
        <div class="event-card">
            <div class="event-card-content">
                <div class="event-title-section">
                    <h3 class="event-title">${market.title}</h3>
                    <span class="event-category">${market.category || 'general'}</span>
                </div>
                
                <p class="event-description">${market.description}</p>
                
                <div class="event-betting-section">
                    <div class="betting-buttons">
                        ${market.options.map((option: string, optIdx: number) => `
                            <button class="event-bet-btn" data-market="${idx}" data-outcome="${optIdx}" data-title="${market.title.replace(/"/g, '&quot;')}" data-option="${option.replace(/"/g, '&quot;')}" data-market-id="${market.marketId}">
                                <span class="bet-option-text">${option}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="event-card-footer">
                <a href="${market.link}" target="_blank" class="event-source-link" title="Read source article">📖</a>
            </div>
        </div>
    `).join('');
    
    // Attach event listeners to bet buttons
    setupBlackbookEventListeners(highConfidenceEvents);
}

function setupBlackbookEventListeners(_rssMarkets: any[]) {
    const betButtons = document.querySelectorAll('.event-bet-btn');
    betButtons.forEach((btn: any) => {
        btn.addEventListener('click', async (e: Event) => {
            const marketIdx = (e.currentTarget as HTMLElement).getAttribute('data-market');
            const outcomeIdx = (e.currentTarget as HTMLElement).getAttribute('data-outcome');
            const marketId = (e.currentTarget as HTMLElement).getAttribute('data-market-id');
            const option = (e.currentTarget as HTMLElement).getAttribute('data-option');
            
            if (!marketIdx || !outcomeIdx || !marketId || !option) {
                log('❌ Invalid bet data', 'error');
                return;
            }
            
            if (!selectedAccount) {
                log('❌ Please select an account first', 'error');
                return;
            }
            
            // Show amount input dialog
            const amount = prompt(`Enter amount to bet on "${option}" (in BB):`);
            if (!amount || isNaN(parseFloat(amount))) {
                log('❌ Invalid bet amount', 'error');
                return;
            }
            
            try {
                log(`🎯 Placing bet on "${option}" for ${amount} BB...`, 'info');
                await BackendService.placeBet(marketId, selectedAccount.name, parseFloat(amount), option);
                log(`✅ Bet placed successfully! ${amount} BB on "${option}"`, 'success');
                await loadAccounts();
            } catch (error) {
                log(`❌ Bet failed: ${error}`, 'error');
            }
        });
    });
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
        
        log('🔮 Fetching top 20 Polymarket events by volume...', 'info');
        
        // Call via BackendService - which uses Rust backend to bypass CORS
        const polymarketData: any[] = await BackendService.getPolymarketEvents();
        log(`📦 Polymarket API returned ${polymarketData.length} events`, 'info');
        
        if (!Array.isArray(polymarketData)) {
            const errMsg = `❌ Polymarket API returned non-array: ${typeof polymarketData}`;
            log(errMsg, 'error');
            console.error('Polymarket data structure:', polymarketData);
            polyEl.innerHTML = `<p class="loading">${errMsg}</p>`;
            return;
        }
        
        if (polymarketData.length === 0) {
            log('⚠️ No active Polymarket events available', 'warning');
            polyEl.innerHTML = '<p class="loading">No active Polymarket events available</p>';
            return;
        }
        
        // Log first event structure for debugging
        if (polymarketData.length > 0) {
            const firstEvent = polymarketData[0];
            log(`📋 Sample Polymarket event fields: ${Object.keys(firstEvent).join(', ')}`, 'info');
            console.log('📊 First Polymarket event:', firstEvent);
        }
        
        // Render events with detailed validation
        const renderedCards: string[] = [];
        polymarketData.forEach((event, idx) => {
            try {
                // Events endpoint returns events with nested markets array
                const eventTitle = event.title || event.question || `Event ${idx}`;
                const eventDescription = event.description || '';
                const eventVolume = event.volume24hr || event.volume_24h || event.volume || 0;
                
                // Get the first market from this event (most trading)
                const markets = event.markets || [];
                if (markets.length === 0) {
                    log(`⚠️ Event ${idx} "${eventTitle}" has no markets`, 'warning');
                    return;
                }
                
                const market = markets[0];
                
                // Parse outcomes - they may be JSON strings or arrays
                let outcomes = market.outcomes || [];
                if (typeof outcomes === 'string') {
                    try {
                        outcomes = JSON.parse(outcomes);
                    } catch (e) {
                        outcomes = ['Yes', 'No'];
                    }
                }
                
                // Parse prices - they may be JSON strings or arrays
                let prices = market.outcomePrices || [];
                if (typeof prices === 'string') {
                    try {
                        prices = JSON.parse(prices);
                    } catch (e) {
                        prices = [0.5, 0.5];
                    }
                }
                
                // Convert string prices to numbers if needed
                prices = prices.map((p: any) => typeof p === 'string' ? parseFloat(p) : p);
                
                log(`✅ Event ${idx}: "${eventTitle}" - Volume: $${(eventVolume/1000).toFixed(1)}K`, 'success');
                
                // Validate prices array
                if (!Array.isArray(prices) || prices.length < 2) {
                    prices = [0.5, 0.5];
                }
                
                // Validate outcomes array
                if (!Array.isArray(outcomes) || outcomes.length < 2) {
                    outcomes = ['Yes', 'No'];
                }
                
                const safePrice0 = Math.min(99, Math.max(1, Math.round((prices[0] || 0.5) * 100)));
                const safePrice1 = Math.min(99, Math.max(1, Math.round((prices[1] || 0.5) * 100)));
                
                renderedCards.push(`
                <div class="market-card">
                    <h3>${eventTitle}</h3>
                    <p>${eventDescription || 'Popular prediction market'}</p>
                    <div class="market-prices">
                        <div class="price-column">
                            <span class="label">${String(outcomes[0]).substring(0, 20)}</span>
                            <span class="price">${safePrice0}¢</span>
                        </div>
                        <div class="price-column">
                            <span class="label">${String(outcomes[1]).substring(0, 20)}</span>
                            <span class="price">${safePrice1}¢</span>
                        </div>
                    </div>
                    <div class="market-volume">24h Vol: ${formatVolume(eventVolume)}</div>
                </div>
            `);
            } catch (cardError) {
                log(`❌ Error rendering Polymarket event ${idx}: ${cardError}`, 'error');
                console.error(`Card rendering error for event ${idx}:`, cardError, event);
            }
        });
        
        if (renderedCards.length > 0) {
            polyEl.innerHTML = renderedCards.join('');
            log(`✅ Successfully rendered ${renderedCards.length} top Polymarket events`, 'success');
        } else {
            polyEl.innerHTML = '<p class="loading">No valid Polymarket events could be rendered</p>';
            log('❌ All Polymarket events failed to render', 'error');
        }
    } catch (error) {
        const errMsg = `❌ Polymarket API Error: ${error instanceof Error ? error.message : String(error)}`;
        log(errMsg, 'error');
        console.error('Polymarket fetch detailed error:', error);
        
        const polyEl = document.getElementById('polymarketEvents');
        if (polyEl) {
            polyEl.innerHTML = `<p class="loading" style="color: #e63946;">${errMsg}</p>`;
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
    const priceActionContainer = document.getElementById('priceActionContainer') as HTMLElement;
    
    if (page === 'transfers') {
        log('🔄 Opening Transfers Page...', 'info');
        if (mainContainer) mainContainer.classList.add('hidden');
        if (transfersContainer) {
            transfersContainer.classList.remove('hidden');
            // Initialize transfers module when switching to transfers page
            TransfersModule.populateTransferSelects();
            TransfersModule.updateTransferStats();
        }
        if (priceActionContainer) priceActionContainer.classList.add('hidden');
    } else if (page === 'priceAction') {
        log('⚡ Opening Price Action...', 'info');
        if (mainContainer) mainContainer.classList.add('hidden');
        if (transfersContainer) transfersContainer.classList.add('hidden');
        if (priceActionContainer) priceActionContainer.classList.remove('hidden');
    } else if (page === 'markets') {
        log('📊 Returning to Markets...', 'info');
        if (mainContainer) mainContainer.classList.remove('hidden');
        if (transfersContainer) transfersContainer.classList.add('hidden');
        if (priceActionContainer) priceActionContainer.classList.add('hidden');
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
        
        // Initialize price action module
        PriceActionModule.initialize(accounts);
        
        // Build and append Price Action container
        const priceActionContainer = document.createElement('div');
        priceActionContainer.id = 'priceActionContainer';
        priceActionContainer.className = 'page-container hidden';
        priceActionContainer.appendChild(PriceActionModule.buildUI());
        app.appendChild(priceActionContainer);
        
        await loadMarkets();
        await loadActiveMarketsFromRSS();
        
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
    
    // Price Action button
    const priceActionBtn = document.getElementById('priceActionBtn');
    if (priceActionBtn) {
        priceActionBtn.addEventListener('click', () => {
            switchPage('priceAction');
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
