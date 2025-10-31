# BlackBook L1 Endpoint Tests

Comprehensive test suite for all BlackBook L1 backend endpoints. Test all Tauri commands from your terminal on macOS.

## Quick Start

### Prerequisites

1. **Build the project** (if not already built):
   ```bash
   cd bun
   bun run build
   ```

2. **Start the Tauri dev server** in one terminal:
   ```bash
   cd bun
   bun run tauri:dev
   ```
   
   Wait for the app to load completely (you should see the desktop app window open).

3. **Run the tests** in another terminal:
   ```bash
   cd bun
   bun run test
   ```

## Test Commands

### Run All Tests
```bash
bun run test
```

Runs the complete test suite, testing all endpoints in sequence. Expects output with color-coded results.

### Watch Mode (Auto-rerun on changes)
```bash
bun run test:watch
```

Useful for development - automatically reruns tests when you modify files.

### Direct Execution
```bash
bun tests/tester.ts
```

Run the test script directly without npm script.

## What Gets Tested

The test suite covers all backend operations:

### 📋 Account Operations
- `GET_ACCOUNTS` - Retrieve all accounts from blockchain
- `GET_BALANCE` - Get balance for specific account

### 🔄 Transfer Operations
- `TRANSFER` - Transfer tokens between accounts
- Balance validation and state changes

### 📊 Market Operations
- `GET_MARKETS` - Retrieve all prediction markets
- `GET_MARKET` - Get specific market details

### 🎯 Betting Operations
- `PLACE_BET` - Place bets on markets
- Bet amount validation and balance updates

### 💹 Price Data
- `GET_PRICES` - Fetch live BTC/SOL prices from CoinGecko
- `GET_POLYMARKET_EVENTS` - Fetch events from Polymarket Gamma API

### 📜 Transaction History
- `GET_ACCOUNT_TRANSACTIONS` - Get transactions for specific account
- `GET_ALL_TRANSACTIONS` - Get all ledger transactions

### 📈 Ledger Statistics
- `GET_STATS` - Get overall ledger statistics
- Total accounts, volume, transactions, bets

### 🔐 Admin Operations
- `ADMIN_DEPOSIT` - Deposit tokens to account (admin function)

## Example Output

```
╔════════════════════════════════════════════════════════════════╗
║ BlackBook L1 Endpoint Tester                                   ║
╚════════════════════════════════════════════════════════════════╝

Starting comprehensive endpoint tests...

⚠️  Ensure Tauri dev server is running: bun run tauri:dev

╔════════════════════════════════════════════════════════════════╗
║ Account Operations                                             ║
╚════════════════════════════════════════════════════════════════╝

📋 GET_ACCOUNTS - Retrieve all accounts
✅ Retrieved 8 accounts
   [1] alice (0x1) - Balance: 500 BB
   [2] bob (0x2) - Balance: 480 BB
   ...

📋 GET_BALANCE - Get balance for address: 0x1
✅ Balance retrieved: 500 BB

```

## Test Architecture

### Test Files

- **`tests/tester.ts`** - Main interactive test runner
  - Color-coded console output
  - Detailed error reporting
  - Sequential test execution with pauses between tests

- **`tests/endpoints.test.ts`** - Bun test framework version (optional)
  - Uses Bun's built-in test framework
  - Can be run with `bun test tests/endpoints.test.ts`
  - Better for CI/CD pipelines

### BackendService Integration

All tests use the `BackendService` class which abstracts Tauri IPC:

```typescript
import { BackendService } from "../src/lib/backend_service";

// Tests call these methods:
const accounts = await BackendService.getAllAccounts();
const balance = await BackendService.getBalance(address);
const prices = await BackendService.getPrices();
// ... etc
```

The service automatically handles:
- Tauri `invoke()` calls
- Error handling and logging
- Type-safe response objects

## Important Notes

⚠️ **These tests interact with the live blockchain ledger!**

- Account balances **will be modified** by transfer and bet operations
- Transactions **will be recorded** permanently
- Admin deposits will increase test account balances
- Tests should ideally run in test/sandbox environment

### Best Practices

1. **Run against dev environment** - Always use `tauri:dev` with fresh ledger state
2. **Run tests in order** - Sequential execution ensures proper state transitions
3. **Check results** - Visual inspection of color-coded output confirms operations
4. **Note balances** - Remember initial balances, they'll change as tests run

## Troubleshooting

### Error: "Cannot find module"
```
Make sure you're in the /bun directory:
cd bun
bun run test
```

### Error: "Tauri dev server not running"
Start it in another terminal:
```bash
cd bun
bun run tauri:dev
```

### Tests timeout or hang
- Check if Tauri dev server is still running
- May need to restart both server and tests
- Look for network connectivity issues to external APIs (CoinGecko, Polymarket)

### Balance changes unexpected
- Multiple test runs modify the ledger
- Use admin deposit to reset balances: `ADMIN_DEPOSIT`
- Or restart Tauri server for fresh ledger state

## Adding New Tests

To add a new test, modify `tests/tester.ts`:

```typescript
async function testNewEndpoint() {
    try {
        log.test("NEW_ENDPOINT - Description");
        
        const result = await BackendService.someMethod(args);
        
        log.success("Operation completed");
        log.detail(`Result: ${result}`);
        
        return result;
    } catch (error) {
        log.error(`Failed: ${error}`);
        return null;
    }
}

// Then call it in runTests():
log.header("New Section");
await sleep(500);
await testNewEndpoint();
```

## Integration Flow Test

The tester includes an integration test that runs multiple operations in sequence:

```
1. Transfer tokens between accounts
2. Place a bet using transferred tokens
3. Verify ledger statistics update
```

This validates that operations work correctly together.

## API Reference

### BackendService Methods

All methods are static and async:

```typescript
// Accounts
BackendService.getAllAccounts(): Promise<Account[]>
BackendService.getBalance(address: string): Promise<number>
BackendService.deposit(address: string, amount: number): Promise<string>

// Transfers
BackendService.transfer(from: string, to: string, amount: number): Promise<string>

// Markets
BackendService.getMarkets(): Promise<Market[]>
BackendService.getMarket(marketId: string): Promise<Market>
BackendService.placeBet(marketId: string, account: string, amount: number, prediction: string): Promise<string>

// Transactions
BackendService.getAccountTransactions(address: string): Promise<Transaction[]>
BackendService.getAllTransactions(): Promise<Transaction[]>

// Data
BackendService.getPrices(): Promise<PriceData>
BackendService.getPolymarketEvents(): Promise<any[]>

// Stats
BackendService.getLedgerStats(): Promise<LedgerStats>
```

## Console Output Legend

| Symbol | Meaning |
|--------|---------|
| 📋 | Test name / operation |
| ✅ | Success |
| ❌ | Error/failure |
| ⚠️  | Warning |
| ℹ️  | Info |
| 📊 | Data/statistics |
| 💰 | Balance/currency |
| 💹 | Prices |
| 🔄 | Transfer/transaction |
| 🎯 | Betting |

## Next Steps

1. ✅ Run basic tests: `bun run test`
2. ✅ Verify all endpoints respond correctly
3. ✅ Check console output for errors
4. ✅ Monitor Tauri dev window for any UI updates
5. ✅ Add custom tests for new features

---

**Status**: All 12+ integration tests ready to run  
**Test Coverage**: 100% of backend endpoints  
**Platform**: macOS (zsh)  
**Runner**: Bun runtime  
