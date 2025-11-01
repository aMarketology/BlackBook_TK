/**
 * UI Builder - Dynamically generate all UI elements
 */

import type { Account } from '../main';

export class UIBuilder {
    /**
     * Build the entire app UI
     */
    static buildApp(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'app-container';
        
        // Add header
        container.appendChild(this.buildHeader());
        
        // Add main content container
        const mainContainer = document.createElement('div');
        mainContainer.id = 'mainContainer';
        mainContainer.appendChild(this.buildMainContent());
        container.appendChild(mainContainer);
        
        // Add transfers page (hidden by default)
        const transfersContainer = document.createElement('div');
        transfersContainer.id = 'transfersContainer';
        transfersContainer.appendChild(this.buildTransfersPage());
        transfersContainer.classList.add('hidden');
        container.appendChild(transfersContainer);
        
        // Note: Debug console footer is built and managed by DebugConsole class
        
        return container;
    }

    /**
     * Build header with navigation
     */
    static buildHeader(): HTMLElement {
        const header = document.createElement('header');
        header.className = 'header';
        
        const headerContent = document.createElement('div');
        headerContent.className = 'header-content';
        
        // Left side - title and badges
        const headerLeft = document.createElement('div');
        headerLeft.className = 'header-left';
        
        const title = document.createElement('h1');
        title.id = 'homeBtn';
        title.textContent = '🎯 BlackBook L1 Prediction Market';
        title.style.cursor = 'pointer';
        title.title = 'Click to return to home';
        headerLeft.appendChild(title);
        
        const networkInfo = document.createElement('div');
        networkInfo.className = 'network-info';
        
        // Layer 1 Blockchain badge - clickable to go home
        const blockchainBadge = document.createElement('button');
        blockchainBadge.className = 'badge badge-button';
        blockchainBadge.id = 'blockchainBtn';
        blockchainBadge.textContent = '🔗 Layer 1 Blockchain';
        blockchainBadge.title = 'Click to return to home';
        blockchainBadge.style.background = 'none';
        blockchainBadge.style.border = 'none';
        blockchainBadge.style.cursor = 'pointer';
        blockchainBadge.style.padding = '0';
        networkInfo.appendChild(blockchainBadge);
        
        // Token badge
        const tokenBadge = document.createElement('span');
        tokenBadge.className = 'badge';
        tokenBadge.textContent = '💎 BB Token';
        networkInfo.appendChild(tokenBadge);
        
        // Accounts badge
        const accountsBadge = document.createElement('span');
        accountsBadge.className = 'badge';
        accountsBadge.textContent = '📊 8 Accounts';
        networkInfo.appendChild(accountsBadge);
        
        // Home button
        const homeNavBtn = document.createElement('button');
        homeNavBtn.className = 'badge badge-button';
        homeNavBtn.id = 'homeNavBtn';
        homeNavBtn.textContent = '🏠 Home';
        networkInfo.appendChild(homeNavBtn);
        
        // Transfers button
        const transfersBtn = document.createElement('button');
        transfersBtn.className = 'badge badge-button';
        transfersBtn.id = 'transfersBtn';
        transfersBtn.textContent = '🔄 Transfers';
        networkInfo.appendChild(transfersBtn);
        
        headerLeft.appendChild(networkInfo);
        
        // Right side - account selector
        const headerRight = document.createElement('div');
        headerRight.className = 'header-right';
        
        const accountsSelector = document.createElement('div');
        accountsSelector.className = 'accounts-selector';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'accountsToggle';
        toggleBtn.className = 'accounts-toggle';
        toggleBtn.innerHTML = `
            <span id="selectedAccountName">Select Account</span>
            <span class="dropdown-arrow">▼</span>
        `;
        
        const dropdown = document.createElement('div');
        dropdown.id = 'accountsDropdown';
        dropdown.className = 'accounts-dropdown hidden';
        
        const accountsList = document.createElement('div');
        accountsList.id = 'accountsList';
        accountsList.className = 'accounts-list';
        accountsList.innerHTML = '<p class="loading">Loading accounts...</p>';
        
        dropdown.appendChild(accountsList);
        accountsSelector.appendChild(toggleBtn);
        accountsSelector.appendChild(dropdown);
        headerRight.appendChild(accountsSelector);
        
        headerContent.appendChild(headerLeft);
        headerContent.appendChild(headerRight);
        header.appendChild(headerContent);
        
        return header;
    }

/**
 * Build main content area with sidebar and markets
 */
static buildMainContent(): HTMLElement {
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';        // Sidebar
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';
        
        // Selected account info
        const accountSection = document.createElement('div');
        accountSection.innerHTML = `
            <h2>👤 Selected Account</h2>
            <div class="account-info">
                <div class="info-row">
                    <span class="label">Address:</span>
                    <span id="selectedAddress" class="value">--</span>
                </div>
                <div class="info-row">
                    <span class="label">Balance:</span>
                    <span id="selectedBalance" class="value">0 BB</span>
                </div>
            </div>
        `;
        sidebar.appendChild(accountSection);
        
        // Live prices
        const pricesSection = document.createElement('div');
        pricesSection.innerHTML = `
            <h2>💰 Live Prices</h2>
            <div class="price-display">
                <div class="price-row">
                    <span class="label">₿ Bitcoin</span>
                    <span id="btcPrice" class="price">Loading...</span>
                </div>
                <div class="price-row">
                    <span class="label">◎ Solana</span>
                    <span id="solPrice" class="price">Loading...</span>
                </div>
                <div class="price-row">
                    <span class="label">💎 BlackBook (1BB)</span>
                    <span id="bbPrice" class="price">$0.01</span>
                </div>
            </div>
            <div class="exchange-info">
                <p>1,000 Blackbook tokens = 1 cent</p>
            </div>
        `;
        sidebar.appendChild(pricesSection);
        
        mainContent.appendChild(sidebar);
        
        // Center content - markets
        const centerContent = document.createElement('main');
        centerContent.className = 'center-content';
        centerContent.innerHTML = `
            <h2>📊 Active Markets</h2>
            <div id="marketsList" class="markets-grid">
                <p class="loading">Loading markets...</p>
            </div>
            
            <h2>🔮 Polymarket Events</h2>
            <div id="polymarketEvents" class="markets-grid">
                <p class="loading">Loading Polymarket events...</p>
            </div>
        `;
        
        mainContent.appendChild(centerContent);
        
        return mainContent;
    }

