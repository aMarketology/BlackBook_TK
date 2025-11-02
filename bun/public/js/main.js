// node_modules/@tauri-apps/api/tauri.js
function uid() {
  return window.crypto.getRandomValues(new Uint32Array(1))[0];
}
function transformCallback(callback, once = false) {
  const identifier = uid();
  const prop = `_${identifier}`;
  Object.defineProperty(window, prop, {
    value: (result) => {
      if (once) {
        Reflect.deleteProperty(window, prop);
      }
      return callback === null || callback === undefined ? undefined : callback(result);
    },
    writable: false,
    configurable: true
  });
  return identifier;
}
async function invoke(cmd, args = {}) {
  return new Promise((resolve, reject) => {
    const callback = transformCallback((e) => {
      resolve(e);
      Reflect.deleteProperty(window, `_${error}`);
    }, true);
    const error = transformCallback((e) => {
      reject(e);
      Reflect.deleteProperty(window, `_${callback}`);
    }, true);
    window.__TAURI_IPC__({
      cmd,
      callback,
      error,
      ...args
    });
  });
}

// src/lib/backend_service.ts
class BackendService {
  static async getAllAccounts() {
    try {
      return await invoke("get_accounts");
    } catch (error) {
      console.error("❌ Failed to get accounts:", error);
      throw error;
    }
  }
  static async getBalance(address) {
    try {
      return await invoke("get_balance", { address });
    } catch (error) {
      console.error("❌ Failed to get balance:", error);
      throw error;
    }
  }
  static async deposit(address, amount) {
    try {
      return await invoke("admin_deposit", {
        req: { address, amount }
      });
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      throw error;
    }
  }
  static async transfer(from, to, amount) {
    try {
      return await invoke("transfer", {
        req: { from, to, amount }
      });
    } catch (error) {
      console.error("❌ Transfer failed:", error);
      throw error;
    }
  }
  static async getAccountTransactions(address) {
    try {
      return await invoke("get_account_transactions", { address });
    } catch (error) {
      console.error("❌ Failed to get transactions:", error);
      throw error;
    }
  }
  static async getAllTransactions() {
    try {
      return await invoke("get_all_transactions");
    } catch (error) {
      console.error("❌ Failed to get all transactions:", error);
      throw error;
    }
  }
  static async getRecipes() {
    try {
      return await invoke("get_recipes");
    } catch (error) {
      console.error("❌ Failed to get recipes:", error);
      throw error;
    }
  }
  static async getLedgerStats() {
    try {
      return await invoke("get_stats");
    } catch (error) {
      console.error("❌ Failed to get stats:", error);
      throw error;
    }
  }
  static async getMarkets() {
    try {
      return await invoke("get_markets");
    } catch (error) {
      console.error("❌ Failed to get markets:", error);
      throw error;
    }
  }
  static async getMarket(marketId) {
    try {
      return await invoke("get_market", { marketId });
    } catch (error) {
      console.error("❌ Failed to get market:", error);
      throw error;
    }
  }
  static async placeBet(marketId, account, amount, prediction) {
    try {
      console.log("\uD83D\uDD27 BackendService.placeBet called with:", { marketId, account, amount, prediction });
      const payload = {
        req: {
          market_id: marketId,
          account,
          amount,
          prediction
        }
      };
      console.log("\uD83D\uDCE4 Sending to Tauri IPC:", JSON.stringify(payload));
      const result = await invoke("place_bet", payload);
      console.log("\uD83D\uDCE5 Received from Tauri IPC:", result);
      return result;
    } catch (error) {
      console.error("❌ Bet placement failed in BackendService:", error);
      throw error;
    }
  }
  static async resolveMarket(marketId, winningOption) {
    try {
      return await invoke("resolve_market", {
        req: { marketId, winningOption }
      });
    } catch (error) {
      console.error("❌ Market resolution failed:", error);
      throw error;
    }
  }
  static async recordBetWin(account, amount, betId) {
    try {
      await invoke("record_bet_win", { account, amount, betId });
    } catch (error) {
      console.error("❌ Record bet win failed:", error);
      throw error;
    }
  }
  static async recordBetLoss(account, amount, betId) {
    try {
      await invoke("record_bet_loss", { account, amount, betId });
    } catch (error) {
      console.error("❌ Record bet loss failed:", error);
      throw error;
    }
  }
  static async getPrices() {
    try {
      return await invoke("get_prices");
    } catch (error) {
      console.error("❌ Price fetch failed:", error);
      throw error;
    }
  }
  static async getPolymarketEvents() {
    try {
      return await invoke("get_polymarket_events");
    } catch (error) {
      console.error("❌ Polymarket fetch failed:", error);
      throw error;
    }
  }
  static async getBlackbookEvents() {
    try {
      return await invoke("get_blackbook_events");
    } catch (error) {
      console.error("❌ BlackBook events fetch failed:", error);
      throw error;
    }
  }
  static async adminMintTokens(account, amount) {
    try {
      console.log(`\uD83D\uDD10 Admin: Minting ${amount} BB to ${account}`);
      const result = await invoke("admin_mint_tokens", { account, amount });
      console.log(`✅ ${result}`);
      return result;
    } catch (error) {
      console.error("❌ Admin mint failed:", error);
      throw error;
    }
  }
  static async adminSetBalance(account, newBalance) {
    try {
      console.log(`\uD83D\uDD10 Admin: Setting ${account} balance to ${newBalance} BB`);
      const result = await invoke("admin_set_balance", { account, newBalance });
      console.log(`✅ ${result}`);
      return result;
    } catch (error) {
      console.error("❌ Admin set balance failed:", error);
      throw error;
    }
  }
  static async getUserBets(account) {
    try {
      console.log(`\uD83D\uDCCA Fetching bets for ${account}...`);
      return await invoke("get_user_bets", { account });
    } catch (error) {
      console.error("❌ Failed to get user bets:", error);
      throw error;
    }
  }
  static async getAllMarkets() {
    try {
      console.log("\uD83D\uDCCA Fetching all markets...");
      return await invoke("get_all_markets");
    } catch (error) {
      console.error("❌ Failed to get all markets:", error);
      throw error;
    }
  }
}

// src/lib/debug_console.ts
class DebugConsole {
  messages = [];
  maxMessages = 100;
  consoleElement = null;
  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.initializeDOM());
    } else {
      this.initializeDOM();
    }
  }
  initializeDOM() {
    this.buildFooter();
    this.consoleElement = document.getElementById("debugConsole");
    this.setupClearButton();
  }
  buildFooter() {
    let footer = document.querySelector("footer");
    if (!footer) {
      footer = document.createElement("footer");
      footer.className = "footer";
      document.body.appendChild(footer);
    }
    footer.innerHTML = "";
    const debugContainer = document.createElement("div");
    debugContainer.className = "debug-container";
    const debugHeader = document.createElement("div");
    debugHeader.className = "debug-header";
    const headerTitle = document.createElement("div");
    headerTitle.textContent = "\uD83D\uDC1B Debug Console";
    headerTitle.style.flex = "1";
    const clearButton = document.createElement("button");
    clearButton.id = "clearLogsBtn";
    clearButton.className = "clear-logs-btn";
    clearButton.textContent = "\uD83D\uDDD1️ Clear";
    clearButton.title = "Clear debug logs";
    debugHeader.appendChild(headerTitle);
    debugHeader.appendChild(clearButton);
    const debugConsole = document.createElement("div");
    debugConsole.id = "debugConsole";
    debugConsole.className = "debug-console";
    debugContainer.appendChild(debugHeader);
    debugContainer.appendChild(debugConsole);
    footer.appendChild(debugContainer);
  }
  setupClearButton() {
    const clearBtn = document.getElementById("clearLogsBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearWithWelcome());
    }
  }
  log(message, level = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = {
      timestamp,
      level,
      message
    };
    this.messages.push(logMsg);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    this.render();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
  logBlockchainConnection(connected) {
    if (connected) {
      this.log("✅ Blockchain Connection: YES", "success");
    } else {
      this.log("❌ Blockchain Connection: NO", "error");
    }
  }
  logAccountsLoaded(loaded, count, accountNames = []) {
    if (loaded && count === 8) {
      this.log(`✅ 8 Accounts Loaded: YES (${accountNames.join(", ")})`, "success");
    } else if (count > 0) {
      this.log(`⚠️ 8 Accounts Loaded: PARTIAL (${count}/8) - ${accountNames.join(", ")}`, "warning");
    } else {
      this.log("❌ 8 Accounts Loaded: NO", "error");
    }
  }
  clear() {
    this.messages = [];
    this.render();
  }
  clearWithWelcome() {
    this.messages = [];
    this.log("\uD83C\uDFAF Welcome to the BlackBook", "success");
  }
  render() {
    if (!this.consoleElement)
      return;
    this.consoleElement.innerHTML = this.messages.map((msg) => this.formatMessage(msg)).join("");
    this.consoleElement.scrollTop = this.consoleElement.scrollHeight;
  }
  formatMessage(msg) {
    const levelClass = `console-${msg.level}`;
    return `
            <div class="console-message ${levelClass}">
                <span class="console-time">[${msg.timestamp}]</span>
                <span class="console-level">${msg.level.toUpperCase()}</span>
                <span class="console-text">${this.escapeHtml(msg.message)}</span>
            </div>
        `;
  }
  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
  getMessages() {
    return [...this.messages];
  }
  exportLogs() {
    return JSON.stringify(this.messages, null, 2);
  }
  exportLogsCSV() {
    const headers = ["Timestamp", "Level", "Message"].join(",");
    const rows = this.messages.map((msg) => [msg.timestamp, msg.level.toUpperCase(), `"${msg.message}"`].join(",")).join(`
`);
    return `${headers}
${rows}`;
  }
}
var debugConsole = new DebugConsole;

