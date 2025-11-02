use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;
use blackbook_prediction_market::ledger::{Ledger, Recipe, Transaction};
use blackbook_prediction_market::markets::{Market, Bet};

/// Response DTO for live prices
#[derive(Debug, Serialize, Clone)]
pub struct PriceResponse {
    pub btc: f64,
    pub sol: f64,
    pub timestamp: i64,
}

/// CoinGecko price response
#[derive(Debug, Deserialize)]
pub struct CoinGeckoResponse {
    pub bitcoin: Option<CoinGeckoPrice>,
    pub solana: Option<CoinGeckoPrice>,
}

#[derive(Debug, Deserialize)]
pub struct CoinGeckoPrice {
    pub usd: f64,
}

/// Application state holding the blockchain ledger
pub type AppState = Arc<Mutex<Ledger>>;

/// DTO for bet placement request
#[derive(Debug, Deserialize)]
pub struct BetRequest {
    pub account: String,
    pub market_id: String,
    pub amount: f64,
    pub prediction: String, // "HIGHER" or "LOWER"
}

/// DTO for transfer request
#[derive(Debug, Deserialize)]
pub struct TransferRequest {
    pub from: String,
    pub to: String,
    pub amount: f64,
}

/// DTO for admin deposit request
#[derive(Debug, Deserialize)]
pub struct DepositRequest {
    pub address: String,
    pub amount: f64,
}

/// DTO for account info response
#[derive(Debug, Serialize, Clone)]
pub struct AccountInfo {
    pub name: String,
    pub address: String,
    pub balance: f64,
}

/// Get all accounts with their addresses and balances
#[tauri::command]
pub fn get_accounts(state: State<AppState>) -> Result<Vec<AccountInfo>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    
    let mut accounts = Vec::new();
    
    for (name, address) in &ledger.accounts {
        let balance = ledger.get_balance(name);
        accounts.push(AccountInfo {
            name: name.clone(),
            address: address.clone(),
            balance,
        });
    }
    
    // Sort by name for consistent ordering
    accounts.sort_by(|a, b| a.name.cmp(&b.name));
    
    Ok(accounts)
}

/// Get balance for a specific account
#[tauri::command]
pub fn get_balance(address: String, state: State<AppState>) -> Result<f64, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.get_balance(&address))
}

/// Place a bet on a market - PROXIES TO BLOCKCHAIN CORE HTTP API
#[tauri::command]
pub async fn place_bet(req: BetRequest, state: State<'_, AppState>) -> Result<String, String> {
    let timestamp = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] 🎯 IPC→HTTP | place_bet called | Account: {}, Market: {}, Amount: {} BB, Prediction: {}", 
        timestamp, req.account, req.market_id, req.amount, req.prediction);
    
    // Call blockchain core HTTP API
    let client = reqwest::Client::new();
    let url = "http://localhost:3000/bet";
    
    let payload = serde_json::json!({
        "account": req.account,
        "market_id": req.market_id,
        "amount": req.amount,
        "prediction": req.prediction
    });
    
    let response = client.post(url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to blockchain: {}", e))?;
    
    if response.status().is_success() {
        let result: serde_json::Value = response.json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] ✅ BLOCKCHAIN_VERIFIED | Bet placed successfully via HTTP API", timestamp);
        
        Ok(result.to_string())
    } else {
        let error = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] ❌ BLOCKCHAIN_REJECTED | {}", timestamp, error);
        Err(error)
    }
}

/// Transfer tokens between accounts - PROXIES TO BLOCKCHAIN CORE HTTP API
#[tauri::command]
pub async fn transfer(req: TransferRequest, state: State<'_, AppState>) -> Result<String, String> {
    let timestamp = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] 🎯 IPC→HTTP | transfer called | From: {}, To: {}, Amount: {} BB", 
        timestamp, req.from, req.to, req.amount);
    
    // Call blockchain core HTTP API
    let client = reqwest::Client::new();
    let url = "http://localhost:3000/transfer";
    
    let payload = serde_json::json!({
        "from": req.from,
        "to": req.to,
        "amount": req.amount
    });
    
    let response = client.post(url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to blockchain: {}", e))?;
    
    if response.status().is_success() {
        let result: serde_json::Value = response.json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] ✅ BLOCKCHAIN_VERIFIED | Transfer completed via HTTP API", timestamp);
        
        Ok(result.to_string())
    } else {
        let error = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] ❌ BLOCKCHAIN_REJECTED | {}", timestamp, error);
        Err(error)
    }
}

