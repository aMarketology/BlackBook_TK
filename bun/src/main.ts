/**
 * BlackBook L1 Desktop App - Simplified
 * Direct communication via BackendService abstraction layer
 */

import { BackendService } from './lib/backend_service';
import type { Transaction } from './lib/backend_service';
import { debugConsole } from './lib/debug_console';
import { formatVolume } from './lib/polymarket';
import { UIBuilder } from './lib/ui_builder';
import TransfersModule from './lib/transfers';
import PriceActionModule from './lib/price_action';
import type { Recipe } from './lib/tauri';

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

// Recipe/Ledger State
let allRecipes: Recipe[] = [];
let filteredRecipes: Recipe[] = [];

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
            const title = (e.currentTarget as HTMLElement).getAttribute('data-title');
            
            if (!marketIdx || !outcomeIdx || !marketId || !option) {
                log('❌ Invalid bet data', 'error');
                return;
            }
            
            if (!selectedAccount) {
                log('❌ Please select an account first', 'error');
                return;
            }
            
            // Show betting modal
            showBettingModal(marketId, title || 'Unknown Market', option, selectedAccount);
        });
    });
}

function showBettingModal(marketId: string, marketTitle: string, option: string, account: any) {
    // Remove existing modal if any
    const existingModal = document.getElementById('bettingModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const balance = account.balance || 0;
    
    // Create modal HTML
    const modalHTML = `
        <div id="bettingModal" class="betting-modal-overlay">
            <div class="betting-modal-content">
                <div class="betting-modal-header">
                    <h2 class="betting-modal-title">Place Bet</h2>
                    <button class="betting-modal-close" id="closeBettingModal">&times;</button>
                </div>
                
                <div class="betting-modal-body">
                    <div class="betting-info-section">
                        <div class="betting-info-item">
                            <span class="betting-info-label">Market:</span>
                            <span class="betting-info-value">${marketTitle}</span>
                        </div>
                        <div class="betting-info-item">
                            <span class="betting-info-label">Betting On:</span>
                            <span class="betting-info-value betting-option-highlight">${option}</span>
                        </div>
                        <div class="betting-info-item">
                            <span class="betting-info-label">Account:</span>
                            <span class="betting-info-value">${account.name}</span>
                        </div>
                        <div class="betting-info-item">
                            <span class="betting-info-label">Available Balance:</span>
                            <span class="betting-info-value betting-balance">${balance.toFixed(2)} BB</span>
                        </div>
                    </div>
                    
                    <div class="betting-amount-section">
                        <label for="betAmount" class="betting-amount-label">
                            Bet Amount (BB)
                        </label>
                        <input 
                            type="number" 
                            id="betAmount" 
                            class="betting-amount-input"
                            placeholder="Enter amount..."
                            min="0.01"
                            max="${balance}"
                            step="0.01"
                        />
                        <div class="betting-quick-amounts">
                            <button type="button" class="betting-quick-btn" data-amount="10">10 BB</button>
                            <button type="button" class="betting-quick-btn" data-amount="50">50 BB</button>
                            <button type="button" class="betting-quick-btn" data-amount="100">100 BB</button>
                            <button type="button" class="betting-quick-btn" data-amount="${balance}">MAX</button>
                        </div>
                        <div id="betAmountError" class="betting-amount-error" style="display: none;"></div>
                    </div>
                </div>
                
                <div class="betting-modal-footer">
                    <button class="betting-modal-btn betting-btn-cancel" id="cancelBet">Cancel</button>
                    <button class="betting-modal-btn betting-btn-submit" id="submitBet">Place Bet</button>
                </div>
            </div>
        </div>
    `;
    
    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get elements
    const modal = document.getElementById('bettingModal')!;
    const closeBtn = document.getElementById('closeBettingModal')!;
    const cancelBtn = document.getElementById('cancelBet')!;
    const submitBtn = document.getElementById('submitBet') as HTMLButtonElement;
    const amountInput = document.getElementById('betAmount') as HTMLInputElement;
    const errorDiv = document.getElementById('betAmountError')!;
    const quickBtns = document.querySelectorAll('.betting-quick-btn');
    
    // Focus input
    amountInput.focus();
    
    // Quick amount buttons
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.getAttribute('data-amount');
            amountInput.value = amount || '';
            errorDiv.style.display = 'none';
        });
    });
    
    // Close handlers
    const closeModal = () => {
        modal.classList.add('modal-closing');
        setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Submit handler
    submitBtn.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        
        // Validation
        if (!amountInput.value || isNaN(amount)) {
            errorDiv.textContent = 'Please enter a valid amount';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (amount <= 0) {
            errorDiv.textContent = 'Amount must be greater than 0';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (amount > balance) {
            errorDiv.textContent = `Insufficient balance (max: ${balance.toFixed(2)} BB)`;
            errorDiv.style.display = 'block';
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Placing Bet...';
        
        try {
            log(`🎯 Placing bet on "${option}" for ${amount} BB...`, 'info');
            log(`📋 Debug - Market ID: ${marketId}, Account: ${account.name}, Amount: ${amount}, Option: ${option}`, 'info');
            
            const result = await BackendService.placeBet(marketId, account.name, amount, option);
            
            log(`✅ Bet placed successfully! ${amount} BB on "${option}"`, 'success');
            log(`📊 Backend response: ${JSON.stringify(result)}`, 'info');
            
            await loadAccounts();
            closeModal();
        } catch (error) {
            log(`❌ Bet failed: ${error}`, 'error');
            console.error('Full error object:', error);
            errorDiv.textContent = `Failed to place bet: ${error}`;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Place Bet';
        }
    });
    
    // Enter key to submit
    amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
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
// BLOCKCHAIN LEDGER / RECEIPTS
// ============================================

async function loadReceipts() {
    try {
        log('⛓️ Loading blockchain ledger...', 'info');
        
        // Fetch all recipes from blockchain
        const recipes = await BackendService.getRecipes();
        allRecipes = recipes as Recipe[];
        filteredRecipes = recipes as Recipe[];
        
        log(`✅ Loaded ${recipes.length} recipes from ledger`, 'success');
        
        // Update UI
        updateReceiptsStats();
        displayRecipes(filteredRecipes);
        populateReceiptsFilters();
        
    } catch (error: any) {
        log(`❌ Failed to load ledger: ${error.message}`, 'error');
    }
}

function updateReceiptsStats() {
    const totalRecipesEl = document.getElementById('totalRecipes');
    const totalVolumeEl = document.getElementById('totalVolume');
    const totalBetsEl = document.getElementById('totalBets');
    const totalTransfersEl = document.getElementById('totalTransfers');
    
    const totalVolume = allRecipes.reduce((sum, recipe) => sum + Math.abs(recipe.amount), 0);
    const totalBets = allRecipes.filter(r => r.recipe_type === 'bet_placed').length;
    const totalTransfers = allRecipes.filter(r => r.recipe_type === 'transfer').length;
    
    if (totalRecipesEl) totalRecipesEl.textContent = allRecipes.length.toString();
    if (totalVolumeEl) totalVolumeEl.textContent = `${totalVolume.toFixed(2)} BB`;
    if (totalBetsEl) totalBetsEl.textContent = totalBets.toString();
    if (totalTransfersEl) totalTransfersEl.textContent = totalTransfers.toString();
}

function displayRecipes(recipes: Recipe[]) {
    const receiptsList = document.getElementById('receiptsList');
    const visibleCountEl = document.getElementById('visibleCount');
    const totalCountEl = document.getElementById('totalCount');
    
    if (!receiptsList) return;
    
    // Update counts
    if (visibleCountEl) visibleCountEl.textContent = recipes.length.toString();
    if (totalCountEl) totalCountEl.textContent = allRecipes.length.toString();
    
    if (recipes.length === 0) {
        receiptsList.innerHTML = '<p class="empty-state">📋 No ledger entries found. All blockchain activity will appear here.</p>';
        return;
    }
    
    // Sort by timestamp (newest first)
    const sortedRecipes = [...recipes].sort((a, b) => b.timestamp - a.timestamp);
    
    // Create ledger-style display
    let ledgerHTML = '<div class="blockchain-ledger">';
    ledgerHTML += '<div class="ledger-header">📡 Blockchain Transaction Ledger</div>';
    
    sortedRecipes.forEach(recipe => {
        const date = new Date(recipe.timestamp * 1000);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        
        // Get icon and format based on recipe type
        let icon = '📝';
        let action = recipe.recipe_type.toUpperCase().replace(/_/g, ' ');
        let details = '';
        
        if (recipe.recipe_type === 'bet_placed') {
            icon = '🎲';
            action = 'BET_PLACED';
            // Extract market name from description if possible
            const marketMatch = recipe.description.match(/on market (.+)/);
            const marketName = marketMatch ? marketMatch[1] : 'Unknown Market';
            details = `${recipe.account} bet ${Math.abs(recipe.amount)} BB on "${marketName}"`;
        } else if (recipe.recipe_type === 'transfer') {
            icon = '💸';
            action = 'TRANSFER';
            details = recipe.description;
        } else if (recipe.recipe_type === 'deposit') {
            icon = '💰';
            action = 'DEPOSIT';
            details = `${recipe.account} deposited ${recipe.amount} BB`;
        } else if (recipe.recipe_type === 'withdrawal') {
            icon = '🏧';
            action = 'WITHDRAWAL';
            details = `${recipe.account} withdrew ${Math.abs(recipe.amount)} BB`;
        } else if (recipe.metadata && recipe.metadata.tx_type === 'mint') {
            icon = '🪙';
            action = 'TOKENS_MINTED';
            details = `Account: ${recipe.account} | Minted: ${recipe.amount} BB`;
        } else {
            // Generic format
            details = recipe.description;
        }
        
        ledgerHTML += `
            <div class="ledger-entry">
                <span class="ledger-time">[${timeStr}]</span>
                <span class="ledger-icon">${icon}</span>
                <span class="ledger-action">${action}</span>
                <span class="ledger-separator">|</span>
                <span class="ledger-details">${details}</span>
            </div>
        `;
    });
    
    ledgerHTML += '</div>';
    receiptsList.innerHTML = ledgerHTML;
}

function getRecipeTypeInfo(type: string): {icon: string, label: string, color: string} {
    const typeMap: Record<string, {icon: string, label: string, color: string}> = {
        'bet_placed': {icon: '🎯', label: 'Bet Placed', color: 'bet'},
        'bet_win': {icon: '🏆', label: 'Bet Won', color: 'win'},
        'bet_loss': {icon: '❌', label: 'Bet Lost', color: 'loss'},
        'market_payout': {icon: '💰', label: 'Payout', color: 'payout'},
        'transfer': {icon: '🔄', label: 'Transfer', color: 'transfer'},
        'deposit': {icon: '💵', label: 'Deposit', color: 'deposit'},
        'admin_action': {icon: '⚙️', label: 'Admin', color: 'admin'},
    };
    
    return typeMap[type] || {icon: '📋', label: type, color: 'default'};
}

function populateReceiptsFilters() {
    const filterAccount = document.getElementById('filterAccount') as HTMLSelectElement;
    if (!filterAccount) return;
    
    // Get unique accounts from recipes
    const accountsSet = new Set<string>();
    allRecipes.forEach(recipe => accountsSet.add(recipe.account));
    
    // Populate dropdown
    const sortedAccounts = Array.from(accountsSet).sort();
    filterAccount.innerHTML = '<option value="">All Accounts</option>' + 
        sortedAccounts.map(account => `<option value="${account}">${account}</option>`).join('');
}

function applyRecipeFilters() {
    const filterAccount = (document.getElementById('filterAccount') as HTMLSelectElement)?.value || '';
    const filterType = (document.getElementById('filterType') as HTMLSelectElement)?.value || '';
    const searchAmount = (document.getElementById('searchAmount') as HTMLInputElement)?.value;
    
    const minAmount = searchAmount ? parseFloat(searchAmount) : 0;
    
    filteredRecipes = allRecipes.filter(recipe => {
        const matchesAccount = !filterAccount || recipe.account === filterAccount;
        const matchesType = !filterType || recipe.recipe_type === filterType;
        const matchesAmount = Math.abs(recipe.amount) >= minAmount;
        
        return matchesAccount && matchesType && matchesAmount;
    });
    
    displayRecipes(filteredRecipes);
    log(`🔍 Filtered to ${filteredRecipes.length} ledger entries`, 'info');
}

function resetRecipeFilters() {
    const filterAccount = document.getElementById('filterAccount') as HTMLSelectElement;
    const filterType = document.getElementById('filterType') as HTMLSelectElement;
    const searchAmount = document.getElementById('searchAmount') as HTMLInputElement;
    
    if (filterAccount) filterAccount.value = '';
    if (filterType) filterType.value = '';
    if (searchAmount) searchAmount.value = '';
    
    filteredRecipes = allRecipes;
    displayRecipes(filteredRecipes);
    log('🔄 Filters reset', 'info');
}

function exportRecipesToCSV() {
    if (filteredRecipes.length === 0) {
        log('⚠️ No recipes to export', 'warning');
        return;
    }
    
    // CSV headers
    const headers = ['ID', 'Type', 'Account', 'Address', 'Amount', 'Description', 'Related ID', 'Timestamp', 'Date'];
    
    // CSV rows
    const rows = filteredRecipes.map(recipe => {
        const date = new Date(recipe.timestamp * 1000);
        return [
            recipe.id,
            recipe.recipe_type,
            recipe.account,
            recipe.address,
            recipe.amount.toFixed(2),
            `"${recipe.description.replace(/"/g, '""')}"`, // Escape quotes
            recipe.related_id || '',
            recipe.timestamp,
            date.toLocaleString()
        ];
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `blackbook_ledger_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
        log(`✅ Exported ${filteredRecipes.length} ledger entries to CSV`, 'success');
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
// PAGE SWITCHING
// ============================================

function switchPage(page: string) {
    const mainContainer = document.getElementById('mainContainer') as HTMLElement;
    const transfersContainer = document.getElementById('transfersContainer') as HTMLElement;
    const priceActionContainer = document.getElementById('priceActionContainer') as HTMLElement;
    const receiptsContainer = document.getElementById('receiptsContainer') as HTMLElement;
    
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
        if (receiptsContainer) receiptsContainer.classList.add('hidden');
    } else if (page === 'priceAction') {
        log('⚡ Opening Price Action...', 'info');
        if (mainContainer) mainContainer.classList.add('hidden');
        if (transfersContainer) transfersContainer.classList.add('hidden');
        if (priceActionContainer) priceActionContainer.classList.remove('hidden');
        if (receiptsContainer) receiptsContainer.classList.add('hidden');
    } else if (page === 'receipts') {
        log('📜 Opening Receipts...', 'info');
        if (mainContainer) mainContainer.classList.add('hidden');
        if (transfersContainer) transfersContainer.classList.add('hidden');
        if (priceActionContainer) priceActionContainer.classList.add('hidden');
        if (receiptsContainer) receiptsContainer.classList.remove('hidden');
        // Load receipts when page opens
        loadReceipts();
    } else if (page === 'markets') {
        log('📊 Returning to Markets...', 'info');
        if (mainContainer) mainContainer.classList.remove('hidden');
        if (transfersContainer) transfersContainer.classList.add('hidden');
        if (priceActionContainer) priceActionContainer.classList.add('hidden');
        if (receiptsContainer) receiptsContainer.classList.add('hidden');
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
        
        // Set up callback to refresh main page accounts after transfers
        TransfersModule.setOnTransferComplete(async () => {
            await loadAccounts();
            log('✅ Balances updated after transfer', 'success');
        });
        
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
    
    // Home button - return to home/markets page (hidden for now)
    // const homeNavBtn = document.getElementById('homeNavBtn');
    // if (homeNavBtn) {
    //     homeNavBtn.addEventListener('click', () => {
    //         switchPage('markets');
    //         debugConsole.log('🏠 Returning to home page', 'info');
    //     });
    // }
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => switchPage('markets'));
    }
    
    // Back from Price Action button
    const backFromPriceActionBtn = document.getElementById('backFromPriceActionBtn');
    if (backFromPriceActionBtn) {
        backFromPriceActionBtn.addEventListener('click', () => switchPage('markets'));
    }
    
    // Back from Receipts button
    const backFromReceiptsBtn = document.getElementById('backFromReceiptsBtn');
    if (backFromReceiptsBtn) {
        backFromReceiptsBtn.addEventListener('click', () => switchPage('markets'));
    }
    
    // Receipts button
    const receiptsBtn = document.getElementById('receiptsBtn');
    if (receiptsBtn) {
        receiptsBtn.addEventListener('click', () => {
            switchPage('receipts');
            debugConsole.log('📜 Opening receipts page', 'info');
        });
    }

    // Receipts filter buttons
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyRecipeFilters);
    }

    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetRecipeFilters);
    }

    const exportCSVBtn = document.getElementById('exportCSVBtn');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportRecipesToCSV);
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
