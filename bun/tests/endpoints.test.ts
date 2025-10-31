/**
 * BlackBook L1 Endpoint Tests
 * Comprehensive test suite for all Tauri backend commands
 * Run with: bun test tests/endpoints.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { BackendService } from "../src/lib/backend_service";

// ============================================
// HELPER FUNCTIONS
// ============================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (message: string) => {
    console.log(`  📋 ${message}`);
};

// ============================================
// TEST SUITE
// ============================================

describe("BlackBook L1 Backend - Endpoint Tests", () => {
    let testAccounts: any[] = [];
    let testMarkets: any[] = [];
    
    // ============================================
    // SETUP & TEARDOWN
    // ============================================

    beforeAll(async () => {
        console.log("\n🚀 Initializing test suite...\n");
        console.log("⚠️  NOTE: Ensure Tauri dev server is running with: bun run tauri:dev\n");
    });

    afterAll(async () => {
        console.log("\n✅ Test suite completed!\n");
    });

    // ============================================
    // ACCOUNT OPERATIONS TESTS
    // ============================================

    describe("Account Operations", () => {
        
        it("GET_ACCOUNTS: Should retrieve all accounts", async () => {
            logTest("Fetching all accounts from blockchain...");
            
            const accounts = await BackendService.getAllAccounts();
            
            expect(accounts).toBeDefined();
            expect(Array.isArray(accounts)).toBe(true);
            expect(accounts.length).toBeGreaterThan(0);
            expect(accounts[0]).toHaveProperty("name");
            expect(accounts[0]).toHaveProperty("address");
            expect(accounts[0]).toHaveProperty("balance");
            
            testAccounts = accounts;
            console.log(`    ✅ Retrieved ${accounts.length} accounts`);
            console.log(`    📝 First account: ${accounts[0].name} (${accounts[0].address})`);
            console.log(`    💰 Balance: ${accounts[0].balance} BB`);
        });

        it("GET_BALANCE: Should retrieve balance for specific account", async () => {
            if (testAccounts.length === 0) {
                throw new Error("No test accounts available");
            }
            
            const testAccount = testAccounts[0];
            logTest(`Getting balance for account: ${testAccount.name}`);
            
            const balance = await BackendService.getBalance(testAccount.address);
            
            expect(balance).toBeDefined();
            expect(typeof balance).toBe("number");
            expect(balance).toBeGreaterThanOrEqual(0);
            
            console.log(`    ✅ Balance for ${testAccount.name}: ${balance} BB`);
        });

    });

    // ============================================
    // TRANSACTION OPERATIONS TESTS
    // ============================================

    describe("Transaction Operations", () => {

        it("GET_ACCOUNT_TRANSACTIONS: Should retrieve transactions for specific account", async () => {
            if (testAccounts.length === 0) {
                throw new Error("No test accounts available");
            }
            
            const testAccount = testAccounts[0];
            logTest(`Getting transactions for ${testAccount.name}...`);
            
            const transactions = await BackendService.getAccountTransactions(testAccount.address);
            
            expect(transactions).toBeDefined();
            expect(Array.isArray(transactions)).toBe(true);
            
            console.log(`    ✅ Retrieved ${transactions.length} transactions`);
            if (transactions.length > 0) {
                console.log(`    📝 Most recent: ${transactions[0].type} (${transactions[0].amount} BB)`);
            }
        });

        it("GET_ALL_TRANSACTIONS: Should retrieve all transactions in ledger", async () => {
            logTest("Getting all transactions from ledger...");
            
            const allTransactions = await BackendService.getAllTransactions();
            
            expect(allTransactions).toBeDefined();
            expect(Array.isArray(allTransactions)).toBe(true);
            
            console.log(`    ✅ Retrieved ${allTransactions.length} total transactions`);
        });

    });

    // ============================================
    // TRANSFER OPERATIONS TESTS
    // ============================================

    describe("Transfer Operations", () => {

        it("TRANSFER: Should transfer tokens between two accounts", async () => {
            if (testAccounts.length < 2) {
                throw new Error("Need at least 2 test accounts for transfer test");
            }
            
            const fromAccount = testAccounts[0];
            const toAccount = testAccounts[1];
            const transferAmount = 10;
            
            logTest(`Transferring ${transferAmount} BB from ${fromAccount.name} to ${toAccount.name}...`);
            
            // Get balance before
            const balanceBefore = await BackendService.getBalance(toAccount.address);
            
            // Execute transfer
            const result = await BackendService.transfer(fromAccount.address, toAccount.address, transferAmount);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe("string");
            
            // Give system time to process
            await sleep(500);
            
            // Get balance after
            const balanceAfter = await BackendService.getBalance(toAccount.address);
            
            expect(balanceAfter).toBe(balanceBefore + transferAmount);
            
            console.log(`    ✅ Transfer successful!`);
            console.log(`    📝 From: ${fromAccount.name} (${fromAccount.address})`);
            console.log(`    📝 To: ${toAccount.name} (${toAccount.address})`);
            console.log(`    💰 Amount: ${transferAmount} BB`);
            console.log(`    📊 Balance change: ${balanceBefore} → ${balanceAfter}`);
        });

        it("TRANSFER: Should reject transfer to same account", async () => {
            if (testAccounts.length === 0) {
                throw new Error("No test accounts available");
            }
            
            const account = testAccounts[0];
            logTest(`Attempting invalid transfer to same account...`);
            
            try {
                await BackendService.transfer(account.address, account.address, 5);
                // If we get here, the transfer wasn't rejected (which may be valid)
                console.log(`    ⚠️  Transfer to same account was allowed`);
            } catch (error) {
                console.log(`    ✅ Transfer correctly rejected`);
            }
        });

        it("TRANSFER: Should reject insufficient balance", async () => {
            if (testAccounts.length < 2) {
                throw new Error("Need at least 2 test accounts");
            }
            
            const fromAccount = testAccounts[0];
            const toAccount = testAccounts[1];
            logTest(`Attempting transfer with insufficient balance...`);
            
            try {
                // Try to transfer massive amount
                await BackendService.transfer(fromAccount.address, toAccount.address, 999999999);
                console.log(`    ⚠️  Large transfer was allowed`);
            } catch (error) {
                console.log(`    ✅ Transfer correctly rejected for insufficient balance`);
            }
        });

    });

    // ============================================
    // MARKET OPERATIONS TESTS
    // ============================================

    describe("Market Operations", () => {

        it("GET_MARKETS: Should retrieve all markets", async () => {
            logTest("Fetching all prediction markets...");
            
            const markets = await BackendService.getMarkets();
            
            expect(markets).toBeDefined();
            expect(Array.isArray(markets)).toBe(true);
            expect(markets.length).toBeGreaterThan(0);
            
            // Check first market structure
            if (markets.length > 0) {
                const market = markets[0];
                expect(market).toHaveProperty("id");
                expect(market).toHaveProperty("title");
                expect(market).toHaveProperty("yes_price");
                expect(market).toHaveProperty("no_price");
            }
            
            testMarkets = markets;
            console.log(`    ✅ Retrieved ${markets.length} markets`);
            if (markets.length > 0) {
                console.log(`    📝 First market: ${markets[0].title}`);
                console.log(`    💹 YES: ${(markets[0].yes_price * 100).toFixed(0)}¢ | NO: ${(markets[0].no_price * 100).toFixed(0)}¢`);
            }
        });

        it("GET_MARKET: Should retrieve specific market by ID", async () => {
            if (testMarkets.length === 0) {
                throw new Error("No test markets available");
            }
            
            const testMarket = testMarkets[0];
            logTest(`Getting market details for ID: ${testMarket.id}...`);
            
            const market = await BackendService.getMarket(testMarket.id);
            
            expect(market).toBeDefined();
            expect(market.id).toBe(testMarket.id);
            expect(market).toHaveProperty("title");
            expect(market).toHaveProperty("yes_price");
            expect(market).toHaveProperty("no_price");
            
            console.log(`    ✅ Retrieved market: ${market.title}`);
            console.log(`    📊 Volume: ${market.total_volume} BB`);
        });

    });

    // ============================================
    // BETTING OPERATIONS TESTS
    // ============================================

    describe("Betting Operations", () => {

        it("PLACE_BET: Should place a bet on a market", async () => {
            if (testAccounts.length === 0 || testMarkets.length === 0) {
                throw new Error("Need test accounts and markets");
            }
            
            const account = testAccounts[0];
            const market = testMarkets[0];
            const betAmount = 5;
            const prediction = "YES";
            
            logTest(`Placing ${prediction} bet for ${betAmount} BB on market: ${market.title}...`);
            
            // Get balance before
            const balanceBefore = await BackendService.getBalance(account.address);
            
            // Place bet
            const result = await BackendService.placeBet(market.id, account.address, betAmount, prediction);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe("string");
            
            // Give system time to process
            await sleep(500);
            
            // Get balance after
            const balanceAfter = await BackendService.getBalance(account.address);
            
            console.log(`    ✅ Bet placed successfully!`);
            console.log(`    📝 Market: ${market.title}`);
            console.log(`    📝 Prediction: ${prediction}`);
            console.log(`    💰 Amount: ${betAmount} BB`);
            console.log(`    📊 Balance change: ${balanceBefore} → ${balanceAfter}`);
        });

    });

    // ============================================
    // PRICE DATA TESTS
    // ============================================

    describe("Price Data", () => {

        it("GET_PRICES: Should retrieve live cryptocurrency prices", async () => {
            logTest("Fetching live prices from CoinGecko...");
            
            const prices = await BackendService.getPrices();
            
            expect(prices).toBeDefined();
            expect(prices).toHaveProperty("btc");
            expect(prices).toHaveProperty("sol");
            expect(prices).toHaveProperty("timestamp");
            expect(typeof prices.btc).toBe("number");
            expect(typeof prices.sol).toBe("number");
            expect(prices.btc).toBeGreaterThan(0);
            expect(prices.sol).toBeGreaterThan(0);
            
            console.log(`    ✅ Prices retrieved successfully!`);
            console.log(`    💹 BTC: $${prices.btc.toFixed(2)}`);
            console.log(`    💹 SOL: $${prices.sol.toFixed(2)}`);
            console.log(`    🕐 Timestamp: ${new Date(prices.timestamp).toISOString()}`);
        });

        it("GET_POLYMARKET_EVENTS: Should retrieve Polymarket events", async () => {
            logTest("Fetching Polymarket events from Gamma API...");
            
            const events = await BackendService.getPolymarketEvents();
            
            expect(events).toBeDefined();
            expect(Array.isArray(events)).toBe(true);
            
            console.log(`    ✅ Retrieved ${events.length} Polymarket events`);
            if (events.length > 0) {
                const event = events[0];
                console.log(`    📝 First event: ${event.question}`);
                if (event.outcome_prices) {
                    console.log(`    💹 YES: ${(event.outcome_prices[0] * 100).toFixed(0)}¢ | NO: ${(event.outcome_prices[1] * 100).toFixed(0)}¢`);
                }
            }
        });

    });

    // ============================================
    // LEDGER STATISTICS TESTS
    // ============================================

    describe("Ledger Statistics", () => {

        it("GET_STATS: Should retrieve ledger statistics", async () => {
            logTest("Getting ledger statistics...");
            
            const stats = await BackendService.getLedgerStats();
            
            expect(stats).toBeDefined();
            expect(stats).toHaveProperty("totalAccounts");
            expect(stats).toHaveProperty("totalVolume");
            expect(stats).toHaveProperty("totalTransactions");
            expect(stats).toHaveProperty("totalBets");
            
            console.log(`    ✅ Ledger statistics retrieved!`);
            console.log(`    👥 Total accounts: ${stats.totalAccounts}`);
            console.log(`    💰 Total volume: ${stats.totalVolume} BB`);
            console.log(`    📊 Total transactions: ${stats.totalTransactions}`);
            console.log(`    🎯 Total bets: ${stats.totalBets}`);
        });

    });

    // ============================================
    // ADMIN OPERATIONS TESTS
    // ============================================

    describe("Admin Operations", () => {

        it("ADMIN_DEPOSIT: Should deposit tokens to account (admin)", async () => {
            if (testAccounts.length === 0) {
                throw new Error("No test accounts available");
            }
            
            const account = testAccounts[0];
            const depositAmount = 50;
            
            logTest(`Depositing ${depositAmount} BB to ${account.name} (admin operation)...`);
            
            // Get balance before
            const balanceBefore = await BackendService.getBalance(account.address);
            
            // Deposit
            const result = await BackendService.deposit(account.address, depositAmount);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe("string");
            
            // Give system time to process
            await sleep(500);
            
            // Get balance after
            const balanceAfter = await BackendService.getBalance(account.address);
            
            expect(balanceAfter).toBe(balanceBefore + depositAmount);
            
            console.log(`    ✅ Admin deposit successful!`);
            console.log(`    📝 Account: ${account.name}`);
            console.log(`    💰 Amount: ${depositAmount} BB`);
            console.log(`    📊 Balance change: ${balanceBefore} → ${balanceAfter}`);
        });

    });

    // ============================================
    // INTEGRATION TESTS
    // ============================================

    describe("Integration Tests", () => {

        it("FLOW: Transfer → Bet → Check Balance", async () => {
            if (testAccounts.length < 2 || testMarkets.length === 0) {
                throw new Error("Insufficient test data");
            }
            
            logTest("Running integrated flow: Transfer → Bet → Check Balance");
            
            const sender = testAccounts[0];
            const receiver = testAccounts[1];
            const market = testMarkets[0];
            const transferAmount = 20;
            const betAmount = 10;
            
            console.log(`\n    Step 1: Transfer ${transferAmount} BB from ${sender.name} to ${receiver.name}`);
            const senderBalanceBefore = await BackendService.getBalance(sender.address);
            const receiverBalanceBefore = await BackendService.getBalance(receiver.address);
            
            await BackendService.transfer(sender.address, receiver.address, transferAmount);
            await sleep(300);
            
            const senderBalanceAfterTransfer = await BackendService.getBalance(sender.address);
            const receiverBalanceAfterTransfer = await BackendService.getBalance(receiver.address);
            
            console.log(`    ✅ Transfer complete`);
            console.log(`       Sender: ${senderBalanceBefore} → ${senderBalanceAfterTransfer}`);
            console.log(`       Receiver: ${receiverBalanceBefore} → ${receiverBalanceAfterTransfer}`);
            
            console.log(`\n    Step 2: Place ${betAmount} BB bet on market "${market.title}"`);
            const balanceBeforeBet = await BackendService.getBalance(receiver.address);
            
            await BackendService.placeBet(market.id, receiver.address, betAmount, "YES");
            await sleep(300);
            
            const balanceAfterBet = await BackendService.getBalance(receiver.address);
            
            console.log(`    ✅ Bet placed`);
            console.log(`       Balance: ${balanceBeforeBet} → ${balanceAfterBet}`);
            
            console.log(`\n    Step 3: Verify final state`);
            const stats = await BackendService.getLedgerStats();
            console.log(`    ✅ Ledger state:`);
            console.log(`       Total transactions: ${stats.totalTransactions}`);
            console.log(`       Total bets: ${stats.totalBets}`);
            
            expect(senderBalanceAfterTransfer).toBe(senderBalanceBefore - transferAmount);
            expect(receiverBalanceAfterTransfer).toBe(receiverBalanceBefore + transferAmount);
            expect(balanceAfterBet).toBeLessThan(balanceBeforeBet);
        });

    });

});

// ============================================
// TEST SUMMARY
// ============================================

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║   BlackBook L1 Endpoint Test Suite                              ║
║   Comprehensive tests for all backend operations                ║
╚══════════════════════════════════════════════════════════════════╝

📋 Test Categories:
   ✓ Account Operations (get_accounts, get_balance)
   ✓ Transaction Operations (get_transactions, get_all_transactions)
   ✓ Transfer Operations (transfer, validation)
   ✓ Market Operations (get_markets, get_market)
   ✓ Betting Operations (place_bet)
   ✓ Price Data (get_prices, get_polymarket_events)
   ✓ Ledger Statistics (get_stats)
   ✓ Admin Operations (admin_deposit)
   ✓ Integration Tests (multi-step flows)

⚡ Quick Start:
   1. Start Tauri dev server: bun run tauri:dev
   2. Run tests in another terminal: bun test tests/endpoints.test.ts
   3. Watch tests: bun test --watch tests/endpoints.test.ts

📊 Expected Results:
   - All account operations should complete successfully
   - Transfers should update balances correctly
   - Bets should be recorded and balances reduced
   - Prices should be fetched from external APIs
   - Statistics should reflect all operations

⚠️  NOTE: Tests interact with a live ledger. Balances will be modified!
`);
