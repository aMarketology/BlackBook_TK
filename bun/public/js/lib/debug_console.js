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
export {
  debugConsole,
  DebugConsole
};
