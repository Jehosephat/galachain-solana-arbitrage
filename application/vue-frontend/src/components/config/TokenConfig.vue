<template>
  <div class="token-config">
    <div class="header-actions">
      <h2>Token Configuration</h2>
      <button @click="showAddForm = true" class="btn btn-primary">
        + Add Token
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && tokens.length === 0" class="loading">
      Loading tokens...
    </div>

    <div v-else-if="tokens.length === 0" class="empty-state">
      No tokens found. Click "Add Token" to add your first token.
    </div>

    <div v-else class="tokens-table">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Enabled</th>
            <th>Trade Size</th>
            <th>Inventory Target</th>
            <th>Decimals</th>
            <th>GalaChain Mint</th>
            <th>Solana Mint</th>
            <th>Quote (GC/SOL)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="token in tokens" :key="token.symbol" :class="{ 'quote-token': !token.enabled && token.tradeSize === 0 }">
            <td>
              <strong>{{ token.symbol }}</strong>
              <span v-if="!token.enabled && token.tradeSize === 0" class="quote-badge">Quote</span>
            </td>
            <td>
              <input 
                type="checkbox" 
                :checked="token.enabled"
                @change="toggleToken(token.symbol, $event)"
                :disabled="!token.enabled && token.tradeSize === 0"
              />
            </td>
            <td>{{ token.tradeSize }}</td>
            <td>{{ token.inventoryTarget || '-' }}</td>
            <td>{{ token.decimals }}</td>
            <td class="mint-address">{{ truncate(token.galaChainMint) }}</td>
            <td class="mint-address">{{ truncate(token.solanaMint) }}</td>
            <td>{{ token.gcQuoteVia || '-' }} / {{ token.solQuoteVia || '-' }}</td>
            <td>
              <div class="action-buttons">
                <button 
                  @click="editToken(token)" 
                  class="btn-icon btn-icon-edit"
                  title="Edit token"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button 
                  v-if="token.enabled || token.tradeSize > 0"
                  @click="confirmDelete(token.symbol)" 
                  class="btn-icon btn-icon-delete"
                  title="Delete token"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || editingToken" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingToken ? 'Edit Token' : 'Add Token' }}</h3>
        <form @submit.prevent="saveToken">
          <div class="form-group">
            <label>Symbol *</label>
            <input 
              v-model="formData.symbol" 
              type="text" 
              required
              :disabled="!!editingToken"
              placeholder="e.g., MEW"
            />
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="formData.enabled" />
              Enabled
            </label>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Trade Size *</label>
              <input 
                v-model.number="formData.tradeSize" 
                type="number" 
                step="0.01"
                required
                placeholder="1500"
              />
              <small>Amount to trade per execution</small>
            </div>

            <div class="form-group">
              <label>Inventory Target</label>
              <input 
                v-model.number="formData.inventoryTarget" 
                type="number" 
                step="0.01"
                min="0"
                placeholder="Optional"
              />
              <small>Total tokens desired across both chains</small>
            </div>
          </div>

          <div class="form-group">
            <label>Decimals *</label>
            <input 
              v-model.number="formData.decimals" 
              type="number" 
              required
              placeholder="5"
            />
          </div>

          <div class="form-group">
            <label>GalaChain Mint *</label>
            <input 
              v-model="formData.galaChainMint" 
              type="text" 
              required
              placeholder="GMEW|Unit|none|none"
            />
          </div>

          <div class="form-group">
            <label>Solana Mint *</label>
            <input 
              v-model="formData.solanaMint" 
              type="text" 
              required
              placeholder="MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5"
            />
          </div>

          <div class="form-group">
            <label>Solana Symbol</label>
            <input 
              v-model="formData.solanaSymbol" 
              type="text" 
              placeholder="MEW"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>GalaChain Quote Via</label>
              <input 
                v-model="formData.gcQuoteVia" 
                type="text" 
                placeholder="GALA"
              />
            </div>

            <div class="form-group">
              <label>Solana Quote Via</label>
              <input 
                v-model="formData.solQuoteVia" 
                type="text" 
                placeholder="GALA"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore, TokenConfig } from '../../stores/config'

const configStore = useConfigStore()
const { tokens, loading, error } = storeToRefs(configStore)

const showAddForm = ref(false)
const editingToken = ref<TokenConfig | null>(null)

const formData = ref<Partial<TokenConfig>>({
  symbol: '',
  enabled: true,
  tradeSize: 0,
  decimals: 6,
  galaChainMint: '',
  solanaMint: '',
  solanaSymbol: '',
  gcQuoteVia: '',
  solQuoteVia: '',
  inventoryTarget: undefined
})

const truncate = (str: string, length: number = 20) => {
  if (!str) return '-'
  return str.length > length ? str.substring(0, length) + '...' : str
}

const toggleToken = async (symbol: string, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  try {
    await configStore.updateToken(symbol, { enabled: checked })
  } catch (e) {
    // Error is handled by store
  }
}

const editToken = (token: TokenConfig) => {
  editingToken.value = token
  formData.value = { ...token }
  showAddForm.value = true
}

const confirmDelete = async (symbol: string) => {
  if (confirm(`Are you sure you want to delete token ${symbol}?`)) {
    try {
      await configStore.deleteToken(symbol)
    } catch (e) {
      // Error is handled by store
    }
  }
}

const saveToken = async () => {
  try {
    if (editingToken.value) {
      await configStore.updateToken(editingToken.value.symbol, formData.value)
    } else {
      await configStore.addToken(formData.value as TokenConfig)
    }
    closeModal()
  } catch (e) {
    // Error is handled by store
  }
}

const closeModal = () => {
  showAddForm.value = false
  editingToken.value = null
  formData.value = {
    symbol: '',
    enabled: true,
    tradeSize: 0,
    decimals: 6,
    galaChainMint: '',
    solanaMint: '',
    solanaSymbol: '',
    gcQuoteVia: '',
    solQuoteVia: '',
    inventoryTarget: undefined
  }
}

onMounted(async () => {
  try {
    await configStore.fetchTokens()
  } catch (e) {
    console.error('Failed to fetch tokens:', e)
  }
})
</script>

<style scoped>
.token-config {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.tokens-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  font-weight: 600;
  color: #2c3e50;
}

tr.quote-token {
  background: #f8f9fa;
  opacity: 0.8;
}

.quote-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  background: #95a5a6;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
}

.mint-address {
  font-family: monospace;
  font-size: 0.875rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
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

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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

.btn-icon-edit {
  color: #3498db;
}

.btn-icon-edit:hover {
  background: #ebf5fb;
  color: #2980b9;
}

.btn-icon-delete {
  color: #e74c3c;
}

.btn-icon-delete:hover {
  background: #fde8e8;
  color: #c0392b;
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

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #7f8c8d;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}
</style>