/// Admin: Add tokens to an account - PROXIES TO BLOCKCHAIN CORE HTTP API
#[tauri::command]
pub async fn admin_deposit(req: DepositRequest, state: State<'_, AppState>) -> Result<String, String> {
    let timestamp = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] 🎯 IPC→HTTP | admin_deposit called | Account: {}, Amount: {} BB", 
        timestamp, req.address, req.amount);
    
    // Call blockchain core HTTP API
    let client = reqwest::Client::new();
    let url = "http://localhost:3000/deposit";
    
    let payload = serde_json::json!({
        "address": req.address,
        "amount": req.amount,
        "memo": "Admin deposit via Tauri IPC"
    });
    
    let response = client.post(url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to blockchain: {}", e))?;
    
    if response.status().is_success() {
        let result: serde_json::Value = response.json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] ✅ BLOCKCHAIN_VERIFIED | Deposit completed via HTTP API", timestamp);
        
        Ok(result.to_string())
    } else {
        let error = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] ❌ BLOCKCHAIN_REJECTED | {}", timestamp, error);
        Err(error)
    }
}

/// Get all transactions in the ledger
#[tauri::command]
pub fn get_all_transactions(state: State<AppState>) -> Result<Vec<Transaction>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.get_all_transactions())
}

/// Get transactions for a specific account
#[tauri::command]
pub fn get_account_transactions(address: String, state: State<AppState>) -> Result<Vec<Transaction>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.get_account_transactions(&address))
}

/// Get all activity recipes
#[tauri::command]
pub fn get_recipes(state: State<AppState>) -> Result<Vec<Recipe>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.get_recipes_sorted())
}

/// Get recipes for a specific account
#[tauri::command]
pub fn get_account_recipes(address: String, state: State<AppState>) -> Result<Vec<Recipe>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.get_account_recipes_sorted(&address))
}

/// Get recipes by type
#[tauri::command]
pub fn get_recipes_by_type(recipe_type: String, state: State<AppState>) -> Result<Vec<Recipe>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.get_recipes_by_type(&recipe_type))
}

/// Get ledger statistics
#[tauri::command]
pub fn get_stats(state: State<AppState>) -> Result<serde_json::Value, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    let stats = ledger.get_stats();
    Ok(serde_json::to_value(stats).map_err(|e| e.to_string())?)
}

/// Record a bet win for an account
#[tauri::command]
pub fn record_bet_win(address: String, amount: f64, bet_id: String, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    ledger.record_bet_win(&address, amount, &bet_id);
    Ok(format!("Recorded win of {} BB for {} on bet {}", amount, address, bet_id))
}

/// Record a bet loss for an account
#[tauri::command]
pub fn record_bet_loss(address: String, amount: f64, bet_id: String, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    ledger.record_bet_loss(&address, amount, &bet_id);
    Ok(format!("Recorded loss of {} BB for {} on bet {}", amount, address, bet_id))
}

/// DTO for market info
#[derive(Debug, Serialize, Clone)]
pub struct MarketInfo {
    pub id: String,
    pub title: String,
    pub description: String,
    pub yes_shares: f64,
    pub no_shares: f64,
    pub yes_price: f64,
    pub no_price: f64,
    pub total_volume: f64,
    pub is_resolved: bool,
    pub winning_outcome: Option<String>,
}

