#!/usr/bin/env bash

# One-liner commands for BlackBook L1 testing
# Copy and paste directly into terminal

# Build
echo "Build: cd ~/Documents/GitHub/BlackBook_TK/bun && bun run build"

# Start dev server (run in Terminal 1)
echo "Dev Server (Terminal 1): cd ~/Documents/GitHub/BlackBook_TK/bun && bun run tauri:dev"

# Run tests (run in Terminal 2)
echo "Run Tests (Terminal 2): cd ~/Documents/GitHub/BlackBook_TK/bun && bun run test"

# Watch tests
echo "Watch Tests: cd ~/Documents/GitHub/BlackBook_TK/bun && bun run test:watch"

# Show this reference
echo "Show Reference: cat ~/Documents/GitHub/BlackBook_TK/bun/TEST_REFERENCE.sh"

# Show full testing guide
echo "Full Guide: cat ~/Documents/GitHub/BlackBook_TK/bun/TESTING.md"
