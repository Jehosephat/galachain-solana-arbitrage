/**
 * Setup Validation Module
 * 
 * Validates that the bot is properly configured before starting.
 * Checks environment variables, configuration files, and basic connectivity.
 */

import fs from 'fs';
import path from 'path';
import logger from './logger';
import { Connection } from '@solana/web3.js';
import { IConfigService } from '../config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SetupValidator {
  private configService: IConfigService;

  constructor(configService: IConfigService) {
    this.configService = configService;
  }

  /**
   * Perform comprehensive setup validation
   */
  async validateSetup(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate environment variables
    this.validateEnvironmentVariables(errors, warnings);

    // Validate configuration files
    this.validateConfigurationFiles(errors, warnings);

    // Validate configuration schema
    this.validateConfigurationSchema(errors, warnings);

    // Validate wallet addresses format
    this.validateWalletAddresses(errors, warnings);

    // Test basic connectivity (non-blocking)
    await this.testConnectivity(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironmentVariables(errors: string[], warnings: string[]): void {
    const requiredVars = [
      'GALACHAIN_PRIVATE_KEY',
      'GALACHAIN_WALLET_ADDRESS',
      'SOLANA_PRIVATE_KEY',
      'SOLANA_WALLET_ADDRESS'
    ];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value || value.trim() === '' || value.includes('your_')) {
        errors.push(`Missing or invalid environment variable: ${varName}`);
      }
    }

    // Check optional but recommended variables
    if (!process.env.COINGECKO_API_KEY) {
      warnings.push('COINGECKO_API_KEY not set. USD price conversions will be limited.');
    }

    if (!process.env.JUPITER_API_KEY) {
      warnings.push('JUPITER_API_KEY not set. May hit rate limits on Jupiter API.');
    }
  }

  /**
   * Validate configuration files exist and are readable
   */
  private validateConfigurationFiles(errors: string[], warnings: string[]): void {
    const rootDir = path.join(__dirname, '..', '..');
    
    // Check required config files
    const requiredFiles = [
      { path: path.join(rootDir, 'config', 'tokens.json'), name: 'config/tokens.json' },
      { path: path.join(rootDir, 'config', 'config.json'), name: 'config/config.json' }
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file.path)) {
        errors.push(`Configuration file not found: ${file.name}`);
      } else {
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          JSON.parse(content); // Validate JSON syntax
        } catch (error) {
          errors.push(`Invalid JSON in ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Check optional files
    const optionalFiles = [
      { path: path.join(rootDir, 'config', 'strategies.json'), name: 'config/strategies.json' }
    ];

    for (const file of optionalFiles) {
      if (!fs.existsSync(file.path)) {
        warnings.push(`Optional configuration file not found: ${file.name}`);
      }
    }

    // Check .env file
    const envPath = path.join(rootDir, '.env');
    if (!fs.existsSync(envPath)) {
      warnings.push('.env file not found. Make sure to copy env.example to .env and configure it.');
    }
  }

  /**
   * Validate configuration schema using config service
   */
  private validateConfigurationSchema(errors: string[], warnings: string[]): void {
    try {
      const validation = this.configService.validateConfig();
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings);
      }
    } catch (error) {
      errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate wallet address formats
   */
  private validateWalletAddresses(errors: string[], warnings: string[]): void {
    const galaAddress = process.env.GALACHAIN_WALLET_ADDRESS;
    const solanaAddress = process.env.SOLANA_WALLET_ADDRESS;

    // Basic format validation for GalaChain addresses (should be hex-like)
    if (galaAddress && !/^0x[a-fA-F0-9]{40}$/.test(galaAddress)) {
      warnings.push('GALACHAIN_WALLET_ADDRESS format may be invalid (expected 0x followed by 40 hex characters)');
    }

    // Basic format validation for Solana addresses (base58, typically 32-44 chars)
    if (solanaAddress && (solanaAddress.length < 32 || solanaAddress.length > 44)) {
      warnings.push('SOLANA_WALLET_ADDRESS format may be invalid (expected base58 string, 32-44 characters)');
    }
  }

  /**
   * Test basic connectivity to required services
   */
  private async testConnectivity(errors: string[], warnings: string[]): Promise<void> {
    // Test Solana RPC connection
    try {
      const solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(solanaRpcUrl, 'confirmed');
      
      // Try to get slot (lightweight operation)
      await Promise.race([
        connection.getSlot(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      logger.debug('Solana RPC connection test passed');
    } catch (error) {
      warnings.push(`Cannot connect to Solana RPC: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Note: GalaChain connectivity test would require SDK initialization
    // which is more complex, so we skip it here and let the bot handle it
  }

  /**
   * Print validation results in a user-friendly format
   */
  static printResults(result: ValidationResult): void {
    if (result.isValid && result.warnings.length === 0) {
      logger.info('✅ Setup validation passed');
      return;
    }

    if (result.errors.length > 0) {
      logger.error('❌ Setup validation failed with errors:');
      result.errors.forEach(error => logger.error(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      logger.warn('⚠️ Setup validation warnings:');
      result.warnings.forEach(warning => logger.warn(`  - ${warning}`));
    }
  }
}

