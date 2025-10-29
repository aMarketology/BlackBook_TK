# 🎯 BlackBook Prediction Market - Quick Start Guide

## ✅ System Status
- **Backend API**: Running on `http://localhost:3000` ✅
- **Frontend UI**: http://localhost:8082/marketplace.html (check console)
- **Database**: In-memory HashMap (no persistence yet)

---

## 🚀 How to Add Events to Your Prediction Market

### Method 1: Using the Web Scraper (Easiest)

1. **Open Admin Panel**
   - Click the red **"Admin"** button in the top-right corner
   - The admin panel opens with a scraper form

2. **Paste a URL**
   - Find any webpage with event information (UFC, news, sports, etc.)
   - Example URLs:
     - `https://www.ufc.com/event/ufc-322`
     - `https://www.cnn.com/world` (news)
     - `https://www.bbc.com/sport` (sports)
   - Paste the URL into the scraper field

3. **Optionally Set Title**
   - Leave blank to auto-detect from page title
   - Or enter custom title like "UFC 322 Main Event"

4. **Choose Category**
   - Tech, Crypto, Sports, Politics, or Business
   - This helps categorize the market

5. **Click "Scrape URL & Create Market"**
   - ✅ The page is fetched
   - ✅ Title, description, date are extracted
   - ✅ A new prediction market is created
   - ✅ You see the new market in the "All Markets" tab

---

## 🔧 API Endpoints

### Core Market Operations
```
GET  /markets                    - List all prediction markets
POST /markets                    - Create market manually
GET  /markets/:id                - Get specific market
GET  /leaderboard                - Featured markets (10+ bettors)
GET  /leaderboard/:category      - Featured markets by category

POST /scrape                      - Scrape URL and create market
POST /bet                         - Place a bet
POST /resolve/:market_id/:option  - Resolve market (admin)
```

### Account & Ledger
```
GET  /balance/:address           - Get account balance
GET  /accounts                   - List all demo accounts
POST /deposit                    - Deposit funds to account
POST /transfer                   - Transfer between accounts
GET  /transactions               - List all transactions
GET  /ledger/stats               - Ledger statistics
```

---

## 📊 Backend Flow

```
User Action                          Backend Processing
─────────────────────────────────────────────────────────

1. Click "Scrape URL & Create"
        ↓
2. POST /scrape
   {
     "url": "https://example.com",
     "title": "My Event",
     "category": "sports"
   }
        ↓
3. scraper::scrape_url(url)
   - HTTP GET request to URL
   - Parse HTML
   - Extract title, description, date
        ↓
4. Create PredictionMarket
   - Generate market ID
   - Set options to ["Yes", "No"]
   - Store in AppState.markets HashMap
        ↓
5. Return JSON response
   {
     "success": true,
     "market_id": "market_abc123",
     "scraped_event": {
       "title": "Event Title",
       "description": "...",
       "date": "...",
       "url": "..."
     }
   }
        ↓
6. Frontend displays new market
   in "All Markets" tab
```

---

## 💡 Demo Workflow

### Step 1: Start Backend
```bash
cd blackbook
cargo run
```
Expected output:
```
🚀 BlackBook Prediction Market starting on http://127.0.0.1:3000
📚 API Endpoints: ...
```

### Step 2: Open Frontend
```
http://localhost:8082/marketplace.html
```

### Step 3: Create Account
- 3 demo accounts ready: `alice`, `bob`, `charlie`
- Each has 1000 BB tokens
- Click on an account to select it

### Step 4: Add Event
1. Click **Admin** button (red button, top-right)
2. Paste URL: `https://www.ufc.com/events`
3. Leave title blank (auto-detect)
4. Select category: **Sports**
5. Click **"Scrape URL & Create Market"**

### Step 5: Place Bets
1. Click **"All Markets"** tab
2. Find your new market
3. Click "Yes" or "No" option
4. Enter amount (e.g., 100 BB)
5. Click **Bet** button
6. ✅ Bet placed! Watch your balance decrease

---

## 📁 File Structure

```
blackbook/
├── src/
│   ├── main.rs              ← API endpoints & routing
│   ├── ledger.rs            ← Account/transaction management
│   ├── scraper.rs           ← URL web scraper (NEW!)
│   ├── market.rs            ← Market data structure
│   ├── consensus.rs         ← Blockchain logic
│   └── ...
├── frontend/
│   └── marketplace.html      ← Web UI
├── Cargo.toml               ← Dependencies
└── ...
```

