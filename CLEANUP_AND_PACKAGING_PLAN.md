# Cleanup and Packaging Plan

**Goal**: Transform the SOL Arbitrage Bot into a clean, distributable package that anyone can download and get started with relative ease.

**Date**: Current state analysis

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: File Cleanup](#phase-1-file-cleanup)
3. [Phase 2: Documentation Consolidation](#phase-2-documentation-consolidation)
4. [Phase 3: UI Cleanup](#phase-3-ui-cleanup)
5. [Phase 4: Statistics & Cost Tracking Improvements](#phase-4-statistics--cost-tracking-improvements)
6. [Phase 5: Configuration & Token Management](#phase-5-configuration--token-management)
7. [Phase 6: Installation & Setup](#phase-6-installation--setup)
8. [Phase 7: Testing & Validation](#phase-7-testing--validation)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Current State Issues

1. **Too Many Documentation Files**: 50+ markdown files with development notes, plans, and analysis
2. **Test Files in Source**: 29 test-*.ts files in src/ directory
3. **Backup Files**: Multiple backup files in config/ directory
4. **UI Redundancy**: Activity and Trades screens may overlap
5. **Missing Cost Tracking**: Solana transaction fees not included in P&L
6. **Graph Component**: DailyPnLChart should be removed per requirements
7. **Token Visibility**: Not all configured tokens appear in balances
8. **No Clear Installation Guide**: README is minimal

### Target State

1. **Clean Repository**: Only essential files for running the bot
2. **Consolidated Documentation**: Single comprehensive README + minimal reference docs
3. **Streamlined UI**: Dashboard-focused with essential views only
4. **Accurate Statistics**: Include all costs (bridging, Solana fees, etc.)
5. **Easy Installation**: Clear setup instructions and automated checks
6. **Working Out of the Box**: All configured tokens visible and functional

---

## Phase 1: File Cleanup

### 1.1 Remove Development Documentation

**Action**: Move or delete development/planning documents

**Files to Remove** (keep only essential):
- All `*_PLAN.md` files (keep only if critical for operation)
- All `*_NOTES.md` files
- All `*_ANALYSIS.md` files
- All `*_PROGRESS.md` files
- All `TODO*.md` files
- `CODEBASE_EXPLORATION_SUMMARY.md` (content moved to README)
- `PROJECT_CONTEXT_ANALYSIS.md` (keep - it's useful for developers)
- `ARCHITECTURE_COMPARISON.md`
- `BEFORE_AFTER_COMPARISON.md`
- `BRIDGING_POST_MORTEM.md`
- `CONFIG_MIGRATION_COMPLETE.md`
- `CONFIG_REFACTOR_SUMMARY.md`
- `FINAL_STRETCH_NOTES.md`
- `LIVE_FIRE_PREP_NOTES.md`
- `PHASE*_COMPLETE.md` files
- `PRODUCTION_VERIFICATION.md`
- `QUICK_START_REFACTORING.md`
- `RESET_STATE_README.md` (merge into main README if needed)

**Files to Keep**:
- `README.md` (will be enhanced)
- `PRD.md` (product requirements - useful reference)
- `STRATEGY.md` (strategy overview - useful reference)
- `PROJECT_CONTEXT_ANALYSIS.md` (developer onboarding)
- `ARBITRAGE_ARCHITECTURE.md` (technical reference)

**Files to Consolidate**:
- Merge `RESET_STATE_README.md` content into main README if needed
- Extract key info from other docs into README sections

### 1.2 Remove Test Files from Source

**Action**: Move test files to proper test directory or remove

**Files to Remove/Move**:
- All `test-*.ts` files in `src/` directory (29 files)
- Move essential tests to `test/` directory
- Remove one-off test scripts that aren't part of test suite

**Test Files to Keep** (move to `test/`):
- `test-edge-calculator.ts` - Core logic test
- `test-dual-leg.ts` - Execution test
- `test-gc-executor.ts` - GalaChain executor test
- `test-sol-executor.ts` - Solana executor test
- `test-quote-manager.ts` - Quote management test
- `test-price-discovery.ts` - Price provider test

**Test Files to Remove**:
- `test-alerts.ts` - One-off test
- `test-bridge-*.ts` - Multiple bridge tests (consolidate if needed)
- `test-config.ts` - One-off test
- `test-core-types.ts` - Type validation (not needed)
- `test-*-live.ts` - Live execution tests (not for distribution)
- `test-*-balances.ts` - Balance check tests (one-off)
- `test-inventory-*.ts` - Inventory tests (one-off)
- `test-main-loop-*.ts` - Main loop tests (one-off)
- `test-live-smoke.ts` - Smoke test (not for distribution)
- `test-price-validation.ts` - One-off test
- `test-risk-manager.ts` - One-off test

### 1.3 Clean Up Backup Files

**Action**: Remove all backup files

**Files to Remove**:
- All `*.backup.*` files in `config/` directory
- `state.json.backup.*` files
- `bridge-state.json.backup.*` files
- `test-state.json` (if not needed)

**Action**: Add backup files to `.gitignore` to prevent future backups

### 1.4 Clean Up Application Documentation

**Action**: Consolidate application-specific docs

**Files in `application/` to Remove**:
- `API_SERVER_TEST_RESULTS.md`
- `DEVELOPMENT_NOTES.md`
- `PHASE1_PROGRESS.md`
- `PHASE2_API_PROGRESS.md`
- `VUE_FRONTEND_SETUP.md`

**Files to Keep**:
- `application/api-server/README.md` (update with essential info)
- `application/vue-frontend/README.md` (update with essential info)

### 1.5 Remove Unused Files

**Action**: Remove files not needed for distribution

**Files to Remove**:
- `bot1.env` (example env file - use `env.example` instead)
- `reset-state.js` (if not needed, or move to scripts/)
- `jest.config.js` (if not using Jest, or keep if needed)
- `test/` directory contents (if tests aren't part of distribution)

**Files to Keep**:
- `env.example` (essential)
- `tsconfig.json` (essential)
- `package.json` (essential)
- `package-lock.json` (essential)

### 1.6 Clean Up Source Directory

**Action**: Remove internal documentation from source

**Files to Remove/Move**:
- `src/services/SERVICES_README.md` (merge into main docs)
- `src/execution/EXECUTION_README.md` (merge into main docs)
- `src/bridging/BRIDGING_README.md` (merge into main docs)

**Action**: Keep only code files in `src/`

---

## Phase 2: Documentation Consolidation

### 2.1 Create Comprehensive README

**Action**: Create a single, comprehensive README.md that includes:

**Sections to Include**:
1. **Project Overview**
   - What the bot does
   - Key features
   - Architecture overview (high-level)

2. **Quick Start**
   - Prerequisites
   - Installation steps
   - Configuration setup
   - Running the bot

3. **Configuration**
   - Environment variables
   - Config files structure
   - Token configuration
   - Trading parameters

4. **Usage**
   - Running in dry-run mode
   - Running in live mode
   - Monitoring and UI
   - Common commands

5. **Troubleshooting**
   - Common issues
   - Error messages
   - Balance issues
   - API connectivity

6. **Architecture** (brief)
   - Component overview
   - Data flow
   - Key concepts

7. **Development** (optional)
   - Project structure
   - Adding new tokens
   - Modifying strategies
   - Testing

8. **License & Support**

**Sources for Content**:
- Extract from `PROJECT_CONTEXT_ANALYSIS.md`
- Extract from `CODEBASE_EXPLORATION_SUMMARY.md`
- Extract from `PRD.md`
- Extract from `STRATEGY.md`
- Consolidate setup instructions from various docs

### 2.2 Create Minimal Reference Documentation

**Action**: Keep only essential reference docs

**Files to Create/Keep**:
- `README.md` - Main documentation (comprehensive)
- `ARCHITECTURE.md` - Technical architecture (detailed)
- `DEVELOPER_GUIDE.md` - For developers extending the bot (optional)

**Files to Remove**: All other markdown files (after extracting useful content)

### 2.3 Update Package.json

**Action**: Update package.json with proper metadata

**Updates**:
- Add proper `description`
- Add `author` (if applicable)
- Add `repository` URL
- Add `keywords` for discoverability
- Add `homepage` (if applicable)
- Add `bugs` URL (if applicable)
- Update `version` appropriately

---

## Phase 3: UI Cleanup

### 3.1 Remove Activity Screen

**Action**: Remove redundant Activity view

**Changes**:
- Remove `application/vue-frontend/src/views/Activity.vue`
- Remove `application/vue-frontend/src/components/activity/ActivityFeed.vue`
- Remove Activity route from router
- Remove Activity navigation link from all views
- Remove Activity store if not used elsewhere (`application/vue-frontend/src/stores/activity.ts`)
- Remove Activity API endpoint if not used (`application/api-server/src/routes/activity.ts`)
- Remove Activity service if not used (`application/api-server/src/services/activityService.ts`)

**Rationale**: Activity feed likely overlaps with Trades view. Dashboard console pane can show recent activity.

### 3.2 Remove Graph from P&L Dashboard

**Action**: Remove DailyPnLChart component

**Changes**:
- Remove `application/vue-frontend/src/components/pnl/DailyPnLChart.vue`
- Remove chart import and usage from `PnLDashboard.vue`
- Remove chart section from P&L view
- Remove Chart.js dependency from `package.json` (if not used elsewhere)
- Remove chart data endpoint from API (`/pnl/daily`) if not used elsewhere
- Remove `getDailyPnL` method from `pnlService.ts` if not used elsewhere

**Rationale**: Per requirements, graph should be removed. Statistics cards provide sufficient information.

### 3.3 Improve Dashboard Experience

**Action**: Enhance main dashboard

**Improvements**:
1. **Better Layout**
   - Make dashboard more informative at a glance
   - Add key metrics cards (total P&L, active trades, inventory value)
   - Improve console pane readability

2. **Consolidate Information**
   - Show recent trades on dashboard (last 5-10)
   - Show recent activity/events on dashboard
   - Show current bot status prominently

3. **Navigation Simplification**
   - Keep only essential nav items: Dashboard, Configuration, Trades, P&L, Balances
   - Remove Activity link
   - Make navigation more intuitive

4. **Status Indicators**
   - Clear bot status (running/paused/stopped)
   - Connection status indicators
   - Error/warning indicators

### 3.4 Improve Trades View

**Action**: Enhance trades view if needed

**Improvements**:
- Better filtering options
- Clearer trade details
- Better formatting of trade data
- Add export functionality (optional)

### 3.5 UI Polish

**Action**: General UI improvements

**Improvements**:
- Consistent styling across all views
- Better error messages
- Loading states
- Empty states
- Responsive design improvements

---

## Phase 4: Statistics & Cost Tracking Improvements

### 4.1 Add Solana Transaction Fee Tracking

**Current State**: Solana transaction fees (priority fees) are estimated in quotes but not tracked in P&L

**Action**: Track and include Solana fees in statistics

**Changes Required**:

1. **Update Trade Logging** (`src/utils/tradeLogger.ts`):
   - Add `solanaFee` field to trade log entries
   - Capture actual priority fee from Solana execution results

2. **Update Execution Results** (`src/core/tradeExecutor.ts`):
   - Extract actual priority fee from Solana transaction
   - Include in execution result
   - Pass to trade logger

3. **Update P&L Service** (`application/api-server/src/services/pnlService.ts`):
   - Add `totalSolanaFees` to `PnLSummary` interface
   - Calculate total Solana fees from trade logs
   - Include in summary calculations
   - Add to breakdown by token, direction, time period

4. **Update P&L UI** (`application/vue-frontend/src/components/pnl/PnLDashboard.vue`):
   - Add Solana fees card to summary
   - Show Solana fees in breakdown tables
   - Update net edge calculation to include Solana fees

5. **Update API** (`application/api-server/src/routes/pnl.ts`):
   - Ensure Solana fees are included in API responses

**Data Sources**:
- Solana execution results include `priorityFee` in `SolanaExecutionResult`
- Trade logs should capture this from execution

### 4.2 Improve Bridging Cost Accuracy

**Current State**: Bridging costs are estimated based on bridge count × fixed cost

**Action**: Track actual bridging costs more accurately

**Changes Required**:

1. **Bridge State Tracking** (`src/bridging/bridgeStateTracker.ts`):
   - Track actual bridge fees paid (if available from bridge API)
   - Store in bridge state

2. **Update P&L Service**:
   - Use actual bridge fees from bridge state if available
   - Fall back to estimated costs if actual fees not available
   - Distinguish between estimated and actual fees in UI

3. **Update UI**:
   - Show actual vs estimated bridging costs
   - Break down by bridge operation if possible

### 4.3 Add GalaChain Transaction Fee Tracking

**Action**: Track GalaChain transaction fees (GALA fees)

**Changes Required**:

1. **Update Trade Logging**:
   - Add `galaChainFee` field to trade log entries
   - Capture actual GALA fee from GalaChain execution

2. **Update Execution Results**:
   - Extract actual GALA fee from GalaChain transaction
   - Include in execution result

3. **Update P&L Service**:
   - Add `totalGalaChainFees` to summary
   - Calculate from trade logs

4. **Update UI**:
   - Show GalaChain fees in summary
   - Include in net edge calculations

### 4.4 Improve Statistics Accuracy

**Action**: Ensure all statistics are accurate and comprehensive

**Improvements**:
1. **Net Edge Calculation**:
   ```
   Net Edge = Gross Edge - Bridge Fees - Solana Fees - GalaChain Fees
   ```

2. **Cost Breakdown**:
   - Show all costs separately
   - Show net edge clearly
   - Show cost percentage of gross edge

3. **Time Period Accuracy**:
   - Ensure all time periods calculate correctly
   - Handle edge cases (no trades, partial periods)

4. **Token Statistics**:
   - Ensure all tokens with trades appear
   - Show accurate per-token costs
   - Show per-token net edge

### 4.5 Update Statistics Display

**Action**: Improve how statistics are displayed

**UI Changes**:
1. **Summary Cards**:
   - Gross Proceeds
   - Bridge Fees (with breakdown if possible)
   - Solana Fees
   - GalaChain Fees
   - Net Proceeds (clearly highlighted)

2. **Cost Breakdown Section**:
   - Visual breakdown of all costs
   - Percentage of gross edge
   - Cost per trade average

3. **Remove Graph** (per requirements):
   - Remove DailyPnLChart component
   - Replace with summary tables if needed

---

## Phase 5: Configuration & Token Management

### 5.1 Ensure All Tokens Appear in Balances

**Current Issue**: Not all configured tokens appear in balance view

**Action**: Fix token balance display

**Changes Required**:

1. **Balance Service** (`application/api-server/src/services/balanceService.ts`):
   - Ensure all tokens from `tokens.json` are included in balance response
   - Handle tokens with zero balance (show as 0.00)
   - Match tokens by symbol correctly

2. **Balance View** (`application/vue-frontend/src/components/balances/BalanceView.vue`):
   - Display all configured tokens, even with zero balance
   - Show which tokens are enabled/disabled
   - Show token configuration status

3. **State Manager** (`src/core/stateManager.ts`):
   - Ensure inventory refresh includes all configured tokens
   - Initialize tokens with zero balance if not present

4. **Inventory Refresher** (`src/core/inventoryRefresher.ts`):
   - Refresh all tokens from config, not just those with existing balances
   - Handle tokens that don't exist on chain yet (show as 0)

### 5.2 Token Configuration Validation

**Action**: Validate token configuration on startup

**Changes Required**:

1. **Config Validation** (`src/config/configSchema.ts`):
   - Validate all token configurations
   - Check for required fields
   - Validate mint addresses format
   - Validate decimals

2. **Startup Checks** (`src/index.ts` or `src/run-bot.ts`):
   - Validate all enabled tokens have valid configuration
   - Warn about tokens with invalid config
   - Skip invalid tokens with clear error message

3. **Balance Check** (`src/core/balanceChecker.ts`):
   - Verify tokens exist on both chains
   - Warn about tokens that can't be found
   - Handle missing tokens gracefully

### 5.3 Token Display Improvements

**Action**: Improve how tokens are displayed

**UI Improvements**:
1. **Balance View**:
   - Show enabled/disabled status
   - Show trade size for each token
   - Show last trade time
   - Group by chain clearly

2. **Configuration View**:
   - Better token configuration UI
   - Validation feedback
   - Enable/disable toggles
   - Trade size configuration

3. **Dashboard**:
   - Show active tokens
   - Show tokens with recent activity
   - Show tokens with issues

### 5.4 Clean Up Config Files

**Action**: Clean up configuration files

**Changes**:
1. **Remove Backup Files**: All `.backup.*` files
2. **Standardize Config**: Ensure consistent structure
3. **Document Config**: Add comments or documentation for config options
4. **Default Config**: Ensure sensible defaults for all options

---

## Phase 6: Installation & Setup

### 6.1 Create Installation Script

**Action**: Create automated setup script

**Script Features**:
1. **Check Prerequisites**:
   - Node.js version
   - npm/yarn availability
   - Required system dependencies

2. **Install Dependencies**:
   - Run `npm install`
   - Check for installation errors

3. **Setup Configuration**:
   - Copy `env.example` to `.env` if doesn't exist
   - Prompt for required environment variables
   - Validate configuration

4. **Initialize State**:
   - Create initial `state.json` if doesn't exist
   - Create initial `bridge-state.json` if doesn't exist

5. **Verify Setup**:
   - Check configuration validity
   - Test API connectivity (optional)
   - Provide setup summary

**File**: `scripts/setup.js` or `scripts/install.sh`

### 6.2 Create Quick Start Guide

**Action**: Add clear quick start section to README

**Content**:
1. **Prerequisites**:
   - Node.js 18+
   - npm or yarn
   - GalaChain wallet with private key
   - Solana wallet with private key
   - Bridge wallet with private key (optional)

2. **Installation Steps**:
   ```bash
   # Clone or download repository
   git clone <repo-url>
   cd sol-arbitrage-bot
   
   # Run setup script
   npm run setup
   
   # Or manual setup
   npm install
   cp env.example .env
   # Edit .env with your keys
   ```

3. **Configuration**:
   - Required environment variables
   - Config file structure
   - Token configuration

4. **First Run**:
   ```bash
   # Dry run mode (safe, no real trades)
   npm run dev
   
   # Check balances
   npm run balances
   
   # When ready, live mode
   RUN_MODE=live npm run dev
   ```

5. **Access UI**:
   - Start API server
   - Start frontend
   - Access dashboard

### 6.3 Create Setup Validation

**Action**: Add validation on startup

**Validations**:
1. **Environment Variables**:
   - Check required vars are set
   - Validate format (private keys, addresses)
   - Provide helpful error messages

2. **Configuration Files**:
   - Validate JSON syntax
   - Validate schema
   - Check for required fields

3. **Wallet Connectivity**:
   - Test GalaChain connection
   - Test Solana connection
   - Verify wallet addresses

4. **API Keys** (optional):
   - Test Jupiter API (if key provided)
   - Test CoinGecko API (if key provided)

**Implementation**: Add to `src/index.ts` or create `src/validateSetup.ts`

### 6.4 Create Distribution Package

**Action**: Prepare for distribution

**Steps**:
1. **Create .gitignore**:
   - Exclude `node_modules/`
   - Exclude `.env`
   - Exclude `state.json`
   - Exclude `bridge-state.json`
   - Exclude `logs/`
   - Exclude `dist/`
   - Exclude backup files

2. **Create Distribution Checklist**:
   - All files cleaned up
   - Documentation complete
   - Configuration examples provided
   - Setup script works
   - README is comprehensive

3. **Package for Distribution**:
   - Create zip/tarball
   - Or prepare for GitHub release
   - Include installation instructions

---

## Phase 7: Testing & Validation

### 7.1 Test Clean Installation

**Action**: Test fresh installation from scratch

**Tests**:
1. Download/clone repository
2. Run setup script
3. Configure with test keys
4. Run in dry-run mode
5. Verify UI works
6. Verify balances load
7. Verify statistics work

### 7.2 Test All Features

**Action**: Test all functionality after cleanup

**Tests**:
1. **Configuration**:
   - Load config
   - Validate tokens
   - Update config

2. **Balance Display**:
   - All tokens appear
   - Zero balances shown
   - USD values correct

3. **Statistics**:
   - P&L calculations correct
   - All costs included
   - Time periods accurate

4. **UI**:
   - All views work
   - Navigation works
   - No broken links
   - No missing components

5. **Bot Operation**:
   - Dry-run mode works
   - Live mode works (with test keys)
   - Error handling works

### 7.3 Validate Token Configuration

**Action**: Ensure all configured tokens work

**Tests**:
1. Enable each token
2. Verify quotes work
3. Verify balances appear
4. Verify trades can execute (dry-run)

### 7.4 Performance Testing

**Action**: Ensure performance is acceptable

**Tests**:
1. Startup time
2. UI load time
3. Balance refresh time
4. Statistics calculation time

---

## Implementation Checklist

### Phase 1: File Cleanup
- [ ] Remove development documentation files (50+ files)
- [ ] Move essential tests to `test/` directory
- [ ] Remove one-off test scripts
- [ ] Remove all backup files
- [ ] Remove application development docs
- [ ] Remove unused files (bot1.env, etc.)
- [ ] Clean up source directory docs
- [ ] Update .gitignore

### Phase 2: Documentation
- [ ] Create comprehensive README.md
- [ ] Consolidate essential docs
- [ ] Update package.json metadata
- [ ] Create developer guide (optional)

### Phase 3: UI Cleanup
- [ ] Remove Activity view and components
- [ ] Remove Activity route and navigation
- [ ] Remove DailyPnLChart component
- [ ] Remove Chart.js dependency
- [ ] Improve dashboard layout
- [ ] Add key metrics to dashboard
- [ ] Improve trades view
- [ ] General UI polish

### Phase 4: Statistics & Costs
- [ ] Add Solana fee tracking to trade logs
- [ ] Update P&L service for Solana fees
- [ ] Update P&L UI for Solana fees
- [ ] Improve bridging cost accuracy
- [ ] Add GalaChain fee tracking
- [ ] Update net edge calculations
- [ ] Improve statistics display
- [ ] Remove graph from P&L view

### Phase 5: Token Management
- [ ] Fix balance service to show all tokens
- [ ] Update balance view to show zero balances
- [ ] Add token configuration validation
- [ ] Improve token display in UI
- [ ] Clean up config files

### Phase 6: Installation
- [ ] Create setup script
- [ ] Add quick start guide to README
- [ ] Add setup validation
- [ ] Create distribution package
- [ ] Update .gitignore

### Phase 7: Testing
- [ ] Test clean installation
- [ ] Test all features
- [ ] Validate token configuration
- [ ] Performance testing
- [ ] Final validation

---

## Additional Ideas & Improvements

### A. Enhanced Error Messages
- More helpful error messages throughout
- Clear guidance on how to fix common issues
- Links to relevant documentation

### B. Configuration Wizard
- Interactive setup for first-time users
- Step-by-step configuration guide
- Validation at each step

### C. Health Checks
- Bot health monitoring
- Automatic issue detection
- Health status dashboard

### D. Export Functionality
- Export trade history to CSV
- Export statistics to PDF
- Export configuration backup

### E. Better Logging
- Structured logging
- Log rotation
- Log level configuration
- Log viewing in UI

### F. Monitoring Alerts
- Configurable alerts
- Email/SMS notifications
- Alert history

### G. Documentation Improvements
- Video tutorials (optional)
- Screenshots in README
- Architecture diagrams
- API documentation

### H. Performance Optimizations
- Lazy loading in UI
- Caching improvements
- Database for trade history (optional, future)

### I. Security Improvements
- Secure key storage options
- Key encryption
- Audit logging

### J. Multi-Instance Support
- Support for multiple bot instances
- Instance management in UI
- Per-instance statistics

---

## Priority Order

### High Priority (Must Have)
1. File cleanup (Phase 1)
2. Documentation consolidation (Phase 2)
3. Remove Activity screen (Phase 3.1)
4. Remove graph (Phase 3.2)
5. Add Solana fee tracking (Phase 4.1)
6. Fix token balance display (Phase 5.1)
7. Create comprehensive README (Phase 2.1)
8. Setup validation (Phase 6.3)

### Medium Priority (Should Have)
1. Improve dashboard (Phase 3.3)
2. Improve statistics accuracy (Phase 4.4)
3. Token configuration validation (Phase 5.2)
4. Create setup script (Phase 6.1)
5. UI polish (Phase 3.5)

### Low Priority (Nice to Have)
1. Enhanced error messages
2. Configuration wizard
3. Export functionality
4. Health checks
5. Performance optimizations

---

## Estimated Effort

### Phase 1: File Cleanup
- **Time**: 2-4 hours
- **Complexity**: Low
- **Risk**: Low

### Phase 2: Documentation
- **Time**: 4-6 hours
- **Complexity**: Medium
- **Risk**: Low

### Phase 3: UI Cleanup
- **Time**: 4-6 hours
- **Complexity**: Medium
- **Risk**: Medium

### Phase 4: Statistics & Costs
- **Time**: 6-8 hours
- **Complexity**: High
- **Risk**: Medium

### Phase 5: Token Management
- **Time**: 4-6 hours
- **Complexity**: Medium
- **Risk**: Medium

### Phase 6: Installation
- **Time**: 3-4 hours
- **Complexity**: Medium
- **Risk**: Low

### Phase 7: Testing
- **Time**: 4-6 hours
- **Complexity**: Medium
- **Risk**: Low

**Total Estimated Time**: 27-40 hours

---

## Notes

- **Backup First**: Before starting, create a backup of the entire repository
- **Incremental Changes**: Make changes incrementally and test after each phase
- **Version Control**: Commit changes frequently with clear messages
- **Documentation**: Update documentation as you make changes
- **Testing**: Test thoroughly after each phase before moving to next

---

## Success Criteria

The project is considered successfully cleaned up and packaged when:

1. ✅ Repository has < 10 markdown files (excluding README)
2. ✅ No test files in `src/` directory
3. ✅ No backup files in repository
4. ✅ README is comprehensive and clear
5. ✅ UI has only essential views (Dashboard, Config, Trades, P&L, Balances)
6. ✅ No graph in P&L view
7. ✅ All costs (Solana fees, bridging, GalaChain fees) are tracked and displayed
8. ✅ All configured tokens appear in balance view
9. ✅ Setup can be completed in < 10 minutes by new user
10. ✅ Bot runs successfully after fresh installation
11. ✅ All statistics are accurate and comprehensive

---

**End of Plan**

