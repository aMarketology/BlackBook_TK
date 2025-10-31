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

// src/lib/prices.ts
var COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";
var CACHE_DURATION_MS = 60 * 1000;
var cache = null;
async function getPrices() {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_DURATION_MS) {
    return {
      btc: cache.btc,
      sol: cache.sol
    };
  }
  try {
    const params = new URLSearchParams({
      ids: "bitcoin,solana",
      vs_currencies: "usd"
    });
    const response = await fetch(`${COINGECKO_API}?${params}`);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.bitcoin?.usd || !data.solana?.usd) {
      throw new Error("Invalid CoinGecko response: missing price data");
    }
    const btc = data.bitcoin.usd;
    const sol = data.solana.usd;
    cache = {
      btc,
      sol,
      timestamp: now
    };
    return { btc, sol };
  } catch (error) {
    console.error("❌ Price fetch failed:", error);
    throw error;
  }
}
function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

// src/lib/polymarket.ts
var POLYMARKET_API = "https://gamma-api.polymarket.com/markets";
async function getPolymarketEvents() {
  try {
    const response = await fetch(`${POLYMARKET_API}?limit=50&active=true`);
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    const data = await response.json();
    const markets = (data || []).slice(0, 7).map((market) => ({
      id: market.id || market.condition_id || `market_${Math.random()}`,
      question: market.question || "Unknown Market",
      description: market.description || "",
      outcomes: market.outcomes || ["YES", "NO"],
      outcomesPrices: market.outcome_prices || [0.5, 0.5],
      volume24h: market.volume_24h || 0,
      volume: market.volume || 0,
      active: market.active !== false
    }));
    return markets;
  } catch (error) {
    console.error("❌ Polymarket API fetch failed:", error);
    throw error;
  }
}
function formatVolume(volume) {
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K`;
  }
  return `$${volume.toFixed(0)}`;
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
    const prices = await getPrices();
    const btcEl = document.getElementById("btcPrice");
    const solEl = document.getElementById("solPrice");
    if (btcEl)
      btcEl.textContent = formatPrice(prices.btc);
    if (solEl)
      solEl.textContent = formatPrice(prices.sol);
    log(`✅ Updated prices - BTC: ${formatPrice(prices.btc)}, SOL: ${formatPrice(prices.sol)}`, "success");
  } catch (error) {
    log(`⚠️ Price update failed: ${error}`, "warning");
    const btcEl = document.getElementById("btcPrice");
    const solEl = document.getElementById("solPrice");
    if (btcEl)
      btcEl.textContent = "API Error";
    if (solEl)
      solEl.textContent = "API Error";
  }
}
async function loadPolymarketEvents() {
  try {
    log("\uD83D\uDD2E Fetching Polymarket events...", "info");
    const polymarketData = await getPolymarketEvents();
    log(`✅ Loaded ${polymarketData.length} Polymarket events`, "success");
    const polyEl = document.getElementById("polymarketEvents");
    if (polyEl && polymarketData.length > 0) {
      polyEl.innerHTML = polymarketData.map((m) => `
                <div class="market-card">
                    <h3>${m.question}</h3>
                    <p>${m.description}</p>
                    <div class="market-prices">
                        <div class="price-column">
                            <span class="label">${m.outcomes[0] || "YES"}</span>
                            <span class="price">${(m.outcomesPrices[0] * 100).toFixed(0)}¢</span>
                        </div>
                        <div class="price-column">
                            <span class="label">${m.outcomes[1] || "NO"}</span>
                            <span class="price">${(m.outcomesPrices[1] * 100).toFixed(0)}¢</span>
                        </div>
                    </div>
                    <div class="market-volume">Vol: ${formatVolume(m.volume)}</div>
                </div>
            `).join("");
    }
  } catch (error) {
    log(`⚠️ Polymarket fetch failed: ${error}`, "warning");
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
  await updatePrices();
  await loadPolymarketEvents();
  setInterval(updatePrices, 30000);
}
document.addEventListener("DOMContentLoaded", () => {
  init();
});
window.selectAccount = selectAccount;
window.placeBet = placeBet;
