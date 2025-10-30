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
var allAccounts = [];
var allMarkets = [];
var selectedMarket = null;
var selectedOutcome = null;
function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const consoleEl = document.getElementById("debugConsole");
  if (consoleEl) {
    const div = document.createElement("div");
    div.className = `console-message ${type}`;
    div.textContent = `[${timestamp}] ${message}`;
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    while (consoleEl.children.length > 100) {
      consoleEl.removeChild(consoleEl.firstChild);
    }
  }
  console.log(message);
}
async function loadAccounts() {
  try {
    log("\uD83D\uDCE1 Fetching accounts from blockchain...");
    allAccounts = await invoke("get_accounts");
    log(`✅ Loaded ${allAccounts.length} L1 accounts`, "success");
    renderAccountsList();
    renderAccountSelect();
    updateNetworkStats();
    if (allAccounts.length > 0) {
      selectAccount(allAccounts[0].name);
    }
  } catch (error) {
    log(`Accounts fetch failed: ${error}`, "error");
    throw error;
  }
}
async function loadMarkets() {
  try {
    log("� Loading prediction markets...");
    allMarkets = await invoke("get_markets");
    log(`✅ Loaded ${allMarkets.length} active markets`, "success");
    renderMarketsList();
    renderMarketSelect();
  } catch (error) {
    log(`Markets fetch failed: ${error}`, "error");
  }
}
function renderAccountsList() {
  const list = document.getElementById("accountsList");
  if (!list)
    return;
  list.innerHTML = allAccounts.map((acc) => `
        <div class="account-item" data-name="${acc.name}">
            <strong>${acc.name}</strong><br>
            <small>${acc.balance.toFixed(2)} BB</small>
        </div>
    `).join("");
  list.querySelectorAll(".account-item").forEach((item) => {
    item.addEventListener("click", () => {
      const name = item.dataset.name;
      if (name)
        selectAccount(name);
    });
  });
}
function renderAccountSelect() {
  const select = document.getElementById("accountSelect");
  if (!select)
    return;
  select.innerHTML = '<option value="">Select Account</option>' + allAccounts.map((acc) => `<option value="${acc.name}">${acc.name} (${acc.balance.toFixed(2)} BB)</option>`).join("");
}
function renderMarketsList() {
  const list = document.getElementById("marketsList");
  if (!list)
    return;
  list.innerHTML = allMarkets.map((market) => `
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
    `).join("");
  list.querySelectorAll(".market-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      if (id)
        selectMarket(id);
    });
  });
}
function renderMarketSelect() {
  const select = document.getElementById("marketSelect");
  if (!select)
    return;
  select.innerHTML = '<option value="">Select Market</option>' + allMarkets.map((m) => `<option value="${m.id}">${m.title}</option>`).join("");
}
function selectAccount(name) {
  selectedAccount = allAccounts.find((acc) => acc.name === name) || null;
  if (!selectedAccount)
    return;
  document.querySelectorAll(".account-item").forEach((item) => {
    item.classList.toggle("selected", item.dataset.name === name);
  });
  const addressEl = document.getElementById("selectedAddress");
  const balanceEl = document.getElementById("selectedBalance");
  const select = document.getElementById("accountSelect");
  if (addressEl)
    addressEl.textContent = selectedAccount.address;
  if (balanceEl)
    balanceEl.textContent = `${selectedAccount.balance.toFixed(2)} BB`;
  if (select)
    select.value = name;
  updateBetButton();
  log(`\uD83D\uDC64 Selected account: ${selectedAccount.name}`, "info");
}
function selectMarket(id) {
  selectedMarket = allMarkets.find((m) => m.id === id) || null;
  if (!selectedMarket)
    return;
  document.querySelectorAll(".market-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.id === id);
  });
  const select = document.getElementById("marketSelect");
  if (select)
    select.value = id;
  updateBetButton();
  log(`\uD83D\uDCCA Selected market: ${selectedMarket.title}`, "info");
}
async function placeBet() {
  if (!selectedAccount || !selectedMarket || !selectedOutcome) {
    log("❌ Please select account, market, and outcome", "error");
    return;
  }
  const amountInput = document.getElementById("betAmount");
  const amount = parseFloat(amountInput?.value || "0");
  if (amount <= 0) {
    log("❌ Please enter a valid bet amount", "error");
    return;
  }
  if (amount > selectedAccount.balance) {
    log("❌ Insufficient balance", "error");
    return;
  }
  try {
    log(`\uD83C\uDFAF Placing ${amount} BB bet on ${selectedOutcome} for ${selectedMarket.title}...`, "info");
    const result = await invoke("place_market_bet", {
      marketId: selectedMarket.id,
      accountName: selectedAccount.name,
      amount,
      outcome: selectedOutcome
    });
    log(`✅ ${result}`, "success");
    await loadAccounts();
    if (amountInput)
      amountInput.value = "";
    selectedOutcome = null;
    document.querySelectorAll(".outcome-btn").forEach((btn) => btn.classList.remove("selected"));
    updateBetButton();
  } catch (error) {
    log(`❌ Bet failed: ${error}`, "error");
  }
}
async function updatePrices() {
  const btcPrice = 67000 + (Math.random() - 0.5) * 2000;
  const solPrice = 180 + (Math.random() - 0.5) * 20;
  const btcEl = document.getElementById("btcPrice");
  const solEl = document.getElementById("solPrice");
  if (btcEl)
    btcEl.textContent = `$${btcPrice.toFixed(0)}`;
  if (solEl)
    solEl.textContent = `$${solPrice.toFixed(2)}`;
}
function updateNetworkStats() {
  const statsEl = document.getElementById("networkStats");
  if (!statsEl)
    return;
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
            <span class="stat-value">\uD83D\uDFE2 Online</span>
        </div>
    `;
}
function updateBetButton() {
  const btn = document.getElementById("placeBetBtn");
  const amountInput = document.getElementById("betAmount");
  if (!btn)
    return;
  const amount = parseFloat(amountInput?.value || "0");
  const canBet = selectedAccount && selectedMarket && selectedOutcome && amount > 0 && amount <= selectedAccount.balance;
  btn.disabled = !canBet;
  btn.textContent = canBet ? `Place ${amount} BB on ${selectedOutcome}` : "Select Account, Market & Amount";
}
function setupEventListeners() {
  const accountSelect = document.getElementById("accountSelect");
  accountSelect?.addEventListener("change", (e) => {
    const name = e.target.value;
    if (name)
      selectAccount(name);
  });
  const marketSelect = document.getElementById("marketSelect");
  marketSelect?.addEventListener("change", (e) => {
    const id = e.target.value;
    if (id)
      selectMarket(id);
  });
  document.querySelectorAll(".quick-bet").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const amount = e.target.dataset.amount;
      const amountInput2 = document.getElementById("betAmount");
      if (amountInput2 && amount) {
        amountInput2.value = amount;
        updateBetButton();
      }
    });
  });
  const higherBtn = document.getElementById("higherBtn");
  const lowerBtn = document.getElementById("lowerBtn");
  higherBtn?.addEventListener("click", () => {
    selectedOutcome = "YES";
    higherBtn.classList.add("selected");
    lowerBtn?.classList.remove("selected");
    updateBetButton();
  });
  lowerBtn?.addEventListener("click", () => {
    selectedOutcome = "NO";
    lowerBtn.classList.add("selected");
    higherBtn?.classList.remove("selected");
    updateBetButton();
  });
  const amountInput = document.getElementById("betAmount");
  amountInput?.addEventListener("input", updateBetButton);
  const placeBetBtn = document.getElementById("placeBetBtn");
  placeBetBtn?.addEventListener("click", placeBet);
  const clearBtn = document.getElementById("clearConsole");
  clearBtn?.addEventListener("click", () => {
    const consoleEl = document.getElementById("debugConsole");
    if (consoleEl) {
      consoleEl.innerHTML = '<div class="console-message">Console cleared...</div>';
    }
  });
  const adminBtn = document.getElementById("adminBtn");
  adminBtn?.addEventListener("click", () => {
    log("\uD83D\uDC51 Admin panel clicked", "info");
  });
}
async function init() {
  log("\uD83D\uDE80 BlackBook initializing...");
  try {
    await loadAccounts();
    await loadMarkets();
    updatePrices();
    setupEventListeners();
    setInterval(updatePrices, 30000);
    log("✅ BlackBook L1 initialized successfully", "success");
  } catch (error) {
    log(`Init failed: ${error}`, "error");
  }
}
document.addEventListener("DOMContentLoaded", init);