/// Get all prediction markets
#[tauri::command]
pub fn get_markets(state: State<AppState>) -> Result<Vec<MarketInfo>, String> {
    let _ledger = state.lock().map_err(|e| e.to_string())?;
    
    // For demo purposes, return some sample markets
    // In a real implementation, this would come from persistent storage
    Ok(vec![
        MarketInfo {
            id: "MARKET_01".to_string(),
            title: "Will Bitcoin reach $100k by 2026?".to_string(),
            description: "Market resolves YES if Bitcoin (BTC) reaches $100,000 USD by January 1, 2026".to_string(),
            yes_shares: 450.0,
            no_shares: 550.0,
            yes_price: 0.45,
            no_price: 0.55,
            total_volume: 2340.0,
            is_resolved: false,
            winning_outcome: None,
        },
        MarketInfo {
            id: "MARKET_02".to_string(),
            title: "Will AI achieve AGI by 2027?".to_string(),
            description: "Market resolves YES if Artificial General Intelligence is achieved by December 31, 2027".to_string(),
            yes_shares: 320.0,
            no_shares: 680.0,
            yes_price: 0.32,
            no_price: 0.68,
            total_volume: 1560.0,
            is_resolved: false,
            winning_outcome: None,
        },
        MarketInfo {
            id: "MARKET_03".to_string(),
            title: "Will Tesla stock be above $300 in Q1 2025?".to_string(),
            description: "Market resolves YES if TSLA closes above $300 any day in Q1 2025".to_string(),
            yes_shares: 600.0,
            no_shares: 400.0,
            yes_price: 0.60,
            no_price: 0.40,
            total_volume: 890.0,
            is_resolved: false,
            winning_outcome: None,
        },
    ])
}

/// Fetch live prices from CoinGecko API
#[tauri::command]
pub async fn get_prices() -> Result<PriceResponse, String> {
    let client = reqwest::Client::new();
    let url = "https://api.coingecko.com/api/v3/simple/price";
    
    let response = client
        .get(url)
        .query(&[("ids", "bitcoin,solana"), ("vs_currencies", "usd")])
        .send()
        .await
        .map_err(|e| format!("Failed to fetch prices: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("CoinGecko API error: {}", response.status()));
    }

    let data: CoinGeckoResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse CoinGecko response: {}", e))?;

    let btc = data
        .bitcoin
        .ok_or("Bitcoin price not found in response")?
        .usd;
    let sol = data
        .solana
        .ok_or("Solana price not found in response")?
        .usd;

    Ok(PriceResponse {
        btc,
        sol,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0),
    })
}

/// Fetch Polymarket events from Gamma API
#[tauri::command]
pub async fn get_polymarket_events() -> Result<Vec<serde_json::Value>, String> {
    let client = reqwest::Client::new();
    let api_url = "https://gamma-api.polymarket.com/events";
    
    println!("🔮 [Polymarket API] Fetching top 20 events sorted by 24h volume");
    
    let response = client
        .get(api_url)
        .query(&[
            ("sort_by", "volume_24hr"),
            ("ascending", "false"),
            ("closed", "false"),
            ("limit", "20")
        ])
        .send()
        .await
        .map_err(|e| {
            let err_msg = format!("🔴 [Polymarket API] Failed to connect: {}", e);
            println!("{}", err_msg);
            err_msg
        })?;

    let status = response.status();
    println!("📡 [Polymarket API] Response status: {}", status);
    
    if !status.is_success() {
        let err_msg = format!("🔴 [Polymarket API] HTTP error: {} {}", status.as_u16(), status.canonical_reason().unwrap_or("Unknown"));
        println!("{}", err_msg);
        return Err(err_msg);
    }

    let content_length = response.content_length();
    println!("📦 [Polymarket API] Content length: {:?} bytes", content_length);

    let mut events: Vec<serde_json::Value> = response
        .json()
        .await
        .map_err(|e| {
            let err_msg = format!("🔴 [Polymarket API] Failed to parse JSON response: {}", e);
            println!("{}", err_msg);
            err_msg
        })?;

    println!("✅ [Polymarket API] Successfully parsed {} events from response", events.len());
    
    // Log sample event structure
    if !events.is_empty() {
        if let Some(first_event) = events.first() {
            let keys: Vec<String> = first_event
                .as_object()
                .map(|obj| obj.keys().cloned().collect())
                .unwrap_or_default();
            println!("📋 [Polymarket API] First event fields: {}", keys.join(", "));
            println!("📋 [Polymarket API] Sample event: {}", serde_json::to_string_pretty(first_event).unwrap_or_default());
        }
    }

    // Take only the first 20 events
    events.truncate(20);
    
    println!("✅ [Polymarket API] Returning {} top events by volume to frontend", events.len());
    Ok(events)
}