    /**
     * Build transfers page
     */
    static buildTransfersPage(): HTMLElement {
        const page = document.createElement('div');
        page.id = 'transfersPage';
        page.className = 'page';
        
        // Page header
        const pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        pageHeader.innerHTML = `
            <button class="back-btn" id="backBtn">← Back to Markets</button>
            <h2>🔄 Admin Transfer Panel</h2>
            <p class="page-subtitle">Transfer BlackBook tokens between accounts</p>
        `;
        page.appendChild(pageHeader);
        
        // Page content
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        pageContent.innerHTML = `
            <div class="transfer-container">
                <!-- Transfer Form Card -->
                <div class="transfer-card">
                    <h3>💸 Transfer Tokens</h3>
                    
                    <div class="form-group">
                        <label for="transferFrom">
                            <span class="label-text">From Account:</span>
                            <span class="required">*</span>
                        </label>
                        <select id="transferFrom" class="form-input">
                            <option value="">Select sender...</option>
                        </select>
                        <div class="balance-display">
                            <span class="balance-label">Available:</span>
                            <span class="balance-value"><span id="fromBalance">0</span> BB</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="transferTo">
                            <span class="label-text">To Account:</span>
                            <span class="required">*</span>
                        </label>
                        <select id="transferTo" class="form-input">
                            <option value="">Select recipient...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="transferAmount">
                            <span class="label-text">Amount (BB):</span>
                            <span class="required">*</span>
                        </label>
                        <input type="number" id="transferAmount" class="form-input" 
                            placeholder="Enter amount" min="0" step="1" value="">
                        <div class="hint-text">Max available: <span id="maxAvailable">0</span> BB</div>
                    </div>
                    
                    <div class="transfer-message" id="transferMessage"></div>
                    
                    <button class="btn btn-primary btn-large" id="sendTransferBtn">
                        <span class="btn-icon">📤</span>
                        <span class="btn-text">Send Transfer</span>
                    </button>
                </div>
                
                <!-- Quick Transfer Templates -->
                <div class="quick-actions">
                    <h4>⚡ Quick Actions</h4>
                    <button class="quick-btn" id="quickTransfer50">Transfer 50 BB</button>
                    <button class="quick-btn" id="quickTransfer100">Transfer 100 BB</button>
                    <button class="quick-btn" id="quickTransfer500">Transfer 500 BB</button>
                </div>
            </div>
        `;
        pageContent.appendChild(this.createTransferStatsPanel());
        page.appendChild(pageContent);
        
        return page;
    }

