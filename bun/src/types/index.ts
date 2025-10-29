// BlackBook Type Definitions

export interface Account {
    name: string;
    balance: number;
}

export interface Bet {
    id: string;
    account: string;
    coin: string;
    direction: 'UP' | 'DOWN';
    amount: number;
    entry_price: number;
    target_price?: number;
    duration: number;
    timestamp: number;
    status: 'active' | 'won' | 'lost' | 'expired';
    profit?: number;
}

export interface LiveBet {
    id: string;
    account: string;
    direction: DirectionType;
    amount: number;
    entry_price: number;
    entry_time: number;
    duration: number;
    timeframe: '1min' | '15min';
    status: 'active' | 'won' | 'lost';
    current_price?: number;
    profit?: number;
}

export interface Market {
    id: string;
    title: string;
    description: string;
    category: string;
    options: string[];
    odds: number[];
    volume: number;
    endTime: number;
    status: 'active' | 'closed' | 'settled';
}

export interface PriceData {
    btc_price: number;
    sol_price: number;
    timestamp: number;
}

export interface Transaction {
    id: string;
    from: string;
    to: string;
    amount: number;
    timestamp: number;
    type: 'transfer' | 'bet' | 'win' | 'loss' | 'deposit';
}

export interface Receipt {
    id: string;
    type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'transfer' | 'deposit';
    account: string;
    amount: number;
    details: string;
    timestamp: number;
}

export interface PriceData {
    price: number;
    timestamp: number;
    change_24h?: number;
}

export interface AppState {
    currentAccount: Account | null;
    accounts: Account[];
    activeBets: Bet[];
    liveBets: LiveBet[];
    btcPrice: number;
    solPrice: number;
    receipts: Receipt[];
    isGodMode: boolean;
}

export type CoinType = 'BTC' | 'SOL';
export type DirectionType = 'HIGHER' | 'LOWER';
export type TimeframeType = '1min' | '15min';