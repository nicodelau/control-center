<template>
  <div class="expenses-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <span class="sub-heading">Egresos Corrientes</span>
        <h1 class="main-title">Control de Gastos</h1>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="split-layout">
      <!-- Left column: Load Gasto and Chart -->
      <div class="left-panel">
        
        <!-- 1. Load Gasto Form -->
        <div class="premium-card form-card">
          <h2 class="panel-title">Cargar Nuevo Gasto</h2>
          <form @submit.prevent="submitExpense" class="expense-form">
            <div class="form-row">
              <div class="form-group">
                <label for="exp-cat">Categoría *</label>
                <select id="exp-cat" v-model="form.category" required class="premium-input select-bold">
                  <option value="Alquiler">Alquiler</option>
                  <option value="Servicios">Servicios (Luz, Agua, Gas, Net)</option>
                  <option value="Sueldos">Sueldos / Personal</option>
                  <option value="Impuestos">Impuestos / AFIP</option>
                  <option value="Proveedores">Proveedores</option>
                  <option value="Varios">Gastos Varios</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="exp-amount">Importe *</label>
                <input 
                  id="exp-amount" 
                  type="number" 
                  v-model.number="form.amount" 
                  step="0.01" 
                  min="0.01" 
                  required 
                  class="premium-input font-mono"
                  placeholder="Ej: 5000"
                />
              </div>

              <div class="form-group">
                <label for="exp-curr">Moneda *</label>
                <select id="exp-curr" v-model="form.currency" required class="premium-input">
                  <option value="PESOS">Pesos ($)</option>
                  <option value="USD">Dólares (u$s)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="exp-method">Método de Pago *</label>
              <select id="exp-method" v-model="form.paymentMethod" required class="premium-input">
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia Bancaria</option>
                <option value="CARD">Tarjeta de Débito/Crédito</option>
              </select>
            </div>

            <div class="form-group">
              <label for="exp-desc">Detalle / Concepto *</label>
              <input 
                id="exp-desc" 
                type="text" 
                v-model="form.description" 
                required 
                placeholder="Ej: Pago de luz vencimiento mayo..." 
                class="premium-input"
              />
            </div>

            <button type="submit" class="btn btn-danger submit-btn" :disabled="submitting">
              <PlusIcon :size="18" />
              {{ submitting ? 'Guardando...' : 'Registrar Gasto' }}
            </button>
          </form>
        </div>

        <!-- 2. Expenses Distribution Donut SVG Chart -->
        <div class="premium-card chart-card">
          <h2 class="panel-title">Distribución de Gastos</h2>
          <span class="panel-sub">Consolidado en Pesos (USD estimado a $1000)</span>
          
          <div class="chart-content">
            <!-- Donut SVG -->
            <div class="svg-container" v-if="hasExpenses">
              <svg viewBox="0 0 160 160" width="100%" height="100%" class="donut-svg">
                <!-- Outer track -->
                <circle cx="80" cy="80" r="55" fill="none" stroke="var(--floral-white)" stroke-width="12" />

                <!-- Category Segments -->
                <circle 
                  v-for="(seg, idx) in chartSegments" 
                  :key="`seg-${idx}`"
                  cx="80" 
                  cy="80" 
                  r="55" 
                  fill="none" 
                  :stroke="seg.color" 
                  stroke-width="14" 
                  :stroke-dasharray="`${seg.strokeLength} 345.5`" 
                  :stroke-dashoffset="seg.strokeOffset"
                  transform="rotate(-90 80 80)"
                  class="donut-segment"
                />

                <!-- Inner circle text -->
                <circle cx="80" cy="80" r="40" fill="var(--white)" />
                <text x="80" y="78" class="donut-text title">Gastos</text>
                <text x="80" y="94" class="donut-text total">${{ formatNumberShort(totalExpensesPesosEq) }}</text>
              </svg>
            </div>

            <div v-else class="no-chart-data text-muted">
              <span>Carga gastos para ver la distribución.</span>
            </div>

            <!-- Legends list -->
            <div class="chart-legends">
              <div 
                v-for="item in distributionData" 
                :key="item.category"
                class="legend-row"
              >
                <div class="legend-lbl">
                  <span class="legend-color-dot" :style="{ backgroundColor: item.color }"></span>
                  <span class="legend-name">{{ item.category }}</span>
                </div>
                <div class="legend-val font-mono">
                  ${{ formatNumber(item.total) }} <span class="pct">({{ item.pct }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Right column: Detailed Historical Expenses Log -->
      <div class="premium-card log-panel">
        <h2 class="panel-title">Historial de Egresos</h2>
        <span class="panel-sub">Listado cronológico de egresos registrados</span>

        <div class="search-box mb-4 mt-2">
          <SearchIcon :size="16" class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Filtrar egresos..." 
            class="search-input"
          />
        </div>

        <div class="log-table-wrapper">
          <table class="premium-table">
            <thead>
              <tr>
                <th @click="sortBy('date')" class="sortable-header">
                  Fecha
                  <span v-if="sortKey === 'date'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('description')" class="sortable-header">
                  Concepto / Detalle
                  <span v-if="sortKey === 'description'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('category')" class="sortable-header">
                  Categoría
                  <span v-if="sortKey === 'category'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('paymentMethod')" class="sortable-header">
                  Método
                  <span v-if="sortKey === 'paymentMethod'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('amount')" class="sortable-header text-right">
                  Importe
                  <span v-if="sortKey === 'amount'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!expenses || filteredExpenses.length === 0">
                <td colspan="6" class="text-center text-muted py-8">
                  No se encontraron egresos.
                </td>
              </tr>
              <tr v-for="exp in filteredExpenses" :key="exp.id">
                <td class="date-cell">{{ formatDate(exp.date) }}</td>
                <td>
                  <div class="exp-concept">
                    <span class="desc">{{ exp.description }}</span>
                  </div>
                </td>
                <td>
                  <span class="cat-pill" :style="{ borderColor: getCategoryColor(exp.category), backgroundColor: getCategoryBg(exp.category), color: getCategoryColor(exp.category) }">
                    {{ exp.category }}
                  </span>
                </td>
                <td class="font-bold text-secondary">{{ exp.paymentMethod }}</td>
                <td class="text-right font-mono font-bold" :class="exp.currency === 'USD' ? 'text-primary' : 'text-danger'">
                  {{ exp.currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(exp.amount) }}
                </td>
                <td class="text-center">
                  <button class="delete-btn" @click="deleteExpense(exp.id)" title="Eliminar gasto">
                    <TrashIcon :size="15" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFetch } from '#app'
import { Plus as PlusIcon, Trash as TrashIcon, Search as SearchIcon } from 'lucide-vue-next'

const { data: expenses, refresh } = await useFetch('/api/gastos')

const searchQuery = ref('')
const sortKey = ref('date')
const sortAsc = ref(false)

function sortBy(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

function levenshteinDistance(a, b) {
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function fuzzyMatch(text, query, threshold = 0.85) {
  if (!query) return true
  if (!text) return false
  
  const textClean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const queryClean = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  
  if (textClean.includes(queryClean)) return true
  
  const queryWords = queryClean.split(/\s+/).filter(Boolean)
  const textWords = textClean.split(/\s+/).filter(Boolean)
  
  return queryWords.every(qWord => {
    return textWords.some(tWord => {
      if (tWord.includes(qWord) || qWord.includes(tWord)) return true
      
      const dist = levenshteinDistance(qWord, tWord)
      const maxLen = Math.max(qWord.length, tWord.length)
      if (maxLen === 0) return true
      return (1 - dist / maxLen) >= threshold
    })
  })
}

const filteredExpenses = computed(() => {
  if (!expenses.value) return []
  const filtered = expenses.value.filter(exp => {
    const query = searchQuery.value.trim()
    const matchesSearch = !query ||
      fuzzyMatch(formatDate(exp.date), query) ||
      fuzzyMatch(exp.description, query) ||
      fuzzyMatch(exp.category, query) ||
      fuzzyMatch(exp.paymentMethod, query) ||
      fuzzyMatch(exp.amount?.toString(), query) ||
      fuzzyMatch(exp.currency, query)
      
    return matchesSearch
  })

  return filtered.sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]

    if (valA && typeof valA === 'object' && valA.toString) valA = parseFloat(valA.toString()) || 0
    if (valB && typeof valB === 'object' && valB.toString) valB = parseFloat(valB.toString()) || 0

    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return sortAsc.value ? -1 : 1
    if (valA > valB) return sortAsc.value ? 1 : -1
    return 0
  })
})

