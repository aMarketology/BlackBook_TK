pub mod commands;

pub use commands::{AppState, BetRequest, TransferRequest, DepositRequest, AccountInfo};
pub use blackbook_prediction_market::{Ledger, Transaction, Recipe};

pub fn create_app_state() -> AppState {
    let ledger = blackbook_prediction_market::Ledger::new_full_node();
    std::sync::Arc::new(std::sync::Mutex::new(ledger))
}
