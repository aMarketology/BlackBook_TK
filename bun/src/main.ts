import { invoke } from '@tauri-apps/api/tauri';
import { getPricesasync function loadMarkets() {
    try {
        log('📊 Loading prediction markets...');
        allMarkets = await invoke('get_markets') as MarketInfo[];
        log(`✅ Loaded ${allMarkets.length} active markets`, 'success');
        
        renderMarketsList();
        renderMarketSelect();
    } catch (error) {
        log(`Markets fetch failed: ${error}`, 'error');
    }
}

async function loadPolymarketEvents() {
    try {
        log('🔮 Fetching real Polymarket events...');
        polymarketEvents = await getPolymarketEvents();
        log(`✅ Loaded ${polymarketEvents.length} Polymarket events`, 'success');
        
        renderPolymarketEvents();
    } catch (error) {
        log(`❌ Polymarket fetch failed: ${error}`, 'error');
    }
}e } from './lib/prices';
import { getPolymarketEvents, formatVolume, getPriceColor, getPriceLabel, type PolymarketMarket } from './lib/polymarket';

interface AccountInfo {
    name: string;
    address: string;
    balance: number;
}

interface MarketInfo {
    id: string;
    title: string;
    description: string;
    yes_shares: number;
    no_shares: number;
    yes_price: number;
    no_price: number;
    total_volume: number;
    is_resolved: boolean;
    winning_outcome?: string;
}

let selectedAccount: AccountInfo | null = null;
let allAccounts: AccountInfo[] = [];
let allMarkets: MarketInfo[] = [];
let polymarketEvents: PolymarketMarket[] = [];
let selectedMarket: MarketInfo | null = null;
let selectedOutcome: 'YES' | 'NO' | null = null;

function log(message: string, type: string = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const consoleEl = document.getElementById('debugConsole');
    if (consoleEl) {
        const div = document.createElement('div');
        div.className = `console-message ${type}`;
        div.textContent = `[${timestamp}] ${message}`;
        consoleEl.appendChild(div);
        consoleEl.scrollTop = consoleEl.scrollHeight;
        
        while (consoleEl.children.length > 100) {
            consoleEl.removeChild(consoleEl.firstChild!);
        }
    }
    console.log(message);
}

async function loadAccounts() {
    try {
        log('📡 Fetching accounts from blockchain...');
        allAccounts = await invoke('get_accounts') as AccountInfo[];
        log(`✅ Loaded ${allAccounts.length} L1 accounts`, 'success');
        
        renderAccountsList();
        renderAccountSelect();
        updateNetworkStats();
        
        if (allAccounts.length > 0) {
            selectAccount(allAccounts[0].name);
        }
    } catch (error) {
        log(`Accounts fetch failed: ${error}`, 'error');
        throw error;
    }
}

async function loadMarkets() {
    try {
        log('� Loading prediction markets...');
        allMarkets = await invoke('get_markets') as MarketInfo[];
        log(`✅ Loaded ${allMarkets.length} active markets`, 'success');
        
        renderMarketsList();
        renderMarketSelect();
    } catch (error) {
        log(`Markets fetch failed: ${error}`, 'error');
    }
}

function renderAccountsList() {
    const list = document.getElementById('accountsList');
    if (!list) return;
    
    list.innerHTML = allAccounts.map(acc => `
        <div class="account-item" data-name="${acc.name}">
            <strong>${acc.name}</strong><br>
            <small>${acc.balance.toFixed(2)} BB</small>
        </div>
    `).join('');
    
    list.querySelectorAll('.account-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = (item as HTMLElement).dataset.name;
            if (name) selectAccount(name);
        });
    });
}

function renderAccountSelect() {
    const select = document.getElementById('accountSelect') as HTMLSelectElement;
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Account</option>' + 
        allAccounts.map(acc => 
            `<option value="${acc.name}">${acc.name} (${acc.balance.toFixed(2)} BB)</option>`
        ).join('');
}

