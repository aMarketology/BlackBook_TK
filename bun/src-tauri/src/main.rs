#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

mod commands;

use tauri::Manager;
use blackbook_lib::{create_app_state};

fn main() {
    let app_state = create_app_state();

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_accounts,
            commands::get_balance,
            commands::place_bet,
            commands::transfer,
            commands::admin_deposit,
            commands::get_all_transactions,
            commands::get_account_transactions,
            commands::get_recipes,
            commands::get_account_recipes,
            commands::get_recipes_by_type,
            commands::get_stats,
            commands::record_bet_win,
            commands::record_bet_loss,
            commands::create_market,
            commands::get_markets,
            commands::place_market_bet,
            commands::get_open_markets,
            commands::get_market_stats,
            commands::close_market,
            commands::resolve_market,
            commands::get_user_bets,
            commands::get_all_markets,
            commands::get_prices,
            commands::get_polymarket_events,
            commands::get_blackbook_events,
            // Admin Commands
            commands::admin_mint_tokens,
            commands::admin_set_balance,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
