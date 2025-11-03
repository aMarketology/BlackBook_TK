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
        
        // Add price action page (hidden by default)
        const priceActionContainer = document.createElement('div');
        priceActionContainer.id = 'priceActionContainer';
        priceActionContainer.appendChild(this.buildPriceActionPage());
        priceActionContainer.classList.add('hidden');
        container.appendChild(priceActionContainer);
        
        // Add receipts page (hidden by default)
        const receiptsContainer = document.createElement('div');
        receiptsContainer.id = 'receiptsContainer';
        receiptsContainer.appendChild(this.buildReceiptsPage());
        receiptsContainer.classList.add('hidden');
        container.appendChild(receiptsContainer);
        
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

        // Home button (hidden for now)
        // const homeNavBtn = document.createElement('button');
        // homeNavBtn.className = 'badge badge-button';
        // homeNavBtn.id = 'homeNavBtn';
        // homeNavBtn.textContent = '🏠 Home';
        // networkInfo.appendChild(homeNavBtn);
        
        // Transfers button
        const transfersBtn = document.createElement('button');
        transfersBtn.className = 'badge badge-button';
        transfersBtn.id = 'transfersBtn';
        transfersBtn.textContent = '🔄 Transfers';
        networkInfo.appendChild(transfersBtn);
        
        // Price Action button
        const priceActionBtn = document.createElement('button');
        priceActionBtn.className = 'badge badge-button';
        priceActionBtn.id = 'priceActionBtn';
        priceActionBtn.textContent = '⚡ Price Action';
        networkInfo.appendChild(priceActionBtn);
        
        // Receipts button
        const receiptsBtn = document.createElement('button');
        receiptsBtn.className = 'badge badge-button';
        receiptsBtn.id = 'receiptsBtn';
        receiptsBtn.textContent = '📜 Receipts';
        networkInfo.appendChild(receiptsBtn);
        
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
            <h2>✅ Active BlackBook Events</h2>
            <div id="blackbookEvents" class="markets-grid">
                <p class="loading">Loading events...</p>
            </div>
            
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
            <h2>� Token Management</h2>
            <p class="page-subtitle">Transfer tokens, manage balances, and view blockchain activity</p>
        `;
        page.appendChild(pageHeader);
        
        // Tab navigation
        const tabNav = document.createElement('div');
        tabNav.className = 'tab-nav';
        tabNav.innerHTML = `
            <button class="tab-btn active" id="transferTab">
                <span class="tab-icon">🔄</span>
                <span class="tab-label">Transfers</span>
            </button>
            <button class="tab-btn" id="adminTab">
                <span class="tab-icon">🔐</span>
                <span class="tab-label">Admin Panel</span>
            </button>
            <button class="tab-btn" id="quickActionsTab">
                <span class="tab-icon">⚡</span>
                <span class="tab-label">Quick Actions</span>
            </button>
        `;
        page.appendChild(tabNav);
        
        // Page content
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        
        // Transfer Tab Content
        const transferTabContent = document.createElement('div');
        transferTabContent.id = 'transferTabContent';
        transferTabContent.className = 'tab-content active';
        transferTabContent.innerHTML = `
            <div class="transfer-container">
                <!-- Transfer Form Card -->
                <div class="transfer-card">
                    <div class="card-header">
                        <h3>💸 Transfer Tokens</h3>
                        <span class="card-badge">Standard Transfer</span>
                    </div>
                    
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
                <div class="quick-amount-actions">
                    <h4>⚡ Quick Amounts</h4>
                    <div class="quick-btn-grid">
                        <button class="quick-btn" id="quickTransfer50">50 BB</button>
                        <button class="quick-btn" id="quickTransfer100">100 BB</button>
                        <button class="quick-btn" id="quickTransfer500">500 BB</button>
                    </div>
                </div>
            </div>
        `;
        pageContent.appendChild(transferTabContent);
        
        // Admin Tab Content
        const adminTabContent = document.createElement('div');
        adminTabContent.id = 'adminTabContent';
        adminTabContent.className = 'tab-content';
        adminTabContent.innerHTML = `
            <div class="admin-container">
                <!-- Mint Tokens Card -->
                <div class="admin-card">
                    <div class="card-header">
                        <h3>🪙 Mint Tokens</h3>
                        <span class="card-badge admin-badge">Admin Only</span>
                    </div>
                    <p class="card-description">Create new tokens and add them to an account</p>
                    
                    <div class="form-group">
                        <label for="mintAccount">
                            <span class="label-text">Account:</span>
                            <span class="required">*</span>
                        </label>
                        <select id="mintAccount" class="form-input">
                            <option value="">Select account...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="mintAmount">
                            <span class="label-text">Amount to Mint (BB):</span>
                            <span class="required">*</span>
                        </label>
                        <input type="number" id="mintAmount" class="form-input" 
                            placeholder="Enter amount to mint" min="1" step="1" value="">
                        <div class="hint-text">Tokens will be added to the account's current balance</div>
                    </div>
                    
                    <div class="admin-message" id="mintMessage"></div>
                    
                    <button class="btn btn-admin btn-large" id="mintTokensBtn">
                        <span class="btn-icon">🪙</span>
                        <span class="btn-text">Mint Tokens</span>
                    </button>
                </div>
                
                <!-- Set Balance Card -->
                <div class="admin-card">
                    <div class="card-header">
                        <h3>⚖️ Set Balance</h3>
                        <span class="card-badge admin-badge">Admin Only</span>
                    </div>
                    <p class="card-description">Set an account's balance to a specific value</p>
                    
                    <div class="form-group">
                        <label for="setBalanceAccount">
                            <span class="label-text">Account:</span>
                            <span class="required">*</span>
                        </label>
                        <select id="setBalanceAccount" class="form-input">
                            <option value="">Select account...</option>
                        </select>
                        <div class="balance-display">
                            <span class="balance-label">Current Balance:</span>
                            <span class="balance-value"><span id="currentBalance">0</span> BB</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="newBalance">
                            <span class="label-text">New Balance (BB):</span>
                            <span class="required">*</span>
                        </label>
                        <input type="number" id="newBalance" class="form-input" 
                            placeholder="Enter new balance" min="0" step="1" value="">
                        <div class="hint-text">⚠️ This will replace the current balance</div>
                    </div>
                    
                    <div class="admin-message" id="setBalanceMessage"></div>
                    
                    <button class="btn btn-admin btn-large" id="setBalanceBtn">
                        <span class="btn-icon">⚖️</span>
                        <span class="btn-text">Set Balance</span>
                    </button>
                </div>
            </div>
        `;
        pageContent.appendChild(adminTabContent);
        
        // Quick Actions Tab Content
        const quickActionsTabContent = document.createElement('div');
        quickActionsTabContent.id = 'quickActionsTabContent';
        quickActionsTabContent.className = 'tab-content';
        quickActionsTabContent.innerHTML = `
            <div class="quick-actions-container">
                <div class="quick-actions-header">
                    <h3>⚡ Quick Actions</h3>
                    <p>Execute common blockchain operations quickly</p>
                </div>
                
                <div class="quick-actions-grid">
                    <!-- Get User Bets -->
                    <div class="action-card">
                        <div class="action-icon">👥</div>
                        <h4>Get User Bets</h4>
                        <p>View all bets for a specific user</p>
                        <select id="userBetsAccount" class="form-input">
                            <option value="">Select account...</option>
                        </select>
                        <button class="btn btn-secondary" id="getUserBetsBtn">
                            <span class="btn-icon">👥</span>
                            <span class="btn-text">Get Bets</span>
                        </button>
                    </div>
                    
                    <!-- Get All Markets -->
                    <div class="action-card">
                        <div class="action-icon">📊</div>
                        <h4>Get All Markets</h4>
                        <p>View all prediction markets</p>
                        <button class="btn btn-secondary" id="getAllMarketsBtn">
                            <span class="btn-icon">📊</span>
                            <span class="btn-text">Get Markets</span>
                        </button>
                    </div>
                    
                    <!-- Quick Mint -->
                    <div class="action-card">
                        <div class="action-icon">🪙</div>
                        <h4>Quick Mint</h4>
                        <p>Mint tokens instantly</p>
                        <select id="quickMintAccount" class="form-input">
                            <option value="">Select account...</option>
                        </select>
                        <input type="number" id="quickMintAmount" class="form-input" 
                            placeholder="Amount" min="1" value="100">
                        <button class="btn btn-admin" id="quickMintBtn">
                            <span class="btn-icon">🪙</span>
                            <span class="btn-text">Quick Mint</span>
                        </button>
                    </div>
                    
                    <!-- Quick Set Balance -->
                    <div class="action-card">
                        <div class="action-icon">⚖️</div>
                        <h4>Quick Balance</h4>
                        <p>Set balance instantly</p>
                        <select id="quickBalanceAccount" class="form-input">
                            <option value="">Select account...</option>
                        </select>
                        <input type="number" id="quickBalanceAmount" class="form-input" 
                            placeholder="New balance" min="0" value="1000">
                        <button class="btn btn-admin" id="quickBalanceBtn">
                            <span class="btn-icon">⚖️</span>
                            <span class="btn-text">Set Balance</span>
                        </button>
                    </div>
                </div>
                
                <!-- Results Display -->
                <div class="results-container" id="quickActionsResults" style="display: none;">
                    <div class="results-header">
                        <h4 id="resultsTitle">Results</h4>
                        <button class="btn-close" id="closeResults">×</button>
                    </div>
                    <div class="results-content" id="resultsContent"></div>
                </div>
            </div>
        `;
        pageContent.appendChild(quickActionsTabContent);
        
        // Add stats panel
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
     * Build price action page
     */
    static buildPriceActionPage(): HTMLElement {
        const page = document.createElement('div');
        page.id = 'priceActionPage';
        page.className = 'page';
        
        // Page header with account selector
        const pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        
        const headerContent = document.createElement('div');
        headerContent.className = 'header-content';
        headerContent.style.display = 'flex';
        headerContent.style.justifyContent = 'space-between';
        headerContent.style.alignItems = 'center';
        headerContent.style.width = '100%';
        
        // Left side - back button and title
        const headerLeft = document.createElement('div');
        headerLeft.style.display = 'flex';
        headerLeft.style.alignItems = 'center';
        headerLeft.style.gap = '15px';
        headerLeft.innerHTML = `
            <button class="back-btn" id="backFromPriceActionBtn">← Back</button>
            <h2>⚡ Price Action</h2>
        `;
        
        // Right side - account selector
        const headerRight = document.createElement('div');
        headerRight.className = 'header-right';
        
        const accountsSelector = document.createElement('div');
        accountsSelector.className = 'accounts-selector';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'accountsTogglePriceAction';
        toggleBtn.className = 'accounts-toggle';
        toggleBtn.innerHTML = `
            <span id="selectedAccountNamePriceAction">Select Account</span>
            <span class="dropdown-arrow">▼</span>
        `;
        
        const dropdown = document.createElement('div');
        dropdown.id = 'accountsDropdownPriceAction';
        dropdown.className = 'accounts-dropdown hidden';
        
        const accountsList = document.createElement('div');
        accountsList.id = 'accountsListPriceAction';
        accountsList.className = 'accounts-list';
        accountsList.innerHTML = '<p class="loading">Loading accounts...</p>';
        
        dropdown.appendChild(accountsList);
        accountsSelector.appendChild(toggleBtn);
        accountsSelector.appendChild(dropdown);
        headerRight.appendChild(accountsSelector);
        
        headerContent.appendChild(headerLeft);
        headerContent.appendChild(headerRight);
        pageHeader.appendChild(headerContent);
        page.appendChild(pageHeader);
        
        // Page content
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        pageContent.innerHTML = `
            <div class="price-action-grid">
                <!-- Live Prices Row - CLICKABLE CARDS -->
                <div class="price-row">
                    <div class="price-card btc selectable-card active-asset" id="selectBtcCard" data-asset="BTC">
                        <div class="coin-info">
                            <span class="coin-icon">₿</span>
                            <div>
                                <div class="coin-name">BITCOIN</div>
                                <div class="coin-price" id="btcPriceAction">$0.00</div>
                            </div>
                        </div>
                        <div class="price-change" id="btcChange">+0.00%</div>
                    </div>
                    
                    <div class="price-card sol selectable-card" id="selectSolCard" data-asset="SOL">
                        <div class="coin-info">
                            <span class="coin-icon">◎</span>
                            <div>
                                <div class="coin-name">SOLANA</div>
                                <div class="coin-price" id="solPriceAction">$0.00</div>
                            </div>
                        </div>
                        <div class="price-change" id="solChange">+0.00%</div>
                    </div>
                </div>

                <!-- Betting Panel -->
                <div class="compact-bet-panel">
                    <div class="panel-title">
                        <span>🎯</span>
                        <h3>Place Bet</h3>
                    </div>
                    
                    <div class="bet-form-compact">
                        <div class="bet-options-row">
                            <div class="option-group">
                                <span class="option-label">Time:</span>
                                <div class="btn-group">
                                    <button class="option-btn active" id="timeframe1min" data-time="60">1m</button>
                                    <button class="option-btn" id="timeframe15min" data-time="900">15m</button>
                                </div>
                            </div>
                            
                            <div class="option-group">
                                <span class="option-label">Direction:</span>
                                <div class="btn-group">
                                    <button class="option-btn direction-up" id="predictHigher" data-direction="HIGHER">📈</button>
                                    <button class="option-btn direction-down" id="predictLower" data-direction="LOWER">📉</button>
                                </div>
                            </div>
                            
                            <div class="option-group">
                                <span class="option-label">Amount:</span>
                                <input type="number" id="betAmount" class="amount-input" 
                                    placeholder="BB" min="1" step="1" value="10">
                            </div>
                            
                            <button class="bet-submit-btn" id="placePriceActionBet">
                                🎲 Bet
                            </button>
                        </div>
                        
                        <div class="balance-hint">
                            Balance: <span id="availableBalance">0 BB</span>
                        </div>
                    </div>
                </div>

                <!-- Active Bets & History -->
                <div class="bets-panels-row">
                    <div class="panel-half">
                        <h3>📊 Active Bets</h3>
                        <div id="activeBetsList" class="compact-bets-list">
                            <p class="empty-state">No active bets</p>
                        </div>
                    </div>
                    
                    <div class="panel-half">
                        <h3>📜 History</h3>
                        <div id="betHistory" class="compact-bets-list">
                            <p class="empty-state">No history</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        page.appendChild(pageContent);
        return page;
    }

    /**
     * Build receipts page
     */
    static buildReceiptsPage(): HTMLElement {
        const page = document.createElement('div');
        page.id = 'receiptsPage';
        page.className = 'page';
        
        // Page header
        const pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        pageHeader.innerHTML = `
            <button class="back-btn" id="backFromReceiptsBtn">← Back to Markets</button>
            <h2>📜 Transaction Receipts</h2>
            <p class="page-subtitle">Complete history of all platform transactions</p>
        `;
        page.appendChild(pageHeader);
        
        // Page content
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        pageContent.innerHTML = `
            <div class="receipts-container">
                <!-- Top Row: Filters + Stats -->
                <div class="receipts-top-row">
                    <!-- Filters Panel -->
                    <div class="receipts-filters">
                        <h3>🔍 Filters</h3>
                        
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="filterAccount">Account:</label>
                                <select id="filterAccount" class="filter-select">
                                    <option value="">All</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="filterType">Type:</label>
                                <select id="filterType" class="filter-select">
                                    <option value="">All</option>
                                    <option value="bet_placed">Bet</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="deposit">Deposit</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="searchAmount">Min (BB):</label>
                                <input type="number" id="searchAmount" class="filter-input" placeholder="0" min="0" step="1">
                            </div>
                            
                            <button class="filter-btn" id="applyFiltersBtn">Apply</button>
                            <button class="reset-btn" id="resetFiltersBtn">Reset</button>
                        </div>
                    </div>

                    <!-- Stats Summary -->
                    <div class="receipts-stats">
                        <div class="stat-card">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-label">Total</div>
                                <div class="stat-value" id="totalRecipes">0</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <div class="stat-label">Volume</div>
                                <div class="stat-value" id="totalVolume">0 BB</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-content">
                                <div class="stat-label">Bets</div>
                                <div class="stat-value" id="totalBets">0</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">🔄</div>
                            <div class="stat-content">
                                <div class="stat-label">Transfers</div>
                                <div class="stat-value" id="totalTransfers">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transactions List -->
                <div class="receipts-list-panel">
                    <div class="panel-header">
                        <h3>📋 Transaction History</h3>
                        <div class="results-count">
                            Showing <span id="visibleCount">0</span> of <span id="totalCount">0</span> transactions
                        </div>
                    </div>
                    
                    <div id="receiptsList" class="receipts-list">
                        <p class="loading">Loading transactions...</p>
                    </div>
                </div>
            </div>
        `;        
        page.appendChild(pageContent);
        return page;
    }

    /**
     * Populate accounts list in header
     */
    static populateAccountsList(accounts: Account[]): void {
        const accountsList = document.getElementById('accountsList');
        const accountsListPriceAction = document.getElementById('accountsListPriceAction');
        
        if (!accountsList) {
            console.log('❌ accountsList element not found');
            return;
        }
        
        console.log(`📋 populateAccountsList called with ${accounts.length} accounts`, accounts);
        
        if (accounts.length === 0) {
            console.log('⚠️ No accounts to populate');
            accountsList.innerHTML = '<p class="empty-state">No accounts available</p>';
            if (accountsListPriceAction) {
                accountsListPriceAction.innerHTML = '<p class="empty-state">No accounts available</p>';
            }
            return;
        }
        
        const html = accounts.map(account => `
            <div class="account-item" data-account="${account.name}">
                <div class="account-name">${account.name}</div>
                <div class="account-balance">${account.balance} BB</div>
            </div>
        `).join('');
        
        console.log('✅ Setting accountsList innerHTML with', accounts.length, 'accounts');
        accountsList.innerHTML = html;
        
        // Also populate Price Action account selector
        if (accountsListPriceAction) {
            accountsListPriceAction.innerHTML = html;
            console.log('✅ Also populated Price Action accounts list');
        }
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
        // Update header prices
        const btcEl = document.getElementById('btcPrice');
        const solEl = document.getElementById('solPrice');
        
        if (btcEl) btcEl.textContent = `$${btc.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        if (solEl) solEl.textContent = `$${sol.toFixed(2)}`;

        // Update Price Action page prices
        const btcPriceActionEl = document.getElementById('btcPriceAction');
        const solPriceActionEl = document.getElementById('solPriceAction');

        if (btcPriceActionEl) {
            btcPriceActionEl.textContent = `$${btc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        if (solPriceActionEl) {
            solPriceActionEl.textContent = `$${sol.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }
}