// src/lib/polymarket.ts
function formatVolume(volume) {
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

// src/lib/ui_builder.ts
class UIBuilder {
  static buildApp() {
    const container = document.createElement("div");
    container.className = "app-container";
    container.appendChild(this.buildHeader());
    const mainContainer = document.createElement("div");
    mainContainer.id = "mainContainer";
    mainContainer.appendChild(this.buildMainContent());
    container.appendChild(mainContainer);
    const transfersContainer = document.createElement("div");
    transfersContainer.id = "transfersContainer";
    transfersContainer.appendChild(this.buildTransfersPage());
    transfersContainer.classList.add("hidden");
    container.appendChild(transfersContainer);
    const priceActionContainer = document.createElement("div");
    priceActionContainer.id = "priceActionContainer";
    priceActionContainer.appendChild(this.buildPriceActionPage());
    priceActionContainer.classList.add("hidden");
    container.appendChild(priceActionContainer);
    const receiptsContainer = document.createElement("div");
    receiptsContainer.id = "receiptsContainer";
    receiptsContainer.appendChild(this.buildReceiptsPage());
    receiptsContainer.classList.add("hidden");
    container.appendChild(receiptsContainer);
    return container;
  }
  static buildHeader() {
    const header = document.createElement("header");
    header.className = "header";
    const headerContent = document.createElement("div");
    headerContent.className = "header-content";
    const headerLeft = document.createElement("div");
    headerLeft.className = "header-left";
    const title = document.createElement("h1");
    title.id = "homeBtn";
    title.textContent = "\uD83C\uDFAF BlackBook L1 Prediction Market";
    title.style.cursor = "pointer";
    title.title = "Click to return to home";
    headerLeft.appendChild(title);
    const networkInfo = document.createElement("div");
    networkInfo.className = "network-info";
    const blockchainBadge = document.createElement("button");
    blockchainBadge.className = "badge badge-button";
    blockchainBadge.id = "blockchainBtn";
    blockchainBadge.textContent = "\uD83D\uDD17 Layer 1 Blockchain";
    blockchainBadge.title = "Click to return to home";
    blockchainBadge.style.background = "none";
    blockchainBadge.style.border = "none";
    blockchainBadge.style.cursor = "pointer";
    blockchainBadge.style.padding = "0";
    networkInfo.appendChild(blockchainBadge);
    const tokenBadge = document.createElement("span");
    tokenBadge.className = "badge";
    tokenBadge.textContent = "\uD83D\uDC8E BB Token";
    networkInfo.appendChild(tokenBadge);
    const transfersBtn = document.createElement("button");
    transfersBtn.className = "badge badge-button";
    transfersBtn.id = "transfersBtn";
    transfersBtn.textContent = "\uD83D\uDD04 Transfers";
    networkInfo.appendChild(transfersBtn);
    const priceActionBtn = document.createElement("button");
    priceActionBtn.className = "badge badge-button";
    priceActionBtn.id = "priceActionBtn";
    priceActionBtn.textContent = "⚡ Price Action";
    networkInfo.appendChild(priceActionBtn);
    const receiptsBtn = document.createElement("button");
    receiptsBtn.className = "badge badge-button";
    receiptsBtn.id = "receiptsBtn";
    receiptsBtn.textContent = "\uD83D\uDCDC Receipts";
    networkInfo.appendChild(receiptsBtn);
    headerLeft.appendChild(networkInfo);
    const headerRight = document.createElement("div");
    headerRight.className = "header-right";
    const accountsSelector = document.createElement("div");
    accountsSelector.className = "accounts-selector";
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "accountsToggle";
    toggleBtn.className = "accounts-toggle";
    toggleBtn.innerHTML = `
            <span id="selectedAccountName">Select Account</span>
            <span class="dropdown-arrow">▼</span>
        `;
    const dropdown = document.createElement("div");
    dropdown.id = "accountsDropdown";
    dropdown.className = "accounts-dropdown hidden";
    const accountsList = document.createElement("div");
    accountsList.id = "accountsList";
    accountsList.className = "accounts-list";
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
  static buildMainContent() {
    const mainContent = document.createElement("div");
    mainContent.className = "main-content";
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    const accountSection = document.createElement("div");
    accountSection.innerHTML = `
            <h2>\uD83D\uDC64 Selected Account</h2>
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
    const pricesSection = document.createElement("div");
    pricesSection.innerHTML = `
            <h2>\uD83D\uDCB0 Live Prices</h2>
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
                    <span class="label">\uD83D\uDC8E BlackBook (1BB)</span>
                    <span id="bbPrice" class="price">$0.01</span>
                </div>
            </div>
            <div class="exchange-info">
                <p>1,000 Blackbook tokens = 1 cent</p>
            </div>
        `;
    sidebar.appendChild(pricesSection);
    mainContent.appendChild(sidebar);
    const centerContent = document.createElement("main");
    centerContent.className = "center-content";
    centerContent.innerHTML = `
            <h2>✅ Active BlackBook Events</h2>
            <div id="blackbookEvents" class="markets-grid">
                <p class="loading">Loading events...</p>
            </div>
            
            <h2>\uD83D\uDCCA Active Markets</h2>
            <div id="marketsList" class="markets-grid">
                <p class="loading">Loading markets...</p>
            </div>
            
            <h2>\uD83D\uDD2E Polymarket Events</h2>
            <div id="polymarketEvents" class="markets-grid">
                <p class="loading">Loading Polymarket events...</p>
            </div>
        `;
    mainContent.appendChild(centerContent);
    return mainContent;
  }
  static buildTransfersPage() {
    const page = document.createElement("div");
    page.id = "transfersPage";
    page.className = "page";
    const pageHeader = document.createElement("div");
    pageHeader.className = "page-header";
    pageHeader.innerHTML = `
            <button class="back-btn" id="backBtn">← Back to Markets</button>
            <h2>� Token Management</h2>
            <p class="page-subtitle">Transfer tokens, manage balances, and view blockchain activity</p>
        `;
    page.appendChild(pageHeader);
    const tabNav = document.createElement("div");
    tabNav.className = "tab-nav";
    tabNav.innerHTML = `
            <button class="tab-btn active" id="transferTab">
                <span class="tab-icon">\uD83D\uDD04</span>
                <span class="tab-label">Transfers</span>
            </button>
            <button class="tab-btn" id="adminTab">
                <span class="tab-icon">\uD83D\uDD10</span>
                <span class="tab-label">Admin Panel</span>
            </button>
            <button class="tab-btn" id="quickActionsTab">
                <span class="tab-icon">⚡</span>
                <span class="tab-label">Quick Actions</span>
            </button>
        `;
    page.appendChild(tabNav);
    const pageContent = document.createElement("div");
    pageContent.className = "page-content";
    const transferTabContent = document.createElement("div");
    transferTabContent.id = "transferTabContent";
    transferTabContent.className = "tab-content active";
    transferTabContent.innerHTML = `
            <div class="transfer-container">
                <!-- Transfer Form Card -->
                <div class="transfer-card">
                    <div class="card-header">
                        <h3>\uD83D\uDCB8 Transfer Tokens</h3>
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
                        <span class="btn-icon">\uD83D\uDCE4</span>
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
    const adminTabContent = document.createElement("div");
    adminTabContent.id = "adminTabContent";
    adminTabContent.className = "tab-content";
    adminTabContent.innerHTML = `
            <div class="admin-container">
                <!-- Mint Tokens Card -->
                <div class="admin-card">
                    <div class="card-header">
                        <h3>\uD83E\uDE99 Mint Tokens</h3>
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
                        <span class="btn-icon">\uD83E\uDE99</span>
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
    const quickActionsTabContent = document.createElement("div");
    quickActionsTabContent.id = "quickActionsTabContent";
    quickActionsTabContent.className = "tab-content";
    quickActionsTabContent.innerHTML = `
            <div class="quick-actions-container">
                <div class="quick-actions-header">
                    <h3>⚡ Quick Actions</h3>
                    <p>Execute common blockchain operations quickly</p>
                </div>
                
                <div class="quick-actions-grid">
                    <!-- Get User Bets -->
                    <div class="action-card">
                        <div class="action-icon">\uD83D\uDC65</div>
                        <h4>Get User Bets</h4>
                        <p>View all bets for a specific user</p>
                        <select id="userBetsAccount" class="form-input">
                            <option value="">Select account...</option>
                        </select>
                        <button class="btn btn-secondary" id="getUserBetsBtn">
                            <span class="btn-icon">\uD83D\uDC65</span>
                            <span class="btn-text">Get Bets</span>
                        </button>
                    </div>
                    
                    <!-- Get All Markets -->
                    <div class="action-card">
                        <div class="action-icon">\uD83D\uDCCA</div>
                        <h4>Get All Markets</h4>
                        <p>View all prediction markets</p>
                        <button class="btn btn-secondary" id="getAllMarketsBtn">
                            <span class="btn-icon">\uD83D\uDCCA</span>
                            <span class="btn-text">Get Markets</span>
                        </button>
                    </div>
                    
                    <!-- Quick Mint -->
                    <div class="action-card">
                        <div class="action-icon">\uD83E\uDE99</div>
                        <h4>Quick Mint</h4>
                        <p>Mint tokens instantly</p>
                        <select id="quickMintAccount" class="form-input">
                            <option value="">Select account...</option>
                        </select>
                        <input type="number" id="quickMintAmount" class="form-input" 
                            placeholder="Amount" min="1" value="100">
                        <button class="btn btn-admin" id="quickMintBtn">
                            <span class="btn-icon">\uD83E\uDE99</span>
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
    pageContent.appendChild(this.createTransferStatsPanel());
    page.appendChild(pageContent);
    return page;
  }
  static createTransferStatsPanel() {
    const statsPanel = document.createElement("div");
    statsPanel.className = "transfer-stats-panel";
    statsPanel.innerHTML = `
            <h3>\uD83D\uDCCA Transfer Statistics</h3>
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
  static buildPriceActionPage() {
    const page = document.createElement("div");
    page.id = "priceActionPage";
    page.className = "page";
    const pageHeader = document.createElement("div");
    pageHeader.className = "page-header";
    pageHeader.innerHTML = `
            <button class="back-btn" id="backFromPriceActionBtn">← Back to Markets</button>
            <h2>⚡ Price Action Trading</h2>
            <p class="page-subtitle">Bet on Bitcoin & Solana price movements</p>
        `;
    page.appendChild(pageHeader);
    const pageContent = document.createElement("div");
    pageContent.className = "page-content";
    pageContent.innerHTML = `
            <div class="price-action-container">
                <!-- Live Prices Display -->
                <div class="price-cards">
                    <div class="price-card bitcoin-card">
                        <div class="coin-header">
                            <span class="coin-icon">₿</span>
                            <h3>Bitcoin</h3>
                        </div>
                        <div class="current-price">
                            <span class="price-label">Current Price</span>
                            <span class="price-value" id="btcPriceAction">$0.00</span>
                        </div>
                        <div class="price-change" id="btcChange">+0.00%</div>
                    </div>
                    
                    <div class="price-card solana-card">
                        <div class="coin-header">
                            <span class="coin-icon">◎</span>
                            <h3>Solana</h3>
                        </div>
                        <div class="current-price">
                            <span class="price-label">Current Price</span>
                            <span class="price-value" id="solPriceAction">$0.00</span>
                        </div>
                        <div class="price-change" id="solChange">+0.00%</div>
                    </div>
                </div>

                <!-- Betting Interface -->
                <div class="betting-panel">
                    <h3>\uD83C\uDFAF Place Your Bet</h3>
                    
                    <!-- Asset Selection -->
                    <div class="form-group">
                        <label>Select Asset:</label>
                        <div class="asset-buttons">
                            <button class="asset-btn active" id="selectBitcoin" data-asset="bitcoin">
                                ₿ Bitcoin
                            </button>
                            <button class="asset-btn" id="selectSolana" data-asset="solana">
                                ◎ Solana
                            </button>
                        </div>
                    </div>
                    
                    <!-- Timeframe Selection -->
                    <div class="form-group">
                        <label>Select Timeframe:</label>
                        <div class="timeframe-buttons">
                            <button class="timeframe-btn active" id="timeframe1min" data-time="60">
                                ⏱️ 1 Minute
                            </button>
                            <button class="timeframe-btn" id="timeframe15min" data-time="900">
                                ⏲️ 15 Minutes
                            </button>
                        </div>
                    </div>
                    
                    <!-- Direction Selection -->
                    <div class="form-group">
                        <label>Predict Price Direction:</label>
                        <div class="direction-buttons">
                            <button class="direction-btn higher-btn" id="predictHigher">
                                \uD83D\uDCC8 HIGHER
                            </button>
                            <button class="direction-btn lower-btn" id="predictLower">
                                \uD83D\uDCC9 LOWER
                            </button>
                        </div>
                    </div>
                    
                    <!-- Bet Amount -->
                    <div class="form-group">
                        <label for="betAmount">
                            <span class="label-text">Bet Amount (BB):</span>
                            <span class="required">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="betAmount" 
                            placeholder="Enter amount in BB tokens..." 
                            min="1"
                            step="1"
                        />
                        <div class="balance-hint">
                            Available: <span id="availableBalance">0 BB</span>
                        </div>
                    </div>
                    
                    <!-- Place Bet Button -->
                    <button class="place-bet-btn" id="placePriceActionBet">
                        \uD83C\uDFB2 Place Bet
                    </button>
                </div>

                <!-- Active Bets -->
                <div class="active-bets-panel">
                    <h3>\uD83D\uDCCA Your Active Bets</h3>
                    <div id="activeBetsList" class="bets-list">
                        <p class="empty-state">No active bets</p>
                    </div>
                </div>

                <!-- Bet History -->
                <div class="bet-history-panel">
                    <h3>\uD83D\uDCDC Recent Results</h3>
                    <div id="betHistory" class="history-list">
                        <p class="empty-state">No bet history</p>
                    </div>
                </div>
            </div>
        `;
    page.appendChild(pageContent);
    return page;
  }
  static buildReceiptsPage() {
    const page = document.createElement("div");
    page.id = "receiptsPage";
    page.className = "page";
    const pageHeader = document.createElement("div");
    pageHeader.className = "page-header";
    pageHeader.innerHTML = `
            <button class="back-btn" id="backFromReceiptsBtn">← Back to Markets</button>
            <h2>\uD83D\uDCDC Transaction Receipts</h2>
            <p class="page-subtitle">Complete history of all platform transactions</p>
        `;
    page.appendChild(pageHeader);
    const pageContent = document.createElement("div");
    pageContent.className = "page-content";
    pageContent.innerHTML = `
            <div class="receipts-container">
                <!-- Filters Panel -->
                <div class="receipts-filters">
                    <h3>\uD83D\uDD0D Filter Transactions</h3>
                    
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="filterAccount">Account:</label>
                            <select id="filterAccount" class="filter-select">
                                <option value="">All Accounts</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="filterType">Transaction Type:</label>
                            <select id="filterType" class="filter-select">
                                <option value="">All Types</option>
                                <option value="transfer">Transfer</option>
                                <option value="market_bet">Market Bet</option>
                                <option value="market_payout">Payout</option>
                                <option value="admin_deposit">Admin Deposit</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="searchAmount">Min Amount (BB):</label>
                            <input type="number" id="searchAmount" class="filter-input" placeholder="0" min="0" step="1">
                        </div>
                        
                        <button class="filter-btn" id="applyFiltersBtn">Apply Filters</button>
                        <button class="reset-btn" id="resetFiltersBtn">Reset</button>
                    </div>
                </div>

                <!-- Stats Summary -->
                <div class="receipts-stats">
                    <div class="stat-card">
                        <div class="stat-icon">\uD83D\uDCCA</div>
                        <div class="stat-content">
                            <div class="stat-label">Total Transactions</div>
                            <div class="stat-value" id="totalTransactions">0</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">\uD83D\uDCB0</div>
                        <div class="stat-content">
                            <div class="stat-label">Total Volume</div>
                            <div class="stat-value" id="totalVolume">0 BB</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">\uD83C\uDFAF</div>
                        <div class="stat-content">
                            <div class="stat-label">Market Bets</div>
                            <div class="stat-value" id="totalBets">0</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">\uD83D\uDD04</div>
                        <div class="stat-content">
                            <div class="stat-label">Transfers</div>
                            <div class="stat-value" id="totalTransfers">0</div>
                        </div>
                    </div>
                </div>

                <!-- Transactions List -->
                <div class="receipts-list-panel">
                    <div class="panel-header">
                        <h3>\uD83D\uDCCB Transaction History</h3>
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
  static populateAccountsList(accounts) {
    const accountsList = document.getElementById("accountsList");
    if (!accountsList) {
      console.log("❌ accountsList element not found");
      return;
    }
    console.log(`\uD83D\uDCCB populateAccountsList called with ${accounts.length} accounts`, accounts);
    if (accounts.length === 0) {
      console.log("⚠️ No accounts to populate");
      accountsList.innerHTML = '<p class="empty-state">No accounts available</p>';
      return;
    }
    const html = accounts.map((account) => `
            <div class="account-item" data-account="${account.name}">
                <div class="account-name">${account.name}</div>
                <div class="account-balance">${account.balance} BB</div>
            </div>
        `).join("");
    console.log("✅ Setting accountsList innerHTML with", accounts.length, "accounts");
    accountsList.innerHTML = html;
  }
  static populateTransferSelects(accounts) {
    const fromSelect = document.getElementById("transferFrom");
    const toSelect = document.getElementById("transferTo");
    if (!fromSelect || !toSelect)
      return;
    const accountOptions = accounts.map((account) => `<option value="${account.name}">${account.name} (${account.balance} BB)</option>`).join("");
    fromSelect.innerHTML = '<option value="">Select sender...</option>' + accountOptions;
    toSelect.innerHTML = '<option value="">Select recipient...</option>' + accounts.map((account) => `<option value="${account.name}">${account.name}</option>`).join("");
  }
  static updateSelectedAccount(account) {
    const nameEl = document.getElementById("selectedAccountName");
    const addressEl = document.getElementById("selectedAddress");
    const balanceEl = document.getElementById("selectedBalance");
    if (!account) {
      if (nameEl)
        nameEl.textContent = "Select Account";
      if (addressEl)
        addressEl.textContent = "--";
      if (balanceEl)
        balanceEl.textContent = "0 BB";
      return;
    }
    if (nameEl)
      nameEl.textContent = account.name;
    if (addressEl)
      addressEl.textContent = account.address;
    if (balanceEl)
      balanceEl.textContent = `${account.balance} BB`;
  }
  static updatePrices(btc, sol) {
    const btcEl = document.getElementById("btcPrice");
    const solEl = document.getElementById("solPrice");
    if (btcEl)
      btcEl.textContent = `$${btc.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    if (solEl)
      solEl.textContent = `$${sol.toFixed(2)}`;
    const btcPriceActionEl = document.getElementById("btcPriceAction");
    const solPriceActionEl = document.getElementById("solPriceAction");
    if (btcPriceActionEl) {
      btcPriceActionEl.textContent = `$${btc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (solPriceActionEl) {
      solPriceActionEl.textContent = `$${sol.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
}

// src/lib/transfers.ts
class TransfersModule {
  static accounts = [];
  static onTransferComplete = null;
  static setOnTransferComplete(callback) {
    this.onTransferComplete = callback;
  }
  static setAccounts(accounts) {
    this.accounts = accounts;
  }
  static getAccounts() {
    return this.accounts;
  }
  static populateTransferSelects() {
    const fromSelect = document.getElementById("transferFrom");
    const toSelect = document.getElementById("transferTo");
    if (!fromSelect || !toSelect)
      return;
    const options = this.accounts.map((account) => `<option value="${account.name}">${account.name} (${account.balance} BB)</option>`).join("");
    fromSelect.innerHTML = '<option value="">Select sender...</option>' + options;
    toSelect.innerHTML = '<option value="">Select recipient...</option>' + options;
  }
  static updateFromBalance() {
    const fromSelect = document.getElementById("transferFrom");
    const fromBalance = document.getElementById("fromBalance");
    const maxAvailable = document.getElementById("maxAvailable");
    if (!fromSelect || !fromBalance || !maxAvailable)
      return;
    const selectedAccountName = fromSelect.value;
    const selectedAccount = this.accounts.find((a) => a.name === selectedAccountName);
    if (selectedAccount) {
      fromBalance.textContent = selectedAccount.balance.toString();
      maxAvailable.textContent = selectedAccount.balance.toString();
      debugConsole.log(`Selected from account: ${selectedAccount.name} (${selectedAccount.balance} BB)`, "info");
    } else {
      fromBalance.textContent = "0";
      maxAvailable.textContent = "0";
    }
  }
  static setQuickTransferAmount(amount) {
    const amountInput = document.getElementById("transferAmount");
    if (amountInput) {
      amountInput.value = amount.toString();
      debugConsole.log(`Quick transfer amount set to ${amount} BB`, "info");
    }
  }
  static async refreshAccountBalances() {
    try {
      const updatedAccounts = await BackendService.getAllAccounts();
      this.accounts = updatedAccounts;
      this.populateTransferSelects();
      this.updateFromBalance();
      debugConsole.log("✅ Account balances refreshed", "success");
    } catch (error) {
      debugConsole.log(`⚠️ Failed to refresh balances: ${error}`, "warning");
    }
  }
  static showTransferMessage(message, type = "info") {
    const messageDiv = document.getElementById("transferMessage");
    if (!messageDiv)
      return;
    messageDiv.textContent = message;
    messageDiv.className = `transfer-message transfer-message-${type}`;
    messageDiv.style.display = "block";
    if (type === "success") {
      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 5000);
    }
  }
  static async executeTransfer() {
    try {
      const fromSelect = document.getElementById("transferFrom");
      const toSelect = document.getElementById("transferTo");
      const amountInput = document.getElementById("transferAmount");
      const btn = document.getElementById("sendTransferBtn");
      const fromAccount = fromSelect?.value;
      const toAccount = toSelect?.value;
      const amount = parseFloat(amountInput?.value || "0");
      if (!fromAccount || !toAccount || !amount || amount <= 0) {
        this.showTransferMessage("❌ Please fill in all transfer fields", "error");
        debugConsole.log("❌ Please fill in all transfer fields", "error");
        return;
      }
      if (fromAccount === toAccount) {
        this.showTransferMessage("❌ Cannot transfer to the same account", "error");
        debugConsole.log("❌ Cannot transfer to the same account", "error");
        return;
      }
      const fromAccountObj = this.accounts.find((a) => a.name === fromAccount);
      if (!fromAccountObj || fromAccountObj.balance < amount) {
        this.showTransferMessage(`❌ Insufficient balance. Available: ${fromAccountObj?.balance || 0} BB`, "error");
        debugConsole.log("❌ Insufficient balance", "error");
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Processing...</span>';
      }
      debugConsole.log(`\uD83D\uDD04 Transferring ${amount} BB from ${fromAccount} to ${toAccount}...`, "info");
      this.showTransferMessage(`⏳ Processing transfer of ${amount} BB...`, "info");
      await BackendService.transfer(fromAccount, toAccount, amount);
      debugConsole.log(`✅ Transfer successful!`, "success");
      this.showTransferMessage(`✅ Successfully transferred ${amount} BB from ${fromAccount} to ${toAccount}!`, "success");
      if (amountInput)
        amountInput.value = "";
      if (fromSelect)
        fromSelect.value = "";
      if (toSelect)
        toSelect.value = "";
      const fromBalance = document.getElementById("fromBalance");
      if (fromBalance) {
        fromBalance.textContent = "0";
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">\uD83D\uDCE4</span><span class="btn-text">Send Transfer</span>';
      }
      await this.refreshAccountBalances();
      await this.updateTransferStats();
      if (this.onTransferComplete) {
        await this.onTransferComplete();
      }
    } catch (error) {
      debugConsole.log(`❌ Transfer failed: ${error}`, "error");
      this.showTransferMessage(`❌ Transfer failed: ${error}`, "error");
      const btn = document.getElementById("sendTransferBtn");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">\uD83D\uDCE4</span><span class="btn-text">Send Transfer</span>';
      }
    }
  }
  static async updateTransferStats() {
    try {
      const stats = await BackendService.getLedgerStats();
      const statsAccounts = document.getElementById("statsAccounts");
      const statsVolume = document.getElementById("statsVolume");
      const statsTransfers = document.getElementById("statsTransfers");
      const statsBets = document.getElementById("statsBets");
      if (statsAccounts)
        statsAccounts.textContent = stats.totalAccounts?.toString() || "0";
      if (statsVolume)
        statsVolume.textContent = `${stats.totalVolume?.toString() || "0"} BB`;
      if (statsTransfers)
        statsTransfers.textContent = stats.totalTransactions?.toString() || "0";
      if (statsBets)
        statsBets.textContent = stats.totalBets?.toString() || "0";
      debugConsole.log("\uD83D\uDCCA Transfer statistics updated", "info");
    } catch (error) {
      debugConsole.log(`⚠️ Failed to update transfer stats: ${error}`, "warning");
    }
  }
  static setupEventListeners() {
    this.setupTabNavigation();
    const fromSelect = document.getElementById("transferFrom");
    if (fromSelect) {
      fromSelect.addEventListener("change", () => this.updateFromBalance());
    }
    const sendBtn = document.getElementById("sendTransferBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.executeTransfer());
    }
    const quickTransfer50 = document.getElementById("quickTransfer50");
    if (quickTransfer50) {
      quickTransfer50.addEventListener("click", () => this.setQuickTransferAmount(50));
    }
    const quickTransfer100 = document.getElementById("quickTransfer100");
    if (quickTransfer100) {
      quickTransfer100.addEventListener("click", () => this.setQuickTransferAmount(100));
    }
    const quickTransfer500 = document.getElementById("quickTransfer500");
    if (quickTransfer500) {
      quickTransfer500.addEventListener("click", () => this.setQuickTransferAmount(500));
    }
    this.setupAdminPanelListeners();
    this.setupQuickActionsListeners();
  }
  static setupTabNavigation() {
    const transferTab = document.getElementById("transferTab");
    const adminTab = document.getElementById("adminTab");
    const quickActionsTab = document.getElementById("quickActionsTab");
    const transferContent = document.getElementById("transferTabContent");
    const adminContent = document.getElementById("adminTabContent");
    const quickActionsContent = document.getElementById("quickActionsTabContent");
    if (transferTab) {
      transferTab.addEventListener("click", () => {
        this.switchTab("transfer", transferTab, transferContent);
      });
    }
    if (adminTab) {
      adminTab.addEventListener("click", () => {
        this.switchTab("admin", adminTab, adminContent);
        this.populateAdminSelects();
      });
    }
    if (quickActionsTab) {
      quickActionsTab.addEventListener("click", () => {
        this.switchTab("quickActions", quickActionsTab, quickActionsContent);
        this.populateQuickActionSelects();
      });
    }
  }
  static switchTab(tabName, tabButton, content) {
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((content2) => content2.classList.remove("active"));
    tabButton.classList.add("active");
    if (content) {
      content.classList.add("active");
    }
    debugConsole.log(`\uD83D\uDCD1 Switched to ${tabName} tab`, "info");
  }
  static setupAdminPanelListeners() {
    const mintBtn = document.getElementById("mintTokensBtn");
    if (mintBtn) {
      mintBtn.addEventListener("click", () => this.executeMintTokens());
    }
    const setBalanceBtn = document.getElementById("setBalanceBtn");
    if (setBalanceBtn) {
      setBalanceBtn.addEventListener("click", () => this.executeSetBalance());
    }
    const setBalanceAccount = document.getElementById("setBalanceAccount");
    if (setBalanceAccount) {
      setBalanceAccount.addEventListener("change", () => this.updateCurrentBalance());
    }
  }
  static setupQuickActionsListeners() {
    const getUserBetsBtn = document.getElementById("getUserBetsBtn");
    if (getUserBetsBtn) {
      getUserBetsBtn.addEventListener("click", () => this.executeGetUserBets());
    }
    const getAllMarketsBtn = document.getElementById("getAllMarketsBtn");
    if (getAllMarketsBtn) {
      getAllMarketsBtn.addEventListener("click", () => this.executeGetAllMarkets());
    }
    const quickMintBtn = document.getElementById("quickMintBtn");
    if (quickMintBtn) {
      quickMintBtn.addEventListener("click", () => this.executeQuickMint());
    }
    const quickBalanceBtn = document.getElementById("quickBalanceBtn");
    if (quickBalanceBtn) {
      quickBalanceBtn.addEventListener("click", () => this.executeQuickBalance());
    }
    const closeResults = document.getElementById("closeResults");
    if (closeResults) {
      closeResults.addEventListener("click", () => this.closeResults());
    }
  }
  static populateAdminSelects() {
    const mintAccount = document.getElementById("mintAccount");
    const setBalanceAccount = document.getElementById("setBalanceAccount");
    if (!mintAccount || !setBalanceAccount)
      return;
    const options = this.accounts.map((account) => `<option value="${account.name}">${account.name} (${account.balance} BB)</option>`).join("");
    mintAccount.innerHTML = '<option value="">Select account...</option>' + options;
    setBalanceAccount.innerHTML = '<option value="">Select account...</option>' + options;
  }
  static populateQuickActionSelects() {
    const userBetsAccount = document.getElementById("userBetsAccount");
    const quickMintAccount = document.getElementById("quickMintAccount");
    const quickBalanceAccount = document.getElementById("quickBalanceAccount");
    const options = this.accounts.map((account) => `<option value="${account.name}">${account.name}</option>`).join("");
    if (userBetsAccount) {
      userBetsAccount.innerHTML = '<option value="">Select account...</option>' + options;
    }
    if (quickMintAccount) {
      quickMintAccount.innerHTML = '<option value="">Select account...</option>' + options;
    }
    if (quickBalanceAccount) {
      quickBalanceAccount.innerHTML = '<option value="">Select account...</option>' + options;
    }
  }
  static async executeMintTokens() {
    try {
      const accountSelect = document.getElementById("mintAccount");
      const amountInput = document.getElementById("mintAmount");
      const messageDiv = document.getElementById("mintMessage");
      const btn = document.getElementById("mintTokensBtn");
      const account = accountSelect?.value;
      const amount = parseFloat(amountInput?.value || "0");
      if (!account || !amount || amount <= 0) {
        this.showAdminMessage("mintMessage", "❌ Please select account and enter valid amount", "error");
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Minting...</span>';
      }
      debugConsole.log(`\uD83E\uDE99 Minting ${amount} BB to ${account}...`, "info");
      const result = await BackendService.adminMintTokens(account, amount);
      this.showAdminMessage("mintMessage", `✅ ${result}`, "success");
      debugConsole.log(`✅ Minted ${amount} BB to ${account}`, "success");
      if (amountInput)
        amountInput.value = "";
      if (accountSelect)
        accountSelect.value = "";
      await this.refreshAccountBalances();
      this.populateAdminSelects();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">\uD83E\uDE99</span><span class="btn-text">Mint Tokens</span>';
      }
    } catch (error) {
      debugConsole.log(`❌ Mint failed: ${error}`, "error");
      this.showAdminMessage("mintMessage", `❌ Mint failed: ${error}`, "error");
      const btn = document.getElementById("mintTokensBtn");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">\uD83E\uDE99</span><span class="btn-text">Mint Tokens</span>';
      }
    }
  }
  static updateCurrentBalance() {
    const accountSelect = document.getElementById("setBalanceAccount");
    const currentBalance = document.getElementById("currentBalance");
    if (!accountSelect || !currentBalance)
      return;
    const selectedAccountName = accountSelect.value;
    const selectedAccount = this.accounts.find((a) => a.name === selectedAccountName);
    if (selectedAccount) {
      currentBalance.textContent = selectedAccount.balance.toString();
    } else {
      currentBalance.textContent = "0";
    }
  }
  static async executeSetBalance() {
    try {
      const accountSelect = document.getElementById("setBalanceAccount");
      const balanceInput = document.getElementById("newBalance");
      const messageDiv = document.getElementById("setBalanceMessage");
      const btn = document.getElementById("setBalanceBtn");
      const account = accountSelect?.value;
      const newBalance = parseFloat(balanceInput?.value || "0");
      if (!account || newBalance < 0) {
        this.showAdminMessage("setBalanceMessage", "❌ Please select account and enter valid balance", "error");
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Setting...</span>';
      }
      debugConsole.log(`⚖️ Setting ${account} balance to ${newBalance} BB...`, "info");
      const result = await BackendService.adminSetBalance(account, newBalance);
      this.showAdminMessage("setBalanceMessage", `✅ ${result}`, "success");
      debugConsole.log(`✅ Set ${account} balance to ${newBalance} BB`, "success");
      if (balanceInput)
        balanceInput.value = "";
      if (accountSelect)
        accountSelect.value = "";
      await this.refreshAccountBalances();
      this.populateAdminSelects();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">⚖️</span><span class="btn-text">Set Balance</span>';
      }
    } catch (error) {
      debugConsole.log(`❌ Set balance failed: ${error}`, "error");
      this.showAdminMessage("setBalanceMessage", `❌ Set balance failed: ${error}`, "error");
      const btn = document.getElementById("setBalanceBtn");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">⚖️</span><span class="btn-text">Set Balance</span>';
      }
    }
  }
  static async executeGetUserBets() {
    try {
      const accountSelect = document.getElementById("userBetsAccount");
      const account = accountSelect?.value;
      if (!account) {
        this.showResults("Error", "❌ Please select an account", "error");
        return;
      }
      debugConsole.log(`\uD83D\uDC65 Fetching bets for ${account}...`, "info");
      const bets = await BackendService.getUserBets(account);
      if (bets.length === 0) {
        this.showResults(`${account}'s Bets`, `<p class="no-data">No bets found for ${account}</p>`, "info");
      } else {
        const betsHTML = bets.map((bet) => `
                    <div class="bet-item">
                        <div><strong>Market:</strong> ${bet.market_id || "N/A"}</div>
                        <div><strong>Amount:</strong> ${bet.amount} BB</div>
                        <div><strong>Prediction:</strong> ${bet.prediction || "N/A"}</div>
                        <div><strong>Status:</strong> ${bet.status || "Active"}</div>
                    </div>
                `).join("");
        this.showResults(`${account}'s Bets (${bets.length})`, betsHTML, "success");
        debugConsole.log(`✅ Found ${bets.length} bets for ${account}`, "success");
      }
    } catch (error) {
      debugConsole.log(`❌ Failed to get user bets: ${error}`, "error");
      this.showResults("Error", `❌ Failed to get user bets: ${error}`, "error");
    }
  }
  static async executeGetAllMarkets() {
    try {
      debugConsole.log(`\uD83D\uDCCA Fetching all markets...`, "info");
      const markets = await BackendService.getAllMarkets();
      if (markets.length === 0) {
        this.showResults("All Markets", '<p class="no-data">No markets found</p>', "info");
      } else {
        const marketsHTML = markets.map((market) => `
                    <div class="market-item">
                        <div><strong>ID:</strong> ${market.id}</div>
                        <div><strong>Title:</strong> ${market.title || "Untitled"}</div>
                        <div><strong>Volume:</strong> ${market.total_volume || 0} BB</div>
                        <div><strong>Status:</strong> ${market.status || "Active"}</div>
                    </div>
                `).join("");
        this.showResults(`All Markets (${markets.length})`, marketsHTML, "success");
        debugConsole.log(`✅ Found ${markets.length} markets`, "success");
      }
    } catch (error) {
      debugConsole.log(`❌ Failed to get markets: ${error}`, "error");
      this.showResults("Error", `❌ Failed to get markets: ${error}`, "error");
    }
  }
  static async executeQuickMint() {
    try {
      const accountSelect = document.getElementById("quickMintAccount");
      const amountInput = document.getElementById("quickMintAmount");
      const account = accountSelect?.value;
      const amount = parseFloat(amountInput?.value || "0");
      if (!account || !amount || amount <= 0) {
        this.showResults("Error", "❌ Please select account and enter valid amount", "error");
        return;
      }
      debugConsole.log(`\uD83E\uDE99 Quick minting ${amount} BB to ${account}...`, "info");
      const result = await BackendService.adminMintTokens(account, amount);
      this.showResults("Quick Mint", `✅ ${result}`, "success");
      debugConsole.log(`✅ Quick minted ${amount} BB to ${account}`, "success");
      await this.refreshAccountBalances();
      this.populateQuickActionSelects();
    } catch (error) {
      debugConsole.log(`❌ Quick mint failed: ${error}`, "error");
      this.showResults("Error", `❌ Quick mint failed: ${error}`, "error");
    }
  }
  static async executeQuickBalance() {
    try {
      const accountSelect = document.getElementById("quickBalanceAccount");
      const amountInput = document.getElementById("quickBalanceAmount");
      const account = accountSelect?.value;
      const newBalance = parseFloat(amountInput?.value || "0");
      if (!account || newBalance < 0) {
        this.showResults("Error", "❌ Please select account and enter valid balance", "error");
        return;
      }
      debugConsole.log(`⚖️ Quick setting ${account} balance to ${newBalance} BB...`, "info");
      const result = await BackendService.adminSetBalance(account, newBalance);
      this.showResults("Quick Balance", `✅ ${result}`, "success");
      debugConsole.log(`✅ Quick set ${account} balance to ${newBalance} BB`, "success");
      await this.refreshAccountBalances();
      this.populateQuickActionSelects();
    } catch (error) {
      debugConsole.log(`❌ Quick balance failed: ${error}`, "error");
      this.showResults("Error", `❌ Quick balance failed: ${error}`, "error");
    }
  }
  static showAdminMessage(elementId, message, type = "info") {
    const messageDiv = document.getElementById(elementId);
    if (!messageDiv)
      return;
    messageDiv.textContent = message;
    messageDiv.className = `admin-message admin-message-${type}`;
    messageDiv.style.display = "block";
    if (type === "success") {
      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 5000);
    }
  }
  static showResults(title, content, type = "info") {
    const resultsContainer = document.getElementById("quickActionsResults");
    const resultsTitle = document.getElementById("resultsTitle");
    const resultsContent = document.getElementById("resultsContent");
    if (!resultsContainer || !resultsTitle || !resultsContent)
      return;
    resultsTitle.textContent = title;
    resultsContent.innerHTML = content;
    resultsContainer.style.display = "block";
    resultsContainer.className = `results-container results-${type}`;
  }
  static closeResults() {
    const resultsContainer = document.getElementById("quickActionsResults");
    if (resultsContainer) {
      resultsContainer.style.display = "none";
    }
  }
  static initialize(accounts) {
    this.setAccounts(accounts);
    this.populateTransferSelects();
    this.setupEventListeners();
    debugConsole.log("✅ Transfers module initialized", "success");
  }
  static refresh(accounts) {
    this.setAccounts(accounts);
    this.populateTransferSelects();
    this.updateFromBalance();
    this.updateTransferStats();
  }
}
var transfers_default = TransfersModule;

// src/lib/price_action.ts
class PriceActionModule {
  activeBets = new Map;
  currentPrices = { btc: 0, sol: 0 };
  initialize(_accounts) {
    this.startPriceUpdates();
  }
  async startPriceUpdates() {
    setInterval(async () => {
      try {
        const prices = await BackendService.getPrices();
        this.currentPrices = prices;
        this.updatePriceDisplay();
        this.checkActiveBets();
      } catch (error) {
        console.error("Price update failed:", error);
      }
    }, 5000);
    try {
      const prices = await BackendService.getPrices();
      this.currentPrices = prices;
      this.updatePriceDisplay();
    } catch (error) {
      console.error("Initial price fetch failed:", error);
    }
  }
  updatePriceDisplay() {
    const btcPriceEl = document.getElementById("btcPriceAction");
    const solPriceEl = document.getElementById("solPriceAction");
    if (btcPriceEl) {
      btcPriceEl.textContent = `$${this.currentPrices.btc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (solPriceEl) {
      solPriceEl.textContent = `$${this.currentPrices.sol.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    const btcHeaderEl = document.getElementById("btcPrice");
    const solHeaderEl = document.getElementById("solPrice");
    if (btcHeaderEl) {
      btcHeaderEl.textContent = `$${this.currentPrices.btc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (solHeaderEl) {
      solHeaderEl.textContent = `$${this.currentPrices.sol.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    console.log(`\uD83D\uDCCA Updated price display - BTC: $${this.currentPrices.btc}, SOL: $${this.currentPrices.sol}`);
  }
  async placePriceBet(asset, direction, amount, duration, account) {
    const betId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startPrice = asset === "BTC" ? this.currentPrices.btc : this.currentPrices.sol;
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    const bet = {
      id: betId,
      asset,
      account,
      direction,
      amount,
      startPrice,
      endPrice: null,
      duration,
      startTime,
      endTime,
      status: "ACTIVE"
    };
    try {
      const marketId = `${asset}_${direction}_${duration}`;
      await BackendService.placeBet(marketId, account, amount, direction);
      this.activeBets.set(betId, bet);
      this.renderActiveBets();
      debugConsole.log(`\uD83C\uDFAF Price bet placed: ${amount} BB on ${asset} ${direction} (${duration}s)`, "success");
      setTimeout(() => {
        this.resolveBet(betId);
      }, duration * 1000);
    } catch (error) {
      debugConsole.log(`❌ Failed to place price bet: ${error}`, "error");
      throw error;
    }
  }
  async resolveBet(betId) {
    const bet = this.activeBets.get(betId);
    if (!bet || bet.status !== "ACTIVE")
      return;
    const endPrice = bet.asset === "BTC" ? this.currentPrices.btc : this.currentPrices.sol;
    bet.endPrice = endPrice;
    const priceIncreased = endPrice > bet.startPrice;
    const won = bet.direction === "HIGHER" && priceIncreased || bet.direction === "LOWER" && !priceIncreased;
    bet.status = won ? "WON" : "LOST";
    if (won) {
      const payout = bet.amount * 2;
      try {
        await BackendService.recordBetWin(bet.account, payout, betId);
        debugConsole.log(`\uD83C\uDF89 Price bet WON! ${bet.asset} went ${bet.direction}. Payout: ${payout} BB`, "success");
      } catch (error) {
        debugConsole.log(`❌ Failed to record win: ${error}`, "error");
      }
    } else {
      try {
        await BackendService.recordBetLoss(bet.account, bet.amount, betId);
        debugConsole.log(`❌ Price bet LOST. ${bet.asset} went ${priceIncreased ? "HIGHER" : "LOWER"}`, "error");
      } catch (error) {
        debugConsole.log(`❌ Failed to record loss: ${error}`, "error");
      }
    }
    this.renderActiveBets();
  }
  checkActiveBets() {
    const now = Date.now();
    for (const [betId, bet] of this.activeBets.entries()) {
      if (bet.status === "ACTIVE" && now >= bet.endTime) {
        this.resolveBet(betId);
      }
    }
  }
  renderActiveBets() {
    const container = document.getElementById("activePriceBets");
    if (!container)
      return;
    const bets = Array.from(this.activeBets.values()).sort((a, b) => b.startTime - a.startTime).slice(0, 10);
    if (bets.length === 0) {
      container.innerHTML = '<p class="empty-state">No active price bets</p>';
      return;
    }
    container.innerHTML = bets.map((bet) => {
      const now = Date.now();
      const remainingMs = Math.max(0, bet.endTime - now);
      const remainingSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const priceChange = bet.endPrice ? ((bet.endPrice - bet.startPrice) / bet.startPrice * 100).toFixed(2) : "...";
      const statusClass = bet.status === "WON" ? "won" : bet.status === "LOST" ? "lost" : "active";
      const statusIcon = bet.status === "WON" ? "\uD83C\uDF89" : bet.status === "LOST" ? "❌" : "⏳";
      return `
                <div class="price-bet-card ${statusClass}">
                    <div class="bet-header">
                        <span class="bet-asset">${bet.asset}</span>
                        <span class="bet-direction ${bet.direction.toLowerCase()}">${bet.direction}</span>
                        <span class="bet-status">${statusIcon} ${bet.status}</span>
                    </div>
                    <div class="bet-details">
                        <div class="bet-row">
                            <span>Start Price:</span>
                            <span>$${bet.startPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        ${bet.endPrice ? `
                        <div class="bet-row">
                            <span>End Price:</span>
                            <span>$${bet.endPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div class="bet-row">
                            <span>Change:</span>
                            <span class="${parseFloat(priceChange) > 0 ? "positive" : "negative"}">${priceChange}%</span>
                        </div>
                        ` : `
                        <div class="bet-row">
                            <span>Time Left:</span>
                            <span>${minutes}:${seconds.toString().padStart(2, "0")}</span>
                        </div>
                        `}
                        <div class="bet-row">
                            <span>Amount:</span>
                            <span>${bet.amount} BB</span>
                        </div>
                        <div class="bet-row">
                            <span>Duration:</span>
                            <span>${bet.duration === 60 ? "1 min" : "15 min"}</span>
                        </div>
                    </div>
                </div>
            `;
    }).join("");
  }
  buildUI() {
    const container = document.createElement("div");
    container.className = "price-action-container";
    container.innerHTML = `
            <div class="page-header">
                <h2>⚡ Price Action Betting</h2>
                <p class="subtitle">Bet on Bitcoin and Solana price movements</p>
            </div>

            <div class="price-grid">
                <!-- Bitcoin Card -->
                <div class="price-card">
                    <div class="price-header">
                        <h3>₿ Bitcoin</h3>
                        <div class="current-price">
                            <span class="price-label">Current Price</span>
                            <span class="price-value" id="btcCurrentPrice">$0.00</span>
                        </div>
                    </div>

                    <div class="betting-panel">
                        <h4>Place Bet</h4>
                        
                        <div class="direction-buttons">
                            <button class="btn-direction higher" data-asset="BTC" data-direction="HIGHER">
                                \uD83D\uDCC8 HIGHER
                            </button>
                            <button class="btn-direction lower" data-asset="BTC" data-direction="LOWER">
                                \uD83D\uDCC9 LOWER
                            </button>
                        </div>

                        <div class="timeframe-buttons">
                            <button class="btn-timeframe" data-duration="60">1 Minute</button>
                            <button class="btn-timeframe active" data-duration="900">15 Minutes</button>
                        </div>

                        <div class="amount-input-group">
                            <label>Bet Amount (BB)</label>
                            <input type="number" id="btcBetAmount" class="amount-input" placeholder="10" min="1" value="10">
                        </div>
                    </div>
                </div>

                <!-- Solana Card -->
                <div class="price-card">
                    <div class="price-header">
                        <h3>◎ Solana</h3>
                        <div class="current-price">
                            <span class="price-label">Current Price</span>
                            <span class="price-value" id="solCurrentPrice">$0.00</span>
                        </div>
                    </div>

                    <div class="betting-panel">
                        <h4>Place Bet</h4>
                        
                        <div class="direction-buttons">
                            <button class="btn-direction higher" data-asset="SOL" data-direction="HIGHER">
                                \uD83D\uDCC8 HIGHER
                            </button>
                            <button class="btn-direction lower" data-asset="SOL" data-direction="LOWER">
                                \uD83D\uDCC9 LOWER
                            </button>
                        </div>

                        <div class="timeframe-buttons">
                            <button class="btn-timeframe" data-duration="60">1 Minute</button>
                            <button class="btn-timeframe active" data-duration="900">15 Minutes</button>
                        </div>

                        <div class="amount-input-group">
                            <label>Bet Amount (BB)</label>
                            <input type="number" id="solBetAmount" class="amount-input" placeholder="10" min="1" value="10">
                        </div>
                    </div>
                </div>
            </div>

            <div class="active-bets-section">
                <h3>\uD83C\uDFAF Active Bets</h3>
                <div id="activePriceBets" class="active-bets-grid">
                    <p class="empty-state">No active price bets</p>
                </div>
            </div>
        `;
    this.setupEventListeners(container);
    return container;
  }
  setupEventListeners(container) {
    container.querySelectorAll(".btn-timeframe").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target;
        const card = target.closest(".price-card");
        if (!card)
          return;
        card.querySelectorAll(".btn-timeframe").forEach((b) => b.classList.remove("active"));
        target.classList.add("active");
      });
    });
    container.querySelectorAll(".btn-direction").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const target = e.target;
        const asset = target.dataset.asset;
        const direction = target.dataset.direction;
        const card = target.closest(".price-card");
        if (!card)
          return;
        const activeTimeframe = card.querySelector(".btn-timeframe.active");
        const duration = parseInt(activeTimeframe?.dataset.duration || "900");
        const amountInput = card.querySelector(".amount-input");
        const amount = parseFloat(amountInput.value || "10");
        if (isNaN(amount) || amount <= 0) {
          debugConsole.log("❌ Invalid bet amount", "error");
          return;
        }
        const selectedAccountEl = document.getElementById("selectedAccountName");
        const accountName = selectedAccountEl?.textContent;
        if (!accountName || accountName === "Select Account") {
          debugConsole.log("❌ Please select an account first", "error");
          return;
        }
        try {
          await this.placePriceBet(asset, direction, amount, duration, accountName);
        } catch (error) {
          debugConsole.log(`❌ Bet failed: ${error}`, "error");
        }
      });
    });
  }
}
var price_action_default = new PriceActionModule;

