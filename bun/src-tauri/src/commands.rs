use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;
use blackbook_prediction_market::ledger::{Ledger, Recipe, Transaction};

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

/// Place a bet on a market
#[tauri::command]
pub fn place_bet(req: BetRequest, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    let market_id = format!("{}_{}", req.market_id, req.prediction);
    ledger.place_bet(&req.account, &market_id, req.amount)
}

/// Transfer tokens between accounts
#[tauri::command]
pub fn transfer(req: TransferRequest, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    ledger.transfer(&req.from, &req.to, req.amount)
}

/// Admin: Add tokens to an account
#[tauri::command]
pub fn admin_deposit(req: DepositRequest, state: State<AppState>) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    ledger.add_tokens(&req.address, req.amount)
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

/// Create a new prediction market
#[tauri::command]
pub fn create_market(
    title: String,
    description: String,
    initial_liquidity: f64,
    state: State<AppState>
) -> Result<MarketInfo, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    // Generate a unique market ID
    let market_id = format!("MARKET_{}", uuid::Uuid::new_v4().to_string().replace("-", "").to_uppercase()[..8].to_string());
    
    // Create market with CSMM (Constant Sum Market Maker)
    // Initial liquidity split 50/50 between YES and NO
    let yes_shares = initial_liquidity / 2.0;
    let no_shares = initial_liquidity / 2.0;
    
    // CSMM pricing: price = shares / (yes_shares + no_shares)
    let total_shares = yes_shares + no_shares;
    let yes_price = yes_shares / total_shares;
    let no_price = no_shares / total_shares;
    
    // Record market creation transaction
    // Using add_tokens as a system operation to record market creation
    ledger.add_tokens("SYSTEM", 0.0).map_err(|e| format!("Failed to record market creation: {}", e))?;
    
    Ok(MarketInfo {
        id: market_id,
        title,
        description,
        yes_shares,
        no_shares,
        yes_price,
        no_price,
        total_volume: 0.0,
        is_resolved: false,
        winning_outcome: None,
    })
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

/// Place a bet on a prediction market
#[tauri::command]
pub fn place_market_bet(
    market_id: String,
    account_name: String,
    amount: f64,
    outcome: String, // "YES" or "NO"
    state: State<AppState>
) -> Result<String, String> {
    let mut ledger = state.lock().map_err(|e| e.to_string())?;
    
    // Validate account has sufficient balance
    let balance = ledger.get_balance(&account_name);
    if balance < amount {
        return Err(format!("Insufficient balance: {} BB available, {} BB required", balance, amount));
    }
    
    // Get account address
    let address = ledger.accounts.get(&account_name)
        .ok_or("Account not found")?
        .clone();
    
    // Place the bet using the existing place_bet method which handles balance deduction and transaction recording
    let bet_id = format!("BET_{}", uuid::Uuid::new_v4().to_string().replace("-", "").to_uppercase()[..8].to_string());
    let full_market_id = format!("{}_{}", market_id, outcome);
    
    // Use the existing place_bet method that handles deduction and transaction recording
    ledger.place_bet(&account_name, &full_market_id, amount)?;
    
    // Record the bet win/loss tracking for later resolution
    ledger.record_bet_win(&account_name, 0.0, &bet_id); // 0 amount initially, updated on resolution
    
    Ok(format!("Successfully placed {} BB bet on {} for market {}", amount, outcome, market_id))
}
