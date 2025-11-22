#!/usr/bin/env node

/**
 * Setup script for SOL Arbitrage Bot
 * 
 * This script automates the installation and initial configuration
 * of the arbitrage bot.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function checkPrerequisites() {
  logStep('1', 'Checking prerequisites...');
  
  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    if (majorVersion < 18) {
      logError(`Node.js version ${nodeVersion} is too old. Please install Node.js 18 or higher.`);
      process.exit(1);
    }
    logSuccess(`Node.js ${nodeVersion} detected`);
  } catch (error) {
    logError('Node.js is not installed. Please install Node.js 18 or higher.');
    process.exit(1);
  }
  
  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm ${npmVersion} detected`);
  } catch (error) {
    logError('npm is not installed. Please install npm.');
    process.exit(1);
  }
  
  logSuccess('All prerequisites met');
}

function installDependencies() {
  logStep('2', 'Installing dependencies...');
  
  try {
    log('Running npm install (this may take a few minutes)...', 'blue');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Core dependencies installed');
  } catch (error) {
    logError('Failed to install dependencies. Please check the error above.');
    process.exit(1);
  }
  
  // Install API server dependencies
  const apiServerPath = path.join(__dirname, '..', 'application', 'api-server');
  if (fs.existsSync(apiServerPath)) {
    log('Installing API server dependencies...', 'blue');
    try {
      process.chdir(apiServerPath);
      execSync('npm install', { stdio: 'inherit' });
      logSuccess('API server dependencies installed');
    } catch (error) {
      logWarning('Failed to install API server dependencies. You may need to install them manually.');
    }
    process.chdir(__dirname);
  }
  
  // Install frontend dependencies
  const frontendPath = path.join(__dirname, '..', 'application', 'vue-frontend');
  if (fs.existsSync(frontendPath)) {
    log('Installing frontend dependencies...', 'blue');
    try {
      process.chdir(frontendPath);
      execSync('npm install', { stdio: 'inherit' });
      logSuccess('Frontend dependencies installed');
    } catch (error) {
      logWarning('Failed to install frontend dependencies. You may need to install them manually.');
    }
    process.chdir(__dirname);
  }
}

function setupConfiguration() {
  logStep('3', 'Setting up configuration...');
  
  const rootDir = path.join(__dirname, '..');
  const envExamplePath = path.join(rootDir, 'env.example');
  const envPath = path.join(rootDir, '.env');
  
  // Copy env.example to .env if it doesn't exist
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      logSuccess('Created .env file from env.example');
      logWarning('Please edit .env and fill in your private keys and wallet addresses');
    } else {
      logWarning('env.example not found. You will need to create .env manually.');
    }
  } else {
    logSuccess('.env file already exists');
  }
  
  // Check if state.json exists, create default if not
  const statePath = path.join(rootDir, 'state.json');
  if (!fs.existsSync(statePath)) {
    const defaultState = {
      inventory: {
        galaChain: {},
        solana: {}
      },
      cooldowns: {},
      tradeHistory: [],
      tokenPrices: {},
      lastUpdate: Date.now()
    };
    fs.writeFileSync(statePath, JSON.stringify(defaultState, null, 2));
    logSuccess('Created initial state.json');
  } else {
    logSuccess('state.json already exists');
  }
  
  // Check if bridge-state.json exists, create default if not
  const bridgeStatePath = path.join(rootDir, 'bridge-state.json');
  if (!fs.existsSync(bridgeStatePath)) {
    const defaultBridgeState = {
      pendingBridges: [],
      bridgeHistory: [],
      lastUpdate: Date.now()
    };
    fs.writeFileSync(bridgeStatePath, JSON.stringify(defaultBridgeState, null, 2));
    logSuccess('Created initial bridge-state.json');
  } else {
    logSuccess('bridge-state.json already exists');
  }
  
  // Ensure logs directory exists
  const logsDir = path.join(rootDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logSuccess('Created logs directory');
  }
}

function validateSetup() {
  logStep('4', 'Validating setup...');
  
  const rootDir = path.join(__dirname, '..');
  const envPath = path.join(rootDir, '.env');
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    logError('.env file not found. Please create it from env.example');
    return false;
  }
  
  // Read and check required environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'GALACHAIN_PRIVATE_KEY',
    'GALACHAIN_WALLET_ADDRESS',
    'SOLANA_PRIVATE_KEY',
    'SOLANA_WALLET_ADDRESS'
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    if (!match || !match[1] || match[1].includes('your_') || match[1].trim() === '') {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    logWarning(`The following required environment variables are not set in .env:`);
    missingVars.forEach(v => log(`  - ${v}`, 'yellow'));
    logWarning('Please edit .env and fill in these values before running the bot');
    return false;
  }
  
  // Check if config files exist
  const configPath = path.join(rootDir, 'config', 'tokens.json');
  if (!fs.existsSync(configPath)) {
    logWarning('config/tokens.json not found. The bot may not work correctly.');
    return false;
  }
  
  logSuccess('Setup validation passed');
  return true;
}

function buildProject() {
  logStep('5', 'Building project...');
  
  try {
    log('Compiling TypeScript...', 'blue');
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Project built successfully');
  } catch (error) {
    logWarning('Build failed. You can still run the bot with npm run dev (ts-node)');
  }
}

function printSummary() {
  log('\n' + '='.repeat(60), 'bright');
  log('Setup Complete!', 'green');
  log('='.repeat(60), 'bright');
  
  log('\nNext steps:', 'cyan');
  log('1. Edit .env and ensure all required variables are set');
  log('2. Review config/tokens.json and configure your tokens');
  log('3. Test the bot in dry-run mode:');
  log('   npm run dev', 'blue');
  log('4. Check balances:');
  log('   npm run balances', 'blue');
  log('5. When ready for live trading:');
  log('   RUN_MODE=live npm run dev', 'blue');
  
  log('\nTo start the UI:', 'cyan');
  log('1. Start API server (in a separate terminal):');
  log('   cd application/api-server && npm run dev', 'blue');
  log('2. Start frontend (in another terminal):');
  log('   cd application/vue-frontend && npm run dev', 'blue');
  log('3. Open http://localhost:5173 in your browser', 'blue');
  
  log('\nFor more information, see README.md', 'cyan');
  log('='.repeat(60) + '\n', 'bright');
}

// Main execution
function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('SOL Arbitrage Bot - Setup Script', 'bright');
  log('='.repeat(60), 'bright');
  
  try {
    checkPrerequisites();
    installDependencies();
    setupConfiguration();
    const isValid = validateSetup();
    buildProject();
    printSummary();
    
    if (!isValid) {
      log('\n⚠ Setup completed with warnings. Please fix the issues above before running the bot.', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };

