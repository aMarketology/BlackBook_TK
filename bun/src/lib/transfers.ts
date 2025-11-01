/**
 * BlackBook Transfers Module
 * Handles all transfer-related functionality including form logic, validation, and execution
 * Self-contained module - import and use in main.ts
 */

import { BackendService } from './backend_service';
import { debugConsole } from './debug_console';

import type { Account } from '../main';

export class TransfersModule {
    private static accounts: Account[] = [];
    private static onTransferComplete: (() => Promise<void>) | null = null;

    /**
     * Set a callback to be called after successful transfers
     */
    static setOnTransferComplete(callback: () => Promise<void>): void {
        this.onTransferComplete = callback;
    }

    /**
     * Initialize the transfers module with current accounts
     */
    static setAccounts(accounts: Account[]): void {
        this.accounts = accounts;
    }

    /**
     * Get current accounts
     */
    static getAccounts(): Account[] {
        return this.accounts;
    }

    /**
     * Populate the transfer form account selectors
     */
    static populateTransferSelects(): void {
        const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
        const toSelect = document.getElementById('transferTo') as HTMLSelectElement;

        if (!fromSelect || !toSelect) return;

        // Build options for both selects
        const options = this.accounts
            .map((account) => `<option value="${account.name}">${account.name} (${account.balance} BB)</option>`)
            .join('');

        // Populate from select
        fromSelect.innerHTML = '<option value="">Select sender...</option>' + options;

        // Populate to select
        toSelect.innerHTML = '<option value="">Select recipient...</option>' + options;
    }

    /**
     * Handle when user selects a "from" account
     * Updates balance display and max available
     */
    static updateFromBalance(): void {
        const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
        const fromBalance = document.getElementById('fromBalance') as HTMLElement;
        const maxAvailable = document.getElementById('maxAvailable') as HTMLElement;

        if (!fromSelect || !fromBalance || !maxAvailable) return;

        const selectedAccountName = fromSelect.value;
        const selectedAccount = this.accounts.find((a) => a.name === selectedAccountName);

        if (selectedAccount) {
            fromBalance.textContent = selectedAccount.balance.toString();
            maxAvailable.textContent = selectedAccount.balance.toString();
            debugConsole.log(`Selected from account: ${selectedAccount.name} (${selectedAccount.balance} BB)`, 'info');
        } else {
            fromBalance.textContent = '0';
            maxAvailable.textContent = '0';
        }
    }

    /**
     * Set amount via quick transfer buttons
     */
    static setQuickTransferAmount(amount: number): void {
        const amountInput = document.getElementById('transferAmount') as HTMLInputElement;
        if (amountInput) {
            amountInput.value = amount.toString();
            debugConsole.log(`Quick transfer amount set to ${amount} BB`, 'info');
        }
    }

    /**
     * Refresh account balances after a transfer
     */
    static async refreshAccountBalances(): Promise<void> {
        try {
            // Fetch updated accounts from backend
            const updatedAccounts = await BackendService.getAllAccounts();
            this.accounts = updatedAccounts;
            
            // Update the transfer form selects with new balances
            this.populateTransferSelects();
            
            // Update the from balance display if an account is selected
            this.updateFromBalance();
            
            debugConsole.log('✅ Account balances refreshed', 'success');
        } catch (error) {
            debugConsole.log(`⚠️ Failed to refresh balances: ${error}`, 'warning');
        }
    }

    /**
     * Show transfer message in the form
     */
    static showTransferMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const messageDiv = document.getElementById('transferMessage') as HTMLElement;
        if (!messageDiv) return;

