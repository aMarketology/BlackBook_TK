#!/usr/bin/env bash

# BlackBook L1 Test Commands Reference
# Quick reference for testing all endpoints on macOS

cat << 'EOF'

╔══════════════════════════════════════════════════════════════════╗
║           BlackBook L1 Endpoint Testing Guide                   ║
║                macOS Terminal Commands                          ║
╚══════════════════════════════════════════════════════════════════╝

🚀 GETTING STARTED
══════════════════════════════════════════════════════════════════

1. Build the project:
   cd ~/Documents/GitHub/BlackBook_TK/bun
   bun run build

2. Start Tauri dev server (Terminal 1):
   cd ~/Documents/GitHub/BlackBook_TK/bun
   bun run tauri:dev
   
   💡 Wait for the app window to open and display

3. Run tests (Terminal 2):
   cd ~/Documents/GitHub/BlackBook_TK/bun
   bun run test


📋 TEST COMMANDS
══════════════════════════════════════════════════════════════════

Run all endpoint tests:
   bun run test

Watch mode (auto-rerun on changes):
   bun run test:watch

Run specific test file directly:
   bun tests/tester.ts

Run Bun test framework version:
   bun test tests/endpoints.test.ts


🧪 WHAT GETS TESTED (12+ Integration Tests)
══════════════════════════════════════════════════════════════════

Account Operations:
   ✓ GET_ACCOUNTS     - Retrieve all 8 accounts
   ✓ GET_BALANCE      - Get balance for address

Transfer Operations:
   ✓ TRANSFER         - Transfer tokens between accounts
   ✓ Validation       - Check balance constraints

Market Operations:
   ✓ GET_MARKETS      - Retrieve all markets
   ✓ GET_MARKET       - Get specific market details

Betting Operations:
   ✓ PLACE_BET        - Place YES/NO bets on markets

Price Data:
   ✓ GET_PRICES       - Fetch BTC/SOL from CoinGecko
   ✓ POLYMARKET       - Fetch events from Gamma API

Transaction History:
   ✓ GET_TRANSACTIONS - Get account transaction history
   ✓ ALL_TRANSACTIONS - Get complete ledger history

Ledger Statistics:
   ✓ GET_STATS        - Get ledger statistics (accounts, volume, bets)

Admin Operations:
   ✓ ADMIN_DEPOSIT    - Deposit tokens to account


📊 EXPECTED BEHAVIOR
══════════════════════════════════════════════════════════════════

Terminal Output Format:
   📋 Test name/operation
   ✅ Success message
      📝 Details
      💰 Data
   
   or
   
   ❌ Error message
   ⚠️  Warning

Example Transfer Test:
   📋 TRANSFER - Transfer 15 BB from alice to bob
   ℹ️  Recipient balance before: 480 BB
   ✅ Transfer executed
   ℹ️  Recipient balance after: 495 BB (change: +15)


⚡ QUICK WORKFLOW
══════════════════════════════════════════════════════════════════

Terminal 1 - Start Dev Server:
   $ cd bun
   $ bun run tauri:dev
   
   [Wait for app window to appear]
   ✅ App loaded in window

Terminal 2 - Run Tests:
   $ cd bun
   $ bun run test
   
   [Watch output as tests execute]
   ✅ All tests complete


🔧 TROUBLESHOOTING
══════════════════════════════════════════════════════════════════

Issue: "Cannot find module"
Fix:   Make sure you're in /bun directory
       cd ~/Documents/GitHub/BlackBook_TK/bun

Issue: "Tauri dev server not running"
Fix:   Start it in another terminal: bun run tauri:dev

Issue: Tests timeout/hang
Fix:   • Check Tauri server is still running
       • May need to restart server
       • Check network (CoinGecko, Polymarket APIs)

Issue: Balances don't match
Fix:   Ledger is persistent across tests
       Run admin deposit to top up accounts
       Or restart Tauri for fresh ledger


💡 TIPS & TRICKS
══════════════════════════════════════════════════════════════════

Monitor live: Open Tauri dev window alongside terminal to see UI updates

Check logs: Tests output color-coded results
           Look for ✅ (success) vs ❌ (error)

Reset state: Restart Tauri dev server for fresh ledger
             bun run tauri:dev

Multiple runs: Balances change with each test run
              Use ADMIN_DEPOSIT to restore funds

API debugging: Check these external services:
              • CoinGecko (prices)
              • Polymarket Gamma API (events)


📚 DETAILED DOCUMENTATION
══════════════════════════════════════════════════════════════════

Full testing guide with examples:
   cat TESTING.md

Test implementation details:
   cat tests/tester.ts

Backend service interface:
   cat src/lib/backend_service.ts


🎯 SUCCESS CRITERIA
══════════════════════════════════════════════════════════════════

✅ All tests show ✅ success indicators
✅ No ❌ errors or timeouts
✅ Account balances update correctly
✅ Transfers complete successfully
✅ Bets are recorded in transactions
✅ Prices return valid values
✅ Polymarket events load correctly
✅ Statistics reflect operations


📝 NEXT STEPS
══════════════════════════════════════════════════════════════════

1. Run: bun run test
2. Review output for any issues
3. Check Tauri window for UI updates
4. Verify balances changed correctly
5. Add more tests as needed


════════════════════════════════════════════════════════════════════

Happy Testing! 🚀

EOF
