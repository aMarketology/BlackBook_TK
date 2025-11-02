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
        // Tab navigation
        this.setupTabNavigation();
        
        // Transfer tab listeners
        const fromSelect = document.getElementById('transferFrom') as HTMLSelectElement;
        if (fromSelect) {
            fromSelect.addEventListener('change', () => this.updateFromBalance());
        }

        const sendBtn = document.getElementById('sendTransferBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.executeTransfer());
        }

        // Quick transfer amount buttons
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

        // Admin panel listeners
        this.setupAdminPanelListeners();
        
        // Quick actions listeners
        this.setupQuickActionsListeners();
    }

    /**
     * Setup tab navigation
     */
    static setupTabNavigation(): void {
        const transferTab = document.getElementById('transferTab');
        const adminTab = document.getElementById('adminTab');
        const quickActionsTab = document.getElementById('quickActionsTab');
        
        const transferContent = document.getElementById('transferTabContent');
        const adminContent = document.getElementById('adminTabContent');
        const quickActionsContent = document.getElementById('quickActionsTabContent');

        if (transferTab) {
            transferTab.addEventListener('click', () => {
                this.switchTab('transfer', transferTab, transferContent);
            });
        }

        if (adminTab) {
            adminTab.addEventListener('click', () => {
                this.switchTab('admin', adminTab, adminContent);
                this.populateAdminSelects();
            });
        }

        if (quickActionsTab) {
            quickActionsTab.addEventListener('click', () => {
                this.switchTab('quickActions', quickActionsTab, quickActionsContent);
                this.populateQuickActionSelects();
            });
        }
    }

    /**
     * Switch between tabs
     */
    static switchTab(tabName: string, tabButton: HTMLElement, content: HTMLElement | null): void {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab
        tabButton.classList.add('active');
        if (content) {
            content.classList.add('active');
        }

        debugConsole.log(`📑 Switched to ${tabName} tab`, 'info');
    }

    /**
     * Setup admin panel event listeners
     */
    static setupAdminPanelListeners(): void {
        // Mint tokens
        const mintBtn = document.getElementById('mintTokensBtn');
        if (mintBtn) {
            mintBtn.addEventListener('click', () => this.executeMintTokens());
        }

        // Set balance
        const setBalanceBtn = document.getElementById('setBalanceBtn');
        if (setBalanceBtn) {
            setBalanceBtn.addEventListener('click', () => this.executeSetBalance());
        }

        // Update current balance when account is selected
        const setBalanceAccount = document.getElementById('setBalanceAccount') as HTMLSelectElement;
        if (setBalanceAccount) {
            setBalanceAccount.addEventListener('change', () => this.updateCurrentBalance());
        }
    }

    /**
     * Setup quick actions event listeners
     */
    static setupQuickActionsListeners(): void {
        // Get user bets
        const getUserBetsBtn = document.getElementById('getUserBetsBtn');
        if (getUserBetsBtn) {
            getUserBetsBtn.addEventListener('click', () => this.executeGetUserBets());
        }

        // Get all markets
        const getAllMarketsBtn = document.getElementById('getAllMarketsBtn');
        if (getAllMarketsBtn) {
            getAllMarketsBtn.addEventListener('click', () => this.executeGetAllMarkets());
        }

        // Quick mint
        const quickMintBtn = document.getElementById('quickMintBtn');
        if (quickMintBtn) {
            quickMintBtn.addEventListener('click', () => this.executeQuickMint());
        }

        // Quick balance
        const quickBalanceBtn = document.getElementById('quickBalanceBtn');
        if (quickBalanceBtn) {
            quickBalanceBtn.addEventListener('click', () => this.executeQuickBalance());
        }

        // Close results
        const closeResults = document.getElementById('closeResults');
        if (closeResults) {
            closeResults.addEventListener('click', () => this.closeResults());
        }
    }

    /**
     * Populate admin panel selects with accounts
     */
    static populateAdminSelects(): void {
        const mintAccount = document.getElementById('mintAccount') as HTMLSelectElement;
        const setBalanceAccount = document.getElementById('setBalanceAccount') as HTMLSelectElement;

        if (!mintAccount || !setBalanceAccount) return;

        const options = this.accounts
            .map((account) => `<option value="${account.name}">${account.name} (${account.balance} BB)</option>`)
            .join('');

        mintAccount.innerHTML = '<option value="">Select account...</option>' + options;
        setBalanceAccount.innerHTML = '<option value="">Select account...</option>' + options;
    }

    /**
     * Populate quick action selects with accounts
     */
    static populateQuickActionSelects(): void {
        const userBetsAccount = document.getElementById('userBetsAccount') as HTMLSelectElement;
        const quickMintAccount = document.getElementById('quickMintAccount') as HTMLSelectElement;
        const quickBalanceAccount = document.getElementById('quickBalanceAccount') as HTMLSelectElement;

        const options = this.accounts
            .map((account) => `<option value="${account.name}">${account.name}</option>`)
            .join('');

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

    /**
     * Execute mint tokens
     */
    static async executeMintTokens(): Promise<void> {
        try {
            const accountSelect = document.getElementById('mintAccount') as HTMLSelectElement;
            const amountInput = document.getElementById('mintAmount') as HTMLInputElement;
            const messageDiv = document.getElementById('mintMessage') as HTMLElement;
            const btn = document.getElementById('mintTokensBtn') as HTMLButtonElement;

            const account = accountSelect?.value;
            const amount = parseFloat(amountInput?.value || '0');

            if (!account || !amount || amount <= 0) {
                this.showAdminMessage('mintMessage', '❌ Please select account and enter valid amount', 'error');
                return;
            }

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Minting...</span>';
            }

            debugConsole.log(`🪙 Minting ${amount} BB to ${account}...`, 'info');
            const result = await BackendService.adminMintTokens(account, amount);

            this.showAdminMessage('mintMessage', `✅ ${result}`, 'success');
            debugConsole.log(`✅ Minted ${amount} BB to ${account}`, 'success');

            // Reset form
            if (amountInput) amountInput.value = '';
            if (accountSelect) accountSelect.value = '';

            // Refresh balances
            await this.refreshAccountBalances();
            this.populateAdminSelects();

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">🪙</span><span class="btn-text">Mint Tokens</span>';
            }
        } catch (error) {
            debugConsole.log(`❌ Mint failed: ${error}`, 'error');
            this.showAdminMessage('mintMessage', `❌ Mint failed: ${error}`, 'error');

            const btn = document.getElementById('mintTokensBtn') as HTMLButtonElement;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">🪙</span><span class="btn-text">Mint Tokens</span>';
            }
        }
    }

    /**
     * Update current balance display when account is selected
     */
    static updateCurrentBalance(): void {
        const accountSelect = document.getElementById('setBalanceAccount') as HTMLSelectElement;
        const currentBalance = document.getElementById('currentBalance') as HTMLElement;

        if (!accountSelect || !currentBalance) return;

        const selectedAccountName = accountSelect.value;
        const selectedAccount = this.accounts.find((a) => a.name === selectedAccountName);

        if (selectedAccount) {
            currentBalance.textContent = selectedAccount.balance.toString();
        } else {
            currentBalance.textContent = '0';
        }
    }

    /**
     * Execute set balance
     */
    static async executeSetBalance(): Promise<void> {
        try {
            const accountSelect = document.getElementById('setBalanceAccount') as HTMLSelectElement;
            const balanceInput = document.getElementById('newBalance') as HTMLInputElement;
            const messageDiv = document.getElementById('setBalanceMessage') as HTMLElement;
            const btn = document.getElementById('setBalanceBtn') as HTMLButtonElement;

            const account = accountSelect?.value;
            const newBalance = parseFloat(balanceInput?.value || '0');

            if (!account || newBalance < 0) {
                this.showAdminMessage('setBalanceMessage', '❌ Please select account and enter valid balance', 'error');
                return;
            }

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Setting...</span>';
            }

            debugConsole.log(`⚖️ Setting ${account} balance to ${newBalance} BB...`, 'info');
            const result = await BackendService.adminSetBalance(account, newBalance);

            this.showAdminMessage('setBalanceMessage', `✅ ${result}`, 'success');
            debugConsole.log(`✅ Set ${account} balance to ${newBalance} BB`, 'success');

            // Reset form
            if (balanceInput) balanceInput.value = '';
            if (accountSelect) accountSelect.value = '';

            // Refresh balances
            await this.refreshAccountBalances();
            this.populateAdminSelects();

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">⚖️</span><span class="btn-text">Set Balance</span>';
            }
        } catch (error) {
            debugConsole.log(`❌ Set balance failed: ${error}`, 'error');
            this.showAdminMessage('setBalanceMessage', `❌ Set balance failed: ${error}`, 'error');

            const btn = document.getElementById('setBalanceBtn') as HTMLButtonElement;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">⚖️</span><span class="btn-text">Set Balance</span>';
            }
        }
    }

    /**
     * Execute get user bets
     */
    static async executeGetUserBets(): Promise<void> {
        try {
            const accountSelect = document.getElementById('userBetsAccount') as HTMLSelectElement;
            const account = accountSelect?.value;

            if (!account) {
                this.showResults('Error', '❌ Please select an account', 'error');
                return;
            }

            debugConsole.log(`👥 Fetching bets for ${account}...`, 'info');
            const bets = await BackendService.getUserBets(account);

            if (bets.length === 0) {
                this.showResults(`${account}'s Bets`, `<p class="no-data">No bets found for ${account}</p>`, 'info');
            } else {
                const betsHTML = bets.map(bet => `
                    <div class="bet-item">
                        <div><strong>Market:</strong> ${bet.market_id || 'N/A'}</div>
                        <div><strong>Amount:</strong> ${bet.amount} BB</div>
                        <div><strong>Prediction:</strong> ${bet.prediction || 'N/A'}</div>
                        <div><strong>Status:</strong> ${bet.status || 'Active'}</div>
                    </div>
                `).join('');
                
                this.showResults(`${account}'s Bets (${bets.length})`, betsHTML, 'success');
                debugConsole.log(`✅ Found ${bets.length} bets for ${account}`, 'success');
            }
        } catch (error) {
            debugConsole.log(`❌ Failed to get user bets: ${error}`, 'error');
            this.showResults('Error', `❌ Failed to get user bets: ${error}`, 'error');
        }
    }

    /**
     * Execute get all markets
     */
    static async executeGetAllMarkets(): Promise<void> {
        try {
            debugConsole.log(`📊 Fetching all markets...`, 'info');
            const markets = await BackendService.getAllMarkets();

            if (markets.length === 0) {
                this.showResults('All Markets', '<p class="no-data">No markets found</p>', 'info');
            } else {
                const marketsHTML = markets.map(market => `
                    <div class="market-item">
                        <div><strong>ID:</strong> ${market.id}</div>
                        <div><strong>Title:</strong> ${market.title || 'Untitled'}</div>
                        <div><strong>Volume:</strong> ${market.total_volume || 0} BB</div>
                        <div><strong>Status:</strong> ${market.status || 'Active'}</div>
                    </div>
                `).join('');
                
                this.showResults(`All Markets (${markets.length})`, marketsHTML, 'success');
                debugConsole.log(`✅ Found ${markets.length} markets`, 'success');
            }
        } catch (error) {
            debugConsole.log(`❌ Failed to get markets: ${error}`, 'error');
            this.showResults('Error', `❌ Failed to get markets: ${error}`, 'error');
        }
    }

    /**
     * Execute quick mint
     */
    static async executeQuickMint(): Promise<void> {
        try {
            const accountSelect = document.getElementById('quickMintAccount') as HTMLSelectElement;
            const amountInput = document.getElementById('quickMintAmount') as HTMLInputElement;

            const account = accountSelect?.value;
            const amount = parseFloat(amountInput?.value || '0');

            if (!account || !amount || amount <= 0) {
                this.showResults('Error', '❌ Please select account and enter valid amount', 'error');
                return;
            }

            debugConsole.log(`🪙 Quick minting ${amount} BB to ${account}...`, 'info');
            const result = await BackendService.adminMintTokens(account, amount);

            this.showResults('Quick Mint', `✅ ${result}`, 'success');
            debugConsole.log(`✅ Quick minted ${amount} BB to ${account}`, 'success');

            await this.refreshAccountBalances();
            this.populateQuickActionSelects();
        } catch (error) {
            debugConsole.log(`❌ Quick mint failed: ${error}`, 'error');
            this.showResults('Error', `❌ Quick mint failed: ${error}`, 'error');
        }
    }

    /**
     * Execute quick balance
     */
    static async executeQuickBalance(): Promise<void> {
        try {
            const accountSelect = document.getElementById('quickBalanceAccount') as HTMLSelectElement;
            const amountInput = document.getElementById('quickBalanceAmount') as HTMLInputElement;

            const account = accountSelect?.value;
            const newBalance = parseFloat(amountInput?.value || '0');

            if (!account || newBalance < 0) {
                this.showResults('Error', '❌ Please select account and enter valid balance', 'error');
                return;
            }

            debugConsole.log(`⚖️ Quick setting ${account} balance to ${newBalance} BB...`, 'info');
            const result = await BackendService.adminSetBalance(account, newBalance);

            this.showResults('Quick Balance', `✅ ${result}`, 'success');
            debugConsole.log(`✅ Quick set ${account} balance to ${newBalance} BB`, 'success');

            await this.refreshAccountBalances();
            this.populateQuickActionSelects();
        } catch (error) {
            debugConsole.log(`❌ Quick balance failed: ${error}`, 'error');
            this.showResults('Error', `❌ Quick balance failed: ${error}`, 'error');
        }
    }

    /**
     * Show admin message
     */
    static showAdminMessage(elementId: string, message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const messageDiv = document.getElementById(elementId) as HTMLElement;
        if (!messageDiv) return;

        messageDiv.textContent = message;
        messageDiv.className = `admin-message admin-message-${type}`;
        messageDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Show results in quick actions
     */
    static showResults(title: string, content: string, type: string = 'info'): void {
        const resultsContainer = document.getElementById('quickActionsResults') as HTMLElement;
        const resultsTitle = document.getElementById('resultsTitle') as HTMLElement;
        const resultsContent = document.getElementById('resultsContent') as HTMLElement;

        if (!resultsContainer || !resultsTitle || !resultsContent) return;

        resultsTitle.textContent = title;
        resultsContent.innerHTML = content;
        resultsContainer.style.display = 'block';
        resultsContainer.className = `results-container results-${type}`;
    }

    /**
     * Close results display
     */
    static closeResults(): void {
        const resultsContainer = document.getElementById('quickActionsResults') as HTMLElement;
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
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
