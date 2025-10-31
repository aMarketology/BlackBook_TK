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
        
        // Add footer with debug console
        container.appendChild(this.buildFooter());
        
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
        title.textContent = '🎯 BlackBook L1 Prediction Market';
        headerLeft.appendChild(title);
        
        const networkInfo = document.createElement('div');
        networkInfo.className = 'network-info';
        networkInfo.innerHTML = `
            <span class="badge">🔗 Layer 1 Blockchain</span>
            <span class="badge">💎 BB Token</span>
            <span class="badge">📊 8 Accounts</span>
            <button class="badge badge-button" id="transfersBtn">🔄 Transfers</button>
        `;
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
        page.className = 'page';
        
        // Page header
        const pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        pageHeader.innerHTML = `
            <button class="back-btn" id="backBtn">← Back to Markets</button>
            <h2>🔄 Transfer Tokens</h2>
        `;
        page.appendChild(pageHeader);
        
        // Page content
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        
        const transferForm = document.createElement('div');
        transferForm.className = 'transfer-form';
        transferForm.innerHTML = `
            <div class="form-group">
                <label for="transferFrom">From Account:</label>
                <select id="transferFrom" class="form-input">
                    <option value="">Select sender...</option>
                </select>
                <div class="balance-info">
                    <span>Balance: <span id="fromBalance">0</span> BB</span>
                </div>
            </div>
            <div class="form-group">
                <label for="transferTo">To Account:</label>
                <select id="transferTo" class="form-input">
                    <option value="">Select recipient...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="transferAmount">Amount (BB):</label>
                <input type="number" id="transferAmount" class="form-input" placeholder="Enter amount" min="0" step="1">
            </div>
            <button class="btn btn-primary" id="sendTransferBtn">Send Transfer</button>
        `;
        
        pageContent.appendChild(transferForm);
        page.appendChild(pageContent);
        
        return page;
    }

    /**
     * Build footer with debug console
     */
    static buildFooter(): HTMLElement {
        const footer = document.createElement('footer');
        footer.className = 'footer';
        
        const debugConsole = document.createElement('div');
        debugConsole.id = 'debugConsole';
        debugConsole.className = 'debug-console';
        debugConsole.innerHTML = '<div class="console-header">🐛 Debug Console</div>';
        
        footer.appendChild(debugConsole);
        
        return footer;
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