/// Get BlackBook events from RSS feed
#[tauri::command]
pub async fn get_blackbook_events() -> Result<Vec<serde_json::Value>, String> {
    use std::fs;
    use std::path::Path;
    
    // Try to read the RSS file from the project
    let rss_paths = vec![
        "blackBook/src/event.rss",
        "../blackBook/src/event.rss",
        "../../blackBook/src/event.rss",
    ];
    
    let mut rss_content = String::new();
    let mut found = false;
    
    for path in rss_paths {
        if Path::new(path).exists() {
            match fs::read_to_string(path) {
                Ok(content) => {
                    rss_content = content;
                    found = true;
                    break;
                }
                Err(_) => continue,
            }
        }
    }
    
    if !found {
        return Err("RSS file not found".to_string());
    }
    
    // Parse XML
    match roxmltree::Document::parse(&rss_content) {
        Ok(doc) => {
            let mut events = Vec::new();
            
            for item in doc.root().descendants() {
                if item.is_element() && item.tag_name().name() == "item" {
                    let mut event = serde_json::json!({});
                    
                    for child in item.children().filter(|n| n.is_element()) {
                        let tag_name = child.tag_name().name();
                        match tag_name {
                            "title" => {
                                if let Some(text) = child.text() {
                                    event["title"] = serde_json::Value::String(
                                        text.replace("✅ ACTIVE MARKET - ", "")
                                    );
                                }
                            }
                            "description" => {
                                if let Some(text) = child.text() {
                                    event["description"] = serde_json::Value::String(text.to_string());
                                }
                            }
                            "link" => {
                                if let Some(text) = child.text() {
                                    event["link"] = serde_json::Value::String(text.to_string());
                                }
                            }
                            "category" => {
                                if let Some(text) = child.text() {
                                    event["category"] = serde_json::Value::String(text.to_string());
                                }
                            }
                            "confidence" => {
                                if let Some(text) = child.text() {
                                    if let Ok(conf) = text.parse::<f64>() {
                                        if let Some(num) = serde_json::Number::from_f64(conf) {
                                            event["confidence"] = serde_json::Value::Number(num);
                                        }
                                    }
                                }
                            }
                            "marketId" => {
                                if let Some(text) = child.text() {
                                    event["marketId"] = serde_json::Value::String(text.to_string());
                                }
                            }
                            "options" => {
                                let mut options = Vec::new();
                                for opt_child in child.children().filter(|n| n.is_element()) {
                                    if opt_child.tag_name().name() == "option" {
                                        if let Some(text) = opt_child.text() {
                                            options.push(serde_json::Value::String(text.to_string()));
                                        }
                                    }
                                }
                                event["options"] = serde_json::Value::Array(options);
                            }
                            _ => {}
                        }
                    }
                    
                    if !event.is_null() && event.get("title").is_some() {
                        events.push(event);
                    }
                }
            }
            
            Ok(events)
        },
        Err(e) => Err(format!("Failed to parse RSS XML: {}", e)),
    }
}


// ============================================
// PRODUCTION PREDICTION MARKET COMMANDS
// ============================================

/// DTO for creating a market
#[derive(Debug, Deserialize)]
pub struct CreateMarketRequest {
    pub id: String,
    pub title: String,
    pub description: String,
    pub outcomes: Vec<String>,
    pub category: String,
    pub resolution_source: String,
}

/// DTO for placing a market bet
#[derive(Debug, Deserialize)]
pub struct PlaceMarketBetRequest {
    pub account: String,
    pub market_id: String,
    pub outcome_index: usize,
    pub amount: f64,
}

/// DTO for resolving a market
#[derive(Debug, Deserialize)]
pub struct ResolveMarketRequest {
    pub market_id: String,
    pub winning_outcome: usize,
}

/// Create a new prediction market
#[tauri::command]
pub fn create_market(req: CreateMarketRequest, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    println!("📈 Creating market: {} - {}", req.id, req.title);
    
    ledger.market_manager.create_market(
        req.id.clone(),
        req.title,
        req.description,
        req.outcomes,
        req.category,
        req.resolution_source,
    )
}