function renderMarketsList() {
    const list = document.getElementById('marketsList');
    if (!list) return;
    
    list.innerHTML = allMarkets.map(market => `
        <div class="market-card" data-id="${market.id}">
            <div class="market-title">${market.title}</div>
            <div class="market-description">${market.description}</div>
            <div class="market-prices">
                <div class="price-option yes">
                    <div class="option-label">YES</div>
                    <div class="option-price">${(market.yes_price * 100).toFixed(1)}¢</div>
                </div>
                <div class="price-option no">
                    <div class="option-label">NO</div>
                    <div class="option-price">${(market.no_price * 100).toFixed(1)}¢</div>
                </div>
            </div>
        </div>
    `).join('');
    
    list.querySelectorAll('.market-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = (card as HTMLElement).dataset.id;
            if (id) selectMarket(id);
        });
    });
}

function renderMarketSelect() {
    const select = document.getElementById('marketSelect') as HTMLSelectElement;
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Market</option>' +
        allMarkets.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
}

function selectAccount(name: string) {
    selectedAccount = allAccounts.find(acc => acc.name === name) || null;
    if (!selectedAccount) return;
    
    document.querySelectorAll('.account-item').forEach(item => {
        item.classList.toggle('selected', (item as HTMLElement).dataset.name === name);
    });
    
    const addressEl = document.getElementById('selectedAddress');
    const balanceEl = document.getElementById('selectedBalance');
    const select = document.getElementById('accountSelect') as HTMLSelectElement;
    
    if (addressEl) addressEl.textContent = selectedAccount.address;
    if (balanceEl) balanceEl.textContent = `${selectedAccount.balance.toFixed(2)} BB`;
    if (select) select.value = name;
    
    updateBetButton();
    log(`👤 Selected account: ${selectedAccount.name}`, 'info');
}

function selectMarket(id: string) {
    selectedMarket = allMarkets.find(m => m.id === id) || null;
    if (!selectedMarket) return;
    
    document.querySelectorAll('.market-card').forEach(card => {
        card.classList.toggle('selected', (card as HTMLElement).dataset.id === id);
    });
    
    const select = document.getElementById('marketSelect') as HTMLSelectElement;
    if (select) select.value = id;
    
    updateBetButton();
    log(`📊 Selected market: ${selectedMarket.title}`, 'info');
}

async function placeBet() {
    if (!selectedAccount || !selectedMarket || !selectedOutcome) {
        log('❌ Please select account, market, and outcome', 'error');
        return;
    }
    
    const amountInput = document.getElementById('betAmount') as HTMLInputElement;
    const amount = parseFloat(amountInput?.value || '0');
    
    if (amount <= 0) {
        log('❌ Please enter a valid bet amount', 'error');
        return;
    }
    
    if (amount > selectedAccount.balance) {
        log('❌ Insufficient balance', 'error');
        return;
    }
    
    try {
        log(`🎯 Placing ${amount} BB bet on ${selectedOutcome} for ${selectedMarket.title}...`, 'info');
        
        const result = await invoke('place_market_bet', {
            marketId: selectedMarket.id,
            accountName: selectedAccount.name,
            amount: amount,
            outcome: selectedOutcome
        });
        
        log(`✅ ${result}`, 'success');
        
        await loadAccounts();
        
        if (amountInput) amountInput.value = '';
        selectedOutcome = null;
        document.querySelectorAll('.outcome-btn').forEach(btn => btn.classList.remove('selected'));
        updateBetButton();
        
    } catch (error) {
        log(`❌ Bet failed: ${error}`, 'error');
    }
}

async function updatePrices() {
    const btcEl = document.getElementById('btcPrice');
    const solEl = document.getElementById('solPrice');
    
    try {
        log('📈 Fetching real-time prices from CoinGecko API...', 'info');
        const prices = await getPrices();
        
        if (btcEl) btcEl.textContent = formatPrice(prices.btc);
        if (solEl) solEl.textContent = formatPrice(prices.sol);
        
        log(`✅ Updated prices - BTC: ${formatPrice(prices.btc)}, SOL: ${formatPrice(prices.sol)}`, 'success');
    } catch (error) {
        log(`❌ Failed to fetch prices: ${error}`, 'error');
        
        // Show error state in UI
        if (btcEl) btcEl.textContent = 'API Error';
        if (solEl) solEl.textContent = 'API Error';
    }
}

