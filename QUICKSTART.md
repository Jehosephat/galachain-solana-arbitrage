# Quick Start Guide

Get the SOL Arbitrage Bot running in 5 minutes!

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- GalaChain wallet with private key
- Solana wallet with private key

## Installation

### 1. Download the Bot

**Option A: Download ZIP (Recommended)**
1. Download the latest release from GitHub
2. Extract the ZIP file
3. Open terminal in the extracted folder

**Option B: Clone from GitHub**
```bash
git clone https://github.com/yourusername/galachain-solana-arbitrage.git
cd galachain-solana-arbitrage
```

### 2. Run Setup Script

```bash
npm run setup
```

This will:
- ✅ Check your Node.js version
- ✅ Install all dependencies
- ✅ Create `.env` file
- ✅ Initialize state files
- ✅ Build the project

**Time:** ~2-5 minutes depending on your internet speed

### 3. Configure Your Wallets

Open `.env` in a text editor and fill in:

```env
GALACHAIN_PRIVATE_KEY=your_actual_private_key_here
GALACHAIN_WALLET_ADDRESS=your_actual_wallet_address_here
SOLANA_PRIVATE_KEY=your_actual_private_key_here
SOLANA_WALLET_ADDRESS=your_actual_wallet_address_here
```

**⚠️ Security:** Never share your `.env` file or commit it to Git!

### 4. Test in Dry-Run Mode

```bash
npm run dev
```

You should see:
- ✅ Configuration loaded
- ✅ Balance checks
- ✅ Token evaluation starting
- ⚠️ No actual trades (dry-run mode)

**Press Ctrl+C to stop**

### 5. Check Your Balances

```bash
npm run balances
```

This shows your current balances on both chains.

### 6. Configure Tokens (Optional)

Edit `config/tokens.json` to:
- Enable/disable specific tokens
- Adjust trade sizes
- Set quote currencies

### 7. Start Live Trading (When Ready)

```bash
RUN_MODE=live npm run dev
```

**⚠️ Important:**
- Start with small trade sizes
- Monitor the first few trades closely
- The bot trades real money in live mode!

### 8. Start the Web UI (Optional)

The bot includes a web dashboard to monitor trades, balances, and P&L. To start it:

**Terminal 1 - Start API Server:**
```bash
cd application/api-server
npm run dev
```
The API server will start on `http://localhost:3000`

**Terminal 2 - Start Frontend:**
```bash
cd application/vue-frontend
npm run dev
```
The frontend will start on `http://localhost:5173` (or the port shown in terminal)

**Open in Browser:**
Navigate to `http://localhost:5173` to access the dashboard.

The UI shows:
- ✅ Real-time balances
- ✅ Trade history
- ✅ P&L dashboard
- ✅ Configuration management

## Troubleshooting

### "Node.js version too old"
- Install Node.js 18+ from [nodejs.org](https://nodejs.org/)

### "npm install failed"
- Check your internet connection
- Try: `npm cache clean --force` then `npm install`

### "Configuration validation failed"
- Check `config/config.json` and `config/tokens.json` for syntax errors
- Ensure JSON is valid (use a JSON validator)

### "Insufficient funds"
- Run `npm run balances` to check
- Ensure you have tokens on GalaChain and SOL on Solana
- The bot needs inventory on both chains

### "Quote fetch failed"
- Check your internet connection
- Verify token mints in `config/tokens.json` are correct
- Some tokens may not have liquidity

## Next Steps

- **Read the full README.md** for detailed configuration options
- **Check PROJECT_CONTEXT_ANALYSIS.md** for technical details
- **Start the Web UI** (see README.md for instructions)

## Getting Help

- Check `logs/arbitrage-bot.log` for detailed error messages
- Review the troubleshooting section in README.md
- Open an issue on GitHub if you find a bug

---

**Ready to start?** Run `npm run setup` and follow the steps above!

