# BlackBook Frontend (Bun)

A modern frontend for the BlackBook Prediction Market built with Bun.

## Prerequisites

- [Bun](https://bun.sh) installed on your system
- BlackBook Rust backend running on `localhost:3000`

## Quick Start

1. Install dependencies:
```bash
bun install
```

2. Start development server:
```bash
bun run dev
```

3. Open browser to `http://localhost:8080`

## Project Structure

```
frontend-bun/
├── src/
│   ├── server.ts    # Bun development server
│   └── main.ts      # Client-side TypeScript
├── public/
│   ├── index.html   # Main HTML template
│   └── style.css    # Styles
└── package.json     # Bun project config
```

## Features

- 🚀 Fast development with Bun
- 📱 Responsive design
- 🔄 Real-time price updates
- 🎯 Live betting interface
- 🏴‍☠️ BlackBook themed UI

## Backend Integration

Connects to Rust backend API endpoints:
- `GET /prices` - Live BTC/SOL prices
- `POST /bet` - Place prediction bets

## Commands

- `bun run dev` - Development server with watch mode
- `bun run build` - Build for production
- `bun run start` - Production server