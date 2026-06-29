<template>
  <div class="price-list-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <span class="sub-heading">Gestión Comercial</span>
        <h1 class="main-title">Lista de Precios</h1>
      </div>
    </div>

    <div class="split-layout">
      <!-- Left side: Bulk pricing modifier form -->
      <div class="premium-card control-panel glass">
        <h2 class="panel-title">Actualización Masiva de Precios</h2>
        <p class="panel-desc">
          Ajusta los precios de tus productos de forma masiva en base a un porcentaje. Ideal para actualizaciones rápidas.
        </p>

        <form @submit.prevent="applyBulkAdjustment" class="bulk-form">
          <div class="form-group">
            <label for="bulk-category">Filtrar por Categoría:</label>
            <select id="bulk-category" v-model="bulkForm.category" class="premium-input">
              <option value="ALL">Todas las Categorías</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="bulk-target">Precios a Modificar:</label>
            <select id="bulk-target" v-model="bulkForm.target" class="premium-input">
              <option value="both">Ambos (Lista y Efectivo)</option>
              <option value="price">Solo Precio Lista</option>
              <option value="cashPrice">Solo Precio Efectivo</option>
            </select>
          </div>

          <div class="form-group">
            <label for="bulk-percentage">Porcentaje de Ajuste (%):</label>
            <div class="percentage-input-wrapper">
              <input 
                id="bulk-percentage" 
                type="number" 
                v-model.number="bulkForm.percentage" 
                step="0.1" 
                required
                placeholder="Ej: 10, -5" 
                class="premium-input font-mono percentage-input"
              />
              <span class="percentage-symbol">%</span>
            </div>
            <span class="input-helper">Coloca números positivos para aumentar o negativos para rebajar.</span>
          </div>

          <!-- Quick presets buttons -->
          <div class="presets-container">
            <span class="presets-label">Atajos:</span>
            <div class="presets-buttons">
              <button type="button" class="preset-btn" @click="setPercentage(5)">+5%</button>
              <button type="button" class="preset-btn" @click="setPercentage(10)">+10%</button>
              <button type="button" class="preset-btn" @click="setPercentage(15)">+15%</button>
              <button type="button" class="preset-btn" @click="setPercentage(20)">+20%</button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary submit-btn" 
            :disabled="submitting || !products || products.length === 0"
          >
            <TrendingUpIcon :size="18" />
            {{ submitting ? 'Actualizando...' : 'Aplicar Aumento' }}
          </button>
        </form>

        <!-- Success Toast indicator -->
        <div v-if="successToast.show" class="toast-indicator bg-success-light text-success animate-fade-in">
          <span>✔️ ¡Se actualizaron <strong>{{ successToast.count }}</strong> productos con éxito!</span>
        </div>
      </div>

      <!-- Right side: Live prices grid -->
      <div class="premium-card grid-panel">
        <h2 class="panel-title">Grilla de Precios de Referencia</h2>
        <div class="grid-header">
          <div class="search-box">
            <SearchIcon :size="16" class="search-icon" />
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Filtrar referencias rápidas..." 
              class="search-input"
            />
          </div>
          <div class="export-actions">
            <button class="btn btn-secondary btn-sm" @click="exportToCSV" title="Exportar a Excel (CSV)" :disabled="!products || products.length === 0">
              <DownloadIcon :size="16" />
              Exportar CSV
            </button>
            <button class="btn btn-primary btn-sm" @click="openPrintModal" title="Imprimir o Guardar en PDF" :disabled="!products || products.length === 0">
              <PrinterIcon :size="16" />
              Vista de Cliente / PDF
            </button>
          </div>
        </div>

        <div class="pricing-table-wrapper">
          <table class="pricing-table">
            <thead>
              <tr>
                <th @click="sortBy('name')" class="sortable-header">
                  Producto
                  <span v-if="sortKey === 'name'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('category')" class="sortable-header">
                  Categoría
                  <span v-if="sortKey === 'category'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('cost')" class="sortable-header text-right">
                  Costo
                  <span v-if="sortKey === 'cost'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('price')" class="sortable-header text-right text-honey">
                  Precio Lista
                  <span v-if="sortKey === 'price'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('cashPrice')" class="sortable-header text-right text-success">
                  Precio Efec
                  <span v-if="sortKey === 'cashPrice'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
                <th @click="sortBy('margin')" class="sortable-header text-right">
                  Margen (Lista)
                  <span v-if="sortKey === 'margin'">{{ sortAsc ? '▲' : '▼' }}</span>
                  <span v-else class="sort-placeholder">↕</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!products || filteredProducts.length === 0">
                <td colspan="6" class="text-center text-muted py-8">
                  No hay productos registrados.
                </td>
              </tr>
              <tr v-for="prod in filteredProducts" :key="prod.id">
                <td>
                  <div class="prod-desc">
                    <span class="name">{{ prod.name }}</span>
                    <span class="sub">{{ prod.brand ? prod.brand : 'Sin Marca' }} · {{ prod.weight ? prod.weight : '' }}</span>
                  </div>
                </td>
                <td><span class="cat">{{ prod.category }}</span></td>
                <td class="text-right font-mono">${{ formatNumber(prod.cost) }}</td>
                <td class="text-right font-mono font-bold text-honey">${{ formatNumber(prod.price) }}</td>
                <td class="text-right font-mono font-bold text-success">${{ formatNumber(prod.cashPrice) }}</td>
                <td class="text-right font-mono">
                  <span 
                    class="margin-badge"
                    :class="calculateMargin(prod) < 20 ? 'low' : 'ok'"
                  >
                    {{ calculateMargin(prod) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Printable Customer Price List Catalog Modal -->
    <div class="modal-overlay print-modal-overlay" v-if="isPrintModalOpen" @click.self="closePrintModal">
      <div class="modal-box print-modal-box premium-card animate-fade-in">
        <div class="modal-header no-print">
          <h2 class="modal-title">Catálogo Oficial de Precios</h2>
          <div class="modal-actions-header">
            <button class="btn btn-success" @click="triggerPrint">
              <PrinterIcon :size="18" />
              Imprimir / Guardar PDF
            </button>
            <button class="modal-close-btn" @click="closePrintModal">
              <XIcon :size="20" />
            </button>
          </div>
        </div>

        <!-- The Printable Page Container -->
        <div class="printable-document" id="print-area">
          <!-- Letterhead Header -->
          <div class="letterhead-container">
            <div class="letterhead-logo">
              <img :src="logoUrl" class="catalog-logo-img" alt="Dulce Victoria" />
              <div class="brand-text">
                <h1>Dulce Victoria</h1>
                <p class="brand-subtitle">Distribución & Venta Mayorista</p>
              </div>
            </div>
            <div class="letterhead-info text-right">
              <p class="tel">Contacto: <strong>11 3804-9152</strong></p>
              <p class="loc">Ubicación: Gaspar Campos 4055</p>
              <p class="date">Fecha de Emisión: <strong>{{ formattedToday }}</strong></p>
            </div>
          </div>

          <!-- Catalog pricing warning -->
          <div class="catalog-disclaimer">
            <p>
              ⚠️ <strong>Precios sujetos a variación sin previo aviso.</strong> 
              El Precio Lista corresponde a compras a crédito/tarjetas. 
              El **Precio Efectivo** aplica de manera directa para pagos al contado en efectivo o transferencia bancaria en el acto.
            </p>
          </div>

          <!-- Printable Categories & Products -->
          <div 
            v-for="catGroup in productsByCategory" 
            :key="catGroup.category" 
            class="catalog-category-section"
          >
            <h3 class="catalog-category-title">{{ catGroup.category }}</h3>
            
            <table class="catalog-table">
              <thead>
                <tr>
                  <th>Descripción del Producto</th>
                  <th>Marca</th>
                  <th>Peso/Envase</th>
                  <th class="text-right">Precio Lista</th>
                  <th class="text-right">Precio Efectivo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prod in catGroup.items" :key="prod.id">
                  <td class="font-bold font-title-table">{{ prod.name }}</td>
                  <td>{{ prod.brand || '-' }}</td>
                  <td class="font-bold">{{ prod.weight || '-' }}</td>
                  <td class="text-right font-mono font-bold">${{ formatNumber(prod.price) }}</td>
                  <td class="text-right font-mono font-bold text-success-print">${{ formatNumber(prod.cashPrice) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Catalog Footer -->
          <div class="catalog-footer">
            <p>¡Gracias por confiar en Dulce Victoria para abastecer tu comercio!</p>
            <p class="catalog-footer-sub">Documento oficial de referencia comercial. Impreso en el Control Center.</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import logoUrl from '~/assets/dulce victoria.jpeg'
import { ref, computed } from 'vue'
import { useFetch } from '#app'
import { 
  TrendingUp as TrendingUpIcon, 
  Search as SearchIcon,
  Download as DownloadIcon,
  Printer as PrinterIcon,
  X as XIcon
} from 'lucide-vue-next'

const { data: products, refresh } = await useFetch('/api/productos')

// State
const searchQuery = ref('')
const submitting = ref(false)
const isPrintModalOpen = ref(false)

const bulkForm = ref({
  category: 'ALL',
  target: 'both',
  percentage: 10
})

const successToast = ref({
  show: false,
  count: 0
})

// Current Date for Printable list
const formattedToday = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
})

// Dynamic categories list
const categories = computed(() => {
  if (!products.value) return []
  const cats = products.value.map(p => (p.category ? p.category.trim() : 'General') || 'General')
  return [...new Set(cats)].sort()
})

// Group active products by category for printable list
const productsByCategory = computed(() => {
  if (!products.value) return []
  
  // Filter active only to show clients!
  const activeProds = products.value.filter(p => p.active)
  
  const groups = {}
  activeProds.forEach(p => {
    const cat = (p.category ? p.category.trim() : 'General') || 'General'
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(p)
  })
  
  return Object.keys(groups).sort().map(cat => ({
    category: cat,
    items: groups[cat].sort((a, b) => a.name.localeCompare(b.name))
  }))
})

const sortKey = ref('name')
const sortAsc = ref(true)

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

function calculateMargin(prod) {
  const cost = Number(prod.cost)
  const price = Number(prod.price)
  if (!cost || cost <= 0) return 100
  const margin = ((price - cost) / cost) * 100
  return Math.round(margin)
}

// Filtered products list (for internal workspace table)
const filteredProducts = computed(() => {
  if (!products.value) return []
  const filtered = products.value.filter(p => {
    const query = searchQuery.value.trim()
    const matchesSearch = !query || 
      fuzzyMatch(p.name, query) ||
      fuzzyMatch(p.code, query) ||
      fuzzyMatch(p.brand, query) ||
      fuzzyMatch(p.category, query) ||
      fuzzyMatch(p.cost?.toString(), query) ||
      fuzzyMatch(p.price?.toString(), query) ||
      fuzzyMatch(p.cashPrice?.toString(), query) ||
      fuzzyMatch(calculateMargin(p).toString(), query)
      
    return matchesSearch
  })

  // Sort
  return filtered.sort((a, b) => {
    let valA = sortKey.value === 'margin' ? calculateMargin(a) : a[sortKey.value]
    let valB = sortKey.value === 'margin' ? calculateMargin(b) : b[sortKey.value]

    if (valA && typeof valA === 'object' && valA.toString) valA = parseFloat(valA.toString()) || 0
    if (valB && typeof valB === 'object' && valB.toString) valB = parseFloat(valB.toString()) || 0

    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return sortAsc.value ? -1 : 1
    if (valA > valB) return sortAsc.value ? 1 : -1
    return 0
  })
})

function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function setPercentage(val) {
  bulkForm.value.percentage = val
}

// Submit bulk adjustment
async function applyBulkAdjustment() {
  submitting.value = true
  successToast.value.show = false
  
  try {
    const res = await $fetch('/api/productos', {
      method: 'PUT',
      body: {
        bulkAction: 'adjust_prices',
        category: bulkForm.value.category === 'ALL' ? undefined : bulkForm.value.category,
        target: bulkForm.value.target,
        percentage: bulkForm.value.percentage
      }
    })

    if (res && res.success) {
      await refresh()
      successToast.value.count = res.count
      successToast.value.show = true
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        successToast.value.show = false
      }, 5000)
    }
  } catch (err) {
    alert("Error al aplicar aumentos masivos: " + err.message)
  } finally {
    submitting.value = false
  }
}

