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
    if (!accountsList)
      return;
    accountsList.innerHTML = accounts.map((account) => `
            <div class="account-item" data-account="${account.name}">
                <div class="account-name">${account.name}</div>
                <div class="account-balance">${account.balance} BB</div>
            </div>
        `).join("");
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
    log("\uD83D\uDD2E Fetching Polymarket events...", "info");
    const polymarketData = await BackendService.getPolymarketEvents();
    log(`✅ Loaded ${polymarketData.length} Polymarket events`, "success");
    if (polymarketData.length > 0) {
      polyEl.innerHTML = polymarketData.map((m) => `
                <div class="market-card">
                    <h3>${m.question}</h3>
                    <p>${m.description || "No description"}</p>
                    <div class="market-prices">
                        <div class="price-column">
                            <span class="label">${m.outcomes[0] || "YES"}</span>
                            <span class="price">${(m.outcome_prices[0] * 100).toFixed(0)}¢</span>
                        </div>
                        <div class="price-column">
                            <span class="label">${m.outcomes[1] || "NO"}</span>
                            <span class="price">${(m.outcome_prices[1] * 100).toFixed(0)}¢</span>
                        </div>
                    </div>
                    <div class="market-volume">Vol: ${formatVolume(m.volume_24h || m.volume || 0)}</div>
                </div>
            `).join("");
    } else {
      polyEl.innerHTML = '<p class="loading">No Polymarket events available</p>';
    }
  } catch (error) {
    log(`⚠️ Polymarket fetch failed: ${error}`, "warning");
    const polyEl = document.getElementById("polymarketEvents");
    if (polyEl) {
      polyEl.innerHTML = `<p class="loading">Error loading Polymarket events: ${error}</p>`;
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
  if (page === "transfers") {
    log("\uD83D\uDD04 Opening Transfers Page...", "info");
    if (mainContainer)
      mainContainer.classList.add("hidden");
    if (transfersContainer) {
      transfersContainer.classList.remove("hidden");
      transfers_default.populateTransferSelects();
      transfers_default.updateTransferStats();
    }
  } else if (page === "markets") {
    log("\uD83D\uDCCA Returning to Markets...", "info");
    if (mainContainer)
      mainContainer.classList.remove("hidden");
    if (transfersContainer)
      transfersContainer.classList.add("hidden");
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
    await loadMarkets();
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
