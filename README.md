# SOL Arbitrage Bot

A cross-chain arbitrage bot that detects price discrepancies between GalaChain and Solana, executes paired trades to capture spreads, and automatically manages inventory via bridging. All profits are tracked and accumulated in **GALA** on GalaChain.

## 🎯 What This Bot Does

- **Detects Opportunities**: Scans enabled tokens every 15 seconds for price discrepancies
- **Executes Paired Trades**: Simultaneously sells on one chain and buys on the other to minimize exposure
- **Manages Inventory**: Automatically bridges tokens between chains to maintain balance
- **Tracks Profits**: All P&L calculated and reported in GALA

### Core Strategy

The bot operates in **"Inventory Mode"** - it maintains inventory on both chains and executes paired trades to capture arbitrage opportunities:

- **Forward Arbitrage**: Sell token on GalaChain → Buy same token on Solana
- **Reverse Arbitrage**: Buy token on GalaChain → Sell same token on Solana

The bot evaluates both directions and automatically picks the most profitable opportunity.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **GalaChain Wallet** with private key (used for trading and bridging)
- **Solana Wallet** with private key
- **API Keys** (optional):
  - CoinGecko API key (for USD price data)
  - Jupiter API key (optional, free tier available)

### Installation

#### Option 1: Automated Setup (Recommended)

Run the setup script to automatically install dependencies and configure the project:

```bash
npm run setup
```

The setup script will:
- ✅ Check prerequisites (Node.js version, npm)
- ✅ Install all dependencies (core, API server, frontend)
- ✅ Create `.env` file from `env.example`
- ✅ Initialize `state.json` and `bridge-state.json`
- ✅ Validate your configuration
- ✅ Build the project

After running setup, edit `.env` and fill in your private keys and wallet addresses.

#### Option 2: Manual Setup

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd sol-arbitrage-bot
   ```

2. **Install dependencies**
   ```bash
   # Core bot dependencies
   npm install
   
   # API server dependencies
   cd application/api-server
   npm install
   cd ../..
   
   # Frontend dependencies
   cd application/vue-frontend
   npm install
   cd ../..
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and fill in your private keys and addresses:
   ```env
   GALACHAIN_PRIVATE_KEY=your_gala_private_key_here
   GALACHAIN_WALLET_ADDRESS=your_gala_wallet_address_here
   SOLANA_PRIVATE_KEY=your_solana_private_key_here
   SOLANA_WALLET_ADDRESS=your_solana_wallet_address_here
   ```

4. **Configure tokens** (optional)
   
   Edit `config/tokens.json` to enable/disable tokens and set trade sizes.

5. **Build the project**
   ```bash
   npm run build
   ```

### First Run

1. **Start in dry-run mode** (safe, no real trades)
   ```bash
   npm run dev
   ```
   
   Or use the compiled version:
   ```bash
   RUN_MODE=dry_run npm run start
   ```

2. **Check balances**
   ```bash
   npm run balances
   ```

3. **When ready for live trading**
   ```bash
   RUN_MODE=live npm run dev
   ```

### Access the UI

1. **Start the API server** (in a separate terminal)
   ```bash
   cd application/api-server
   npm install
   npm run dev
   ```

2. **Start the frontend** (in another terminal)
   ```bash
   cd application/vue-frontend
   npm install
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173` (or the port shown in the terminal)

## ⚙️ Configuration

### Environment Variables

**Required:**
- `GALACHAIN_PRIVATE_KEY` - Private key for GalaChain wallet (used for trading and bridging)
- `SOLANA_PRIVATE_KEY` - Private key for Solana wallet

**Optional (with defaults):**
- `RUN_MODE` - `dry_run` or `live` (default: `dry_run`)
- `PAUSE` - `true`/`false` to pause bot (default: `false`)
- `UPDATE_INTERVAL_MS` - Main loop interval in milliseconds (default: 15000)
- `INVENTORY_REFRESH_MS` - Balance refresh interval (default: 300000)
- `MIN_EDGE_BPS` - Override minimum edge threshold
- `MAX_SLIPPAGE_BPS` - Override max slippage tolerance
- `LOG_LEVEL` - Logging level: `debug`, `info`, `warn`, `error` (default: `info`)

