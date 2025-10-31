/**
 * BlackBook L1 Desktop App - Simplifieasync function loadAccounts() {
    try {
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
// PAGE SWITCHING & TRANSFERS
// ============================================

function switchPage(page: string) {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    const transfersPage = document.getElementById('transfersPage') as HTMLElement;
    
    if (page === 'transfers') {
        log('🔄 Opening Transfers Page...', 'info');
        if (mainContent) mainContent.classList.add('hidden');
        if (transfersPage) {
            transfersPage.classList.remove('hidden');
            populateTransferSelects();
        }
    } else if (page === 'markets') {
        log('📊 Returning to Markets...', 'info');
        if (mainContent) mainContent.classList.remove('hidden');
        if (transfersPage) transfersPage.classList.add('hidden');
    }
}

function populateTransferSelects() {
    const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
    const toSelect = document.getElementById('transferTo') as HTMLSelectElement;
    
    if (!fromSelect || !toSelect) return;
    
    fromSelect.innerHTML = '<option value="">Select sender...</option>';
    toSelect.innerHTML = '<option value="">Select recipient...</option>';
    
    accounts.forEach(account => {
        const fromOption = document.createElement('option');
        fromOption.value = account.name;
        fromOption.textContent = `${account.name} (${account.balance} BB)`;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = account.name;
        toOption.textContent = account.name;
        toSelect.appendChild(toOption);
    });
}

function updateFromBalance() {
    const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
    const balanceDisplay = document.getElementById('fromBalance') as HTMLElement;
    const maxAvailable = document.getElementById('maxAvailable') as HTMLElement;
    
    if (!fromSelect || !balanceDisplay) return;
    
    const account = accounts.find(a => a.name === fromSelect.value);
    if (account) {
        balanceDisplay.textContent = account.balance.toString();
        if (maxAvailable) {
            maxAvailable.textContent = account.balance.toString();
        }
    } else {
        balanceDisplay.textContent = '0';
        if (maxAvailable) {
            maxAvailable.textContent = '0';
        }
    }
}

function showTransferMessage(message: string, type: 'success' | 'error' | 'info') {
    const messageEl = document.getElementById('transferMessage');
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.className = `transfer-message show ${type}`;
    
    // Auto-clear success messages after 4 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 4000);
    }
}

function setQuickTransferAmount(amount: number) {
    const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
    const amountInput = document.getElementById('transferAmount') as HTMLInputElement;
    
    if (!fromSelect.value) {
        showTransferMessage('❌ Please select a sender account first', 'error');
        return;
    }
    
    const account = accounts.find(a => a.name === fromSelect.value);
    if (account && account.balance >= amount) {
        amountInput.value = amount.toString();
        showTransferMessage(`📝 Set transfer amount to ${amount} BB`, 'info');
    } else {
        showTransferMessage(`❌ Insufficient balance. Available: ${account?.balance || 0} BB`, 'error');
    }
}

async function executeTransfer() {
    try {
        const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
        const toSelect = document.getElementById('transferTo') as HTMLSelectElement;
        const amountInput = document.getElementById('transferAmount') as HTMLInputElement;
        const btn = document.getElementById('sendTransferBtn') as HTMLButtonElement;
        
        const fromAccount = fromSelect.value;
        const toAccount = toSelect.value;
        const amount = parseFloat(amountInput.value);
        
        if (!fromAccount || !toAccount || !amount || amount <= 0) {
            showTransferMessage('❌ Please fill in all transfer fields', 'error');
            log('❌ Please fill in all transfer fields', 'error');
            return;
        }
        
        if (fromAccount === toAccount) {
            showTransferMessage('❌ Cannot transfer to the same account', 'error');
            log('❌ Cannot transfer to the same account', 'error');
            return;
        }
        
        const fromAccountObj = accounts.find(a => a.name === fromAccount);
        if (!fromAccountObj || fromAccountObj.balance < amount) {
            showTransferMessage(`❌ Insufficient balance. Available: ${fromAccountObj?.balance || 0} BB`, 'error');
            log('❌ Insufficient balance', 'error');
            return;
        }
        
        // Disable button and show loading state
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Processing...</span>';
        
        log(`🔄 Transferring ${amount} BB from ${fromAccount} to ${toAccount}...`, 'info');
        showTransferMessage(`⏳ Processing transfer of ${amount} BB...`, 'info');
        
        await BackendService.transfer(fromAccount, toAccount, amount);
        
        log(`✅ Transfer successful!`, 'success');
        showTransferMessage(`✅ Successfully transferred ${amount} BB from ${fromAccount} to ${toAccount}!`, 'success');
        
        // Reset form
        amountInput.value = '';
        fromSelect.value = '';
        toSelect.value = '';
        
        const balanceDisplay = document.getElementById('fromBalance') as HTMLElement;
        if (balanceDisplay) {
            balanceDisplay.textContent = '0';
        }
        
        // Re-enable button
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">📤</span><span class="btn-text">Send Transfer</span>';
        
        // Reload accounts to update balances
        await loadAccounts();
        await updateTransferStats();
        
    } catch (error) {
        log(`❌ Transfer failed: ${error}`, 'error');
        showTransferMessage(`❌ Transfer failed: ${error}`, 'error');
        
        const btn = document.getElementById('sendTransferBtn') as HTMLButtonElement;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">📤</span><span class="btn-text">Send Transfer</span>';
        }
    }
}

async function updateTransferStats() {
    try {
        const stats = await BackendService.getLedgerStats();
        
        const statsAccounts = document.getElementById('statsAccounts');
        const statsVolume = document.getElementById('statsVolume');
        const statsTransfers = document.getElementById('statsTransfers');
        const statsBets = document.getElementById('statsBets');
        
        if (statsAccounts) statsAccounts.textContent = stats.totalAccounts.toString();
        if (statsVolume) statsVolume.textContent = `${stats.totalVolume.toFixed(0)} BB`;
        if (statsTransfers) statsTransfers.textContent = stats.totalTransactions.toString();
        if (statsBets) statsBets.textContent = stats.totalBets.toString();
    } catch (error) {
        console.error('Failed to update transfer stats:', error);
    }
}

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
            updateTransferStats();
        });
    }
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => switchPage('markets'));
    }
    
    // Transfer form
    const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
    if (fromSelect) {
        fromSelect.addEventListener('change', updateFromBalance);
    }
    
    const sendBtn = document.getElementById('sendTransferBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', executeTransfer);
    }
    
    // Quick transfer buttons
    const quickTransfer50 = document.getElementById('quickTransfer50');
    if (quickTransfer50) {
        quickTransfer50.addEventListener('click', () => setQuickTransferAmount(50));
    }
    
    const quickTransfer100 = document.getElementById('quickTransfer100');
    if (quickTransfer100) {
        quickTransfer100.addEventListener('click', () => setQuickTransferAmount(100));
    }
    
    const quickTransfer500 = document.getElementById('quickTransfer500');
    if (quickTransfer500) {
        quickTransfer500.addEventListener('click', () => setQuickTransferAmount(500));
    }
    
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
(window as any).updateFromBalance = updateFromBalance;
(window as any).executeTransfer = executeTransfer;
(window as any).setQuickTransferAmount = setQuickTransferAmount;
(window as any).updateTransferStats = updateTransferStats;
