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
async function placeBet(marketId, outcome, amount) {
  try {
    if (!selectedAccount) {
      log("❌ No account selected", "error");
      return;
    }
    log(`\uD83C\uDFAF Placing ${outcome} bet for ${amount} BB on market ${marketId}...`, "info");
    const result = await invoke("place_bet", {
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
  const list = document.getElementById("accountsList");
  if (!list)
    return;
  list.innerHTML = accounts.map((acc) => `
        <div class="account-item ${selectedAccount?.name === acc.name ? "active" : ""}" onclick="selectAccount('${acc.name}')">
            <div class="account-name">${acc.name}</div>
            <div class="account-balance">${acc.balance.toFixed(2)} BB</div>
        </div>
    `).join("");
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
  renderAccounts();
  updateAccountInfo();
}
function updateAccountInfo() {
  const addressEl = document.getElementById("selectedAddress");
  const balanceEl = document.getElementById("selectedBalance");
  if (selectedAccount) {
    if (addressEl)
      addressEl.textContent = selectedAccount.address;
    if (balanceEl)
      balanceEl.textContent = `${selectedAccount.balance.toFixed(2)} BB`;
  } else {
    if (addressEl)
      addressEl.textContent = "--";
    if (balanceEl)
      balanceEl.textContent = "0 BB";
  }
}
async function init() {
  log("⚡ Initializing BlackBook L1 Desktop App...", "info");
  await loadAccounts();
  await loadMarkets();
}
document.addEventListener("DOMContentLoaded", () => {
  init();
});
window.selectAccount = selectAccount;
window.placeBet = placeBet;