function updateNetworkStats() {
    const statsEl = document.getElementById('networkStats');
    if (!statsEl) return;
    
    const totalSupply = allAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    statsEl.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total Accounts</span>
            <span class="stat-value">${allAccounts.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Supply</span>
            <span class="stat-value">${totalSupply.toFixed(2)} BB</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Active Markets</span>
            <span class="stat-value">${allMarkets.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Network Status</span>
            <span class="stat-value">🟢 Online</span>
        </div>
    `;
}

function updateBetButton() {
    const btn = document.getElementById('placeBetBtn') as HTMLButtonElement;
    const amountInput = document.getElementById('betAmount') as HTMLInputElement;
    
    if (!btn) return;
    
    const amount = parseFloat(amountInput?.value || '0');
    const canBet = selectedAccount && selectedMarket && selectedOutcome && amount > 0 && amount <= selectedAccount.balance;
    
    btn.disabled = !canBet;
    btn.textContent = canBet ? 
        `Place ${amount} BB on ${selectedOutcome}` : 
        'Select Account, Market & Amount';
}

function openAdminPanel() {
    log('👑 Opening Admin Panel...', 'info');
    
    // Populate accounts in admin panel
    populateAdminAccounts();
    
    // Show modal
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeAdminPanel() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function populateAdminAccounts() {
    const adminAccountsList = document.getElementById('adminAccountsList');
    const depositSelect = document.getElementById('adminDepositAccount') as HTMLSelectElement;
    const transferFromSelect = document.getElementById('adminTransferFrom') as HTMLSelectElement;
    const transferToSelect = document.getElementById('adminTransferTo') as HTMLSelectElement;
    const adminStats = document.getElementById('adminStats');
    
    if (adminAccountsList) {
        adminAccountsList.innerHTML = allAccounts.map(account => `
            <div class="admin-account-card">
                <div class="admin-account-name">👤 ${account.name}</div>
                <div class="admin-account-address">${account.address}</div>
                <div class="admin-account-balance">${account.balance.toFixed(2)} BB</div>
            </div>
        `).join('');
    }
    
    // Populate dropdowns
    const accountOptions = allAccounts.map(acc => 
        `<option value="${acc.name}">${acc.name} (${acc.balance.toFixed(2)} BB)</option>`
    ).join('');
    
    if (depositSelect) {
        depositSelect.innerHTML = '<option value="">Select Account</option>' + accountOptions;
    }
    if (transferFromSelect) {
        transferFromSelect.innerHTML = '<option value="">From Account</option>' + accountOptions;
    }
    if (transferToSelect) {
        transferToSelect.innerHTML = '<option value="">To Account</option>' + accountOptions;
    }
    
    // Update stats
    if (adminStats) {
        const totalSupply = allAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const avgBalance = totalSupply / allAccounts.length;
        
        adminStats.innerHTML = `
            <div class="admin-stat-card">
                <div class="admin-stat-label">Total Accounts</div>
                <div class="admin-stat-value">${allAccounts.length}</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">Total Supply</div>
                <div class="admin-stat-value">${totalSupply.toFixed(2)} BB</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">Average Balance</div>
                <div class="admin-stat-value">${avgBalance.toFixed(2)} BB</div>
            </div>
        `;
    }
}

async function performAdminDeposit() {
    const accountSelect = document.getElementById('adminDepositAccount') as HTMLSelectElement;
    const amountInput = document.getElementById('adminDepositAmount') as HTMLInputElement;
    
    const account = accountSelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (!account || !amount || amount <= 0) {
        log('❌ Please select an account and enter a valid amount', 'error');
        return;
    }
    
    try {
        log(`💎 Depositing ${amount} BB to ${account}...`, 'info');
        
        const result = await invoke('admin_deposit', {
            req: { address: account, amount }
        }) as string;
        
        log(`✅ ${result}`, 'success');
        
        // Refresh accounts and admin panel
        await loadAccounts();
        populateAdminAccounts();
        renderAccountSelect();
        
        // Clear form
        amountInput.value = '';
        accountSelect.value = '';
        
    } catch (error) {
        log(`❌ Deposit failed: ${error}`, 'error');
    }
}

async function performAdminTransfer() {
    const fromSelect = document.getElementById('adminTransferFrom') as HTMLSelectElement;
    const toSelect = document.getElementById('adminTransferTo') as HTMLSelectElement;
    const amountInput = document.getElementById('adminTransferAmount') as HTMLInputElement;
    
    const from = fromSelect.value;
    const to = toSelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (!from || !to || !amount || amount <= 0) {
        log('❌ Please select both accounts and enter a valid amount', 'error');
        return;
    }
    
    if (from === to) {
        log('❌ Cannot transfer to the same account', 'error');
        return;
    }
    
    try {
        log(`🔄 Transferring ${amount} BB from ${from} to ${to}...`, 'info');
        
        const result = await invoke('transfer', {
            req: { from, to, amount }
        }) as string;
        
        log(`✅ ${result}`, 'success');
        
        // Refresh accounts and admin panel
        await loadAccounts();
        populateAdminAccounts();
        renderAccountSelect();
        
        // Clear form
        amountInput.value = '';
        fromSelect.value = '';
        toSelect.value = '';
        
    } catch (error) {
        log(`❌ Transfer failed: ${error}`, 'error');
    }
}

function setupEventListeners() {
    const accountSelect = document.getElementById('accountSelect') as HTMLSelectElement;
    accountSelect?.addEventListener('change', (e) => {
        const name = (e.target as HTMLSelectElement).value;
        if (name) selectAccount(name);
    });

    const marketSelect = document.getElementById('marketSelect') as HTMLSelectElement;
    marketSelect?.addEventListener('change', (e) => {
        const id = (e.target as HTMLSelectElement).value;
        if (id) selectMarket(id);
    });

    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = (e.target as HTMLElement).dataset.amount;
            const amountInput = document.getElementById('betAmount') as HTMLInputElement;
            if (amountInput && amount) {
                amountInput.value = amount;
                updateBetButton();
            }
        });
    });

    const higherBtn = document.getElementById('higherBtn');
    const lowerBtn = document.getElementById('lowerBtn');
    
    higherBtn?.addEventListener('click', () => {
        selectedOutcome = 'YES';
        higherBtn.classList.add('selected');
        lowerBtn?.classList.remove('selected');
        updateBetButton();
    });
    
    lowerBtn?.addEventListener('click', () => {
        selectedOutcome = 'NO';
        lowerBtn.classList.add('selected');
        higherBtn?.classList.remove('selected');
        updateBetButton();
    });

    const amountInput = document.getElementById('betAmount') as HTMLInputElement;
    amountInput?.addEventListener('input', updateBetButton);

    const placeBetBtn = document.getElementById('placeBetBtn');
    placeBetBtn?.addEventListener('click', placeBet);

    const clearBtn = document.getElementById('clearConsole');
    clearBtn?.addEventListener('click', () => {
        const consoleEl = document.getElementById('debugConsole');
        if (consoleEl) {
            consoleEl.innerHTML = '<div class="console-message">Console cleared...</div>';
        }
    });
    
    const adminBtn = document.getElementById('adminBtn');
    adminBtn?.addEventListener('click', openAdminPanel);
    
    const closeAdminModal = document.getElementById('closeAdminModal');
    closeAdminModal?.addEventListener('click', closeAdminPanel);
    
    const adminDepositBtn = document.getElementById('adminDepositBtn');
    adminDepositBtn?.addEventListener('click', performAdminDeposit);
    
    const adminTransferBtn = document.getElementById('adminTransferBtn');
    adminTransferBtn?.addEventListener('click', performAdminTransfer);
    
    // Close modal when clicking outside
    const adminModal = document.getElementById('adminModal');
    adminModal?.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            closeAdminPanel();
        }
    });
}

async function init() {
    log('🚀 BlackBook initializing...');
    
    try {
        await loadAccounts();
        await loadMarkets();
        updatePrices();
        setupEventListeners();
        
        setInterval(updatePrices, 30000);
        
        log('✅ BlackBook L1 initialized successfully', 'success');
    } catch (error) {
        log(`Init failed: ${error}`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);