// Form state
const submitting = ref(false)
const form = ref({
  category: 'Varios',
  amount: null,
  currency: 'PESOS',
  paymentMethod: 'CASH',
  description: ''
})

const categoryColors = {
  'Alquiler': '#d9534f',      // Red
  'Servicios': '#537fe7',     // Blue
  'Sueldos': '#699361',      // Sage Green
  'Impuestos': '#e8ae1f',     // Amber
  'Proveedores': '#9a73ec',   // Purple
  'Varios': '#8e897d'         // Charcoal
}

function getCategoryColor(cat) {
  return categoryColors[cat] || '#8e897d'
}

function getCategoryBg(cat) {
  const hex = getCategoryColor(cat)
  return hex + '15' // 8% opacity background
}

// Formatters
function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatNumberShort(val) {
  if (val === undefined || val === null) return '0'
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
  if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
  return Math.round(val).toString()
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Math for Donut Chart
const hasExpenses = computed(() => {
  return expenses.value && expenses.value.length > 0
})

const totalExpensesPesosEq = computed(() => {
  if (!expenses.value) return 0
  return expenses.value.reduce((sum, e) => {
    const val = Number(e.amount)
    return sum + (e.currency === 'USD' ? val * 1000 : val)
  }, 0)
})

const distributionData = computed(() => {
  if (!expenses.value) return []
  
  // Group by category
  const groups = {}
  expenses.value.forEach(e => {
    const val = Number(e.amount)
    const valPesos = e.currency === 'USD' ? val * 1000 : val
    groups[e.category] = (groups[e.category] || 0) + valPesos
  })

  const total = totalExpensesPesosEq.value || 1

  return Object.keys(groups).map(cat => {
    const sum = groups[cat]
    const pct = Math.round((sum / total) * 100)
    return {
      category: cat,
      total: sum,
      pct,
      color: getCategoryColor(cat)
    }
  }).sort((a, b) => b.total - a.total)
})

// Calculate SVG stroke parameters for donut ring
const chartSegments = computed(() => {
  const data = distributionData.value
  const totalCircumference = 2 * Math.PI * 55 // r=55 -> C = 345.57

  let runningPercent = 0
  return data.map(item => {
    // Length is based on percentages
    const strokeLength = (item.pct / 100) * totalCircumference
    // Offset represents where the segment starts (relative to top rotate)
    const strokeOffset = -(runningPercent / 100) * totalCircumference
    runningPercent += item.pct

    return {
      color: item.color,
      strokeLength: strokeLength.toFixed(1),
      strokeOffset: strokeOffset.toFixed(1)
    }
  })
})

// Submit Expense
async function submitExpense() {
  submitting.value = true
  
  try {
    await $fetch('/api/gastos', {
      method: 'POST',
      body: form.value
    })
    
    // reset form
    form.value.description = ''
    form.value.amount = null
    
    await refresh()
  } catch (err) {
    alert("Error al cargar el gasto: " + err.message)
  } finally {
    submitting.value = false
  }
}

// Delete Expense
async function deleteExpense(id) {
  if (!confirm("¿Está seguro de que desea eliminar este gasto del historial?")) return
  
  try {
    await $fetch('/api/gastos', {
      method: 'DELETE',
      body: { id }
    })
    await refresh()
  } catch (err) {
    alert("Error al eliminar el gasto: " + err.message)
  }
}
</script>

<style scoped>
.expenses-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.page-header {
  margin-bottom: 8px;
}

.sub-heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.main-title {
  font-size: 2.2rem;
  font-family: var(--font-family-title);
  color: var(--text-primary);
  font-weight: 800;
}

/* Split layout */
.split-layout {
  display: grid;
  grid-template-columns: 1.10fr 1.90fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 992px) {
  .split-layout {
    grid-template-columns: 1fr;
  }
}

.panel-title {
  font-size: 1.15rem;
  font-family: var(--font-family-title);
  font-weight: 700;
  color: var(--text-primary);
}

.panel-sub {
  font-size: 0.82rem;
  color: var(--text-muted);
  display: block;
  margin-bottom: 16px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Expense Form */
.expense-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row > .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.select-bold {
  font-weight: 600;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
  margin-top: 6px;
}

/* Donut Chart styles */
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
}

.svg-container {
  width: 140px;
  height: 140px;
  position: relative;
}

.donut-svg {
  display: block;
}

.donut-segment {
  transition: stroke-width 0.2s ease, stroke 0.2s ease;
}

.donut-segment:hover {
  stroke-width: 16px;
}

.donut-text {
  text-anchor: middle;
  fill: var(--text-primary);
  font-family: var(--font-family-sans);
}

.donut-text.title {
  font-size: 10px;
  fill: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
}

.donut-text.total {
  font-size: 15px;
  font-weight: 800;
  font-family: var(--font-family-title);
  fill: var(--text-primary);
}

.no-chart-data {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.88rem;
}

/* Legends */
.chart-legends {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px dashed var(--border-color);
  padding-top: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border-radius: 10px;
  border: 1px solid var(--soft-fawn);
  background-color: var(--white);
  color: var(--text-primary);
  font-family: var(--font-family-sans);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--amber-honey);
  box-shadow: 0 0 0 3px rgba(232, 174, 31, 0.15);
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}
.sortable-header:hover {
  background-color: rgba(233, 215, 155, 0.3) !important;
}
.sort-placeholder {
  opacity: 0.25;
  margin-left: 4px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mt-2 {
  margin-top: 8px;
}

.legend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
}

.legend-lbl {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-name {
  font-weight: 600;
  color: var(--text-secondary);
}

.legend-val {
  font-weight: 700;
  color: var(--text-primary);
}

.legend-val .pct {
  color: var(--text-muted);
  font-weight: 600;
}

/* Right Panel log table */
.log-panel {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-height: 500px;
}

.log-table-wrapper {
  flex-grow: 1;
  overflow-x: auto;
}

.date-cell {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.exp-concept .desc {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.cat-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.75rem;
  font-weight: 700;
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-mono { font-family: monospace, Courier, monospace; }
.font-bold { font-weight: 700; }
.text-danger { color: var(--color-danger); }

.delete-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  margin: 0 auto;
}

.delete-btn:hover {
  color: var(--color-danger);
  background-color: rgba(217, 83, 79, 0.15);
}
</style>
