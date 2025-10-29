// BlackBook Frontend - Main Application
import { store, subscribe } from './lib/store';
import { getAccounts, getPrices, healthCheck } from './lib/api';
import { LiveBetting } from './components/LiveBetting';
import type { AppState } from './types';

// Global app state
let liveBettingComponent: LiveBetting | null = null;
let priceUpdateInterval: number | null = null;

// ==================== INITIALIZATION ====================

async function initializeApp() {
    console.log('🚀 BlackBook initializing...');
    
    // Check backend connection
    const isConnected = await healthCheck();
    if (!isConnected) {
        showError('❌ Cannot connect to backend. Make sure Rust server is running on localhost:3000');
        return;
    }
    
    console.log('✅ Connected to backend');
    
    // Load initial data
    await Promise.all([
        loadAccounts(),
        loadPrices()
    ]);
    
    // Subscribe to state changes
    subscribe(onStateChange);
    
    // Initialize components
    initializeComponents();
    
    // Start periodic updates
    startPriceUpdates();
    
    console.log('✅ BlackBook ready!');
}

// ==================== DATA LOADING ====================

async function loadAccounts() {
    try {
        const accounts = await getAccounts();
        store.setAccounts(accounts);
        console.log(`Loaded ${accounts.length} accounts`);
    } catch (error) {
        console.error('Failed to load accounts:', error);
    }
}

async function loadPrices() {
    try {
        const prices = await getPrices();
        store.updatePrices(prices.BTC, prices.SOL);
        updatePriceDisplay();
    } catch (error) {
        console.error('Failed to load prices:', error);
    }
}

function startPriceUpdates() {
    priceUpdateInterval = window.setInterval(loadPrices, 5000);
}

// ==================== UI UPDATES ====================

function updatePriceDisplay() {
    const state = store.getState();
    
    const btcPriceEl = document.getElementById('btc-price');
    const solPriceEl = document.getElementById('sol-price');
    
    if (btcPriceEl) {
        btcPriceEl.textContent = `$${state.btcPrice.toLocaleString()}`;
    }
    
    if (solPriceEl) {
        solPriceEl.textContent = `$${state.solPrice.toLocaleString()}`;
    }
}

function updateAccountDisplay() {
    const state = store.getState();
    const balanceEl = document.getElementById('balance-display');
    
    if (balanceEl && state.currentAccount) {
        balanceEl.textContent = `${state.currentAccount.balance} BB`;
    }
}

function onStateChange(state: AppState) {
    updatePriceDisplay();
    updateAccountDisplay();
}

// ==================== COMPONENTS ====================

function initializeComponents() {
    const liveContainer = document.getElementById('live-betting-container');
    if (liveContainer) {
        liveBettingComponent = new LiveBetting(liveContainer);
    }
}

// ==================== NAVIGATION ====================

function showTab(tabName: string) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Highlight nav tab
    const navTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (navTab) {
        navTab.classList.add('active');
    }
}

// Make global for HTML onclick handlers
(window as any).showTab = showTab;

// ==================== ERROR HANDLING ====================

function showError(message: string) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.background = 'rgba(220, 53, 69, 0.1)';
        statusEl.style.borderColor = '#dc3545';
        statusEl.style.display = 'block';
    }
}

// ==================== START APP ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('📦 BlackBook module loaded');