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
      return await invoke("admin_deposit", { address, amount });
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      throw error;
    }
  }
  static async transfer(from, to, amount) {
    try {
      return await invoke("transfer", { from, to, amount });
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
      return await invoke("place_bet", { marketId, account, amount, prediction });
    } catch (error) {
      console.error("❌ Bet placement failed:", error);
      throw error;
    }
  }
  static async resolveMarket(marketId, winningOption) {
    try {
      return await invoke("resolve_market", { marketId, winningOption });
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
    const accountsBadge = document.createElement("span");
    accountsBadge.className = "badge";
    accountsBadge.textContent = "\uD83D\uDCCA 8 Accounts";
    networkInfo.appendChild(accountsBadge);
    const homeNavBtn = document.createElement("button");
    homeNavBtn.className = "badge badge-button";
    homeNavBtn.id = "homeNavBtn";
    homeNavBtn.textContent = "\uD83C\uDFE0 Home";
    networkInfo.appendChild(homeNavBtn);
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
            <h2>\uD83D\uDD04 Admin Transfer Panel</h2>
            <p class="page-subtitle">Transfer BlackBook tokens between accounts</p>
        `;
    page.appendChild(pageHeader);
    const pageContent = document.createElement("div");
    pageContent.className = "page-content";
    pageContent.innerHTML = `
            <div class="transfer-container">
                <!-- Transfer Form Card -->
                <div class="transfer-card">
                    <h3>\uD83D\uDCB8 Transfer Tokens</h3>
                    
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
  }
}

// src/lib/transfers.ts
class TransfersModule {
  static accounts = [];
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
    const btcPriceEl = document.getElementById("btcCurrentPrice");
    const solPriceEl = document.getElementById("solCurrentPrice");
    if (btcPriceEl) {
      btcPriceEl.textContent = `$${this.currentPrices.btc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (solPriceEl) {
      solPriceEl.textContent = `$${this.currentPrices.sol.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
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
      if (!marketIdx || !outcomeIdx || !marketId || !option) {
        log("❌ Invalid bet data", "error");
        return;
      }
      if (!selectedAccount) {
        log("❌ Please select an account first", "error");
        return;
      }
      const amount = prompt(`Enter amount to bet on "${option}" (in BB):`);
      if (!amount || isNaN(parseFloat(amount))) {
        log("❌ Invalid bet amount", "error");
        return;
      }
      try {
        log(`\uD83C\uDFAF Placing bet on "${option}" for ${amount} BB...`, "info");
        await BackendService.placeBet(marketId, selectedAccount.name, parseFloat(amount), option);
        log(`✅ Bet placed successfully! ${amount} BB on "${option}"`, "success");
        await loadAccounts();
      } catch (error) {
        log(`❌ Bet failed: ${error}`, "error");
      }
    });
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
  } else if (page === "priceAction") {
    log("⚡ Opening Price Action...", "info");
    if (mainContainer)
      mainContainer.classList.add("hidden");
    if (transfersContainer)
      transfersContainer.classList.add("hidden");
    if (priceActionContainer)
      priceActionContainer.classList.remove("hidden");
  } else if (page === "markets") {
    log("\uD83D\uDCCA Returning to Markets...", "info");
    if (mainContainer)
      mainContainer.classList.remove("hidden");
    if (transfersContainer)
      transfersContainer.classList.add("hidden");
    if (priceActionContainer)
      priceActionContainer.classList.add("hidden");
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
  const homeNavBtn = document.getElementById("homeNavBtn");
  if (homeNavBtn) {
    homeNavBtn.addEventListener("click", () => {
      switchPage("markets");
      debugConsole.log("\uD83C\uDFE0 Returning to home page", "info");
    });
  }
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => switchPage("markets"));
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
