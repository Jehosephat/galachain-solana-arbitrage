# SOL Arbitrage Bot - AI Context (Compact)

## Core Purpose
Cross-chain arbitrage bot: detects price discrepancies GalaChain↔Solana, executes paired trades, auto-bridges inventory. Profits tracked in GALA.

## Strategy
Inventory mode: maintains inventory on both chains. Forward: sell GC→buy SOL. Reverse: buy GC→sell SOL. Evaluates both, picks best.

## Tech Stack
TypeScript, Node.js, @gala-chain/dex, @gala-chain/gswap-sdk, @solana/web3.js, Jupiter Aggregator API, CoinGecko API

## Entry Points
- `src/run-bot.ts` - Main entry, scheduling loop, calls `runMainCycle()`
- `src/mainLoop.ts` - Trading cycle orchestrator
- `src/index.ts` - Unused (TODOs)

## Key Components

### Core Logic
- `src/core/tokenEvaluator.ts` - Evaluates tokens, fetches quotes, calculates edges
- `src/core/edgeCalculator.ts` - Forward arbitrage edge (sell GC→buy SOL)
- `src/core/reverseEdgeCalculator.ts` - Reverse arbitrage edge (buy GC→sell SOL)
- `src/core/rateConverter.ts` - SOL/USDC→GALA conversion
- `src/core/tradeExecutor.ts` - Trade execution orchestrator
- `src/core/quoteValidator.ts` - Validates quotes (freshness, liquidity, completeness)
- `src/core/stateManager.ts` - Persistent state (inventory, cooldowns, trades, prices)
- `src/core/priceCache.ts` - USD price caching (CoinGecko)
- `src/core/balanceChecker.ts` - Pre-trade balance validation
- `src/core/quoteManager.ts` - Quote caching & management

### Price Providers
- `src/core/priceProviders/galachain.ts` - GalaChain DEX v3 quoting (local SDK)
- `src/core/priceProviders/solana.ts` - Solana Jupiter aggregator
- `src/core/priceProviders/strategies/` - Strategy overrides

### Execution
- `src/execution/dualLegCoordinator.ts` - Concurrent GC+SOL execution
- `src/execution/galaChainExecutor.ts` - GC swaps (@gala-chain/gswap-sdk)
- `src/execution/solanaExecutor.ts` - Solana swaps (Jupiter)
- `src/execution/riskManager.ts` - Pre-execution validation (impact, cooldown, inventory)

### Bridging
- `src/bridging/bridgeManager.ts` - Bridge orchestration (uses GALACHAIN_PRIVATE_KEY)
- `src/bridging/autoBridgeService.ts` - Auto rebalancing
- `src/bridging/galaConnectClient.ts` - GalaConnect API client

### Config
- `src/config/configManager.ts` - Loads JSON + env vars, Zod validation
- `src/config/configService.ts` - Service interface (DI)
- `src/config/configSchema.ts` - Zod schemas
- `config/config.json` - Trading params
- `config/tokens.json` - Token definitions
- `config/strategies.json` - Optional strategy overrides

### Utils
- `src/utils/setupValidator.ts` - Startup validation (env vars, files, connectivity)
- `src/utils/logger.ts` - Winston logger
- `src/utils/errorHandler.ts` - Centralized error handling
- `src/utils/alerts.ts` - Slack/Discord notifications

### Setup
- `scripts/setup.js` - Automated installation script (`npm run setup`)

## Data Flow
1. Main loop (15s): `runMainCycle()` → balance check → auto-bridge check → for each enabled token
2. Token evaluation: `TokenEvaluator.evaluateToken()` → fetch GC quote → fetch SOL quote → convert to GALA → calculate edge → risk validation
3. Execution: `TradeExecutor.executeTrade()` → `DualLegCoordinator.executeLive()` → concurrent GC+SOL execution
4. Post-execution: set cooldown, check balances, log

## Configuration

### Env Vars (Required)
- `GALACHAIN_PRIVATE_KEY` - GC wallet (trading + bridging)
- `GALACHAIN_WALLET_ADDRESS` - GC address
- `SOLANA_PRIVATE_KEY` - Solana wallet
- `SOLANA_WALLET_ADDRESS` - Solana address

### Env Vars (Optional)
- `RUN_MODE` - `dry_run`|`live` (default: `dry_run`)
- `PAUSE` - `true`|`false`
- `UPDATE_INTERVAL_MS` - Loop interval (default: 15000)
- `INVENTORY_REFRESH_MS` - Balance refresh (default: 300000)
- `MIN_EDGE_BPS` - Override min edge
- `COINGECKO_API_KEY` - USD prices
- `JUPITER_API_KEY` - Jupiter aggregator

