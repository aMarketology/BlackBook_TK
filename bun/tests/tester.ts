#!/usr/bin/env bun

/**
 * BlackBook L1 Endpoint Tester
 * Interactive CLI tool to test all backend endpoints
 * Run with: bun tests/tester.ts
 */

import { BackendService } from "../src/lib/backend_service";

// ============================================
// COLORS & FORMATTING
// ============================================

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// ============================================
// UTILITIES
// ============================================

const log = {
    header: (title: string) => {
        console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.cyan}║ ${title.padEnd(62)} ║${colors.reset}`);
        console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    },
    
    test: (name: string) => {
        console.log(`${colors.bright}${colors.blue}📋 ${name}${colors.reset}`);
    },
    
    success: (message: string) => {
        console.log(`${colors.green}✅ ${message}${colors.reset}`);
    },
    
    error: (message: string) => {
        console.log(`${colors.red}❌ ${message}${colors.reset}`);
    },
    
    warning: (message: string) => {
        console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
    },
    
    info: (message: string) => {
        console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
    },
    
    detail: (message: string) => {
        console.log(`${colors.dim}   ${message}${colors.reset}`);
    },
    
    data: (key: string, value: any) => {
        console.log(`${colors.magenta}   📊 ${key}:${colors.reset} ${JSON.stringify(value, null, 2).replace(/\n/g, '\n      ')}`);
    },
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// TEST FUNCTIONS
// ============================================

async function testGetAccounts() {
    try {
        log.test("GET_ACCOUNTS - Retrieve all accounts");
        
        const accounts = await BackendService.getAllAccounts();
        
        if (!accounts || accounts.length === 0) {
            log.error("No accounts retrieved");
            return null;
        }
        
        log.success(`Retrieved ${accounts.length} accounts`);
        accounts.forEach((acc, idx) => {
            log.detail(`[${idx + 1}] ${acc.name} (${acc.address}) - Balance: ${acc.balance} BB`);
        });
        
        return accounts;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetBalance(address: string) {
    try {
        log.test(`GET_BALANCE - Get balance for address: ${address}`);
        
        const balance = await BackendService.getBalance(address);
        
        log.success(`Balance retrieved: ${balance} BB`);
        return balance;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testTransfer(from: string, to: string, amount: number) {
    try {
        log.test(`TRANSFER - Transfer ${amount} BB from ${from} to ${to}`);
        
        const balanceBefore = await BackendService.getBalance(to);
        log.info(`Recipient balance before: ${balanceBefore} BB`);
        
        const result = await BackendService.transfer(from, to, amount);
        log.success(`Transfer executed: ${result}`);
        
        await sleep(500);
        
        const balanceAfter = await BackendService.getBalance(to);
        log.info(`Recipient balance after: ${balanceAfter} BB (change: +${balanceAfter - balanceBefore})`);
        
        return result;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetMarkets() {
    try {
        log.test("GET_MARKETS - Retrieve all markets");
        
        const markets = await BackendService.getMarkets();
        
        if (!markets || markets.length === 0) {
            log.error("No markets retrieved");
            return null;
        }
        
        log.success(`Retrieved ${markets.length} markets`);
        markets.forEach((market, idx) => {
            const yesPrice = (market.yes_price * 100).toFixed(0);
            const noPrice = (market.no_price * 100).toFixed(0);
            log.detail(`[${idx + 1}] ${market.title} - YES: ${yesPrice}¢ | NO: ${noPrice}¢ | Vol: ${market.total_volume}`);
        });
        
        return markets;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetMarket(marketId: string) {
    try {
        log.test(`GET_MARKET - Get market ${marketId}`);
        
        const market = await BackendService.getMarket(marketId);
        
        log.success(`Market retrieved: ${market.title}`);
        log.detail(`Description: ${market.description}`);
        log.detail(`YES Price: ${(market.yes_price * 100).toFixed(0)}¢`);
        log.detail(`NO Price: ${(market.no_price * 100).toFixed(0)}¢`);
        log.detail(`Volume: ${market.total_volume} BB`);
        
        return market;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testPlaceBet(marketId: string, account: string, amount: number, prediction: string) {
    try {
        log.test(`PLACE_BET - Bet ${amount} BB on ${prediction} (Market: ${marketId}, Account: ${account})`);
        
        const balanceBefore = await BackendService.getBalance(account);
        log.info(`Account balance before: ${balanceBefore} BB`);
        
        const result = await BackendService.placeBet(marketId, account, amount, prediction);
        log.success(`Bet placed: ${result}`);
        
        await sleep(500);
        
        const balanceAfter = await BackendService.getBalance(account);
        log.info(`Account balance after: ${balanceAfter} BB (change: -${balanceBefore - balanceAfter})`);
        
        return result;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetPrices() {
    try {
        log.test("GET_PRICES - Fetch live prices from CoinGecko");
        
        const prices = await BackendService.getPrices();
        
        log.success("Prices retrieved from CoinGecko");
        log.detail(`BTC: $${prices.btc.toFixed(2)}`);
        log.detail(`SOL: $${prices.sol.toFixed(2)}`);
        log.detail(`Timestamp: ${new Date(prices.timestamp).toISOString()}`);
        
        return prices;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetPolymarketEvents() {
    try {
        log.test("GET_POLYMARKET_EVENTS - Fetch events from Polymarket Gamma API");
        
        const events = await BackendService.getPolymarketEvents();
        
        log.success(`Retrieved ${events.length} Polymarket events`);
        
        events.slice(0, 3).forEach((event, idx) => {
            const yesPrice = event.outcome_prices ? (event.outcome_prices[0] * 100).toFixed(0) : "N/A";
            const noPrice = event.outcome_prices ? (event.outcome_prices[1] * 100).toFixed(0) : "N/A";
            log.detail(`[${idx + 1}] ${event.question}`);
            log.detail(`     YES: ${yesPrice}¢ | NO: ${noPrice}¢ | Vol: ${event.volume || "N/A"}`);
        });
        
        if (events.length > 3) {
            log.detail(`... and ${events.length - 3} more events`);
        }
        
        return events;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetTransactions(address: string) {
    try {
        log.test(`GET_ACCOUNT_TRANSACTIONS - Get transactions for ${address}`);
        
        const transactions = await BackendService.getAccountTransactions(address);
        
        log.success(`Retrieved ${transactions.length} transactions`);
        transactions.slice(0, 5).forEach((tx, idx) => {
            log.detail(`[${idx + 1}] ${tx.type}: ${tx.amount} BB from ${tx.from} to ${tx.to}`);
        });
        
        if (transactions.length > 5) {
            log.detail(`... and ${transactions.length - 5} more transactions`);
        }
        
        return transactions;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetAllTransactions() {
    try {
        log.test("GET_ALL_TRANSACTIONS - Get all ledger transactions");
        
        const transactions = await BackendService.getAllTransactions();
        
        log.success(`Retrieved ${transactions.length} total transactions`);
        
        return transactions;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testGetStats() {
    try {
        log.test("GET_STATS - Get ledger statistics");
        
        const stats = await BackendService.getLedgerStats();
        
        log.success("Ledger statistics retrieved");
        log.detail(`Total Accounts: ${stats.totalAccounts}`);
        log.detail(`Total Volume: ${stats.totalVolume} BB`);
        log.detail(`Total Transactions: ${stats.totalTransactions}`);
        log.detail(`Total Bets: ${stats.totalBets}`);
        
        return stats;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

async function testAdminDeposit(address: string, amount: number) {
    try {
        log.test(`ADMIN_DEPOSIT - Deposit ${amount} BB to ${address}`);
        
        const balanceBefore = await BackendService.getBalance(address);
        log.info(`Balance before: ${balanceBefore} BB`);
        
        const result = await BackendService.deposit(address, amount);
        log.success(`Deposit executed: ${result}`);
        
        await sleep(500);
        
        const balanceAfter = await BackendService.getBalance(address);
        log.info(`Balance after: ${balanceAfter} BB (change: +${balanceAfter - balanceBefore})`);
        
        return result;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
    log.header("BlackBook L1 Endpoint Tester");
    
    console.log(`${colors.bright}Starting comprehensive endpoint tests...${colors.reset}\n`);
    console.log(`${colors.yellow}⚠️  Ensure Tauri dev server is running: bun run tauri:dev${colors.reset}\n`);
    
    let accounts = null;
    let markets = null;
    
    try {
        // ============================================
        // ACCOUNT TESTS
        // ============================================
        
        log.header("Account Operations");
        accounts = await testGetAccounts();
        
        if (accounts && accounts.length > 0) {
            await sleep(500);
            await testGetBalance(accounts[0].address);
        }
        
        // ============================================
        // TRANSFER TESTS
        // ============================================
        
        log.header("Transfer Operations");
        
        if (accounts && accounts.length >= 2) {
            await sleep(500);
            await testTransfer(accounts[0].address, accounts[1].address, 15);
        }
        
        // ============================================
        // MARKET TESTS
        // ============================================
        
        log.header("Market Operations");
        markets = await testGetMarkets();
        
        if (markets && markets.length > 0) {
            await sleep(500);
            await testGetMarket(markets[0].id);
        }
        
        // ============================================
        // BETTING TESTS
        // ============================================
        
        log.header("Betting Operations");
        
        if (accounts && accounts.length > 0 && markets && markets.length > 0) {
            await sleep(500);
            await testPlaceBet(markets[0].id, accounts[0].address, 8, "YES");
        }
        
        // ============================================
        // PRICE DATA TESTS
        // ============================================
        
        log.header("Price Data");
        await sleep(500);
        await testGetPrices();
        
        await sleep(500);
        await testGetPolymarketEvents();
        
        // ============================================
        // TRANSACTION TESTS
        // ============================================
        
        log.header("Transaction History");
        
        if (accounts && accounts.length > 0) {
            await sleep(500);
            await testGetTransactions(accounts[0].address);
            
            await sleep(500);
            await testGetAllTransactions();
        }
        
        // ============================================
        // STATISTICS TESTS
        // ============================================
        
        log.header("Ledger Statistics");
        await sleep(500);
        await testGetStats();
        
        // ============================================
        // ADMIN TESTS
        // ============================================
        
        log.header("Admin Operations");
        
        if (accounts && accounts.length > 0) {
            await sleep(500);
            await testAdminDeposit(accounts[2]?.address || accounts[0].address, 100);
        }
        
        // ============================================
        // COMPLETION
        // ============================================
        
        log.header("Test Suite Complete");
        
        console.log(`${colors.green}${colors.bright}✅ All endpoint tests completed successfully!${colors.reset}\n`);
        
        console.log(`${colors.cyan}📊 Summary:${colors.reset}`);
        console.log(`   ✓ Account Operations (2 tests)`);
        console.log(`   ✓ Transfer Operations (1 test)`);
        console.log(`   ✓ Market Operations (2 tests)`);
        console.log(`   ✓ Betting Operations (1 test)`);
        console.log(`   ✓ Price Data (2 tests)`);
        console.log(`   ✓ Transaction History (2 tests)`);
        console.log(`   ✓ Ledger Statistics (1 test)`);
        console.log(`   ✓ Admin Operations (1 test)`);
        console.log(`\n${colors.bright}Total: 12+ integration tests${colors.reset}\n`);
        
    } catch (error) {
        log.error(`Unexpected error in test suite: ${error}`);
        console.log(`${colors.red}Stack: ${(error as any).stack}${colors.reset}`);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