// Print overlay handlers
function openPrintModal() {
  isPrintModalOpen.value = true
}

function closePrintModal() {
  isPrintModalOpen.value = false
}

function triggerPrint() {
  if (typeof window !== 'undefined') {
    // Guardamos el título original de la pestaña
    const originalTitle = document.title
    
    // Generamos la fecha formateada
    const d = new Date()
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const formattedDate = `${day}-${month}-${year}`
    
    // Cambiamos temporalmente el título para que el navegador nombre al PDF de esta forma
    document.title = `Dulce victoria - Lista de Precios - ${formattedDate}`
    
    // Disparamos la impresión
    window.print()
    
    // Restauramos el título original inmediatamente después
    setTimeout(() => {
      document.title = originalTitle
    }, 150)
  }
}

// CSV Export logic
function exportToCSV() {
  if (!products.value || products.value.length === 0) return

  // CSV headers (separated by categories)
  const headers = ['Categoría', 'Producto', 'Marca', 'Peso/Envase', 'Precio Lista ($)', 'Precio Efectivo ($)']
  const activeProds = products.value.filter(p => p.active)
  
  // Sort by category first, then by name
  const sortedProds = [...activeProds].sort((a, b) => {
    const catComp = a.category.localeCompare(b.category)
    if (catComp !== 0) return catComp
    return a.name.localeCompare(b.name)
  })

  const rows = sortedProds.map(p => [
    p.category,
    p.name,
    p.brand || '',
    p.weight || '',
    Number(p.price).toFixed(2),
    Number(p.cashPrice).toFixed(2)
  ])

  // Generate CSV data string with Semicolon (Spanish Excel standard) and UTF-8 BOM
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
    + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const formattedDate = `${day}-${month}-${year}` // Usamos guiones ya que la barra '/' es un caracter reservado del sistema operativo (separador de carpetas)
  link.setAttribute("download", `Dulce victoria - Lista de Precios - ${formattedDate}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>


<style scoped>
.price-list-page {
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

/* Split Layout */
.split-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 992px) {
  .split-layout {
    grid-template-columns: 1fr;
  }
}

.panel-title {
  font-size: 1.2rem;
  font-family: var(--font-family-title);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.panel-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
}

/* Bulk Form panel */
.control-panel {
  display: flex;
  flex-direction: column;
}

.bulk-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.percentage-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.percentage-input {
  padding-right: 40px;
}

.percentage-symbol {
  position: absolute;
  right: 16px;
  font-weight: 700;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.input-helper {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* Preset button atajos */
.presets-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}

.presets-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
}

.presets-buttons {
  display: flex;
  gap: 6px;
}

.preset-btn {
  background-color: var(--floral-white);
  border: 1px solid var(--soft-fawn);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background-color: var(--vanilla-custard);
  border-color: var(--amber-honey);
  color: var(--text-primary);
}

.submit-btn {
  padding: 14px;
  font-size: 1rem;
  margin-top: 8px;
  width: 100%;
}

.toast-indicator {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(105, 147, 97, 0.3);
}

.bg-success-light {
  background-color: rgba(105, 147, 97, 0.12);
}

/* Grid reference panel */
.grid-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.export-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 0.85rem;
  border-radius: 8px;
  gap: 6px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 250px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border-radius: 6px;
  border: 1px solid var(--soft-fawn);
  background-color: var(--floral-white);
  color: var(--text-primary);
  font-size: 0.88rem;
  outline: none;
}

.search-input:focus {
  border-color: var(--amber-honey);
  background-color: var(--white);
}

.pricing-table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.pricing-table th {
  background-color: var(--floral-white);
  color: var(--text-secondary);
  font-family: var(--font-family-title);
  font-weight: 700;
  padding: 12px 14px;
  border-bottom: 2px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 5;
}

.pricing-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
}

.pricing-table tr:hover td {
  background-color: rgba(233, 215, 155, 0.1);
}

.prod-desc {
  display: flex;
  flex-direction: column;
}

.prod-desc .name {
  font-weight: 700;
  color: var(--text-primary);
}

.prod-desc .sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.cat {
  font-size: 0.75rem;
  font-weight: 600;
  background-color: var(--floral-white);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.text-right { text-align: right; }
.font-mono { font-family: monospace, Courier, monospace; }
.font-bold { font-weight: 700; }
.text-honey { color: #b88b0f; }
.text-success { color: var(--sage-green); }

.margin-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
}

.margin-badge.ok {
  background-color: rgba(105, 147, 97, 0.15);
  color: var(--sage-green);
}

.margin-badge.low {
  background-color: rgba(217, 83, 79, 0.12);
  color: var(--color-danger);
}

/* Print Catalog Modal styles */
.print-modal-overlay {
  z-index: 200;
}

.print-modal-box {
  max-width: 850px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  background-color: var(--white);
}

.modal-actions-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Printable Document Sheet */
.printable-document {
  flex-grow: 1;
  overflow-y: auto;
  padding: 40px;
  background-color: var(--white);
  color: #1e1c18;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Letterhead letter layout */
.letterhead-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 20px;
}

.letterhead-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.catalog-logo-img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  border: 1.5px solid var(--soft-fawn);
}

.logo-icon-svg {
  color: #1e1c18;
}

.brand-text h1 {
  font-family: var(--font-family-title);
  font-weight: 800;
  font-size: 1.7rem;
  line-height: 1.1;
  color: #1e1c18;
}

.brand-subtitle {
  font-size: 0.78rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.letterhead-info {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.letterhead-info p {
  margin-bottom: 2px;
}

.catalog-disclaimer {
  background-color: var(--floral-white);
  border: 1px solid var(--soft-fawn);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Printable tables */
.catalog-category-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  page-break-inside: avoid;
}

.catalog-category-title {
  font-family: var(--font-family-title);
  font-weight: 800;
  font-size: 1.1rem;
  background-color: var(--floral-white);
  padding: 6px 12px;
  border-radius: 6px;
  border-left: 4px solid var(--amber-honey);
  color: var(--text-primary);
}

.catalog-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.catalog-table th {
  padding: 8px 10px;
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  font-family: var(--font-family-title);
}

.catalog-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
}

.catalog-table tr:hover td {
  background-color: rgba(233, 215, 155, 0.05);
}

.font-title-table {
  font-size: 0.9rem;
}

.text-success-print {
  color: #4b6a45; /* Dark readable green for printing */
}

.catalog-footer {
  border-top: 1px dashed var(--soft-fawn);
  padding-top: 16px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: auto;
}

.catalog-footer-sub {
  font-size: 0.7rem;
  margin-top: 2px;
}

/* NATIVE BROWSER PRINT MODES */
@media print {
  /* Hide UI elements */
  body * {
    visibility: hidden;
  }
  
  /* Show only the print area */
  #print-area, #print-area * {
    visibility: visible;
  }
  
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0 !important;
    padding: 0 !important;
    background-color: white !important;
    color: black !important;
    box-shadow: none !important;
    border: none !important;
    overflow: visible !important;
  }

  .print-modal-overlay {
    background: white !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    z-index: 99999 !important;
  }

  .print-modal-box {
    box-shadow: none !important;
    border: none !important;
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
    overflow: visible !important;
  }

  .no-print {
    display: none !important;
  }

  @page {
    size: A4 portrait;
    margin: 1.6cm;
  }
  
  .catalog-category-title {
    background-color: #F7F3E8 !important;
    border-left: 4px solid #E8AE1F !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
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
</style>
