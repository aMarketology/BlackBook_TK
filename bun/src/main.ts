// BlackBook Frontend - Main Application
import { store, subscribe } from './lib/store';
import { getAccounts, getPrices, healthCheck } from './lib/api';
import { router } from './lib/router';
import { AdminPanel } from './components/AdminPanel';
import './components/AdminPanel'; // Import for global functions
import './lib/utils'; // Import for global utility functions
import type { AppState } from './types';

// Import pages
import { renderHomePage } from './pages/Home';
import { renderAllMarketsPage } from './pages/AllMarkets';
import { renderCryptoPage } from './pages/Crypto';
import { renderBusinessPage } from './pages/Business';
import { renderTechPage } from './pages/Tech';
import { renderRecipesPage } from './pages/Recipes';

// Global app state
let priceUpdateInterval: number | null = null;
let adminPanelInstance: AdminPanel | null = null;

// ==================== INITIALIZATION ====================

async function initializeApp() {
    console.log('🚀 BlackBook Frontend Initializing...');
    console.log('📡 Blockchain API: http://localhost:3000');
    console.log('🌐 Frontend: http://localhost:8082');
    
    // Check backend connection
    const isConnected = await healthCheck();
    if (!isConnected) {
        console.error('❌ Cannot connect to backend. Make sure Rust server is running on localhost:3000');
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
    
    // Set up router
    setupRouter();
    
    // Start periodic updates
    startPriceUpdates();
    
    console.log('✅ BlackBook Frontend Ready');
}

// ==================== ROUTER SETUP ====================

function setupRouter() {
    const container = document.getElementById('mainContent');
    if (!container) {
        console.error('Main content container not found');
        return;
    }
    
    router.setContainer(container);
    
    // Register all routes
    router.register('/', '🔴 LIVE Market', renderHomePage);
    router.register('/all-markets', 'All Markets', renderAllMarketsPage);
    router.register('/crypto', 'Crypto Markets', renderCryptoPage);
    router.register('/business', 'Business Markets', renderBusinessPage);
    router.register('/tech', 'Tech Markets', renderTechPage);
    router.register('/recipes', 'Activity Recipes', renderRecipesPage);
    
    // Start router
    router.start();
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
    
    const btcPriceEl = document.getElementById('btcPrice');
    const solPriceEl = document.getElementById('solPrice');
    
    if (btcPriceEl && state.btcPrice > 0) {
        btcPriceEl.textContent = `$${state.btcPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        btcPriceEl.className = 'crypto-price price-up';
    }
    
    if (solPriceEl && state.solPrice > 0) {
        solPriceEl.textContent = `$${state.solPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        solPriceEl.className = 'crypto-price price-up';
    }
    
    // Also update crypto page prices if on that page
    const cryptoBtcPrice = document.getElementById('cryptoBtcPrice');
    const cryptoSolPrice = document.getElementById('cryptoSolPrice');
    if (cryptoBtcPrice && state.btcPrice > 0) {
        cryptoBtcPrice.textContent = `$${state.btcPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    if (cryptoSolPrice && state.solPrice > 0) {
        cryptoSolPrice.textContent = `$${state.solPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

function updateAccountDisplay() {
    const state = store.getState();
    
    if (state.currentAccount) {
        const sidebarDisplay = document.getElementById('selectedAccountDisplay');
        const sidebarName = document.getElementById('selectedAccountName');
        const sidebarBalance = document.getElementById('selectedAccountBalance');
        
        if (sidebarDisplay && sidebarName && sidebarBalance) {
            sidebarDisplay.style.display = 'block';
            sidebarName.textContent = state.currentAccount.name;
            sidebarBalance.textContent = `${state.currentAccount.balance} BB`;
        }
    }
}

function onStateChange(state: AppState) {
    updatePriceDisplay();
    updateAccountDisplay();
}

// ==================== ADMIN PANEL ====================

(window as any).openAdminPanel = function() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.add('active');
        // Initialize admin panel if not already
        if (!adminPanelInstance) {
            adminPanelInstance = new AdminPanel();
        }
    }
};

(window as any).closeAdminPanel = function() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

// Event Creator (placeholder)
(window as any).openEventCreator = function() {
    console.log('📝 Event creator opened');
    alert('Event creator coming soon!');
};

// ==================== START APP ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('📦 BlackBook module loaded');