/// Get all open markets
#[tauri::command]
pub fn get_open_markets(state: State<AppState>) -> Result<Vec<Market>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.market_manager.get_open_markets())
}

/// Get market statistics
#[tauri::command]
pub fn get_market_stats(market_id: String, state: State<AppState>) -> Result<serde_json::Value, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    
    match ledger.market_manager.get_market_stats(&market_id) {
        Some(stats) => Ok(serde_json::to_value(stats).map_err(|e| e.to_string())?),
        None => Err(format!("Market {} not found", market_id)),
    }
}

/// Place a bet on a market outcome WITH ESCROW
#[tauri::command]
pub fn place_market_bet(req: PlaceMarketBetRequest, state: State<AppState>) -> Result<Bet, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    println!("🎯 Placing bet WITH ESCROW: {} - {} BB on market {} outcome {}", 
             req.account, req.amount, req.market_id, req.outcome_index);
    
    // Use the new escrow-integrated bet placement method
    let bet = ledger.place_market_bet(&req.account, &req.market_id, req.outcome_index, req.amount)?;
    
    println!("✅ Bet placed successfully: {} - Escrow locked {} BB", bet.id, req.amount);
    
    Ok(bet)
}

/// Close a market (stop accepting bets)
#[tauri::command]
pub fn close_market(market_id: String, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    ledger.market_manager.close_market(market_id)
}

/// Resolve a market with winning outcome and distribute payouts WITH ESCROW
#[tauri::command]
pub fn resolve_market(req: ResolveMarketRequest, state: State<AppState>) -> Result<Vec<(String, f64)>, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    println!("✅ Resolving market {} to outcome {} (WITH ESCROW)", req.market_id, req.winning_outcome);
    
    // Use the new escrow-integrated resolve method
    let payouts = ledger.resolve_market_with_escrow(&req.market_id, req.winning_outcome)?;
    
    // Log all payouts
    for (account_address, payout_amount) in &payouts {
        println!("💰 Escrow Payout: {} wins {} BB", account_address, payout_amount);
    }
    
    println!("✅ Market {} resolved successfully with {} payouts", req.market_id, payouts.len());
    
    Ok(payouts)
}

/// Get user's active bets
#[tauri::command]
pub fn get_user_bets(account: String, state: State<AppState>) -> Result<Vec<Bet>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    Ok(ledger.market_manager.get_account_bets(&account))
}

/// Get all markets (including closed and resolved)
#[tauri::command]
pub fn get_all_markets(state: State<AppState>) -> Result<Vec<Market>, String> {
    let ledger = state.lock().map_err(|e| e.to_string())?;
    let markets: Vec<Market> = ledger.market_manager.markets.values().cloned().collect();
    Ok(markets)
}

// ============================================
// ADMIN COMMANDS
// ============================================

/// Admin command to mint tokens and add them to an account
#[tauri::command]
pub fn admin_mint_tokens(account: String, amount: f64, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    let old_balance = ledger.get_balance(&account);
    let result = ledger.admin_mint_tokens(&account, amount);
    
    // Log blockchain activity
    if let Ok(ref tx_id) = result {
        let new_balance = ledger.get_balance(&account);
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] 🪙 TOKENS_MINTED | Account: {} | Minted: {} BB | Old Balance: {} BB | New Balance: {} BB | TX: {}", 
            timestamp, account, amount, old_balance, new_balance, tx_id);
        Ok(format!("Successfully minted {} BB to {}. New balance: {} BB", amount, account, new_balance))
    } else {
        result
    }
}

/// Admin command to set an account balance to a specific value
#[tauri::command]
pub fn admin_set_balance(account: String, new_balance: f64, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    let old_balance = ledger.get_balance(&account);
    let result = ledger.admin_set_balance(&account, new_balance);
    
    // Log blockchain activity
    if let Ok(ref tx_id) = result {
        let timestamp = chrono::Local::now().format("%H:%M:%S");
        println!("[{}] ⚖️  BALANCE_SET | Account: {} | Old: {} BB → New: {} BB | TX: {}", 
            timestamp, account, old_balance, new_balance, tx_id);
        Ok(format!("Successfully set {} balance to {} BB", account, new_balance))
    } else {
        result
    }
}