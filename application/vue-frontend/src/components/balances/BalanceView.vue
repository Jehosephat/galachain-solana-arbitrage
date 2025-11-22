<template>
  <div class="balance-view">
    <div class="header-section">
      <h2>Token Balances</h2>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="loading && !balances" class="loading">Loading balances...</div>

    <div v-else-if="balances" class="balances-container">
      <!-- Balances Table -->
      <div class="balances-table-container">
        <table class="balances-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>GalaChain</th>
              <th>Solana</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="token in allTokens" :key="token.symbol">
              <td class="token-column">
                <div class="token-info">
                  <span class="token-symbol">{{ token.symbol }}</span>
                  <span v-if="token.enabled === false && token.symbol !== 'GALA'" class="status-badge disabled">Disabled</span>
                </div>
              </td>
              <td class="balance-column">
                <span class="balance-amount">{{ formatNumber(token.galaChainBalance) }}</span>
              </td>
              <td class="balance-column">
                <span class="balance-amount">{{ formatNumber(token.solanaBalance) }}</span>
              </td>
              <td class="balance-column">
                <span class="balance-amount">{{ formatNumber(getTotal(token)) }}</span>
              </td>
            </tr>
            <tr v-if="allTokens.length === 0">
              <td colspan="4" class="empty-state">No token balances</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useBalanceStore } from '../../stores/balances'
import { useConfigStore } from '../../stores/config'

const balanceStore = useBalanceStore()
const configStore = useConfigStore()
const { balances, loading, error } = storeToRefs(balanceStore)
const { tokens: tokenConfigs } = storeToRefs(configStore)

// Get all unique tokens from both chains and combine their balances with config info
const allTokens = computed(() => {
  if (!balances.value) return []
  
  const tokenMap = new Map<string, { 
    symbol: string
    galaChainBalance: number | string
    solanaBalance: number | string
    enabled?: boolean
    tradeSize?: number
  }>()
  
  // Add GalaChain tokens
  if (balances.value.galaChain?.tokens) {
    for (const [symbol, token] of Object.entries(balances.value.galaChain.tokens)) {
      const config = tokenConfigs.value?.find(t => t.symbol === symbol)
      tokenMap.set(symbol, {
        symbol,
        galaChainBalance: token.balance || '0',
        solanaBalance: '0',
        enabled: config?.enabled,
        tradeSize: config?.tradeSize
      })
    }
  }
  
  // Add Solana native SOL
  if (balances.value.solana?.native) {
    const existing = tokenMap.get('SOL')
    const config = tokenConfigs.value?.find(t => t.symbol === 'SOL')
    if (existing) {
      existing.solanaBalance = balances.value.solana.native
      existing.enabled = config?.enabled
      existing.tradeSize = config?.tradeSize
    } else {
      tokenMap.set('SOL', {
        symbol: 'SOL',
        galaChainBalance: '0',
        solanaBalance: balances.value.solana.native,
        enabled: config?.enabled,
        tradeSize: config?.tradeSize
      })
    }
  }
  
  // Add Solana SPL tokens
  if (balances.value.solana?.tokens) {
    for (const [symbol, token] of Object.entries(balances.value.solana.tokens)) {
      // Skip SOL as we already handled it above
      if (symbol === 'SOL') continue
      
      const config = tokenConfigs.value?.find(t => t.symbol === symbol)
      const existing = tokenMap.get(symbol)
      if (existing) {
        existing.solanaBalance = token.balance || '0'
        existing.enabled = config?.enabled
        existing.tradeSize = config?.tradeSize
      } else {
        tokenMap.set(symbol, {
          symbol,
          galaChainBalance: '0',
          solanaBalance: token.balance || '0',
          enabled: config?.enabled,
          tradeSize: config?.tradeSize
        })
      }
    }
  }
  
  // Ensure all configured tokens are included (even if not in balances)
  if (tokenConfigs.value) {
    for (const config of tokenConfigs.value) {
      if (!tokenMap.has(config.symbol)) {
        tokenMap.set(config.symbol, {
          symbol: config.symbol,
          galaChainBalance: '0',
          solanaBalance: '0',
          enabled: config.enabled,
          tradeSize: config.tradeSize
        })
      }
    }
  }
  
  // Convert to array and sort: GALA first, then enabled tokens, then disabled tokens, then by symbol
  return Array.from(tokenMap.values()).sort((a, b) => {
    // GALA always comes first
    if (a.symbol === 'GALA') return -1
    if (b.symbol === 'GALA') return 1
    
    // Then sort by enabled status (enabled first)
    if (a.enabled !== b.enabled) {
      if (a.enabled === true) return -1
      if (b.enabled === true) return 1
      // Both undefined or both false - treat as equal for this comparison
    }
    // Then sort by symbol
    return a.symbol.localeCompare(b.symbol)
  })
})

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  if (num === 0) return '0'
  if (Math.abs(num) < 0.0001) return num.toExponential(2)
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(4)
}

const getTotal = (token: { galaChainBalance: number | string; solanaBalance: number | string }): number => {
  const galaChain = typeof token.galaChainBalance === 'string' ? parseFloat(token.galaChainBalance) : token.galaChainBalance
  const solana = typeof token.solanaBalance === 'string' ? parseFloat(token.solanaBalance) : token.solanaBalance
  const galaChainNum = isNaN(galaChain) ? 0 : galaChain
  const solanaNum = isNaN(solana) ? 0 : solana
  return galaChainNum + solanaNum
}

onMounted(async () => {
  await Promise.all([
    balanceStore.fetchBalances(),
    configStore.fetchTokens()
  ])
})
</script>

<style scoped>
.balance-view {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-section {
  margin-bottom: 2rem;
}

.header-section h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.balances-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.balances-table-container {
  overflow-x: auto;
}

.balances-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.balances-table thead {
  background: #f8f9fa;
}

.balances-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
}

.balances-table th:first-child {
  width: 200px;
}

.balances-table th:nth-child(2),
.balances-table th:nth-child(3),
.balances-table th:nth-child(4) {
  text-align: right;
}

.balances-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
}

.balances-table tbody tr:hover {
  background: #f8f9fa;
}

.balances-table tbody tr:last-child td {
  border-bottom: none;
}

.token-column {
  font-weight: 600;
  color: #2c3e50;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.token-symbol {
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.disabled {
  background: #f8d7da;
  color: #721c24;
}

.balance-column {
  text-align: right;
}

.balance-amount {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}

.error-message {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fee;
  color: #c0392b;
  border-radius: 4px;
  border: 1px solid #e74c3c;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

