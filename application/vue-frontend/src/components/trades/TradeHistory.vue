<template>
  <div class="trade-history">
    <div class="header-section">
      <h2>Trade History</h2>
    </div>

    <!-- Stats Summary -->
    <div v-if="stats" class="stats-cards">
      <div class="stat-card">
        <div class="stat-label">Total Trades</div>
        <div class="stat-value">{{ stats.totalTrades }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value">{{ stats.winRate.toFixed(1) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Profit (GALA)</div>
        <div class="stat-value">{{ stats.totalProfitGala.toFixed(4) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Edge (BPS)</div>
        <div class="stat-value">{{ stats.averageEdgeBps.toFixed(2) }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Token:</label>
        <select v-model="localFilters.token" @change="applyFilters">
          <option value="">All</option>
          <option v-for="token in uniqueTokens" :key="token" :value="token">{{ token }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Direction:</label>
        <select v-model="localFilters.direction" @change="applyFilters">
          <option value="">All</option>
          <option value="forward">Forward</option>
          <option value="reverse">Reverse</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="localFilters.success" @change="applyFilters">
          <option :value="undefined">All</option>
          <option :value="true">Success</option>
          <option :value="false">Failed</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Mode:</label>
        <select v-model="localFilters.mode" @change="applyFilters">
          <option value="">All</option>
          <option value="live">Live</option>
          <option value="dry_run">Dry Run</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="loading && trades.length === 0" class="loading">Loading trades...</div>

    <div v-else-if="trades.length === 0" class="empty-state">
      No trades found.
    </div>

    <div v-else class="trades-table-container">
      <table class="trades-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Token</th>
            <th>Direction</th>
            <th>Size</th>
            <th>Edge (BPS)</th>
            <th>Status</th>
            <th>GC TX</th>
            <th>SOL TX</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trade in trades" :key="trade.timestamp" :class="{ 'trade-failed': !trade.success }">
            <td>
              <div class="timestamp-cell">
                <div class="timestamp-date">{{ formatDate(trade.timestamp) }}</div>
                <div class="timestamp-relative">{{ formatRelativeTime(trade.timestamp) }}</div>
              </div>
            </td>
            <td><strong>{{ trade.token }}</strong></td>
            <td>
              <span :class="['direction-badge', trade.direction]">
                {{ trade.direction || '-' }}
              </span>
            </td>
            <td>{{ trade.tradeSize }}</td>
            <td>
              <span :class="getEdgeClass(trade)">
                {{ getEdgeBps(trade) }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', trade.success ? 'success' : 'failed']">
                {{ trade.success ? '✓ Success' : '✗ Failed' }}
              </span>
            </td>
            <td>
              <a 
                v-if="trade.galaChainTxHash" 
                :href="`https://explorer.galachain.io/transaction/${trade.galaChainTxHash}`"
                target="_blank"
                class="tx-link"
              >
                {{ truncate(trade.galaChainTxHash) }}
              </a>
              <span v-else>-</span>
            </td>
            <td>
              <a 
                v-if="trade.solanaTxSig" 
                :href="`https://solscan.io/tx/${trade.solanaTxSig}`"
                target="_blank"
                class="tx-link"
              >
                {{ truncate(trade.solanaTxSig) }}
              </a>
              <span v-else>-</span>
            </td>
            <td>
              <button @click="viewTradeDetails(trade)" class="btn-icon btn-icon-view" title="View trade details">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          @click="changePage(pagination.page - 1)" 
          :disabled="pagination.page <= 1 || loading"
          class="btn btn-secondary"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ pagination.page }} of {{ Math.ceil(pagination.total / pagination.limit) }}
          ({{ pagination.total }} total)
        </span>
        <button 
          @click="changePage(pagination.page + 1)" 
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit) || loading"
          class="btn btn-secondary"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Trade Detail Modal -->
    <div v-if="selectedTrade" class="modal-overlay" @click.self="selectedTrade = null">
      <div class="modal-content large">
        <h3>Trade Details</h3>
        <div class="trade-details">
          <div class="detail-row">
            <strong>Timestamp:</strong> {{ formatDate(selectedTrade.timestamp) }}
          </div>
          <div class="detail-row">
            <strong>Token:</strong> {{ selectedTrade.token }}
          </div>
          <div class="detail-row">
            <strong>Trade Size:</strong> {{ selectedTrade.tradeSize }}
          </div>
          <div class="detail-row">
            <strong>Direction:</strong> {{ selectedTrade.direction || '-' }}
          </div>
          <div class="detail-row">
            <strong>Mode:</strong> {{ selectedTrade.mode }}
          </div>
          <div class="detail-row">
            <strong>Status:</strong> 
            <span :class="['status-badge', selectedTrade.success ? 'success' : 'failed']">
              {{ selectedTrade.success ? '✓ Success' : '✗ Failed' }}
            </span>
          </div>
          <div class="detail-section">
            <h4>Expected Values</h4>
            <div class="detail-row">GC Proceeds: {{ selectedTrade.expectedGalaChainProceeds?.toFixed(4) || '-' }}</div>
            <div class="detail-row">SOL Cost: {{ selectedTrade.expectedSolanaCost?.toFixed(4) || '-' }}</div>
            <div class="detail-row">Edge (BPS): {{ selectedTrade.expectedNetEdgeBps?.toFixed(2) || '-' }}</div>
          </div>
          <div v-if="selectedTrade.mode === 'live'" class="detail-section">
            <h4>Actual Values</h4>
            <div v-if="hasActualValues(selectedTrade)">
              <div class="detail-row">GC Proceeds: {{ selectedTrade.actualGalaChainProceeds?.toFixed(4) }}</div>
              <div class="detail-row">SOL Cost: {{ selectedTrade.actualSolanaCost?.toFixed(4) }}</div>
              <div class="detail-row">Edge (BPS): {{ selectedTrade.actualNetEdgeBps?.toFixed(2) }}</div>
            </div>
            <div v-else class="detail-row note-text">
              <em>Coming soon: Parsing transaction receipts to verify actual amounts swapped.</em>
            </div>
          </div>
          <div class="detail-section">
            <h4>Transactions</h4>
            <div class="detail-row">
              <strong>GalaChain:</strong>
              <a 
                v-if="selectedTrade.galaChainTxHash" 
                :href="`https://explorer.galachain.io/transaction/${selectedTrade.galaChainTxHash}`"
                target="_blank"
                class="tx-link"
              >
                {{ selectedTrade.galaChainTxHash }}
              </a>
              <span v-else>-</span>
            </div>
            <div class="detail-row">
              <strong>Solana:</strong>
              <a 
                v-if="selectedTrade.solanaTxSig" 
                :href="`https://solscan.io/tx/${selectedTrade.solanaTxSig}`"
                target="_blank"
                class="tx-link"
              >
                {{ selectedTrade.solanaTxSig }}
              </a>
              <span v-else>-</span>
            </div>
          </div>
          <div v-if="selectedTrade.galaChainError || selectedTrade.solanaError" class="detail-section">
            <h4>Errors</h4>
            <div v-if="selectedTrade.galaChainError" class="error-text">
              <strong>GalaChain:</strong> {{ selectedTrade.galaChainError }}
            </div>
            <div v-if="selectedTrade.solanaError" class="error-text">
              <strong>Solana:</strong> {{ selectedTrade.solanaError }}
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="selectedTrade = null" class="btn btn-primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTradesStore, TradeLogEntry } from '../../stores/trades'

const tradesStore = useTradesStore()
const { trades, stats, loading, error, pagination, filters } = storeToRefs(tradesStore)

const selectedTrade = ref<TradeLogEntry | null>(null)
const localFilters = ref({
  token: '',
  direction: '' as '' | 'forward' | 'reverse',
  success: undefined as boolean | undefined,
  mode: '' as '' | 'live' | 'dry_run'
})

const uniqueTokens = computed(() => {
  const tokens = new Set<string>()
  trades.value.forEach(t => {
    if (t.token) tokens.add(t.token)
  })
  return Array.from(tokens).sort()
})

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const truncate = (str: string, length: number = 10) => {
  if (!str) return '-'
  return str.length > length ? str.substring(0, length) + '...' : str
}

const getEdgeBps = (trade: TradeLogEntry) => {
  const edge = trade.actualNetEdgeBps ?? trade.expectedNetEdgeBps
  return edge ? edge.toFixed(2) : '-'
}

const getEdgeClass = (trade: TradeLogEntry) => {
  const edge = trade.actualNetEdgeBps ?? trade.expectedNetEdgeBps ?? 0
  if (edge > 0) return 'edge-positive'
  if (edge < 0) return 'edge-negative'
  return ''
}

const applyFilters = () => {
  const filters: any = {}
  if (localFilters.value.token) filters.token = localFilters.value.token
  if (localFilters.value.direction) filters.direction = localFilters.value.direction
  if (localFilters.value.success !== undefined) filters.success = localFilters.value.success
  if (localFilters.value.mode) filters.mode = localFilters.value.mode
  tradesStore.fetchTrades(1, pagination.value.limit, filters)
}

const changePage = (page: number) => {
  tradesStore.fetchTrades(page, pagination.value.limit, filters.value)
}

const viewTradeDetails = (trade: TradeLogEntry) => {
  selectedTrade.value = trade
}

const hasActualValues = (trade: TradeLogEntry): boolean => {
  return trade.actualGalaChainProceeds !== undefined || 
         trade.actualSolanaCost !== undefined || 
         trade.actualNetEdgeBps !== undefined
}

onMounted(async () => {
  await tradesStore.fetchTrades()
  await tradesStore.fetchStats()
})
</script>

<style scoped>
.trade-history {
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #2c3e50;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.trades-table-container {
  overflow-x: auto;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
}

.trades-table thead {
  background: #f8f9fa;
}

.trades-table th,
.trades-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.trades-table tbody tr {
  transition: background-color 0.15s;
}

.trades-table tbody tr:hover {
  background-color: #f8f9fa;
}

.timestamp-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.timestamp-date {
  font-size: 0.875rem;
  color: #2c3e50;
}

.timestamp-relative {
  font-size: 0.75rem;
  color: #7f8c8d;
}

.trades-table th {
  font-weight: 600;
  color: #2c3e50;
}

.trade-failed {
  background: #fee;
}

.direction-badge,
.mode-badge,
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.direction-badge.forward {
  background: #3498db;
  color: white;
}

.direction-badge.reverse {
  background: #9b59b6;
  color: white;
}

.mode-badge.live {
  background: #e74c3c;
  color: white;
}

.mode-badge.dry_run {
  background: #95a5a6;
  color: white;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.success {
  background: #27ae60;
  color: white;
}

.status-badge.failed {
  background: #e74c3c;
  color: white;
}

.edge-positive {
  color: #27ae60;
  font-weight: 600;
}

.edge-negative {
  color: #e74c3c;
  font-weight: 600;
}

.tx-link {
  color: #3498db;
  text-decoration: none;
  font-family: monospace;
  font-size: 0.875rem;
}

.tx-link:hover {
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.page-info {
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

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.btn-icon-view {
  color: #3498db;
}

.btn-icon-view:hover {
  background: #ebf5fb;
  color: #2980b9;
}

.btn-icon:active {
  transform: scale(0.95);
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 4px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.trade-details {
  margin-bottom: 1.5rem;
}

.detail-section {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.detail-section h4 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
}

.detail-row {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.error-text {
  color: #e74c3c;
  margin: 0.5rem 0;
}

.note-text {
  color: #7f8c8d;
  font-style: italic;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #95a5a6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>

