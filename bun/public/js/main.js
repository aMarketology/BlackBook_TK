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

// src/lib/debug_console.ts
class DebugConsole {
  messages = [];
  maxMessages = 100;
  consoleElement = null;
  constructor() {
    this.consoleElement = document.getElementById("debugConsole");
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
    container.appendChild(this.buildFooter());
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
    title.textContent = "\uD83C\uDFAF BlackBook L1 Prediction Market";
    headerLeft.appendChild(title);
    const networkInfo = document.createElement("div");
    networkInfo.className = "network-info";
    networkInfo.innerHTML = `
            <span class="badge">\uD83D\uDD17 Layer 1 Blockchain</span>
            <span class="badge">\uD83D\uDC8E BB Token</span>
            <span class="badge">\uD83D\uDCCA 8 Accounts</span>
            <button class="badge badge-button" id="transfersBtn">\uD83D\uDD04 Transfers</button>
        `;
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
    page.className = "page";
    const pageHeader = document.createElement("div");
    pageHeader.className = "page-header";
    pageHeader.innerHTML = `
            <button class="back-btn" id="backBtn">← Back to Markets</button>
            <h2>\uD83D\uDD04 Transfer Tokens</h2>
        `;
    page.appendChild(pageHeader);
    const pageContent = document.createElement("div");
    pageContent.className = "page-content";
    const transferForm = document.createElement("div");
    transferForm.className = "transfer-form";
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
  static buildFooter() {
    const footer = document.createElement("footer");
    footer.className = "footer";
    const debugConsole2 = document.createElement("div");
    debugConsole2.id = "debugConsole";
    debugConsole2.className = "debug-console";
    debugConsole2.innerHTML = '<div class="console-header">\uD83D\uDC1B Debug Console</div>';
    footer.appendChild(debugConsole2);
    return footer;
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

// src/main.ts
var selectedAccount = null;
var accounts = [];
var markets = [];
var log = (message, type = "info") => debugConsole.log(message, type);
async function loadAccounts() {
  try {
    log("� Connecting to BlackBook L1...", "info");
    accounts = await invoke("get_accounts");
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
    markets = await invoke("get_markets");
    log(`✅ Loaded ${markets.length} markets`, "success");
    renderMarkets();
  } catch (error) {
    log(`❌ Failed to load markets: ${error}`, "error");
  }
}
async function updatePrices() {
  try {
    log("\uD83D\uDCC8 Fetching live prices from CoinGecko...", "info");
    const prices = await invoke("get_prices");
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
    const polymarketData = await invoke("get_polymarket_events");
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
    await invoke("place_bet", {
      account: selectedAccount.name,
      market_id: marketId,
      outcome,
      amount
    });
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
  const mainContent = document.querySelector(".main-content");
  const transfersPage = document.getElementById("transfersPage");
  if (page === "transfers") {
    log("\uD83D\uDD04 Opening Transfers Page...", "info");
    if (mainContent)
      mainContent.classList.add("hidden");
    if (transfersPage) {
      transfersPage.classList.remove("hidden");
      populateTransferSelects();
    }
  } else if (page === "markets") {
    log("\uD83D\uDCCA Returning to Markets...", "info");
    if (mainContent)
      mainContent.classList.remove("hidden");
    if (transfersPage)
      transfersPage.classList.add("hidden");
  }
}
function populateTransferSelects() {
  const fromSelect = document.getElementById("transferFrom");
  const toSelect = document.getElementById("transferTo");
  if (!fromSelect || !toSelect)
    return;
  fromSelect.innerHTML = '<option value="">Select sender...</option>';
  toSelect.innerHTML = '<option value="">Select recipient...</option>';
  accounts.forEach((account) => {
    const fromOption = document.createElement("option");
    fromOption.value = account.name;
    fromOption.textContent = `${account.name} (${account.balance} BB)`;
    fromSelect.appendChild(fromOption);
    const toOption = document.createElement("option");
    toOption.value = account.name;
    toOption.textContent = account.name;
    toSelect.appendChild(toOption);
  });
}
function updateFromBalance() {
  const fromSelect = document.getElementById("transferFrom");
  const balanceDisplay = document.getElementById("fromBalance");
  if (!fromSelect || !balanceDisplay)
    return;
  const account = accounts.find((a) => a.name === fromSelect.value);
  if (account) {
    balanceDisplay.textContent = account.balance.toString();
  } else {
    balanceDisplay.textContent = "0";
  }
}
async function executeTransfer() {
  try {
    const fromSelect = document.getElementById("transferFrom");
    const toSelect = document.getElementById("transferTo");
    const amountInput = document.getElementById("transferAmount");
    const fromAccount = fromSelect.value;
    const toAccount = toSelect.value;
    const amount = parseFloat(amountInput.value);
    if (!fromAccount || !toAccount || !amount || amount <= 0) {
      log("❌ Please fill in all transfer fields", "error");
      return;
    }
    if (fromAccount === toAccount) {
      log("❌ Cannot transfer to the same account", "error");
      return;
    }
    const fromAccountObj = accounts.find((a) => a.name === fromAccount);
    if (!fromAccountObj || fromAccountObj.balance < amount) {
      log("❌ Insufficient balance", "error");
      return;
    }
    log(`\uD83D\uDD04 Transferring ${amount} BB from ${fromAccount} to ${toAccount}...`, "info");
    await invoke("transfer", {
      from: fromAccount,
      to: toAccount,
      amount
    });
    log(`✅ Transfer successful!`, "success");
    amountInput.value = "";
    fromSelect.value = "";
    toSelect.value = "";
    await loadAccounts();
  } catch (error) {
    log(`❌ Transfer failed: ${error}`, "error");
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
    log("⚡ Initializing BlackBook L1 Desktop App...", "info");
    await loadAccounts();
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
    transfersBtn.addEventListener("click", () => switchPage("transfers"));
  }
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => switchPage("markets"));
  }
  const fromSelect = document.getElementById("transferFrom");
  if (fromSelect) {
    fromSelect.addEventListener("change", updateFromBalance);
  }
  const sendBtn = document.getElementById("sendTransferBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", executeTransfer);
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
window.updateFromBalance = updateFromBalance;
window.executeTransfer = executeTransfer;
