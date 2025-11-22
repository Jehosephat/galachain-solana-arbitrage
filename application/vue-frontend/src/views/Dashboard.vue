<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Sol Arbitrage Bot</h1>
      <p class="subtitle">Control Panel</p>
      <nav class="header-nav">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/config" class="nav-link">Configuration</router-link>
        <router-link to="/trades" class="nav-link">Trades</router-link>
        <router-link to="/pnl" class="nav-link">P&L</router-link>
        <router-link to="/balances" class="nav-link">Balances</router-link>
      </nav>
    </header>
    
    <main class="dashboard-content">
      <!-- Bot Status Bar -->
      <BotControl />

      <!-- Key Metrics -->
      <div class="metrics-section">
        <div class="metric-card">
          <div class="metric-label">Total P&L (GALA)</div>
          <div class="metric-value" :class="{ positive: totalPnL >= 0, negative: totalPnL < 0 }">
            {{ formatGala(totalPnL) }}
          </div>
          <div class="metric-detail">All time</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Trades</div>
          <div class="metric-value">{{ tradeStats?.totalTrades || 0 }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg Edge (BPS)</div>
          <div class="metric-value">{{ tradeStats?.averageEdgeBps?.toFixed(2) || '0.00' }}</div>
          <div class="metric-detail">Per trade average</div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Trades -->
        <div class="recent-trades-card">
            <div class="card-header">
              <h3>Recent Trades</h3>
              <router-link to="/trades" class="view-all-link">View All →</router-link>
            </div>
            <div v-if="recentTradesLoading" class="loading">Loading recent trades...</div>
            <div v-else-if="recentTrades.length === 0" class="empty-state">
              No trades yet
            </div>
            <div v-else class="recent-trades-list">
              <div 
                v-for="trade in recentTrades" 
                :key="trade.timestamp"
                class="recent-trade-item"
                :class="{ 'trade-failed': !trade.success }"
              >
                <div class="trade-main">
                  <div class="trade-token">{{ trade.token }}</div>
                  <div class="trade-direction">
                    <span :class="['direction-badge', trade.direction]">
                      {{ trade.direction || '-' }}
                    </span>
                  </div>
                </div>
                <div class="trade-details">
                  <div class="trade-edge" :class="getEdgeClass(trade)">
                    {{ getEdgeBps(trade) }} BPS
                  </div>
                  <div class="trade-status">
                    <span :class="['status-badge', trade.success ? 'success' : 'failed']">
                      {{ trade.success ? '✓' : '✗' }}
                    </span>
                  </div>
                  <div class="trade-time">{{ formatTime(trade.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        <ConsolePane />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import BotControl from '../components/dashboard/BotControl.vue'
import ConsolePane from '../components/dashboard/ConsolePane.vue'
import { useTradesStore, TradeLogEntry } from '../stores/trades'
import { usePnLStore } from '../stores/pnl'

const tradesStore = useTradesStore()
const pnlStore = usePnLStore()

const { trades, stats: tradeStats, loading: tradesLoading } = storeToRefs(tradesStore)
const { breakdown, loading: pnlLoading } = storeToRefs(pnlStore)

const recentTradesLoading = computed(() => tradesLoading.value)

const recentTrades = computed(() => {
  return trades.value.slice(0, 5) // Show last 5 trades
})

const totalPnL = computed(() => {
  if (!breakdown.value?.summary) return 0
  return breakdown.value.summary.netActualEdge ?? breakdown.value.summary.netExpectedEdge ?? 0
})

const formatGala = (value: number): string => {
  if (value === 0) return '0.0000'
  if (Math.abs(value) < 0.0001) return value.toExponential(2)
  return value >= 0 ? `+${value.toFixed(4)}` : value.toFixed(4)
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

onMounted(async () => {
  // Fetch initial data
  await Promise.all([
    tradesStore.fetchTrades(1, 5), // Just get 5 most recent
    tradesStore.fetchStats(),
    pnlStore.fetchBreakdown()
  ])
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.dashboard-header {
  background: white;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #2c3e50;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #7f8c8d;
  font-size: 1rem;
}

.header-nav {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #7f8c8d;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.nav-link.router-link-active {
  background: #3498db;
  color: white;
}

.dashboard-content {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3498db;
}

.metric-label {
  font-size: 0.875rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.metric-value.positive {
  color: #27ae60;
}

.metric-value.negative {
  color: #e74c3c;
}

.metric-detail {
  font-size: 0.875rem;
  color: #7f8c8d;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.recent-trades-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.view-all-link {
  color: #3498db;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

.recent-trades-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recent-trade-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #3498db;
  transition: all 0.2s;
}

.recent-trade-item:hover {
  background: #f0f0f0;
  transform: translateX(2px);
}

.recent-trade-item.trade-failed {
  border-left-color: #e74c3c;
  background: #fee;
}

.trade-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.trade-token {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
}

.trade-details {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.875rem;
}

.trade-edge {
  font-weight: 600;
}

.edge-positive {
  color: #27ae60;
}

.edge-negative {
  color: #e74c3c;
}

.direction-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
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

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.success {
  background: #27ae60;
  color: white;
}

.status-badge.failed {
  background: #e74c3c;
  color: white;
}

.trade-time {
  color: #7f8c8d;
  margin-left: auto;
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
  font-style: italic;
}
</style>