// src/main.ts
var selectedAccount = null;
var accounts = [];
var markets = [];
var allRecipes = [];
var filteredRecipes = [];
var log = (message, type = "info") => debugConsole.log(message, type);
async function loadAccounts() {
  try {
    log("� Connecting to BlackBook L1...", "info");
    accounts = await BackendService.getAllAccounts();
    if (accounts.length === 8) {
      log("✅ Blockchain Connection: YES", "success");
      log("✅ 8 Accounts Loaded: YES", "success");
    } else {
      log(`⚠️ Found ${accounts.length} accounts (expected 8)`, "warning");
    }
    renderAccounts();
  } catch (error) {
    log(`❌ Failed to connect to blockchain: ${error}`, "error");
  }
}
async function loadMarkets() {
  try {
    log("\uD83D\uDCCA Loading prediction markets...", "info");
    markets = await BackendService.getMarkets();
    log(`✅ Loaded ${markets.length} markets`, "success");
    renderMarkets();
  } catch (error) {
    log(`❌ Failed to load markets: ${error}`, "error");
  }
}
async function loadActiveMarketsFromRSS() {
  try {
    console.log("\uD83D\uDCE1 Fetching BlackBook events from RSS...");
    const rssMarkets = await BackendService.getBlackbookEvents();
    console.log(`✅ Fetched ${rssMarkets.length} events from RSS`);
    if (rssMarkets.length === 0) {
      log("⚠️ No events available", "warning");
      return;
    }
    renderActiveMarkets(rssMarkets);
    log(`✅ Loaded ${rssMarkets.length} active markets from event.rss`, "success");
  } catch (error) {
    console.error("❌ Failed to load RSS markets:", error);
    log(`⚠️ Could not load active markets: ${error}`, "warning");
  }
}
function renderActiveMarkets(rssMarkets) {
  renderBlackbookEvents(rssMarkets);
  const list = document.getElementById("marketsList");
  if (!list) {
    console.log("⚠️ marketsList element not found");
    return;
  }
  if (rssMarkets.length === 0) {
    list.innerHTML = '<p class="empty-state">No active markets available</p>';
    return;
  }
  list.innerHTML = rssMarkets.map((market) => `
        <div class="market-card">
            <div class="market-header">
                <h3>${market.title}</h3>
                <span class="confidence-badge" style="background: hsl(${Math.round(market.confidence * 120)}, 100%, 50%)">
                    ${(market.confidence * 100).toFixed(0)}% confidence
                </span>
            </div>
            <p class="market-description">${market.description}</p>
            <div class="market-options">
                ${market.options.map((option) => `
                    <div class="option-pill">${option}</div>
                `).join("")}
            </div>
            <div class="market-footer">
                <a href="${market.link}" target="_blank" class="read-more">Read source →</a>
            </div>
        </div>
    `).join("");
}
function renderBlackbookEvents(rssMarkets) {
  const eventsContainer = document.getElementById("blackbookEvents");
  if (!eventsContainer) {
    console.log("⚠️ blackbookEvents element not found");
    return;
  }
  const highConfidenceEvents = rssMarkets.filter((market) => market.confidence > 0.5);
  if (highConfidenceEvents.length === 0) {
    eventsContainer.innerHTML = '<p class="empty-state">No high-confidence events available (need >50%)</p>';
    return;
  }
  console.log(`\uD83D\uDCCA Rendering ${highConfidenceEvents.length} high-confidence BlackBook events`);
  eventsContainer.innerHTML = highConfidenceEvents.map((market, idx) => `
        <div class="event-card">
            <div class="event-card-content">
                <div class="event-title-section">
                    <h3 class="event-title">${market.title}</h3>
                    <span class="event-category">${market.category || "general"}</span>
                </div>
                
                <p class="event-description">${market.description}</p>
                
                <div class="event-betting-section">
                    <div class="betting-buttons">
                        ${market.options.map((option, optIdx) => `
                            <button class="event-bet-btn" data-market="${idx}" data-outcome="${optIdx}" data-title="${market.title.replace(/"/g, "&quot;")}" data-option="${option.replace(/"/g, "&quot;")}" data-market-id="${market.marketId}">
                                <span class="bet-option-text">${option}</span>
                            </button>
                        `).join("")}
                    </div>
                </div>
            </div>
            
            <div class="event-card-footer">
                <a href="${market.link}" target="_blank" class="event-source-link" title="Read source article">\uD83D\uDCD6</a>
            </div>
        </div>
    `).join("");
  setupBlackbookEventListeners(highConfidenceEvents);
}
function setupBlackbookEventListeners(_rssMarkets) {
  const betButtons = document.querySelectorAll(".event-bet-btn");
  betButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const marketIdx = e.currentTarget.getAttribute("data-market");
      const outcomeIdx = e.currentTarget.getAttribute("data-outcome");
      const marketId = e.currentTarget.getAttribute("data-market-id");
      const option = e.currentTarget.getAttribute("data-option");
      const title = e.currentTarget.getAttribute("data-title");
      if (!marketIdx || !outcomeIdx || !marketId || !option) {
        log("❌ Invalid bet data", "error");
        return;
      }
      if (!selectedAccount) {
        log("❌ Please select an account first", "error");
        return;
      }
      showBettingModal(marketId, title || "Unknown Market", option, selectedAccount);
    });
  });
}
function showBettingModal(marketId, marketTitle, option, account) {
  const existingModal = document.getElementById("bettingModal");
  if (existingModal) {
    existingModal.remove();
  }
  const balance = account.balance || 0;
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
                            <button class="betting-quick-btn" data-amount="10">10 BB</button>
                            <button class="betting-quick-btn" data-amount="50">50 BB</button>
                            <button class="betting-quick-btn" data-amount="100">100 BB</button>
                            <button class="betting-quick-btn" data-amount="${balance}">MAX</button>
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
  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const modal = document.getElementById("bettingModal");
  const closeBtn = document.getElementById("closeBettingModal");
  const cancelBtn = document.getElementById("cancelBet");
  const submitBtn = document.getElementById("submitBet");
  const amountInput = document.getElementById("betAmount");
  const errorDiv = document.getElementById("betAmountError");
  const quickBtns = document.querySelectorAll(".betting-quick-btn");
  amountInput.focus();
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const amount = btn.getAttribute("data-amount");
      amountInput.value = amount || "";
      errorDiv.style.display = "none";
    });
  });
  const closeModal = () => {
    modal.classList.add("modal-closing");
    setTimeout(() => modal.remove(), 300);
  };
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal)
      closeModal();
  });
  submitBtn.addEventListener("click", async () => {
    const amount = parseFloat(amountInput.value);
    if (!amountInput.value || isNaN(amount)) {
      errorDiv.textContent = "Please enter a valid amount";
      errorDiv.style.display = "block";
      return;
    }
    if (amount <= 0) {
      errorDiv.textContent = "Amount must be greater than 0";
      errorDiv.style.display = "block";
      return;
    }
    if (amount > balance) {
      errorDiv.textContent = `Insufficient balance (max: ${balance.toFixed(2)} BB)`;
      errorDiv.style.display = "block";
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Bet...";
    try {
      log(`\uD83C\uDFAF Placing bet on "${option}" for ${amount} BB...`, "info");
      log(`\uD83D\uDCCB Debug - Market ID: ${marketId}, Account: ${account.name}, Amount: ${amount}, Option: ${option}`, "info");
      const result = await BackendService.placeBet(marketId, account.name, amount, option);
      log(`✅ Bet placed successfully! ${amount} BB on "${option}"`, "success");
      log(`\uD83D\uDCCA Backend response: ${JSON.stringify(result)}`, "info");
      await loadAccounts();
      closeModal();
    } catch (error) {
      log(`❌ Bet failed: ${error}`, "error");
      console.error("Full error object:", error);
      errorDiv.textContent = `Failed to place bet: ${error}`;
      errorDiv.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Bet";
    }
  });
  amountInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });
}
async function updatePrices() {
  try {
    log("\uD83D\uDCC8 Fetching live prices from CoinGecko...", "info");
    const prices = await BackendService.getPrices();
    UIBuilder.updatePrices(prices.btc, prices.sol);
    log(`✅ Updated prices - BTC: $${prices.btc.toFixed(2)}, SOL: $${prices.sol.toFixed(2)}`, "success");
  } catch (error) {
    log(`⚠️ Price update failed: ${error}`, "warning");
  }
}
async function loadPolymarketEvents() {
  try {
    const polyEl = document.getElementById("polymarketEvents");
    if (!polyEl) {
      log("⚠️ Polymarket Events element not found", "warning");
      return;
    }
    log("\uD83D\uDD2E Fetching top 20 Polymarket events by volume...", "info");
    const polymarketData = await BackendService.getPolymarketEvents();
    log(`\uD83D\uDCE6 Polymarket API returned ${polymarketData.length} events`, "info");
    if (!Array.isArray(polymarketData)) {
      const errMsg = `❌ Polymarket API returned non-array: ${typeof polymarketData}`;
      log(errMsg, "error");
      console.error("Polymarket data structure:", polymarketData);
      polyEl.innerHTML = `<p class="loading">${errMsg}</p>`;
      return;
    }
    if (polymarketData.length === 0) {
      log("⚠️ No active Polymarket events available", "warning");
      polyEl.innerHTML = '<p class="loading">No active Polymarket events available</p>';
      return;
    }
    if (polymarketData.length > 0) {
      const firstEvent = polymarketData[0];
      log(`\uD83D\uDCCB Sample Polymarket event fields: ${Object.keys(firstEvent).join(", ")}`, "info");
      console.log("\uD83D\uDCCA First Polymarket event:", firstEvent);
    }
    const renderedCards = [];
    polymarketData.forEach((event, idx) => {
      try {
        const eventTitle = event.title || event.question || `Event ${idx}`;
        const eventDescription = event.description || "";
        const eventVolume = event.volume24hr || event.volume_24h || event.volume || 0;
        const markets2 = event.markets || [];
        if (markets2.length === 0) {
          log(`⚠️ Event ${idx} "${eventTitle}" has no markets`, "warning");
          return;
        }
        const market = markets2[0];
        let outcomes = market.outcomes || [];
        if (typeof outcomes === "string") {
          try {
            outcomes = JSON.parse(outcomes);
          } catch (e) {
            outcomes = ["Yes", "No"];
          }
        }
        let prices = market.outcomePrices || [];
        if (typeof prices === "string") {
          try {
            prices = JSON.parse(prices);
          } catch (e) {
            prices = [0.5, 0.5];
          }
        }
        prices = prices.map((p) => typeof p === "string" ? parseFloat(p) : p);
        log(`✅ Event ${idx}: "${eventTitle}" - Volume: $${(eventVolume / 1000).toFixed(1)}K`, "success");
        if (!Array.isArray(prices) || prices.length < 2) {
          prices = [0.5, 0.5];
        }
        if (!Array.isArray(outcomes) || outcomes.length < 2) {
          outcomes = ["Yes", "No"];
        }
        const safePrice0 = Math.min(99, Math.max(1, Math.round((prices[0] || 0.5) * 100)));
        const safePrice1 = Math.min(99, Math.max(1, Math.round((prices[1] || 0.5) * 100)));
        renderedCards.push(`
                <div class="market-card">
                    <h3>${eventTitle}</h3>
                    <p>${eventDescription || "Popular prediction market"}</p>
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
        log(`❌ Error rendering Polymarket event ${idx}: ${cardError}`, "error");
        console.error(`Card rendering error for event ${idx}:`, cardError, event);
      }
    });
    if (renderedCards.length > 0) {
      polyEl.innerHTML = renderedCards.join("");
      log(`✅ Successfully rendered ${renderedCards.length} top Polymarket events`, "success");
    } else {
      polyEl.innerHTML = '<p class="loading">No valid Polymarket events could be rendered</p>';
      log("❌ All Polymarket events failed to render", "error");
    }
  } catch (error) {
    const errMsg = `❌ Polymarket API Error: ${error instanceof Error ? error.message : String(error)}`;
    log(errMsg, "error");
    console.error("Polymarket fetch detailed error:", error);
    const polyEl = document.getElementById("polymarketEvents");
    if (polyEl) {
      polyEl.innerHTML = `<p class="loading" style="color: #e63946;">${errMsg}</p>`;
    }
  }
}
async function placeBet(marketId, outcome, amount) {
  try {
    if (!selectedAccount) {
      log("❌ No account selected", "error");
      return;
    }
    log(`\uD83C\uDFAF Placing ${outcome} bet for ${amount} BB on market ${marketId}...`, "info");
    await BackendService.placeBet(marketId, selectedAccount.name, amount, outcome);
    log(`✅ Bet placed successfully!`, "success");
    await loadAccounts();
  } catch (error) {
    log(`❌ Bet placement failed: ${error}`, "error");
  }
}
async function loadReceipts() {
  try {
    log("⛓️ Loading blockchain ledger...", "info");
    const recipes = await BackendService.getRecipes();
    allRecipes = recipes;
    filteredRecipes = recipes;
    log(`✅ Loaded ${recipes.length} recipes from ledger`, "success");
    updateReceiptsStats();
    displayRecipes(filteredRecipes);
    populateReceiptsFilters();
  } catch (error) {
    log(`❌ Failed to load ledger: ${error.message}`, "error");
  }
}
function updateReceiptsStats() {
  const totalRecipesEl = document.getElementById("totalRecipes");
  const totalVolumeEl = document.getElementById("totalVolume");
  const totalBetsEl = document.getElementById("totalBets");
  const totalTransfersEl = document.getElementById("totalTransfers");
  const totalVolume = allRecipes.reduce((sum, recipe) => sum + Math.abs(recipe.amount), 0);
  const totalBets = allRecipes.filter((r) => r.recipe_type === "bet_placed").length;
  const totalTransfers = allRecipes.filter((r) => r.recipe_type === "transfer").length;
  if (totalRecipesEl)
    totalRecipesEl.textContent = allRecipes.length.toString();
  if (totalVolumeEl)
    totalVolumeEl.textContent = `${totalVolume.toFixed(2)} BB`;
  if (totalBetsEl)
    totalBetsEl.textContent = totalBets.toString();
  if (totalTransfersEl)
    totalTransfersEl.textContent = totalTransfers.toString();
}
function displayRecipes(recipes) {
  const receiptsList = document.getElementById("receiptsList");
  const visibleCountEl = document.getElementById("visibleCount");
  const totalCountEl = document.getElementById("totalCount");
  if (!receiptsList)
    return;
  if (visibleCountEl)
    visibleCountEl.textContent = recipes.length.toString();
  if (totalCountEl)
    totalCountEl.textContent = allRecipes.length.toString();
  if (recipes.length === 0) {
    receiptsList.innerHTML = '<p class="empty-state">No ledger entries found. Try adjusting your filters.</p>';
    return;
  }
  const sortedRecipes = [...recipes].sort((a, b) => b.timestamp - a.timestamp);
  receiptsList.innerHTML = sortedRecipes.map((recipe) => {
    const date = new Date(recipe.timestamp * 1000);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    const typeInfo = getRecipeTypeInfo(recipe.recipe_type);
    return `
            <div class="recipe-item" data-recipe-id="${recipe.id}">
                <div class="recipe-icon ${typeInfo.color}">${typeInfo.icon}</div>
                <div class="recipe-content">
                    <div class="recipe-header">
                        <span class="recipe-type-badge ${recipe.recipe_type}">${typeInfo.label}</span>
                        <span class="recipe-amount ${recipe.amount >= 0 ? "positive" : "negative"}">${recipe.amount >= 0 ? "+" : ""}${recipe.amount.toFixed(2)} BB</span>
                    </div>
                    <div class="recipe-description">${recipe.description}</div>
                    <div class="recipe-meta">
                        <span class="recipe-account">\uD83D\uDC64 ${recipe.account}</span>
                        ${recipe.related_id ? `<span class="recipe-related">\uD83D\uDD17 ${recipe.related_id.substring(0, 12)}...</span>` : ""}
                        <span class="recipe-timestamp">\uD83D\uDCC5 ${formattedDate} ${formattedTime}</span>
                    </div>
                </div>
            </div>
        `;
  }).join("");
}
function getRecipeTypeInfo(type) {
  const typeMap = {
    bet_placed: { icon: "\uD83C\uDFAF", label: "Bet Placed", color: "bet" },
    bet_win: { icon: "\uD83C\uDFC6", label: "Bet Won", color: "win" },
    bet_loss: { icon: "❌", label: "Bet Lost", color: "loss" },
    market_payout: { icon: "\uD83D\uDCB0", label: "Payout", color: "payout" },
    transfer: { icon: "\uD83D\uDD04", label: "Transfer", color: "transfer" },
    deposit: { icon: "\uD83D\uDCB5", label: "Deposit", color: "deposit" },
    admin_action: { icon: "⚙️", label: "Admin", color: "admin" }
  };
  return typeMap[type] || { icon: "\uD83D\uDCCB", label: type, color: "default" };
}
function populateReceiptsFilters() {
  const filterAccount = document.getElementById("filterAccount");
  if (!filterAccount)
    return;
  const accountsSet = new Set;
  allRecipes.forEach((recipe) => accountsSet.add(recipe.account));
  const sortedAccounts = Array.from(accountsSet).sort();
  filterAccount.innerHTML = '<option value="">All Accounts</option>' + sortedAccounts.map((account) => `<option value="${account}">${account}</option>`).join("");
}
function applyRecipeFilters() {
  const filterAccount = document.getElementById("filterAccount")?.value || "";
  const filterType = document.getElementById("filterType")?.value || "";
  const searchAmount = document.getElementById("searchAmount")?.value;
  const minAmount = searchAmount ? parseFloat(searchAmount) : 0;
  filteredRecipes = allRecipes.filter((recipe) => {
    const matchesAccount = !filterAccount || recipe.account === filterAccount;
    const matchesType = !filterType || recipe.recipe_type === filterType;
    const matchesAmount = Math.abs(recipe.amount) >= minAmount;
    return matchesAccount && matchesType && matchesAmount;
  });
  displayRecipes(filteredRecipes);
  log(`\uD83D\uDD0D Filtered to ${filteredRecipes.length} ledger entries`, "info");
}
function resetRecipeFilters() {
  const filterAccount = document.getElementById("filterAccount");
  const filterType = document.getElementById("filterType");
  const searchAmount = document.getElementById("searchAmount");
  if (filterAccount)
    filterAccount.value = "";
  if (filterType)
    filterType.value = "";
  if (searchAmount)
    searchAmount.value = "";
  filteredRecipes = allRecipes;
  displayRecipes(filteredRecipes);
  log("\uD83D\uDD04 Filters reset", "info");
}
function exportRecipesToCSV() {
  if (filteredRecipes.length === 0) {
    log("⚠️ No recipes to export", "warning");
    return;
  }
  const headers = ["ID", "Type", "Account", "Address", "Amount", "Description", "Related ID", "Timestamp", "Date"];
  const rows = filteredRecipes.map((recipe) => {
    const date = new Date(recipe.timestamp * 1000);
    return [
      recipe.id,
      recipe.recipe_type,
      recipe.account,
      recipe.address,
      recipe.amount.toFixed(2),
      `"${recipe.description.replace(/"/g, '""')}"`,
      recipe.related_id || "",
      recipe.timestamp,
      date.toLocaleString()
    ];
  });
  const csvContent = [headers, ...rows].map((row) => row.join(",")).join(`
`);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `blackbook_ledger_${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  log(`✅ Exported ${filteredRecipes.length} ledger entries to CSV`, "success");
}
function renderAccounts() {
  console.log(`\uD83C\uDFAF renderAccounts called with ${accounts.length} accounts`, accounts);
  UIBuilder.populateAccountsList(accounts);
  UIBuilder.populateTransferSelects(accounts);
  updateAccountsToggleDisplay();
}
function renderMarkets() {
  const list = document.getElementById("marketsList");
  if (!list)
    return;
  if (markets.length === 0) {
    list.innerHTML = '<p class="empty-state">No markets available</p>';
    return;
  }
  list.innerHTML = markets.map((market) => `
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
    `).join("");
}
function selectAccount(accountName) {
  selectedAccount = accounts.find((a) => a.name === accountName) || null;
  if (selectedAccount) {
    log(`\uD83D\uDCCC Selected account: ${selectedAccount.name}`, "info");
  }
  UIBuilder.updateSelectedAccount(selectedAccount);
  updateAccountsToggleDisplay();
  closeAccountsDropdown();
}
function updateAccountsToggleDisplay() {
  const toggleBtn = document.getElementById("accountsToggle");
  const displayName = document.getElementById("selectedAccountName");
  if (toggleBtn && displayName) {
    if (selectedAccount) {
      displayName.textContent = selectedAccount.name;
    } else {
      displayName.textContent = "Select Account";
    }
  }
}
function toggleAccountsDropdown() {
  const dropdown = document.getElementById("accountsDropdown");
  const toggle = document.getElementById("accountsToggle");
  console.log("Toggle clicked - dropdown hidden:", dropdown?.classList.contains("hidden"));
  if (dropdown && toggle) {
    dropdown.classList.toggle("hidden");
    toggle.classList.toggle("active");
    console.log("After toggle - dropdown hidden:", dropdown.classList.contains("hidden"));
  }
}
function closeAccountsDropdown() {
  const dropdown = document.getElementById("accountsDropdown");
  const toggle = document.getElementById("accountsToggle");
  if (dropdown && toggle) {
    dropdown.classList.add("hidden");
    toggle.classList.remove("active");
  }
}
function switchPage(page) {
  const mainContainer = document.getElementById("mainContainer");
  const transfersContainer = document.getElementById("transfersContainer");
  const priceActionContainer = document.getElementById("priceActionContainer");
  const receiptsContainer = document.getElementById("receiptsContainer");
  if (page === "transfers") {
    log("\uD83D\uDD04 Opening Transfers Page...", "info");
    if (mainContainer)
      mainContainer.classList.add("hidden");
    if (transfersContainer) {
      transfersContainer.classList.remove("hidden");
      transfers_default.populateTransferSelects();
      transfers_default.updateTransferStats();
    }
    if (priceActionContainer)
      priceActionContainer.classList.add("hidden");
    if (receiptsContainer)
      receiptsContainer.classList.add("hidden");
  } else if (page === "priceAction") {
    log("⚡ Opening Price Action...", "info");
    if (mainContainer)
      mainContainer.classList.add("hidden");
    if (transfersContainer)
      transfersContainer.classList.add("hidden");
    if (priceActionContainer)
      priceActionContainer.classList.remove("hidden");
    if (receiptsContainer)
      receiptsContainer.classList.add("hidden");
  } else if (page === "receipts") {
    log("\uD83D\uDCDC Opening Receipts...", "info");
    if (mainContainer)
      mainContainer.classList.add("hidden");
    if (transfersContainer)
      transfersContainer.classList.add("hidden");
    if (priceActionContainer)
      priceActionContainer.classList.add("hidden");
    if (receiptsContainer)
      receiptsContainer.classList.remove("hidden");
    loadReceipts();
  } else if (page === "markets") {
    log("\uD83D\uDCCA Returning to Markets...", "info");
    if (mainContainer)
      mainContainer.classList.remove("hidden");
    if (transfersContainer)
      transfersContainer.classList.add("hidden");
    if (priceActionContainer)
      priceActionContainer.classList.add("hidden");
    if (receiptsContainer)
      receiptsContainer.classList.add("hidden");
  }
}
async function init() {
  console.log("\uD83D\uDE80 Starting app initialization...");
  try {
    const app = document.getElementById("app");
    if (!app) {
      console.error("❌ App container not found");
      return;
    }
    console.log("✅ Building UI...");
    app.appendChild(UIBuilder.buildApp());
    console.log("✅ UI built successfully");
    console.log("✅ Setting up event listeners...");
    setupEventListeners();
    log("\uD83C\uDFAF Welcome to the BlackBook", "success");
    log("⚡ Initializing BlackBook L1 Desktop App...", "info");
    await loadAccounts();
    transfers_default.initialize(accounts);
    transfers_default.setOnTransferComplete(async () => {
      await loadAccounts();
      log("✅ Balances updated after transfer", "success");
    });
    price_action_default.initialize(accounts);
    const priceActionContainer = document.createElement("div");
    priceActionContainer.id = "priceActionContainer";
    priceActionContainer.className = "page-container hidden";
    priceActionContainer.appendChild(price_action_default.buildUI());
    app.appendChild(priceActionContainer);
    await loadMarkets();
    await loadActiveMarketsFromRSS();
    await updatePrices();
    await loadPolymarketEvents();
    setInterval(updatePrices, 30000);
    log("✅ App initialized successfully!", "success");
  } catch (error) {
    console.error("❌ Initialization error:", error);
    log(`❌ Failed to initialize: ${error}`, "error");
  }
}
function setupEventListeners() {
  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      switchPage("markets");
      debugConsole.log("\uD83C\uDFE0 Returning to home page", "info");
    });
  }
  const blockchainBtn = document.getElementById("blockchainBtn");
  if (blockchainBtn) {
    blockchainBtn.addEventListener("click", () => {
      switchPage("markets");
      debugConsole.log("\uD83C\uDFE0 Returning to home page", "info");
    });
  }
  const toggle = document.getElementById("accountsToggle");
  if (toggle) {
    toggle.addEventListener("click", toggleAccountsDropdown);
  }
  const accountsList = document.getElementById("accountsList");
  if (accountsList) {
    accountsList.addEventListener("click", (e) => {
      if (e.target.classList.contains("account-item")) {
        const accountName = e.target.dataset.account;
        selectAccount(accountName);
      }
    });
  }
  const transfersBtn = document.getElementById("transfersBtn");
  if (transfersBtn) {
    transfersBtn.addEventListener("click", () => {
      switchPage("transfers");
      transfers_default.updateTransferStats();
    });
  }
  const priceActionBtn = document.getElementById("priceActionBtn");
  if (priceActionBtn) {
    priceActionBtn.addEventListener("click", () => {
      switchPage("priceAction");
    });
  }
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => switchPage("markets"));
  }
  const backFromPriceActionBtn = document.getElementById("backFromPriceActionBtn");
  if (backFromPriceActionBtn) {
    backFromPriceActionBtn.addEventListener("click", () => switchPage("markets"));
  }
  const backFromReceiptsBtn = document.getElementById("backFromReceiptsBtn");
  if (backFromReceiptsBtn) {
    backFromReceiptsBtn.addEventListener("click", () => switchPage("markets"));
  }
  const receiptsBtn = document.getElementById("receiptsBtn");
  if (receiptsBtn) {
    receiptsBtn.addEventListener("click", () => {
      switchPage("receipts");
      debugConsole.log("\uD83D\uDCDC Opening receipts page", "info");
    });
  }
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", applyRecipeFilters);
  }
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", resetRecipeFilters);
  }
  const exportCSVBtn = document.getElementById("exportCSVBtn");
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener("click", exportRecipesToCSV);
  }
  document.addEventListener("click", (e) => {
    const selector = document.querySelector(".accounts-selector");
    if (selector && !selector.contains(e.target)) {
      closeAccountsDropdown();
    }
  });
}
document.addEventListener("DOMContentLoaded", init);
window.selectAccount = selectAccount;
window.placeBet = placeBet;
window.toggleAccountsDropdown = toggleAccountsDropdown;
window.switchPage = switchPage;