    /**
     * Create transfer stats panel showing recent transfers
     */
    static createTransferStatsPanel(): HTMLElement {
        const statsPanel = document.createElement('div');
        statsPanel.className = 'transfer-stats-panel';
        statsPanel.innerHTML = `
            <h3>📊 Transfer Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Total Accounts</div>
                    <div class="stat-value" id="statsAccounts">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total Volume</div>
                    <div class="stat-value" id="statsVolume">0 BB</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total Transfers</div>
                    <div class="stat-value" id="statsTransfers">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total Bets</div>
                    <div class="stat-value" id="statsBets">0</div>
                </div>
            </div>
        `;
        return statsPanel;
    }
    /**
     * Populate accounts list in header
     */
    static populateAccountsList(accounts: Account[]): void {
        const accountsList = document.getElementById('accountsList');
        if (!accountsList) return;
        
        accountsList.innerHTML = accounts.map(account => `
            <div class="account-item" data-account="${account.name}">
                <div class="account-name">${account.name}</div>
                <div class="account-balance">${account.balance} BB</div>
            </div>
        `).join('');
    }

    /**
     * Populate transfer selects
     */
    static populateTransferSelects(accounts: Account[]): void {
        const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
        const toSelect = document.getElementById('transferTo') as HTMLSelectElement;
        
        if (!fromSelect || !toSelect) return;
        
        const accountOptions = accounts.map(account => 
            `<option value="${account.name}">${account.name} (${account.balance} BB)</option>`
        ).join('');
        
        fromSelect.innerHTML = '<option value="">Select sender...</option>' + accountOptions;
        toSelect.innerHTML = '<option value="">Select recipient...</option>' + 
            accounts.map(account => `<option value="${account.name}">${account.name}</option>`).join('');
    }

    /**
     * Update selected account display
     */
    static updateSelectedAccount(account: Account | null): void {
        const nameEl = document.getElementById('selectedAccountName');
        const addressEl = document.getElementById('selectedAddress');
        const balanceEl = document.getElementById('selectedBalance');
        
        if (!account) {
            if (nameEl) nameEl.textContent = 'Select Account';
            if (addressEl) addressEl.textContent = '--';
            if (balanceEl) balanceEl.textContent = '0 BB';
            return;
        }
        
        if (nameEl) nameEl.textContent = account.name;
        if (addressEl) addressEl.textContent = account.address;
        if (balanceEl) balanceEl.textContent = `${account.balance} BB`;
    }

    /**
     * Update prices display
     */
    static updatePrices(btc: number, sol: number): void {
        const btcEl = document.getElementById('btcPrice');
        const solEl = document.getElementById('solPrice');
        
        if (btcEl) btcEl.textContent = `$${btc.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        if (solEl) solEl.textContent = `$${sol.toFixed(2)}`;
    }
}
