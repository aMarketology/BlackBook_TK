/**
 * Tauri Invoke Wrapper
 * Type-safe wrapper functions for all blockchain commands
 */

import { invoke } from '@tauri-apps/api/tauri';

export interface AccountInfo {
    name: string;
    address: string;
    balance: number;
}

export interface BetRequest {
    account: string;
    market_id: string;
    amount: number;
    prediction: string;
}

export interface TransferRequest {
    from: string;
    to: string;
    amount: number;
}

export interface DepositRequest {
    address: string;
    amount: number;
}

export interface Transaction {
    from: string;
    to: string;
    amount: number;
    timestamp: number;
    tx_type: string;
}

export interface Recipe {
    id: string;
    recipe_type: string;
    account: string;
    address: string;
    amount: number;
    description: string;
    related_id: string | null;
    timestamp: number;
    metadata: Record<string, string>;
}

/**
 * Get all accounts with their addresses and balances
 */
export async function getAccounts(): Promise<AccountInfo[]> {
    return invoke('get_accounts');
}

/**
 * Get balance for a specific account
 */
export async function getBalance(address: string): Promise<number> {
    return invoke('get_balance', { address });
}

/**
 * Place a bet on a market
 */
export async function placeBet(req: BetRequest): Promise<string> {
    return invoke('place_bet', req);
}

/**
 * Transfer tokens between accounts
 */
export async function transfer(req: TransferRequest): Promise<string> {
    return invoke('transfer', req);
}

/**
 * Admin: Add tokens to an account
 */
export async function adminDeposit(req: DepositRequest): Promise<string> {
    return invoke('admin_deposit', req);
}

/**
 * Get all transactions in the ledger
 */
export async function getAllTransactions(): Promise<Transaction[]> {
    return invoke('get_all_transactions');
}

/**
 * Get transactions for a specific account
 */
export async function getAccountTransactions(address: string): Promise<Transaction[]> {
    return invoke('get_account_transactions', { address });
}

/**
 * Get all activity recipes
 */
export async function getRecipes(): Promise<Recipe[]> {
    return invoke('get_recipes');
}

/**
 * Get recipes for a specific account
 */
export async function getAccountRecipes(address: string): Promise<Recipe[]> {
    return invoke('get_account_recipes', { address });
}

/**
 * Get recipes by type
 */
export async function getRecipesByType(recipe_type: string): Promise<Recipe[]> {
    return invoke('get_recipes_by_type', { recipe_type });
}

/**
 * Get ledger statistics
 */
export async function getStats(): Promise<Record<string, any>> {
    return invoke('get_stats');
}

/**
 * Record a bet win for an account
 */
export async function recordBetWin(address: string, amount: number, bet_id: string): Promise<string> {
    return invoke('record_bet_win', { address, amount, bet_id });
}

/**
 * Record a bet loss for an account
 */
export async function recordBetLoss(address: string, amount: number, bet_id: string): Promise<string> {
    return invoke('record_bet_loss', { address, amount, bet_id });
}
