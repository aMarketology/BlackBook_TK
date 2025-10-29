// Admin Panel Component
import { store } from '../lib/store';
import { getAccounts, addBalance, transfer } from '../lib/api';
import { showToast } from '../lib/utils';
import type { Account } from '../types';

export class AdminPanel {
    private accounts: Account[] = [];
    
    constructor() {
        this.init();
    }
    
    async init() {
        await this.loadAccounts();
        this.render();
        this.attachEventListeners();
    }
    
    async loadAccounts() {
        try {
            this.accounts = await getAccounts();
            store.setAccounts(this.accounts);
        } catch (error) {
            console.error('Failed to load accounts:', error);
        }
    }
    
    render() {
        const container = document.getElementById('adminContent');
        if (!container) return;
        
        container.innerHTML = `
            <!-- SELECT ACCOUNT -->
            <div style="background: #e8f4f8; border-radius: 12px; padding: 30px; border: 2px solid #0088cc; margin-bottom: 25px;">
                <h3 style="color: #0066aa; margin-bottom: 20px; font-size: 18px; font-weight: 600;">
                    <i class="fas fa-user-circle"></i> Select Active Account
                </h3>
                <div id="adminAccountSelector" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    ${this.renderAccountButtons()}
                </div>
            </div>
            
            <!-- ACCOUNT DETAILS -->
            <div id="accountDetailsSection" style="display: none;">
                <!-- Selected Account Info -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; color: white; margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                        <div>
                            <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Selected Account</div>
                            <h3 id="detailAccountName" style="font-size: 28px; font-weight: 700; margin-bottom: 12px;">ALICE</h3>
                            <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; backdrop-filter: blur(10px); font-family: 'Courier New', monospace; font-size: 14px; word-break: break-all;">
                                <i class="fas fa-wallet" style="margin-right: 8px;"></i>
                                <span id="detailAccountAddress">0x...</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">Balance</div>
                            <div id="detailAccountBalance" style="font-size: 36px; font-weight: 700;">1000 BB</div>
                        </div>
                    </div>
                </div>
                
                <!-- Add Tokens Section -->
                <div style="background: white; border-radius: 12px; padding: 25px; border: 2px solid #e0e0e0; margin-bottom: 25px;">
                    <h3 style="color: #1c1e21; margin-bottom: 20px; font-size: 18px; font-weight: 600;">
                        <i class="fas fa-coins"></i> Add Tokens (GOD MODE)
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="addTokensAmount" placeholder="Enter amount" min="1" style="flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                        <button onclick="addTokensToAccount()" style="padding: 12px 24px; background: #1877f2; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Tokens
                        </button>
                    </div>
                </div>
                
                <!-- Transfer Tokens Section -->
                <div style="background: white; border-radius: 12px; padding: 25px; border: 2px solid #e0e0e0;">
                    <h3 style="color: #1c1e21; margin-bottom: 20px; font-size: 18px; font-weight: 600;">
                        <i class="fas fa-exchange-alt"></i> Transfer Tokens (GOD MODE)
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px;">
                        <!-- FROM Account -->
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; color: #1c1e21; margin-bottom: 8px;">
                                <i class="fas fa-arrow-right"></i> FROM Account
                            </label>
                            <select id="transferFromSelect" onchange="updateTransferFromUI()" 
                                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; cursor: pointer;">
                                <option value="">Select sender...</option>
                                ${this.accounts.map(acc => `<option value="${acc.name}">${acc.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <!-- TO Account -->
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; color: #1c1e21; margin-bottom: 8px;">
                                <i class="fas fa-arrow-left"></i> TO Account
                            </label>
                            <select id="transferToSelect"
                                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; cursor: pointer;">
                                <option value="">Select recipient...</option>
                                ${this.accounts.map(acc => `<option value="${acc.name}">${acc.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <!-- Amount -->
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; color: #1c1e21; margin-bottom: 8px;">
                                <i class="fas fa-coins"></i> Amount (BB)
                            </label>
                            <input type="number" id="transferAmount" placeholder="Enter amount" min="1" step="1" onchange="updateTransferFromUI()"
                                   style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                        </div>
                    </div>
                    
                    <!-- Balance Info -->
                    <div id="transferBalanceInfo" style="background: #f0f8ff; border-left: 4px solid #1877f2; padding: 15px; border-radius: 6px; margin-bottom: 20px; display: none;">
                        <div style="font-size: 13px; color: #333;">
                            <strong id="transferFromBalance"></strong> | 
                            Will have <strong id="transferFromBalanceAfter"></strong> after transfer
                        </div>
                    </div>
                    
                    <!-- Send Button -->
                    <button onclick="sendTransferGodMode()" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"
                            onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.4)';" 
                            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <i class="fas fa-paper-plane"></i> Execute Transfer
                    </button>
                </div>
            </div>
        `;
    }
    
    renderAccountButtons(): string {
        return this.accounts.map(account => `
            <button onclick="selectAdminAccount('${account.name}')" 
                    style="padding: 20px; background: white; border: 2px solid #e0e0e0; border-radius: 12px; cursor: pointer; transition: all 0.3s; text-align: left;"
                    onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.2)';"
                    onmouseout="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                    <i class="fas fa-user-circle" style="font-size: 32px; color: #667eea;"></i>
                    <div>
                        <div style="font-size: 18px; font-weight: 700; color: #1c1e21;">${account.name}</div>
                        <div style="font-size: 12px; color: #666;">Click to select</div>
                    </div>
                </div>
                <div style="background: #f0f2f5; border-radius: 6px; padding: 8px; font-size: 14px; font-weight: 600; color: #1877f2;">
                    💰 ${account.balance} BB
                </div>
            </button>
        `).join('');
    }
    
    attachEventListeners() {
        // These will be handled by global functions defined below
    }
}

// Global functions for HTML onclick handlers
(window as any).openAdminPanel = async function() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.add('active');
        const adminPanel = new AdminPanel();
    }
};

(window as any).closeAdminPanel = function() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

(window as any).selectAdminAccount = async function(accountName: string) {
    console.log('🔘 Admin account selected:', accountName);
    
    const state = store.getState();
    const account = state.accounts.find(a => a.name === accountName);
    
    if (!account) return;
    
    // Update store
    store.setCurrentAccount(account);
    
    // Show account details section
    const detailsSection = document.getElementById('accountDetailsSection');
    if (detailsSection) {
        detailsSection.style.display = 'block';
    }
    
    // Update account details
    const nameEl = document.getElementById('detailAccountName');
    const balanceEl = document.getElementById('detailAccountBalance');
    const addressEl = document.getElementById('detailAccountAddress');
    
    if (nameEl) nameEl.textContent = accountName;
    if (balanceEl) balanceEl.textContent = `${account.balance} BB`;
    if (addressEl) addressEl.textContent = `0x${accountName.toLowerCase()}...`;
    
    // Update selected account display in sidebar
    const sidebarDisplay = document.getElementById('selectedAccountDisplay');
    const sidebarName = document.getElementById('selectedAccountName');
    const sidebarBalance = document.getElementById('selectedAccountBalance');
    
    if (sidebarDisplay && sidebarName && sidebarBalance) {
        sidebarDisplay.style.display = 'block';
        sidebarName.textContent = accountName;
        sidebarBalance.textContent = `${account.balance} BB`;
    }
    
    showToast(`Account switched to ${accountName}`, 'success');
};

(window as any).addTokensToAccount = async function() {
    const state = store.getState();
    if (!state.currentAccount) {
        showToast('Please select an account first', 'error');
        return;
    }
    
    const amountInput = document.getElementById('addTokensAmount') as HTMLInputElement;
    const amount = parseInt(amountInput?.value || '0');
    
    if (amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        await addBalance(state.currentAccount.name, amount);
        
        // Update local state
        const newBalance = state.currentAccount.balance + amount;
        store.updateAccountBalance(state.currentAccount.name, newBalance);
        
        // Update UI
        const balanceEl = document.getElementById('detailAccountBalance');
        if (balanceEl) balanceEl.textContent = `${newBalance} BB`;
        
        const sidebarBalance = document.getElementById('selectedAccountBalance');
        if (sidebarBalance) sidebarBalance.textContent = `${newBalance} BB`;
        
        showToast(`✅ Added ${amount} BB to ${state.currentAccount.name}`, 'success');
        
        // Clear input
        if (amountInput) amountInput.value = '';
    } catch (error) {
        console.error('Failed to add tokens:', error);
        showToast('Failed to add tokens', 'error');
    }
};

(window as any).updateTransferFromUI = function() {
    const fromSelect = document.getElementById('transferFromSelect') as HTMLSelectElement;
    const amountInput = document.getElementById('transferAmount') as HTMLInputElement;
    const balanceInfo = document.getElementById('transferBalanceInfo');
    
    if (!fromSelect || !amountInput || !balanceInfo) return;
    
    const fromAccount = fromSelect.value;
    if (!fromAccount) {
        balanceInfo.style.display = 'none';
        return;
    }
    
    const state = store.getState();
    const account = state.accounts.find(a => a.name === fromAccount);
    if (!account) return;
    
    const amount = parseFloat(amountInput.value) || 0;
    const balanceAfter = account.balance - amount;
    
    const fromBalanceEl = document.getElementById('transferFromBalance');
    const afterBalanceEl = document.getElementById('transferFromBalanceAfter');
    
    if (fromBalanceEl) fromBalanceEl.textContent = `${account.name.toUpperCase()}: ${account.balance} BB`;
    if (afterBalanceEl) afterBalanceEl.textContent = `${balanceAfter} BB`;
    
    balanceInfo.style.display = 'block';
};

(window as any).sendTransferGodMode = async function() {
    const fromSelect = document.getElementById('transferFromSelect') as HTMLSelectElement;
    const toSelect = document.getElementById('transferToSelect') as HTMLSelectElement;
    const amountInput = document.getElementById('transferAmount') as HTMLInputElement;
    
    const from = fromSelect?.value.trim();
    const to = toSelect?.value.trim();
    const amount = parseInt(amountInput?.value || '0');
    
    if (!from || !to) {
        showToast('Please select both sender and recipient', 'error');
        return;
    }
    
    if (from === to) {
        showToast('Cannot transfer to the same account', 'error');
        return;
    }
    
    if (amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    const state = store.getState();
    const fromAccount = state.accounts.find(a => a.name === from);
    
    if (!fromAccount || fromAccount.balance < amount) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    try {
        await transfer(from, to, amount);
        
        // Update balances
        store.updateAccountBalance(from, fromAccount.balance - amount);
        
        const toAccount = state.accounts.find(a => a.name === to);
        if (toAccount) {
            store.updateAccountBalance(to, toAccount.balance + amount);
        }
        
        showToast(`✅ Transferred ${amount} BB from ${from} to ${to}`, 'success');
        
        // Clear inputs
        if (amountInput) amountInput.value = '';
        fromSelect.value = '';
        toSelect.value = '';
        
        // Hide balance info
        const balanceInfo = document.getElementById('transferBalanceInfo');
        if (balanceInfo) balanceInfo.style.display = 'none';
        
        // Refresh admin panel
        const adminPanel = new AdminPanel();
    } catch (error) {
        console.error('Transfer failed:', error);
        showToast('Transfer failed', 'error');
    }
};