/**
 * Backend Service - Abstracts all Tauri IPC calls
 * Centralizes communication with the Rust backend via Tauri invoke()
 * NO HTTP SERVER - uses direct Inter-Process Communication
 */

import { invoke } from '@tauri-apps/api/tauri';

export interface Account {
    name: string;
    address: string;
    balance: number;
}

export interface Market {
    id: string;
    title: string;
    description: string;
    yes_price: number;
    no_price: number;
    total_volume: number;
}

export interface Transaction {
    id: string;
    from: string;
    to: string;
    amount: number;
    timestamp: number;
    type: string;
}

export interface LedgerStats {
    totalAccounts: number;
    totalVolume: number;
    totalTransactions: number;
    totalBets: number;
}

export interface PriceData {
    btc: number;
    sol: number;
    timestamp: number;
}

export interface BetRequest {
    account: string;
    market_id: string;
    amount: number;
    prediction: string;
}

/**
 * Backend Service - Static methods for all Tauri IPC operations
 * No singleton needed - all methods use direct invoke() calls
 */
export class BackendService {
    // ============================================
    // ACCOUNT OPERATIONS
    // ============================================

    /**
     * Get all accounts from Rust blockchain
     */
    static async getAllAccounts(): Promise<Account[]> {
        try {
            return await invoke('get_accounts') as Account[];
        } catch (error) {
            console.error('❌ Failed to get accounts:', error);
            throw error;
        }
    }

    /**
     * Get account balance
     */
    static async getBalance(address: string): Promise<number> {
        try {
            return await invoke('get_balance', { address }) as number;
        } catch (error) {
            console.error('❌ Failed to get balance:', error);
            throw error;
        }
    }

    /**
     * Deposit funds (admin operation)
     */
    static async deposit(address: string, amount: number): Promise<string> {
        try {
            return await invoke('admin_deposit', { address, amount }) as string;
        } catch (error) {
            console.error('❌ Deposit failed:', error);
            throw error;
        }
    }

    /**
     * Transfer tokens between accounts
     */
    static async transfer(from: string, to: string, amount: number): Promise<string> {
        try {
            return await invoke('transfer', { from, to, amount }) as string;
        } catch (error) {
            console.error('❌ Transfer failed:', error);
            throw error;
        }
    }

    // ============================================
    // TRANSACTION OPERATIONS
    // ============================================

    /**
     * Get all transactions for an account
     */
    static async getAccountTransactions(address: string): Promise<Transaction[]> {
        try {
            return await invoke('get_account_transactions', { address }) as Transaction[];
        } catch (error) {
            console.error('❌ Failed to get transactions:', error);
            throw error;
        }
    }

    /**
     * Get all transactions
     */
    static async getAllTransactions(): Promise<Transaction[]> {
        try {
            return await invoke('get_all_transactions') as Transaction[];
        } catch (error) {
            console.error('❌ Failed to get all transactions:', error);
            throw error;
        }
    }

    // ============================================
    // LEDGER STATISTICS
    // ============================================

    /**
     * Get ledger statistics
     */
    static async getLedgerStats(): Promise<LedgerStats> {
        try {
            return await invoke('get_stats') as LedgerStats;
        } catch (error) {
            console.error('❌ Failed to get stats:', error);
            throw error;
        }
    }

    // ============================================
    // MARKET OPERATIONS
    // ============================================

    /**
     * Get all markets from Rust blockchain
     */
    static async getMarkets(): Promise<Market[]> {
        try {
            return await invoke('get_markets') as Market[];
        } catch (error) {
            console.error('❌ Failed to get markets:', error);
            throw error;
        }
    }

    /**
     * Get specific market by ID
     */
    static async getMarket(marketId: string): Promise<Market> {
        try {
            return await invoke('get_market', { marketId }) as Market;
        } catch (error) {
            console.error('❌ Failed to get market:', error);
            throw error;
        }
    }

    /**
     * Place a bet on a market
     */
    static async placeBet(marketId: string, account: string, amount: number, prediction: string): Promise<string> {
        try {
            return await invoke('place_bet', { marketId, account, amount, prediction }) as string;
        } catch (error) {
            console.error('❌ Bet placement failed:', error);
            throw error;
        }
    }

    /**
     * Resolve a market (admin operation)
     */
    static async resolveMarket(marketId: string, winningOption: string): Promise<string> {
        try {
            return await invoke('resolve_market', { marketId, winningOption }) as string;
        } catch (error) {
            console.error('❌ Market resolution failed:', error);
            throw error;
        }
    }

    /**
     * Record a bet win
     */
    static async recordBetWin(account: string, amount: number, betId: string): Promise<void> {
        try {
            await invoke('record_bet_win', { account, amount, betId });
        } catch (error) {
            console.error('❌ Record bet win failed:', error);
            throw error;
        }
    }

    /**
     * Record a bet loss
     */
    static async recordBetLoss(account: string, amount: number, betId: string): Promise<void> {
        try {
            await invoke('record_bet_loss', { account, amount, betId });
        } catch (error) {
            console.error('❌ Record bet loss failed:', error);
            throw error;
        }
    }

    // ============================================
    // EXTERNAL DATA
    // ============================================

    /**
     * Get live prices from CoinGecko (via Rust backend to bypass CORS)
     */
    static async getPrices(): Promise<PriceData> {
        try {
            return await invoke('get_prices') as PriceData;
        } catch (error) {
            console.error('❌ Price fetch failed:', error);
            throw error;
        }
    }

    /**
     * Get Polymarket events (via Rust backend to bypass CORS)
     */
    static async getPolymarketEvents(): Promise<any[]> {
        try {
            return await invoke('get_polymarket_events') as any[];
        } catch (error) {
            console.error('❌ Polymarket fetch failed:', error);
            throw error;
        }
    }

    /**
     * Get BlackBook Events from RSS feed
     */
    static async getBlackbookEvents(): Promise<any[]> {
        try {
            return await invoke('get_blackbook_events') as any[];
        } catch (error) {
            console.error('❌ BlackBook events fetch failed:', error);
            throw error;
        }
    }
}
