/**
 * BlackBook Debug Console
 * Manages all debug logging and console display
 * Critical for monitoring blockchain connection and account loading
 */

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    emoji?: string;
}

export class DebugConsole {
    private messages: LogMessage[] = [];
    private maxMessages = 100;
    private consoleElement: HTMLElement | null = null;

    constructor() {
        this.consoleElement = document.getElementById('debugConsole');
    }

    /**
     * Log a message to the debug console
     * @param message The message to log
     * @param level The log level (info, success, warning, error)
     */
    public log(message: string, level: LogLevel = 'info'): void {
        const timestamp = new Date().toLocaleTimeString();
        
        const logMsg: LogMessage = {
            timestamp,
            level,
            message,
        };

        this.messages.push(logMsg);

        // Keep only the last maxMessages
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }

        this.render();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Log blockchain connection status
     * @param connected Whether the blockchain is connected
     */
    public logBlockchainConnection(connected: boolean): void {
        if (connected) {
            this.log('✅ Blockchain Connection: YES', 'success');
        } else {
            this.log('❌ Blockchain Connection: NO', 'error');
        }
    }

    /**
     * Log account loading status
     * @param loaded Whether 8 accounts were loaded
     * @param count The number of accounts loaded
     * @param accountNames The names of the loaded accounts
     */
    public logAccountsLoaded(loaded: boolean, count: number, accountNames: string[] = []): void {
        if (loaded && count === 8) {
            this.log(
                `✅ 8 Accounts Loaded: YES (${accountNames.join(', ')})`,
                'success'
            );
        } else if (count > 0) {
            this.log(
                `⚠️ 8 Accounts Loaded: PARTIAL (${count}/8) - ${accountNames.join(', ')}`,
                'warning'
            );
        } else {
            this.log('❌ 8 Accounts Loaded: NO', 'error');
        }
    }

    /**
     * Clear all messages from the console
     */
    public clear(): void {
        this.messages = [];
        this.render();
    }

    /**
     * Render the console to the DOM
     */
    private render(): void {
        if (!this.consoleElement) return;

        this.consoleElement.innerHTML = this.messages
            .map((msg) => this.formatMessage(msg))
            .join('');

        // Auto-scroll to bottom
        this.consoleElement.scrollTop = this.consoleElement.scrollHeight;
    }

    /**
     * Format a log message for display
     * @param msg The log message to format
     * @returns HTML string for the message
     */
    private formatMessage(msg: LogMessage): string {
        const levelClass = `console-${msg.level}`;
        return `
            <div class="console-message ${levelClass}">
                <span class="console-time">[${msg.timestamp}]</span>
                <span class="console-level">${msg.level.toUpperCase()}</span>
                <span class="console-text">${this.escapeHtml(msg.message)}</span>
            </div>
        `;
    }

    /**
     * Escape HTML special characters to prevent XSS
     * @param text The text to escape
     * @returns Escaped text
     */
    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, (char) => map[char]);
    }

    /**
     * Get all logged messages
     * @returns Array of log messages
     */
    public getMessages(): LogMessage[] {
        return [...this.messages];
    }

    /**
     * Export logs as JSON
     * @returns JSON string of all messages
     */
    public exportLogs(): string {
        return JSON.stringify(this.messages, null, 2);
    }

    /**
     * Export logs as CSV
     * @returns CSV string of all messages
     */
    public exportLogsCSV(): string {
        const headers = ['Timestamp', 'Level', 'Message'].join(',');
        const rows = this.messages
            .map((msg) =>
                [msg.timestamp, msg.level.toUpperCase(), `"${msg.message}"`].join(',')
            )
            .join('\n');
        return `${headers}\n${rows}`;
    }
}

// Create a singleton instance
export const debugConsole = new DebugConsole();