---

## 🛠️ Creating Markets

### Option A: Scraper (Recommended)
- Paste URL → Auto-detect content → Market created
- Fastest way to populate markets with real events

### Option B: Manual via API
```bash
curl -X POST http://localhost:3000/markets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Will Bitcoin reach $100K by end of 2025?",
    "description": "Prediction on Bitcoin price target",
    "category": "crypto",
    "options": ["Yes", "No"]
  }'
```

### Option C: Manual via Frontend
- Click **"All Markets"** tab (currently no UI for this)
- Or use Admin panel (coming soon)

---

## 🎮 Test Scenarios

### Test 1: Scrape Sports Event
1. Admin → Scraper
2. URL: `https://www.ufc.com/events`
3. Category: Sports
4. Create → ✅ Should see market in "All Markets"

### Test 2: Scrape News
1. Admin → Scraper
2. URL: `https://www.bbc.com/news` (any news site)
3. Category: Politics/Business
4. Create → ✅ Should extract headline as title

### Test 3: Place Bets
1. Select "alice" account
2. Find a market
3. Place 100 BB on "Yes"
4. Check alice's balance decreased
5. ✅ Works!

### Test 4: Leaderboard
1. Place 10+ bets from different accounts on same market
2. Click **Leaderboard** tab
3. Market should appear (shows when 10+ bettors)

---

## 🚨 Troubleshooting

### Issue: "No markets showing"
**Solution**: 
- Refresh page (F5)
- Check browser console (F12) for errors
- Verify backend is running: `curl http://localhost:3000/health`

### Issue: "Scraper returns error"
**Solution**:
- Website might block scrapers (use robots.txt safe sites)
- Try simpler sites (BBC, CNN, Wikipedia)
- Check backend logs for error message

### Issue: "Balance not updating after bet"
**Solution**:
- Refresh page
- Check if account is selected
- Look at API response in browser console

### Issue: "Frontend shows 'Loading...' forever"
**Solution**:
- Backend might not be running
- Check port 3000 is accessible
- Restart backend with `cargo run`

---

## 📈 Next Steps

### Coming Soon
1. ✅ Persistent database (SQLite/PostgreSQL)
2. ✅ Weekly auto-refresh of event sources
3. ✅ Market pruning (remove old markets with no bets)
4. ✅ Real-time leaderboard updates
5. ✅ WebSocket for live price updates
6. ✅ Market resolution & payout logic
7. ✅ User authentication

### Deploy
1. ✅ Docker containerization
2. ✅ Cloud hosting (AWS/Vercel)
3. ✅ Production database
4. ✅ Real payment integration

---

## 💰 How Betting Works

### Current System (Demo)
- All accounts start with 1000 BB tokens
- Place bets on "Yes" or "No" outcomes
- Bets tracked in ledger (immutable transaction log)
- Balance updates in real-time
- Leaderboard tracks most popular markets

### Future System
- Winner determined when market resolves
- Winners split loser's money (minus fees)
- Payouts automated via smart contract
- Real cryptocurrency integration

---

## 🎓 Understanding the Code

### Scraper Flow (Simple!)
```rust
// 1. User submits URL
async fn scrape_and_create_market(url, title, category) {
    
    // 2. Fetch and parse
    let event = scraper::scrape_url(url).await?;
    
    // 3. Create market
    let market = PredictionMarket::new(
        market_id,
        event.title,
        event.description,
        category,
        vec!["Yes", "No"]
    );
    
    // 4. Store in AppState
    state.markets.insert(market_id, market);
    
    // 5. Return success
    Ok(Json({ success: true, market_id, ... }))
}
```

### Scraper Methods
- **HTML Parsing**: Uses CSS selectors to extract text from web pages
- **Date Extraction**: Finds common date formats (Jan 1, 2025, etc.)
- **Title Detection**: Looks for `<h1>`, `<title>`, meta tags
- **Description**: Gets first paragraph or meta description

---

## 📞 Support

For issues:
1. Check browser console (F12 → Console tab)
2. Check backend terminal output
3. Check file: `SCRAPER_ARCHITECTURE.md`
4. Create test with curl:
   ```bash
   curl http://localhost:3000/health
   ```

---

**Happy Predicting! 🎯**