### Token Config (`config/tokens.json`)
```typescript
{
  symbol: string,
  galaChainMint: string,
  solanaMint: string,
  solanaSymbol: string,
  decimals: number,
  tradeSize: number,
  enabled: boolean,
  gcQuoteVia: "GALA",
  solQuoteVia: "SOL"|"USDC"|"GALA",
  coingeckoId?: string  // Optional, for USD prices
}
```

## State Management

### `state.json` Structure
```typescript
{
  status: "running"|"paused"|"stopped"|"error",
  inventory: {
    galaChain: Record<string, TokenBalance>,
    solana: Record<string, TokenBalance>
  },
  cooldowns: Record<string, number>,
  tradeHistory: TradeLogEntry[],
  tokenPrices: Record<string, { price: number, lastUpdated: number, source: string }>,
  dailyTradeCounts: Record<string, number>
}
```

### State Updates
- Inventory: `InventoryRefresher` (every 5min)
- Cooldowns: set after trade execution
- Trades: logged after execution
- Prices: cached from CoinGecko

## Key Types

### Quote Types
- `GalaChainQuote` - GC DEX quote (token→GALA)
- `SolanaQuote` - Jupiter quote (buy token with SOL/USDC/GALA)
- Quote includes: price, amount, fees, liquidity, timestamp

### Execution Results
- `ExecutionResult` - { success, txHash, actualAmount, error }
- `DualLegResult` - { gcResult, solResult, partialSuccess }

### Edge Calculation
- Forward: `galaProceeds - solCostGala - bridgeCost - riskBuffer`
- Reverse: `solProceedsGala - galaCost - bridgeCost - riskBuffer`
- Net Edge BPS = (netEdge / cost) × 10000
- Min threshold: 30 BPS (0.3%) default

## Validation Rules

### Quote Validation
- Max age: 30 seconds
- Liquidity: min 2x tradeSize OR 100 tokens (GC pools)
- Completeness: all required fields present

### Risk Validation
- Price impact: max 250 BPS (2.5%)
- Slippage: max 50 BPS (0.5%)
- Cooldown: 5 minutes per token (default)
- Inventory: sufficient balance on both chains

### Setup Validation (on startup)
- Required env vars set and valid
- Config files exist and valid JSON
- Wallet address formats valid
- Solana RPC connectivity test

## Execution Flow

### Quote Fetching
- GC: `@gala-chain/dex` SDK (local), includes fees + 1 GALA/hop, price impact
- SOL: Jupiter API, includes priority fees
- Both validated for liquidity before use

### Trade Execution
- Fresh quotes fetched at execution time
- Both legs execute concurrently (`Promise.allSettled()`)
- Partial failures handled gracefully
- Cooldown set after execution

## Error Handling
- Categories: NETWORK, VALIDATION, EXECUTION, EXTERNAL_API, SYSTEM
- Network errors: retryable
- Validation errors: non-retryable
- Circuit breakers: auto-pause after repeated failures

## File Locations

### Core
- Entry: `src/run-bot.ts`
- Loop: `src/mainLoop.ts`
- Evaluation: `src/core/tokenEvaluator.ts`
- Execution: `src/execution/dualLegCoordinator.ts`

### Config
- Manager: `src/config/configManager.ts`
- Files: `config/config.json`, `config/tokens.json`

### State
- Manager: `src/core/stateManager.ts`
- File: `state.json` (auto-generated)
- Bridge state: `bridge-state.json`

## Key Patterns

### Dependency Injection
- Services use interfaces (`IConfigService`) for testability

### Async Patterns
- `Promise.allSettled()` for concurrent execution
- All async wrapped in try-catch
- Errors bubble to error handler

### BigNumber Usage
- All monetary values: `BigNumber.js`
- Never use JavaScript `number` for financial calculations

### Naming
- Files: camelCase
- Classes: PascalCase
- Functions: camelCase
- Types: PascalCase
- Constants: UPPER_SNAKE_CASE

## Critical Notes

1. **Bridge Wallet**: Uses `GALACHAIN_PRIVATE_KEY` for both trading and bridging (no separate bridge wallet)
2. **State**: Don't edit `state.json` manually, use `StateManager`
3. **Config**: Validated with Zod, invalid config prevents startup
4. **Dry Run**: Default mode, no real trades
5. **Quotes**: Re-fetched at execution time (not cached)
6. **Liquidity**: Validated before execution to prevent failures
7. **Prices**: Cached in `state.json` under `tokenPrices`, fetched from CoinGecko

## Setup Script
- `npm run setup` - Automated installation
- Checks prerequisites, installs deps, creates config files, validates setup