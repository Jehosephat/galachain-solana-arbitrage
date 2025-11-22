/**
 * Balance Service
 * 
 * Reads token balances from state.json and can fetch fresh balances
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { ConfigService } from './configService';

export interface TokenBalance {
  symbol: string;
  mint: string;
  rawBalance: string;
  balance: string;
  decimals: number;
  valueUsd?: number;
  lastUpdated: number;
}

export interface ChainBalances {
  tokens: Record<string, TokenBalance>;
  native: string;
  lastUpdated: number;
}

export interface AllBalances {
  galaChain: ChainBalances;
  solana: ChainBalances;
  lastUpdated: number;
  version?: number;
}

export class BalanceService {
  private stateFilePath: string;
  private configService: ConfigService;
  private botRoot: string;

  constructor() {
    this.configService = new ConfigService();
    
    // Determine bot root directory
    const currentDir = __dirname;
    this.botRoot = currentDir.includes('dist') 
      ? path.resolve(currentDir, '../../..')
      : path.resolve(currentDir, '../../../..');
    this.stateFilePath = path.join(this.botRoot, 'state.json');
  }

  /**
   * Get all balances from state.json, ensuring all configured tokens are included
   */
  async getAllBalances(): Promise<AllBalances | null> {
    try {
      // Get all configured tokens
      const configuredTokens = await this.configService.readTokens();
      const tokenSymbols = new Set(configuredTokens.map(t => t.symbol));
      
      // Read state.json if it exists
      let state: any = null;
      if (existsSync(this.stateFilePath)) {
        const content = await fs.readFile(this.stateFilePath, 'utf-8');
        state = JSON.parse(content);
      }
      
      // Convert BigNumber strings and ensure proper types
      const convertTokenBalance = (token: any): TokenBalance => {
        return {
          symbol: token.symbol || '',
          mint: token.mint || '',
          rawBalance: typeof token.rawBalance === 'string' ? token.rawBalance : String(token.rawBalance || '0'),
          balance: typeof token.balance === 'string' ? token.balance : String(token.balance || '0'),
          decimals: typeof token.decimals === 'number' ? token.decimals : parseInt(String(token.decimals || 0), 10),
          valueUsd: typeof token.valueUsd === 'number' ? token.valueUsd : parseFloat(String(token.valueUsd || '0')),
          lastUpdated: typeof token.lastUpdated === 'number' ? token.lastUpdated : parseInt(String(token.lastUpdated || Date.now()), 10)
        };
      };

      const convertChainBalances = (chainData: any, chainType: 'galaChain' | 'solana'): ChainBalances => {
        const tokens: Record<string, TokenBalance> = {};
        
        // First, add tokens from state.json (existing balances)
        if (chainData && chainData.tokens && typeof chainData.tokens === 'object') {
          Object.keys(chainData.tokens).forEach(symbol => {
            tokens[symbol] = convertTokenBalance(chainData.tokens[symbol]);
          });
        }
        
        // Then, ensure all configured tokens are included (even with zero balance)
        for (const tokenConfig of configuredTokens) {
          if (!tokens[tokenConfig.symbol]) {
            // Create zero balance entry for configured token
            const mint = chainType === 'galaChain' 
              ? tokenConfig.galaChainMint 
              : (tokenConfig.solanaMint || '');
            
            tokens[tokenConfig.symbol] = {
              symbol: tokenConfig.symbol,
              mint: mint,
              rawBalance: '0',
              balance: '0',
              decimals: tokenConfig.decimals || 8,
              valueUsd: 0,
              lastUpdated: Date.now()
            };
          }
        }

        return {
          tokens,
          native: typeof chainData?.native === 'string' ? chainData.native : String(chainData?.native || '0'),
          lastUpdated: typeof chainData?.lastUpdated === 'number' 
            ? chainData.lastUpdated 
            : parseInt(String(chainData?.lastUpdated || Date.now()), 10)
        };
      };

      const inventory = state?.inventory || {};
      
      return {
        galaChain: convertChainBalances(inventory.galaChain, 'galaChain'),
        solana: convertChainBalances(inventory.solana, 'solana'),
        lastUpdated: typeof inventory.lastUpdated === 'number' 
          ? inventory.lastUpdated 
          : parseInt(String(inventory.lastUpdated || Date.now()), 10),
        version: typeof inventory.version === 'number' 
          ? inventory.version 
          : parseInt(String(inventory.version || 0), 10)
      };
    } catch (error) {
      console.error('Failed to read balances from state:', error);
      return null;
    }
  }

  /**
   * Get balances for a specific chain
   */
  async getChainBalances(chain: 'galaChain' | 'solana'): Promise<ChainBalances | null> {
    const allBalances = await this.getAllBalances();
    if (!allBalances) {
      return null;
    }
    
    return allBalances[chain];
  }

  /**
   * Refresh balances by re-reading from state.json
   * This simply reloads the current balances from the state file
   */
  async refreshBalances(): Promise<AllBalances | null> {
    // Just re-fetch from state.json, don't call network refresh
    return await this.getAllBalances();
  }
}