**API Keys (optional):**
- `COINGECKO_API_KEY` - For USD price data
- `JUPITER_API_KEY` - For Jupiter aggregator (optional)
- `JUPITER_ULTRA_API_KEY` - For Jupiter Ultra Swap (optional)
- `SLACK_WEBHOOK_URL` - For alerts
- `DISCORD_WEBHOOK_URL` - For alerts

### Configuration Files

**`config/config.json`** - Trading parameters:
```json
{
  "trading": {
    "minEdgeBps": 30,              // Minimum edge threshold (0.3%)
    "maxSlippageBps": 50,          // Max slippage tolerance (0.5%)
    "maxPriceImpactBps": 250,     // Max price impact (2.5%)
    "cooldownMinutes": 5,          // Cooldown after trade
    "enableReverseArbitrage": true,
    "arbitrageDirection": "best"   // "forward", "reverse", or "best"
  },
  "bridging": {
    "intervalMinutes": 30,         // Bridge check interval
    "thresholdUsd": 100,           // Bridge threshold
    "bridgeCostUsd": 1.25          // Estimated bridge cost
  }
}
```

**`config/tokens.json`** - Token definitions:
```json
{
  "tokens": {
    "SOL": {
      "symbol": "SOL",
      "galaChainMint": "GSOL|Unit|none|none",
      "solanaMint": "So11111111111111111111111111111111111111112",
      "solanaSymbol": "SOL",
      "decimals": 9,
      "tradeSize": 0.05,           // Fixed trade size
      "enabled": true,             // Enable/disable this token
      "gcQuoteVia": "GALA",       // Quote currency on GalaChain
      "solQuoteVia": "SOL"        // Quote currency on Solana
    }
  }
}
```

## 📖 Usage

### Running the Bot

**Dry Run Mode** (recommended for testing):
```bash
npm run dev
# or
RUN_MODE=dry_run npm run start
```

**Live Mode** (real trades):
```bash
RUN_MODE=live npm run dev
# or
RUN_MODE=live npm run start
```

**Pause the Bot**:
```bash
PAUSE=true npm run dev
```

### Available Commands

- `npm run dev` - Run in development mode (dry-run by default)
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled version
- `npm run balances` - Check current balances on both chains
- `npm run analyze` - Analyze trade history
- `npm test` - Run tests (if configured)

### Monitoring

The bot provides several ways to monitor activity:

1. **Console Logs**: Real-time logging to console and `logs/arbitrage-bot.log`
2. **Web UI**: Dashboard with balances, trades, P&L, and configuration
3. **State Files**: 
   - `state.json` - Bot state (inventory, cooldowns, trades)
   - `bridge-state.json` - Bridge operation state

### Understanding the Output

**Edge Calculation:**
```
Net Edge (GALA) = 
  GC Proceeds (GALA) 
  - SOL Cost (converted to GALA) 
  - Bridge Cost (GALA) 
  - Risk Buffer (GALA)

Net Edge BPS = (Net Edge / SOL Cost) × 10,000
```

A trade executes only if `Net Edge BPS >= minEdgeBps` (default: 30 BPS = 0.3%).

**Key Terms:**
- **Edge**: Profit opportunity before execution
- **BPS**: Basis Points (1 BPS = 0.01%, 100 BPS = 1%)
- **Slippage**: Difference between expected and actual execution price
- **Price Impact**: How much the trade moves the market price
- **Cooldown**: Period after trade where same token is not evaluated

## 🔧 Troubleshooting

### Common Issues

**1. "Insufficient funds" error**
- **Solution**: Check balances with `npm run balances`
- Ensure you have sufficient tokens on GalaChain and SOL on Solana
- The bot will pause trading for tokens with insufficient funds

**2. "Configuration validation failed"**
- **Solution**: Check `config/config.json` and `config/tokens.json` for syntax errors
- Validate JSON format
- Check required fields are present

**3. "Quote fetch failed"**
- **Solution**: Check API connectivity
- Verify token mints are correct in `config/tokens.json`
- Check if token has liquidity on both chains
- Review logs for specific error messages

**4. "Transaction failed"**
- **Solution**: Check transaction status on blockchain explorers
- Verify private keys are correct in `.env`
- Check for slippage breaches (may need to increase `maxSlippageBps`)
- Review execution logs for specific error

