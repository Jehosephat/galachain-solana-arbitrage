# Project Context Analysis: SOL Arbitrage Bot

**Purpose**: This document provides comprehensive context for developers or AI assistants to immediately understand and work on the SOL Arbitrage Bot codebase.

**Last Updated**: Based on codebase analysis as of current state

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture & Key Components](#architecture--key-components)
4. [Configuration System](#configuration-system)
5. [Execution Flow](#execution-flow)
6. [Key Concepts & Terminology](#key-concepts--terminology)
7. [Development Setup](#development-setup)
8. [Common Development Tasks](#common-development-tasks)
9. [Important Files & Their Purposes](#important-files--their-purposes)
10. [State Management](#state-management)
11. [Error Handling Patterns](#error-handling-patterns)
12. [External Dependencies & Services](#external-dependencies--services)
13. [Testing & Debugging](#testing--debugging)
14. [Known Patterns & Conventions](#known-patterns--conventions)
15. [What to Know Before Making Changes](#what-to-know-before-making-changes)

---

## Executive Summary

**What This Bot Does**: 
- Detects price discrepancies between GalaChain and Solana for the same tokens
- Executes paired trades (sell on one chain, buy on the other) to capture arbitrage opportunities
- Automatically bridges tokens between chains to maintain inventory balance
- All profits are tracked and accumulated in **GALA** on GalaChain

**Core Strategy**: "Inventory Mode Arbitrage"
- **Forward**: Sell token on GalaChain → Buy same token on Solana
- **Reverse**: Buy token on GalaChain → Sell same token on Solana
- Bot evaluates both directions and picks the best opportunity

**Tech Stack**: TypeScript, Node.js, GalaChain SDK, Solana Web3.js, Jupiter Aggregator API

**Current Status**: Production-ready MVP with comprehensive error handling, state management, monitoring, automated setup, and UI dashboard

**Recent Improvements** (as of latest update):
- Automated setup script for easy installation
- Comprehensive setup validation on startup
- UI improvements (removed Activity screen, improved balances view, better dashboard)
- Price caching system for USD conversions
- Liquidity validation to prevent failed trades
- Unified bridge wallet (uses GalaChain wallet for both trading and bridging)

---

## Project Overview

### Business Logic

The bot operates on a simple principle: if a token is worth more on GalaChain than on Solana (after accounting for all fees), there's an arbitrage opportunity. The bot:

1. **Discovers Opportunities**: Checks each enabled token every 15 seconds
2. **Evaluates Edge**: Calculates net profit in GALA after all costs (fees, bridge costs, risk buffer)
3. **Validates Risk**: Checks price impact, slippage tolerance, cooldowns, inventory levels
4. **Executes Trades**: Simultaneously executes both legs (GalaChain + Solana) when profitable
5. **Manages Inventory**: Automatically bridges tokens back to GalaChain to maintain balance

### Key Metrics

- **Minimum Edge**: 30 basis points (0.3%) - configurable
- **Max Slippage**: 50 basis points (0.5%) - configurable
- **Max Price Impact**: 250 basis points (2.5%) - configurable
- **Cooldown**: 5 minutes per token after trade - configurable
- **Cycle Interval**: 15 seconds (configurable via `UPDATE_INTERVAL_MS`)
- **Inventory Refresh**: Every 5 minutes (configurable via `INVENTORY_REFRESH_MS`)

### Profit Calculation

```
Net Edge (GALA) = 
  GC Proceeds (GALA) 
  - SOL Cost (converted to GALA) 
  - Bridge Cost (GALA) 
  - Risk Buffer (GALA)

Net Edge BPS = (Net Edge / SOL Cost) × 10,000
```

Trade only executes if `Net Edge BPS >= minEdgeBps` (default: 30)

---

## Architecture & Key Components

### Directory Structure

```
src/
├── index.ts                    # Entry point (minimal, mostly TODOs)
├── run-bot.ts                  # Main runner with scheduling loop
├── mainLoop.ts                 # Core trading cycle orchestrator
│
├── config/                     # Configuration management
│   ├── configManager.ts        # Loads JSON + env vars
│   ├── configService.ts        # Service interface
│   └── configSchema.ts         # Zod validation
│
├── core/                       # Core arbitrage logic
│   ├── tokenEvaluator.ts       # Evaluates tokens for opportunities
│   ├── edgeCalculator.ts       # Forward arbitrage edge calculation
│   ├── reverseEdgeCalculator.ts # Reverse arbitrage edge calculation
│   ├── rateConverter.ts        # Currency conversion (SOL/USDC → GALA)
│   ├── tradeExecutor.ts        # Trade execution orchestrator
│   ├── stateManager.ts         # Persistent state (inventory, cooldowns)
│   ├── balanceChecker.ts       # Pre-trade balance validation
│   ├── quoteManager.ts         # Quote caching & management
│   ├── priceCache.ts           # Price caching service
│   │
│   ├── priceProviders/         # Chain-specific price quoters
│   │   ├── galachain.ts        # GalaChain DEX v3 quoting
│   │   ├── solana.ts           # Solana Jupiter aggregator
│   │   └── strategies/         # Quote strategy overrides
│   │
│   └── strategies/              # Arbitrage strategies
│       ├── arbitrageStrategy.ts
│       └── strategyEvaluator.ts
│
├── execution/                  # Trade execution engines
│   ├── riskManager.ts          # Risk validation before execution
│   ├── dualLegCoordinator.ts   # Orchestrates GC + SOL execution
│   ├── galaChainExecutor.ts    # Executes GC swaps
│   └── solanaExecutor.ts       # Executes Solana swaps
│
├── bridging/                   # Cross-chain bridging
│   ├── bridgeManager.ts        # Bridge orchestration
│   ├── autoBridgeService.ts    # Automatic rebalancing
│   ├── bridgeScheduler.ts      # Scheduled bridging
│   └── galaConnectClient.ts    # GalaConnect API client
│
├── services/                   # External service integrations
│   ├── jupiterService.ts       # Jupiter aggregator interface
│   └── jupiterMcpClient.ts    # Jupiter MCP protocol client
│
├── utils/                      # Utility functions
│   ├── logger.ts               # Winston logger setup
│   ├── errorHandler.ts         # Centralized error handling
│   ├── alerts.ts               # Slack/Discord alerts
│   ├── calculations.ts         # Math utilities
│   └── setupValidator.ts       # Setup validation on startup
│
├── scripts/                    # Setup and utility scripts
│   └── setup.js                # Automated installation script
│
└── types/                      # TypeScript type definitions
    ├── core.ts                 # Core data structures
    ├── config.ts               # Configuration interfaces
    └── direction.ts            # Arbitrage direction types
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **TokenEvaluator** | Fetches quotes, calculates edges, validates opportunities |
| **EdgeCalculator** | Calculates forward arbitrage profitability |
| **ReverseEdgeCalculator** | Calculates reverse arbitrage profitability |
| **RateConverter** | Converts SOL/USDC quotes to GALA for comparison |
| **RiskManager** | Validates trades before execution (impact, cooldown, inventory) |
| **DualLegCoordinator** | Orchestrates simultaneous execution on both chains |
| **GalaChainExecutor** | Executes token→GALA swaps on GalaChain DEX v3 |
| **SolanaExecutor** | Executes token buys on Solana via Jupiter |
| **BalanceChecker** | Validates sufficient inventory before trading |
| **AutoBridgeService** | Automatically rebalances inventory between chains |
| **StateManager** | Manages persistent state (inventory, cooldowns, trades) |
| **SetupValidator** | Validates setup on startup (env vars, config files, connectivity) |
| **PriceCache** | Caches USD prices from CoinGecko to avoid rate limits |

### Data Flow

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
│ - GalaChain funds    │          │   OPPORTUNITIES    │
│ - Solana funds       │          │                   │
└──────────────────────┘          └───────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ FOR EACH ENABLED TOKEN:                                      │
│                                                              │
│  1. TokenEvaluator.evaluateToken()                          │
│     ├─ GalaChainPriceProvider.getQuote()                    │
│     ├─ SolanaPriceProvider.getQuote()                       │
│     ├─ RateConverter.convertToGala()                       │
│     ├─ EdgeCalculator.calculateEdge()                      │
│     └─ RiskManager.evaluate()                              │
│                                                              │
│  2. If evaluation passes:                                   │
│     └─ TradeExecutor.executeTrade()                        │
│        └─ DualLegCoordinator.executeLive()                 │
│           ├─ GalaChainExecutor.executeFromQuoteLive()       │
│           └─ SolanaExecutor.executeFromQuoteLive()          │
│                                                              │
│  3. Post-execution:                                         │
│     ├─ Set cooldown                                         │
│     └─ Check balances                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration System

### Configuration Files

**Location**: `config/` directory

1. **`config.json`** - Trading parameters, bridging settings, monitoring config
2. **`tokens.json`** - Token definitions (mints, decimals, trade sizes, enabled status)
3. **`strategies.json`** - (Optional) Strategy overrides per token

### Environment Variables

**Location**: `.env` file (use `env.example` as template)

**Required**:
- `GALACHAIN_PRIVATE_KEY` - Private key for GalaChain wallet (used for both trading and bridging)
- `GALACHAIN_WALLET_ADDRESS` - GalaChain wallet address
- `SOLANA_PRIVATE_KEY` - Private key for Solana wallet
- `SOLANA_WALLET_ADDRESS` - Solana wallet address

**Note**: The bot uses the same GalaChain wallet for both trading and bridging operations. There is no separate bridge wallet or bridge private key.

**Optional** (with defaults):
- `RUN_MODE` - `dry_run` or `live` (default: `dry_run`)
- `UPDATE_INTERVAL_MS` - Main loop interval (default: 15000)
- `INVENTORY_REFRESH_MS` - Balance refresh interval (default: 300000)
- `PAUSE` - `true`/`false` to pause bot (default: `false`)
- `MIN_EDGE_BPS` - Override min edge threshold
- `MAX_SLIPPAGE_BPS` - Override max slippage
- `LOG_LEVEL` - Logging level (default: `info`)

**API Keys** (optional):
- `COINGECKO_API_KEY` - For USD price data
- `JUPITER_API_KEY` - For Jupiter aggregator (optional, free tier available)
- `JUPITER_ULTRA_API_KEY` - For Jupiter Ultra Swap (optional)
- `SLACK_WEBHOOK_URL` - For alerts
- `DISCORD_WEBHOOK_URL` - For alerts

### Configuration Loading

Configuration is loaded in this order (later overrides earlier):

1. **JSON files** (`config.json`, `tokens.json`, `strategies.json`)
2. **Environment variables** (override JSON values)
3. **Runtime validation** (Zod schema validation)

**Key Files**:
- `src/config/configManager.ts` - Loads and merges configs
- `src/config/configSchema.ts` - Zod validation schemas
- `src/config/configService.ts` - Service interface for dependency injection

### Token Configuration

Each token in `tokens.json` has:
```typescript
{
  "symbol": "SOL",
  "galaChainMint": "GSOL|Unit|none|none",
  "solanaMint": "So11111111111111111111111111111111111111112",
  "solanaSymbol": "SOL",
  "decimals": 9,
  "tradeSize": 0.05,          // Fixed trade size per opportunity
  "enabled": true,             // Whether to evaluate this token
  "gcQuoteVia": "GALA",        // Quote currency on GalaChain
  "solQuoteVia": "GALA",       // Quote currency on Solana (SOL, USDC, or GALA)
  "coingeckoId": "solana"      // Optional: CoinGecko ID for USD price fetching
}
```

**Important**: 
- `solQuoteVia` determines what currency is used to buy the token on Solana. If set to "GALA", the bot will use a GALA/SOL pool rate to convert.
- `coingeckoId` is optional but recommended for accurate USD price display in the UI. Find IDs on [CoinGecko](https://www.coingecko.com).

---

## Execution Flow

### Main Loop (`run-bot.ts`)

1. **Initialize**: Load config, create services
2. **Initial Inventory Refresh**: Sync balances from both chains
3. **Start Periodic Refresh**: Every 5 minutes, refresh inventory
4. **Main Trading Loop**: Every 15 seconds:
   - Check if paused (`PAUSE=true`)
   - Call `runMainCycle(runMode, configService)`

### Trading Cycle (`mainLoop.ts` → `runMainCycle()`)

1. **Balance Check**: 
   - Check GalaChain and Solana balances
   - Pause trading for tokens with insufficient funds
   - Continue with tokens that have sufficient funds

2. **Auto-Bridging Check** (if enabled):
   - Check for inventory imbalances
   - Bridge tokens if needed to rebalance

3. **For Each Enabled Token**:
   - **Evaluate** (`TokenEvaluator.evaluateToken()`):
     - Fetch GalaChain quote (sell token → GALA)
     - Fetch Solana quote (buy token with SOL/USDC)
     - Convert Solana quote to GALA
     - Calculate edge (forward and/or reverse)
     - Risk validation (impact, cooldown, inventory)
   - **Execute** (if evaluation passes):
     - `TradeExecutor.executeTrade()`
     - `DualLegCoordinator.executeLive()` (or `dryRun()`)
     - Both legs execute concurrently
   - **Post-Execution**:
     - Set cooldown (1 minute)
     - Check balances again
     - Log results

### Quote Fetching

**GalaChain** (`GalaChainPriceProvider`):
- Uses `@gala-chain/dex` SDK for local quoting
- Returns executable price for `token → GALA` swap
- Includes pool fees + 1 GALA per hop
- Accounts for price impact
- **Liquidity Validation**: Quotes are validated for sufficient pool liquidity (minimum 2x trade size or 100 tokens)

**Solana** (`SolanaPriceProvider`):
- Uses Jupiter Aggregator API
- Returns executable price for buying token
- Quote currency: SOL, USDC, or GALA (per token config)
- Includes priority fee estimates

**Quote Validation** (`QuoteValidator`):
- Validates quote freshness (max age: 30 seconds)
- Checks for sufficient liquidity on GalaChain pools
- Validates quote completeness and correctness
- Rejects opportunities with insufficient liquidity to prevent failed trades

### Edge Calculation

**Forward Arbitrage**:
```typescript
galaProceeds = gcQuote.price × tradeSize  // in GALA
solCostGala = solQuote.price × tradeSize × solToGalaRate  // converted to GALA
bridgeCost = $1.25 USD / galaUsdPrice  // amortized
riskBuffer = galaProceeds × (riskBufferBps / 10000)

netEdge = galaProceeds - solCostGala - bridgeCost - riskBuffer
netEdgeBps = (netEdge / solCostGala) × 10000
```

**Reverse Arbitrage**:
```typescript
galaCost = gcQuote.price × tradeSize  // cost in GALA to BUY token
solProceedsGala = solQuote.price × tradeSize × quoteToGalaRate  // converted to GALA
// ... same cost deductions ...
netEdge = solProceedsGala - galaCost - bridgeCost - riskBuffer
```

### Trade Execution

**Dual-Leg Execution** (`DualLegCoordinator`):
- Fetches fresh quotes at execution time
- Executes both legs concurrently using `Promise.allSettled()`
- Handles partial failures gracefully
- Returns results from both legs

**GalaChain Execution** (`GalaChainExecutor`):
- Uses `@gala-chain/gswap-sdk` to build swap transaction
- Signs with `GALACHAIN_PRIVATE_KEY`
- Submits transaction and waits for confirmation
- Returns transaction hash and actual proceeds

**Solana Execution** (`SolanaExecutor`):
- Builds Jupiter swap instruction
- Signs with `SOLANA_PRIVATE_KEY`
- Submits transaction and waits for confirmation
- Returns transaction signature and actual cost

---

## Key Concepts & Terminology

### Arbitrage Directions

- **Forward**: Sell on GalaChain → Buy on Solana
  - Use when token is worth more on GalaChain
  - Reduces GalaChain inventory, increases Solana inventory
  - Requires bridging tokens back to GalaChain later

- **Reverse**: Buy on GalaChain → Sell on Solana
  - Use when token is worth more on Solana
  - Increases GalaChain inventory, reduces Solana inventory
  - Profits accumulate directly on GalaChain

- **Best**: Evaluates both directions and picks the most profitable

### Edge & Profitability

- **Edge**: The profit opportunity before execution
- **Net Edge**: Profit after all costs (fees, bridge, risk buffer)
- **Basis Points (BPS)**: 1 BPS = 0.01% (100 BPS = 1%)
- **Min Edge BPS**: Minimum profitability threshold (default: 30 BPS = 0.3%)

### Price Impact

- **Price Impact**: How much the trade moves the market price
- Measured in basis points
- High impact = low liquidity = risky trade
- Max allowed: 250 BPS (2.5%) by default

### Slippage

- **Slippage**: Difference between expected price and actual execution price
- **Max Slippage**: Tolerance for price movement (default: 50 BPS = 0.5%)
- If actual slippage exceeds tolerance, trade may fail or be rejected

### Cooldown

- **Cooldown**: Period after a trade where the same token is not evaluated
- Default: 5 minutes (configurable)
- Prevents over-trading and reduces API rate limit issues

### Inventory Mode

- **Inventory Mode**: Bot maintains inventory on both chains
- Trades are paired (sell + buy) to minimize market exposure
- Inventory is automatically rebalanced via bridging

### Quote Currency

- **Quote Currency**: The currency used to price a trade
- GalaChain: Always GALA
- Solana: SOL, USDC, or GALA (configurable per token via `solQuoteVia`)
- All quotes are converted to GALA for edge calculation

---

## Development Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- TypeScript knowledge
- Understanding of blockchain concepts (Solana, GalaChain)

### Installation

#### Option 1: Automated Setup (Recommended)

The project includes an automated setup script that handles installation and configuration:

```bash
cd sol-arbitrage-bot
npm run setup
```

The setup script will:
- ✅ Check prerequisites (Node.js version, npm)
- ✅ Install all dependencies (core, API server, frontend)
- ✅ Create `.env` file from `env.example`
- ✅ Initialize `state.json` and `bridge-state.json`
- ✅ Create `logs/` directory
- ✅ Validate configuration
- ✅ Build the project

After running setup, edit `.env` and fill in your private keys and wallet addresses.

#### Option 2: Manual Installation

```bash
cd sol-arbitrage-bot

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

### Environment Setup

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in required private keys and addresses:
   - `GALACHAIN_PRIVATE_KEY` - Private key for GalaChain wallet (used for trading and bridging)
   - `GALACHAIN_WALLET_ADDRESS` - GalaChain wallet address
   - `SOLANA_PRIVATE_KEY` - Private key for Solana wallet
   - `SOLANA_WALLET_ADDRESS` - Solana wallet address

3. (Optional) Add API keys for enhanced features:
   - `COINGECKO_API_KEY` - For USD price data
   - `JUPITER_API_KEY` - For Jupiter aggregator (optional)

**Note**: The bot uses the same GalaChain wallet for both trading and bridging. There is no separate bridge wallet.

### Build

```bash
npm run build        # Compile TypeScript
npm run dev          # Run with ts-node (development)
npm run start        # Run compiled version
```

### Setup Validation

The bot includes comprehensive setup validation that runs on startup:

- **Environment Variables**: Validates required variables are set and properly formatted
- **Configuration Files**: Checks JSON syntax and schema validation
- **Wallet Addresses**: Validates address formats
- **Connectivity**: Tests basic Solana RPC connectivity

Validation is performed by `src/utils/setupValidator.ts` and integrated into `src/run-bot.ts`. The bot will not start if critical validation errors are found.

### Running the Bot

```bash
# Dry run mode (default - no real trades)
npm run dev

# Live mode (real trades)
RUN_MODE=live npm run dev

# Pause bot
PAUSE=true npm run dev
```

### Available Scripts

- `npm run setup` - **Automated setup script** (installs dependencies, creates config files, validates setup)
- `npm run build` - Compile TypeScript
- `npm run dev` - Run in development mode (dry run by default)
- `npm run start` - Run compiled version
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run balances` - Check current balances
- `npm run analyze` - Analyze trade history

---

## Common Development Tasks

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
      "solQuoteVia": "SOL"
    }
  }
}
```

2. **Verify token exists on both chains**
3. **Test with dry run mode first**
4. **Monitor initial trades closely**

### Modifying Trading Parameters

**Via Config File** (`config/config.json`):
```json
{
  "trading": {
    "minEdgeBps": 50,        // Increase minimum edge
    "maxSlippageBps": 30,    // Tighter slippage tolerance
    "cooldownMinutes": 10    // Longer cooldown
  }
}
```

**Via Environment Variables**:
```bash
MIN_EDGE_BPS=50 MAX_SLIPPAGE_BPS=30 npm run dev
```

### Debugging Quote Issues

1. **Check logs** for quote fetch errors
2. **Use test scripts**:
   - `test-gc-quote-sol.ts` - Test GalaChain quotes
   - `test-price-discovery.ts` - Test price providers
3. **Verify token config** (mints, decimals, enabled status)
4. **Check API connectivity** (Jupiter, GalaChain RPC)

### Debugging Execution Issues

1. **Check balance logs** - Insufficient funds?
2. **Check risk manager logs** - Why was trade rejected?
3. **Use dry run mode** - See what would happen without executing
4. **Check transaction status** - Use blockchain explorers

### Modifying Risk Parameters

Edit `src/execution/riskManager.ts`:
- Price impact thresholds
- Cooldown logic
- Inventory checks
- Edge validation

---

## Important Files & Their Purposes

### Entry Points

- **`src/index.ts`** - Minimal entry point (mostly TODOs, not used in production)
- **`src/run-bot.ts`** - **Main entry point** - Sets up scheduling and runs main loop

### Core Logic

- **`src/mainLoop.ts`** - Orchestrates trading cycle, balance checks, auto-bridging
- **`src/core/tokenEvaluator.ts`** - Evaluates tokens for opportunities
- **`src/core/tradeExecutor.ts`** - Executes trades (dry run or live)
- **`src/execution/dualLegCoordinator.ts`** - Coordinates simultaneous execution

### Configuration

- **`src/config/configManager.ts`** - Loads and validates configuration
- **`config/config.json`** - Trading parameters
- **`config/tokens.json`** - Token definitions

### State Management

- **`src/core/stateManager.ts`** - Manages persistent state (inventory, cooldowns, trades)
- **`state.json`** - Persistent state file (auto-generated)
- **`bridge-state.json`** - Bridge operation state

### Price Providers

- **`src/core/priceProviders/galachain.ts`** - GalaChain DEX quoting
- **`src/core/priceProviders/solana.ts`** - Solana Jupiter quoting
- **`src/core/rateConverter.ts`** - Currency conversion (SOL/USDC → GALA)

### Execution

- **`src/execution/galaChainExecutor.ts`** - Executes GalaChain swaps
- **`src/execution/solanaExecutor.ts`** - Executes Solana swaps
- **`src/execution/riskManager.ts`** - Pre-execution risk validation

### Bridging

- **`src/bridging/autoBridgeService.ts`** - Automatic inventory rebalancing
- **`src/bridging/bridgeManager.ts`** - Bridge orchestration
- **`src/bridging/galaConnectClient.ts`** - GalaConnect API client

### Utilities

- **`src/utils/logger.ts`** - Winston logger configuration
- **`src/utils/errorHandler.ts`** - Centralized error handling
- **`src/utils/alerts.ts`** - Slack/Discord notifications
- **`src/utils/setupValidator.ts`** - Setup validation on startup

### Setup & Installation

- **`scripts/setup.js`** - Automated setup script
- **`DISTRIBUTION_CHECKLIST.md`** - Distribution readiness checklist

### Types

- **`src/types/core.ts`** - Core data structures (quotes, execution results, inventory)
- **`src/types/config.ts`** - Configuration interfaces
- **`src/types/direction.ts`** - Arbitrage direction types

---

## State Management

### State File

**Location**: `state.json` (auto-generated, do not edit manually)

**Structure**:
```typescript
{
  "status": "running" | "paused" | "stopped" | "error",
  "inventory": {
    "galaChain": { /* token balances */ },
    "solana": { /* token balances */ },
    "version": number,
    "lastUpdated": timestamp
  },
  "pendingBridges": [ /* bridge operations */ ],
  "recentTrades": [ /* execution results */ ],
  "tokenCooldowns": { /* per-token cooldown info */ },
  "dailyTradeCounts": { /* per-token trade counts */ }
}
```

### State Updates

- **Inventory**: Updated via `InventoryRefresher` (every 5 minutes)
- **Cooldowns**: Set after each trade execution
- **Trades**: Logged after execution
- **Bridges**: Tracked via `BridgeStateTracker`

### State Persistence

- State is saved to `state.json` after significant events
- State is loaded on bot startup
- State versioning prevents race conditions

---

## Error Handling Patterns

### Error Categories

**`src/utils/errorHandler.ts`** categorizes errors:

- **NETWORK**: API timeouts, connection issues
- **VALIDATION**: Invalid quotes, insufficient funds
- **EXECUTION**: Transaction failures, slippage breaches
- **EXTERNAL_API**: Jupiter, GalaChain API errors
- **SYSTEM**: Internal errors, state corruption

### Error Recovery

- **Retryable Errors**: Network issues, temporary API failures
- **Non-Retryable**: Validation failures, insufficient funds
- **Circuit Breakers**: Auto-pause after repeated failures

### Error Logging

- All errors logged via Winston logger
- Critical errors trigger alerts (Slack/Discord)
- Errors stored in state for analysis

### Common Error Scenarios

1. **Insufficient Funds**: 
   - Bot pauses trading for affected token
   - Logs recommendation to bridge/replenish
   - Resumes when funds are sufficient

2. **Quote Failures**:
   - Token evaluation skipped
   - Error logged, bot continues with next token

3. **Execution Failures**:
   - Partial fills handled gracefully
   - Cooldown set to prevent retry storms
   - Error logged with context

4. **Bridge Failures**:
   - Retry with exponential backoff
   - Max retries: 3 (configurable)
   - Alert sent after max retries

---

## External Dependencies & Services

### GalaChain

- **SDK**: `@gala-chain/dex`, `@gala-chain/gswap-sdk`
- **RPC**: `https://gateway-mainnet.galachain.com/` (configurable)
- **DEX**: GalaChain DEX v3 for swaps
- **Bridge**: GalaConnect API for bridging

### Solana

- **SDK**: `@solana/web3.js`, `@solana/spl-token`
- **RPC**: `https://api.mainnet-beta.solana.com` (configurable)
- **DEX**: Jupiter Aggregator API for swaps
- **Bridge**: GalaConnect bridge program

### External APIs

- **Jupiter Aggregator**: Token swap quotes and execution
- **CoinGecko**: USD price data for rate conversion (optional)
- **GalaConnect API**: Bridge operations and status

### Rate Limiting

- **Jupiter**: Free tier available, rate limits apply
- **Jupiter Ultra**: Dynamic rate limits based on volume (optional)
- **GalaChain**: No explicit rate limits, but be respectful

---

## Testing & Debugging

### Test Scripts

Located in `src/` directory (prefixed with `test-`):

- **`test-edge-calculator.ts`** - Test edge calculation logic
- **`test-dual-leg.ts`** - Test dual-leg execution (dry run)
- **`test-gc-executor.ts`** - Test GalaChain execution
- **`test-sol-executor.ts`** - Test Solana execution
- **`test-quote-manager.ts`** - Test quote management
- **`test-price-discovery.ts`** - Test price providers
- **`test-bridge-roundtrip.ts`** - Test bridge operations
- **`test-balances.ts`** - Test balance checking

### Running Tests

```bash
# Run specific test
ts-node src/test-edge-calculator.ts

# Run all tests (if Jest configured)
npm test
```

### Debugging Tips

1. **Use Dry Run Mode**: See what would happen without executing
2. **Check Logs**: Winston logs to `logs/arbitrage-bot.log`
3. **Monitor State**: Check `state.json` for current state
4. **Use Test Scripts**: Isolate specific functionality
5. **Check Balances**: Run `npm run balances` to see current inventory

### Common Debugging Scenarios

**Trade Not Executing**:
1. Check logs for evaluation results
2. Verify edge calculation (is it above threshold?)
3. Check risk manager logs (why was it rejected?)
4. Verify token is enabled and has sufficient funds

**Quote Failures**:
1. Check API connectivity
2. Verify token mints are correct
3. Check if token has liquidity on both chains
4. Review quote provider logs

**Execution Failures**:
1. Check transaction status on blockchain explorers
2. Verify private keys are correct
3. Check for slippage breaches
4. Review execution logs for specific error

---

## Known Patterns & Conventions

### Code Patterns

1. **Dependency Injection**: Services use interfaces (`IConfigService`) for testability
2. **Error Handling**: Centralized via `ErrorHandler` class
3. **Logging**: Structured logging via Winston with context
4. **State Management**: Persistent state via `StateManager`
5. **Configuration**: JSON + env vars with Zod validation

### Naming Conventions

- **Files**: camelCase (e.g., `tokenEvaluator.ts`)
- **Classes**: PascalCase (e.g., `TokenEvaluator`)
- **Functions**: camelCase (e.g., `evaluateToken`)
- **Types/Interfaces**: PascalCase (e.g., `TokenConfig`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_SLIPPAGE_BPS`)

### Async Patterns

- **Promise.allSettled()**: Used for concurrent execution (handles partial failures)
- **Try-catch**: All async operations wrapped in try-catch
- **Error Propagation**: Errors bubble up to error handler

### BigNumber Usage

- **All monetary values**: Use `BigNumber.js` for precision
- **Never use**: JavaScript `number` for financial calculations
- **Conversion**: Use `toFixed()` only for display, not calculations

---

## What to Know Before Making Changes

### Critical Considerations

1. **Financial Risk**: This bot trades real money. Always test in dry run mode first.

2. **State Persistence**: State is saved to `state.json`. Don't edit manually - use `StateManager`.

3. **Configuration Validation**: Config is validated with Zod schemas. Invalid config will prevent bot startup.

4. **Balance Checks**: Bot pauses trading if insufficient funds. This is intentional - don't disable without understanding implications.

5. **Cooldowns**: Cooldowns prevent over-trading and API rate limit issues. Don't reduce without considering rate limits.

6. **Quote Freshness**: Quotes are re-fetched at execution time to prevent stale quote execution.

7. **Concurrent Execution**: Both legs execute concurrently. Handle partial failures gracefully.

8. **Error Recovery**: Errors are categorized and handled differently. Network errors retry, validation errors don't.

### Areas Requiring Careful Changes

- **Edge Calculation** (`edgeCalculator.ts`, `reverseEdgeCalculator.ts`): Core profitability logic
- **Risk Management** (`riskManager.ts`): Safety checks before execution
- **Execution** (`dualLegCoordinator.ts`, executors): Actual trade execution
- **State Management** (`stateManager.ts`): Persistent state handling
- **Configuration** (`configManager.ts`, `configSchema.ts`): Config loading and validation

### Testing Before Deployment

1. **Dry Run Mode**: Always test in dry run mode first
2. **Small Trade Sizes**: Start with small trade sizes
3. **Single Token**: Test with one token first
4. **Monitor Closely**: Watch first few live trades carefully
5. **Check Logs**: Review logs for any unexpected behavior

### Documentation to Read First

- **`PRD.md`** - Product requirements and goals
- **`STRATEGY.md`** - Plain-English strategy overview
- **`CODEBASE_EXPLORATION_SUMMARY.md`** - Detailed architecture overview
- **`ARBITRAGE_ARCHITECTURE.md`** - Architecture deep dive

---

## Quick Reference

### Key Commands

```bash
# Development
npm run dev                    # Run in dev mode (dry run)
RUN_MODE=live npm run dev      # Run in live mode
PAUSE=true npm run dev         # Pause bot

# Utilities
npm run balances               # Check balances
npm run analyze                # Analyze trades
npm run build                  # Compile TypeScript

# Testing
ts-node src/test-edge-calculator.ts
```

### Key Configuration Files

- `config/config.json` - Trading parameters
- `config/tokens.json` - Token definitions
- `.env` - Environment variables (private keys, API keys)

### Key State Files

- `state.json` - Bot state (inventory, cooldowns, trades)
- `bridge-state.json` - Bridge operation state
- `logs/arbitrage-bot.log` - Application logs

### Key Environment Variables

- `RUN_MODE` - `dry_run` or `live` (default: `dry_run`)
- `PAUSE` - `true` or `false` (default: `false`)
- `UPDATE_INTERVAL_MS` - Main loop interval (default: 15000)
- `MIN_EDGE_BPS` - Override min edge threshold
- `GALACHAIN_PRIVATE_KEY` - **Required**: GalaChain wallet private key (for trading and bridging)
- `SOLANA_PRIVATE_KEY` - **Required**: Solana wallet private key

---

## Summary

This bot is a **sophisticated cross-chain arbitrage system** that:

- Detects price discrepancies between GalaChain and Solana
- Executes paired trades to capture arbitrage opportunities
- Automatically manages inventory via bridging
- Tracks all profits in GALA on GalaChain

**Key Strengths**:
- Comprehensive error handling
- Robust state management
- Flexible configuration system
- Extensive logging and monitoring

**Key Areas for Development**:
- Adding new tokens
- Adjusting risk parameters
- Improving quote strategies
- Enhancing monitoring/alerting

**Critical Reminders**:
- Always test in dry run mode first
- Monitor first live trades closely
- Understand financial implications of changes
- Review logs and state files regularly

---

**For Questions or Issues**: Review the extensive documentation files in the project root, particularly `README.md`, `CLEANUP_AND_PACKAGING_PLAN.md`, and `ARBITRAGE_ARCHITECTURE.md` for detailed technical information.

---

## Recent Updates & Improvements

### Installation & Setup (Phase 6 - Completed)

**Automated Setup Script**:
- Created `scripts/setup.js` for automated installation
- Checks prerequisites (Node.js 18+, npm)
- Installs all dependencies (core, API server, frontend)
- Creates configuration files from templates
- Validates setup before completion
- Added `npm run setup` command

**Setup Validation**:
- Created `src/utils/setupValidator.ts` for comprehensive validation
- Validates environment variables on startup
- Checks configuration file existence and JSON syntax
- Validates wallet address formats
- Tests basic Solana RPC connectivity
- Integrated into `src/run-bot.ts` - bot won't start if validation fails

**Documentation Improvements**:
- Updated README.md with automated and manual setup instructions
- Created `DISTRIBUTION_CHECKLIST.md` for distribution readiness
- Improved quick start guide with clear steps

### UI Improvements (Phase 3 & 5 - Completed)

**Removed Features**:
- Removed Activity screen and all related components
- Removed P&L chart (DailyPnLChart component)
- Removed mode column from trade history table
- Removed refresh buttons from multiple screens
- Removed inventory value and success rate metrics from dashboard

**UI Enhancements**:
- Improved button layouts (replaced stacked buttons with icon buttons)
- Improved balances view (single grid table, price display, USD values)
- Improved dashboard layout (compact horizontal bot status bar)
- Added helper text to configuration inputs
- Improved trade details modal
- Better token status display (enabled/disabled badges, sorting)

### Configuration Improvements

**Bridge Wallet Unification**:
- Removed separate `BRIDGE_PRIVATE_KEY` and `BRIDGE_WALLET_ADDRESS`
- Now uses `GALACHAIN_PRIVATE_KEY` for both trading and bridging
- Updated all documentation and code references

**Token Configuration**:
- Added `coingeckoId` field to token configuration
- Added CoinGecko ID column and input in UI
- Prices fetched and cached for all configured tokens

### Price & Liquidity Improvements

**Price Caching System**:
- Implemented price caching in `state.json`
- Fetches USD prices from CoinGecko for all tokens
- Caches prices to avoid rate limits
- UI displays prices and USD values from cached data
- Shows "prices last updated" indicator

**Liquidity Validation**:
- Enhanced `quoteValidator.ts` to check pool liquidity
- Rejects opportunities if liquidity < 2x trade size or < 100 tokens
- Prevents failed trades due to insufficient liquidity
- Validation performed immediately after quote fetching

### Code Quality

- All TypeScript compilation passes
- No linting errors
- Comprehensive error handling
- Improved logging and monitoring