        messageDiv.textContent = message;
        messageDiv.className = `transfer-message transfer-message-${type}`;
        messageDiv.style.display = 'block';

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Execute a transfer between accounts
     */
    static async executeTransfer(): Promise<void> {
        try {
            const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
            const toSelect = document.getElementById('transferTo') as HTMLSelectElement;
            const amountInput = document.getElementById('transferAmount') as HTMLInputElement;
            const btn = document.getElementById('sendTransferBtn') as HTMLButtonElement;

            const fromAccount = fromSelect?.value;
            const toAccount = toSelect?.value;
            const amount = parseFloat(amountInput?.value || '0');

            // Validation
            if (!fromAccount || !toAccount || !amount || amount <= 0) {
                this.showTransferMessage('❌ Please fill in all transfer fields', 'error');
                debugConsole.log('❌ Please fill in all transfer fields', 'error');
                return;
            }

            if (fromAccount === toAccount) {
                this.showTransferMessage('❌ Cannot transfer to the same account', 'error');
                debugConsole.log('❌ Cannot transfer to the same account', 'error');
                return;
            }

            const fromAccountObj = this.accounts.find((a) => a.name === fromAccount);
            if (!fromAccountObj || fromAccountObj.balance < amount) {
                this.showTransferMessage(
                    `❌ Insufficient balance. Available: ${fromAccountObj?.balance || 0} BB`,
                    'error'
                );
                debugConsole.log('❌ Insufficient balance', 'error');
                return;
            }

            // Disable button and show loading state
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Processing...</span>';
            }

            debugConsole.log(`🔄 Transferring ${amount} BB from ${fromAccount} to ${toAccount}...`, 'info');
            this.showTransferMessage(`⏳ Processing transfer of ${amount} BB...`, 'info');

            // Execute transfer via backend
            await BackendService.transfer(fromAccount, toAccount, amount);

            debugConsole.log(`✅ Transfer successful!`, 'success');
            this.showTransferMessage(
                `✅ Successfully transferred ${amount} BB from ${fromAccount} to ${toAccount}!`,
                'success'
            );

            // Reset form
            if (amountInput) amountInput.value = '';
            if (fromSelect) fromSelect.value = '';
            if (toSelect) toSelect.value = '';

            const fromBalance = document.getElementById('fromBalance') as HTMLElement;
            if (fromBalance) {
                fromBalance.textContent = '0';
            }

            // Re-enable button
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">📤</span><span class="btn-text">Send Transfer</span>';
            }

            // Reload accounts and stats to show updated balances
            await this.refreshAccountBalances();
            await this.updateTransferStats();
            
            // Call the global callback to update main page
            if (this.onTransferComplete) {
                await this.onTransferComplete();
            }
        } catch (error) {
            debugConsole.log(`❌ Transfer failed: ${error}`, 'error');
            this.showTransferMessage(`❌ Transfer failed: ${error}`, 'error');

            const btn = document.getElementById('sendTransferBtn') as HTMLButtonElement;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">📤</span><span class="btn-text">Send Transfer</span>';
            }
        }
    }

    /**
     * Update transfer statistics display
     */
    static async updateTransferStats(): Promise<void> {
        try {
            const stats = await BackendService.getLedgerStats();

            const statsAccounts = document.getElementById('statsAccounts') as HTMLElement;
            const statsVolume = document.getElementById('statsVolume') as HTMLElement;
            const statsTransfers = document.getElementById('statsTransfers') as HTMLElement;
            const statsBets = document.getElementById('statsBets') as HTMLElement;

            if (statsAccounts) statsAccounts.textContent = stats.totalAccounts?.toString() || '0';
            if (statsVolume) statsVolume.textContent = `${stats.totalVolume?.toString() || '0'} BB`;
            if (statsTransfers) statsTransfers.textContent = stats.totalTransactions?.toString() || '0';
            if (statsBets) statsBets.textContent = stats.totalBets?.toString() || '0';

            debugConsole.log('📊 Transfer statistics updated', 'info');
        } catch (error) {
            debugConsole.log(`⚠️ Failed to update transfer stats: ${error}`, 'warning');
        }
    }

    /**
     * Setup all event listeners for the transfers page
     */
    static setupEventListeners(): void {
        // From account selection
        const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
        if (fromSelect) {
            fromSelect.addEventListener('change', () => this.updateFromBalance());
        }

        // Send transfer button
        const sendBtn = document.getElementById('sendTransferBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.executeTransfer());
        }

        // Quick transfer buttons
        const quickTransfer50 = document.getElementById('quickTransfer50');
        if (quickTransfer50) {
            quickTransfer50.addEventListener('click', () => this.setQuickTransferAmount(50));
        }

        const quickTransfer100 = document.getElementById('quickTransfer100');
        if (quickTransfer100) {
            quickTransfer100.addEventListener('click', () => this.setQuickTransferAmount(100));
        }

        const quickTransfer500 = document.getElementById('quickTransfer500');
        if (quickTransfer500) {
            quickTransfer500.addEventListener('click', () => this.setQuickTransferAmount(500));
        }
    }

    /**
     * Initialize the transfers module
     */
    static initialize(accounts: Account[]): void {
        this.setAccounts(accounts);
        this.populateTransferSelects();
        this.setupEventListeners();
        debugConsole.log('✅ Transfers module initialized', 'success');
    }

    /**
     * Refresh the module with updated accounts
     */
    static refresh(accounts: Account[]): void {
        this.setAccounts(accounts);
        this.populateTransferSelects();
        this.updateFromBalance();
        this.updateTransferStats();
    }
}

// Export as singleton-like usage
export default TransfersModule;