**5. "Token not appearing in balances"**
- **Solution**: Ensure token is configured in `config/tokens.json`
- Check token is enabled
- Verify mint addresses are correct
- Run `npm run balances` to refresh

### Getting Help

- Check logs in `logs/arbitrage-bot.log`
- Review state files (`state.json`, `bridge-state.json`)
- Check console output for error messages
- Review `PROJECT_CONTEXT_ANALYSIS.md` for detailed technical information

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│ MAIN LOOP (every 15s)                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────────┐          ┌───────────────────┐
│ CHECK BALANCES       │          │ CHECK AUTO-BRIDGE │
│ - GalaChain funds    │          │   OPPORTUNITIES   │
│ - Solana funds       │          │                   │
└──────────────────────┘          └───────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ FOR EACH ENABLED TOKEN:                                     │
│                                                             │
│  1. Fetch quotes (GalaChain + Solana)                       │
│  2. Calculate edge (forward & reverse)                      │
│  3. Validate risk (impact, cooldown, inventory)             │
│  4. Execute trade (if profitable)                           │
│  5. Set cooldown & update state                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

- **TokenEvaluator**: Evaluates tokens for arbitrage opportunities
- **EdgeCalculator**: Calculates profitability (forward & reverse)
- **RiskManager**: Validates trades before execution
- **DualLegCoordinator**: Orchestrates simultaneous execution on both chains
- **AutoBridgeService**: Automatically rebalances inventory between chains
- **StateManager**: Manages persistent state (inventory, cooldowns, trades)

For detailed architecture information, see `ARBITRAGE_ARCHITECTURE.md`.

## 🛠️ Development

### Project Structure

```
sol-arbitrage-bot/
├── src/                    # Source code
│   ├── core/              # Core arbitrage logic
│   ├── execution/         # Trade execution
│   ├── bridging/          # Cross-chain bridging
│   ├── config/            # Configuration management
│   └── utils/             # Utilities
├── config/                # Configuration files
├── application/           # Web UI
│   ├── api-server/       # REST API
│   └── vue-frontend/     # Vue.js frontend
└── test/                  # Tests
```

### Adding a New Token

1. **Add to `config/tokens.json`**:
```json
{
  "tokens": {
    "NEWTOKEN": {
      "symbol": "NEWTOKEN",
      "galaChainMint": "GNEWTOKEN|Unit|none|none",
      "solanaMint": "SolanaMintAddressHere",
      "solanaSymbol": "NEWTOKEN",
      "decimals": 9,
      "tradeSize": 1.0,
      "enabled": true,
      "gcQuoteVia": "GALA",
      "solQuoteVia": "GALA"
    }
  }
}
```

2. **Verify token exists on both chains**
3. **Test with dry-run mode first**
4. **Monitor initial trades closely**

### Modifying Trading Parameters

Edit `config/config.json` or use environment variables:
```bash
MIN_EDGE_BPS=50 MAX_SLIPPAGE_BPS=30 npm run dev
```

### Building

```bash
npm run build        # Compile TypeScript
npm run start        # Run compiled version
```

For more development information, see `PROJECT_CONTEXT_ANALYSIS.md`.

## 📊 Statistics & Costs

The bot tracks comprehensive statistics including:

- **Gross Proceeds**: Total edge before costs
- **Bridge Fees**: Cost of bridging tokens
- **Solana Fees**: Transaction fees on Solana
- **GalaChain Fees**: Transaction fees on GalaChain
- **Net Proceeds**: Profit after all costs

All statistics are available in the web UI under the P&L section.

## 🔒 Security

- **Never commit `.env` file** - It contains private keys
- **Use separate wallets** for testing and production
- **Start with dry-run mode** to test configuration
- **Monitor first live trades** closely
- **Keep private keys secure** - Never share or expose them

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues, questions, or contributions:
- Review documentation files
- Check logs for error messages
- Review `PROJECT_CONTEXT_ANALYSIS.md` for technical details

## 📚 Additional Documentation

- **`PRD.md`** - Product requirements and goals
- **`STRATEGY.md`** - Plain-English strategy overview
- **`ARBITRAGE_ARCHITECTURE.md`** - Detailed technical architecture
- **`PROJECT_CONTEXT_ANALYSIS.md`** - Comprehensive developer guide

---

**⚠️ Important**: This bot trades real money. Always test in dry-run mode first and understand the risks before running in live mode.
