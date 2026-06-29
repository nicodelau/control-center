<template>
  <div class="prints-page">
    <!-- Header (Hidden when printing) -->
    <div class="page-header no-print">
      <div>
        <span class="sub-heading">Producción & Etiquetas</span>
        <h1 class="main-title">Impresión de Etiquetas</h1>
      </div>
    </div>

    <!-- Tabs (Hidden when printing) -->
    <div class="tabs-container glass no-print">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'etiquetas' }"
        @click="activeTab = 'etiquetas'"
      >
        <TagIcon :size="18" />
        Etiquetas de Precios
      </button>
      <button 
        class="tab-btn disabled" 
        title="Próximamente" 
        disabled
      >
        <FileTextIcon :size="18" />
        Comprobantes / Remitos
      </button>
      <button 
        class="tab-btn disabled" 
        title="Próximamente" 
        disabled
      >
        <PrinterIcon :size="18" />
        Códigos de Barras
      </button>
    </div>

    <!-- Active Tab Content -->
    <div v-if="activeTab === 'etiquetas'" class="tab-content">
      <!-- Top Grid Layout: Queue (2/3) & Settings (1/3) -->
      <div class="top-layout-grid no-print">
        
        <!-- Left: Search and Print Queue (2/3 width) -->
        <div class="queue-section-wrapper">
          <!-- 1. Product Search & Add Controls -->
          <div class="premium-card control-panel glass mb-4">
            <h2 class="panel-title mb-1">Seleccionar Productos</h2>
            <p class="panel-desc mb-4">
              Busca productos para agregar a la cola de impresión. Puedes ajustar el precio y texto de cada etiqueta antes de imprimir.
            </p>

            <div class="search-section">
              <div class="search-box">
                <SearchIcon :size="18" class="search-icon" />
                <input 
                  type="text" 
                  v-model="productSearch" 
                  @input="onProductSearchInput"
                  placeholder="Buscar por código, nombre o marca..." 
                  class="search-input"
                />
                
                <!-- Autocomplete Dropdown overlay -->
                <div class="search-results-overlay glass" v-if="searchDropdownOpen && foundProducts.length > 0">
                  <div 
                    v-for="prod in foundProducts" 
                    :key="prod.id"
                    @click="addProductToQueue(prod)"
                    class="search-result-item"
                  >
                    <div class="result-identity">
                      <span class="result-name font-bold">{{ prod.name }}</span>
                      <span class="result-meta text-muted">
                        {{ prod.brand || 'Sin Marca' }} · {{ prod.weight || 'S/D' }} · SKU: {{ prod.code }}
                      </span>
                    </div>
                    <div class="result-price text-right">
                      <div class="font-bold text-success">${{ formatNumber(prod.cashPrice) }} <span class="price-type-tag">Efect.</span></div>
                      <div class="text-muted font-mono text-sm">${{ formatNumber(prod.price) }} <span class="price-type-tag">Lista</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bulk Category Add -->
            <div class="bulk-add-row mt-4 pt-4 border-t border-color">
              <div class="form-group flex-1">
                <label for="bulk-category" class="filter-label">Agregar Categoría Completa:</label>
                <div class="flex gap-2">
                  <select id="bulk-category" v-model="selectedCategory" class="premium-input select-sm flex-1">
                    <option value="">Seleccionar Categoría...</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">
                      {{ cat }}
                    </option>
                  </select>
                  <button 
                    @click="addCategoryToQueue" 
                    class="btn btn-secondary btn-sm"
                    :disabled="!selectedCategory"
                  >
                    <PlusIcon :size="16" />
                    Cargar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. The Print Queue List -->
          <div class="premium-card queue-card glass">
            <div class="queue-header mb-4">
              <div>
                <h2 class="panel-title">Cola de Impresión</h2>
                <span class="panel-sub">Productos listos para generar etiqueta: {{ printQueue.length }}</span>
              </div>
              <button 
                v-if="printQueue.length > 0" 
                @click="clearQueue" 
                class="btn btn-danger btn-sm"
              >
                <TrashIcon :size="16" />
                Limpiar Cola
              </button>
            </div>

            <div class="queue-list-wrapper">
              <div v-if="printQueue.length === 0" class="empty-queue-state text-center py-10">
                <TagIcon :size="48" class="text-muted mb-2 mx-auto" />
                <p class="text-muted font-bold">La cola de impresión está vacía.</p>
                <p class="text-sm text-muted">Busca y selecciona productos arriba para empezar a diseñar etiquetas.</p>
              </div>

              <!-- Queue items list (Card-based spacious layout) -->
              <div v-else class="queue-items-list">
                <div 
                  v-for="(item, index) in printQueue" 
                  :key="item.queueId" 
                  class="queue-item-card glass-card"
                >
                  <!-- Card Header: Title input and delete button -->
                  <div class="queue-item-header">
                    <div class="queue-item-title-section">
                      <input 
                        type="text" 
                        v-model="item.name" 
                        class="premium-input item-title-input" 
                        placeholder="Nombre de la etiqueta"
                      />
                      <div class="item-meta-db">
                        Original: {{ item.originalName }} <span v-if="item.originalWeight">({{ item.originalWeight }})</span>
                      </div>
                    </div>
                    <button 
                      @click="removeQueueItem(index)" 
                      class="btn-delete-item" 
                      title="Quitar de la cola"
                    >
                      <TrashIcon :size="18" />
                    </button>
                  </div>
                  
                  <!-- Card Controls: Organized spacious grid -->
                  <div class="queue-item-controls">
                    <!-- Price Config -->
                    <div class="control-group">
                      <label class="control-label-micro">Precio a Imprimir ($)</label>
                      <div class="price-input-wrapper">
                        <input 
                          type="number" 
                          v-model.number="item.price" 
                          class="premium-input font-mono price-num-input" 
                          step="0.01"
                        />
                        <div class="preset-toggle-buttons">
                          <button 
                            @click="setPricePreset(item, 'cash')" 
                            class="preset-btn-micro"
                            :class="{ active: item.priceType === 'cash' }"
                            title="Precio Efectivo"
                          >
                            Efectivo
                          </button>
                          <button 
                            @click="setPricePreset(item, 'list')" 
                            class="preset-btn-micro"
                            :class="{ active: item.priceType === 'list' }"
                            title="Precio Lista"
                          >
                            Lista
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- IVA Dropdown -->
                    <div class="control-group">
                      <label class="control-label-micro">Tasa de IVA</label>
                      <select v-model.number="item.iva" class="premium-input select-iva-micro font-mono">
                        <option :value="10.5">10.5% (Canasta)</option>
                        <option :value="21">21.0% (General)</option>
                        <option :value="0">0.0% (Exento)</option>
                      </select>
                    </div>

                    <!-- Divisor & Unit calculations -->
                    <div class="control-group">
                      <label class="control-label-micro">Divisor / Unidad</label>
                      <div class="unit-calc-micro">
                        <input 
                          type="number" 
                          v-model.number="item.weightDivisor" 
                          class="premium-input font-mono input-divisor-micro" 
                          placeholder="Divisor" 
                          step="0.01"
                        />
                        <span class="calc-divider">/</span>
                        <select v-model="item.unit" class="premium-input select-unit-micro">
                          <option value="kilogramo">Kg</option>
                          <option value="litro">Litro</option>
                          <option value="unidad">Unid</option>
                        </select>
                      </div>
                    </div>

                    <!-- Copies stepper counter -->
                    <div class="control-group">
                      <label class="control-label-micro">Cantidad Copias</label>
                      <div class="copies-stepper">
                        <button 
                          type="button"
                          @click="item.copies = Math.max(1, (item.copies || 1) - 1)" 
                          class="stepper-btn"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          v-model.number="item.copies" 
                          min="1" 
                          class="premium-input stepper-input font-mono"
                        />
                        <button 
                          type="button"
                          @click="item.copies = (item.copies || 1) + 1" 
                          class="stepper-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Layout Settings (1/3 width) -->
        <div class="settings-section-wrapper">
          <div class="premium-card settings-card glass">
            <h2 class="panel-title mb-1">Configuración del Diseño</h2>
            <p class="panel-desc mb-4">Ajusta el estilo global, cantidad y tamaño de las etiquetas para ocupar toda la hoja.</p>

            <!-- Size Presets Dropdown -->
            <div class="form-group mb-4">
              <label class="filter-label">Plantilla de Tamaño / Distribución:</label>
              <select v-model="selectedPresetId" @change="applySizePreset" class="premium-input select-bold">
                <option v-for="preset in sizePresets" :key="preset.id" :value="preset.id">
                  {{ preset.name }}
                </option>
              </select>
            </div>

            <!-- Custom layout parameters -->
            <div class="custom-tuning-section bg-floral p-3 rounded-lg border border-color mb-4">
              <h3 class="tuning-title mb-2">Ajuste de Dimensiones</h3>
              
              <div class="settings-grid">
                <div class="form-group">
                  <label class="filter-label">Columnas (Cuadrícula):</label>
                  <input 
                    type="number" 
                    v-model.number="layoutSettings.columns" 
                    min="1" 
                    max="6" 
                    @input="onTuningChange"
                    class="premium-input font-mono"
                  />
                </div>

                <div class="form-group">
                  <label class="filter-label">Alto de Etiqueta (mm):</label>
                  <input 
                    type="number" 
                    v-model.number="layoutSettings.labelHeight" 
                    min="10" 
                    max="290" 
                    @input="onTuningChange"
                    class="premium-input font-mono"
                  />
                </div>

                <div class="form-group">
                  <label class="filter-label">Separación (Gap mm):</label>
                  <input 
                    type="number" 
                    v-model.number="layoutSettings.gap" 
                    min="0" 
                    max="20" 
                    @input="onTuningChange"
                    class="premium-input font-mono"
                  />
                </div>

                <div class="form-group">
                  <label class="filter-label">Margen de Hoja (mm):</label>
                  <input 
                    type="number" 
                    v-model.number="layoutSettings.sheetMargin" 
                    min="0" 
                    max="30" 
                    @input="onTuningChange"
                    class="premium-input font-mono"
                  />
                </div>
              </div>

              <!-- Typography text scaling -->
              <div class="form-group mt-3">
                <div class="flex justify-between items-center">
                  <label class="filter-label mb-0">Escala de Texto de Etiqueta:</label>
                  <span class="font-mono text-sm text-honey font-bold">{{ Math.round(layoutSettings.fontScale * 100) }}%</span>
                </div>
                <input 
                  type="range" 
                  v-model.number="layoutSettings.fontScale" 
                  min="0.3" 
                  max="1.8" 
                  step="0.05"
                  @input="onTuningChange"
                  class="range-slider w-full mt-1"
                />
              </div>
            </div>

            <!-- Border & Display Options -->
            <div class="settings-grid mb-4">
              <div class="form-group">
                <label class="filter-label">Estilo del Borde:</label>
                <select v-model="layoutSettings.borderStyle" class="premium-input">
                  <option value="dashed">Línea de corte punteada</option>
                  <option value="solid">Línea sólida negra</option>
                  <option value="none">Sin bordes</option>
                </select>
              </div>

              <div class="form-group">
                <label class="filter-label">IVA por Defecto:</label>
                <select v-model.number="layoutSettings.defaultIva" class="premium-input">
                  <option :value="10.5">10.5% (Canasta básica)</option>
                  <option :value="21">21.0% (Tasa general)</option>
                  <option :value="0">0.0% (Exento)</option>
                </select>
              </div>
            </div>

            <!-- Checkbox toggles -->
            <div class="checkbox-settings">
              <label class="checkbox-label">
                <input type="checkbox" v-model="layoutSettings.showLogo" />
                <span>Mostrar logo de la empresa (Dulce Victoria)</span>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" v-model="layoutSettings.showIvaDetail" />
                <span>Mostrar "Precio sin impuestos nacionales (IVA)"</span>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" v-model="layoutSettings.showUnitDetail" />
                <span>Mostrar "Precio por Kilogramo/Litro/Unidad"</span>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" v-model="layoutSettings.roundDecimals" />
                <span>Quitar decimales del precio si terminan en ,00</span>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" v-model="layoutSettings.stretchLabels" />
                <span>Ajustar etiquetas para ocupar todo el ancho disponible</span>
              </label>
            </div>

            <!-- Print Trigger Action -->
            <div class="print-actions mt-6 pt-4 border-t border-color">
              <button 
                @click="triggerPrint" 
                class="btn btn-success w-full justify-center print-btn-lg"
                :disabled="printQueue.length === 0"
              >
                <PrinterIcon :size="20" />
                IMPRIMIR HOJA COMPLETA
              </button>
              <span class="helper-text-center">Tip: En el panel de impresión de tu navegador, asegúrate de activar "Gráficos de fondo" y configurar los márgenes como "Ninguno" para respetar el diseño al 100%.</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Layout: Live Preview Section (Always visible in UI, prints in special layout) -->
      <div class="preview-section-wrapper">
        <div class="preview-container-box">
          <h2 class="panel-title no-print mb-2">Vista Previa de la Hoja</h2>
          <p class="panel-desc no-print mb-4">Simulación a escala de la distribución en una hoja A4 física.</p>
          
          <!-- Scale slider for preview in browser -->
          <div class="preview-zoom-control no-print mb-3">
            <label class="text-sm font-bold text-secondary">Zoom del preview:</label>
            <input type="range" v-model.number="previewZoom" min="0.3" max="1.0" step="0.05" class="w-32 ml-2" />
            <span class="font-mono text-sm ml-2">{{ Math.round(previewZoom * 100) }}%</span>
          </div>

          <div class="preview-sheet glass">
            <!-- Simulated A4 Canvas Sheet -->
            <div 
              class="preview-page-canvas" 
              :class="{ 'roll': selectedPresetId === 'roll_80' }"
              :style="{
                'transform': `scale(${previewZoom})`,
                'transform-origin': 'top center',
                '--print-margin': layoutSettings.sheetMargin + 'mm',
                '--print-cols': layoutSettings.columns,
                '--print-gap': layoutSettings.gap + 'mm',
                '--label-height': layoutSettings.labelHeight + 'mm',
                '--font-scale': layoutSettings.fontScale
              }"
            >
              <!-- Printable Area -->
              <div 
                id="print-area" 
                :class="[
                  'labels-print-container', 
                  { 'stretch-labels': layoutSettings.stretchLabels }
                ]"
              >
                <template v-for="item in flattenedQueue" :key="item.queueId + '-' + item.copyIndex">
                  <div 
                    class="label-item" 
                    :class="[
                      'border-' + layoutSettings.borderStyle,
                      { 'no-logo': !layoutSettings.showLogo },
                      { 'layout-watermark': layoutSettings.columns === 2 }
                    ]"
                  >
                    <!-- Left Column: Logo + Title -->
                    <div class="label-col-left">
                      <div class="logo-wrapper" v-if="layoutSettings.showLogo">
                        <img :src="logoUrl" class="label-logo" alt="Dulce Victoria" />
                      </div>
                      <h3 class="label-product-title">{{ item.name }}</h3>
                    </div>

                    <!-- Right Column: Prices -->
                    <div class="label-col-right">
                      <div class="label-price-header">Precio final al consumidor</div>
                      <div class="label-price-value">
                        ${{ formatFinalPrice(item.price) }}
                      </div>
                      <ul class="label-price-details">
                        <li v-if="layoutSettings.showIvaDetail">
                          <strong>Precio sin IVA:</strong> ${{ formatNumber(calculatePriceWithoutIva(item.price, item.iva)) }}
                        </li>
                        <li v-if="layoutSettings.showUnitDetail && item.weightDivisor > 0">
                          <strong>Precio x {{ item.unit }}:</strong> ${{ formatNumber(calculatePricePerUnit(item.price, item.weightDivisor)) }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </template>
              </div>
            </div>
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
  Tag as TagIcon,
  Printer as PrinterIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  FileText as FileTextIcon
} from 'lucide-vue-next'

// Active tab selection
const activeTab = ref('etiquetas')

// Browser preview zoom scaling factor
const previewZoom = ref(0.65)

// Presets mapping
const sizePresets = [
  {
    id: 'large_8',
    name: 'Grande (A4 - 8 por hoja, 2x4)',
    columns: 2,
    labelHeight: 68,
    gap: 4,
    sheetMargin: 10,
    fontScale: 1.15,
    roundDecimals: false,
    stretchLabels: true
  },
  {
    id: 'medium_12',
    name: 'Mediano Grande (A4 - 12 por hoja, 2x6)',
    columns: 2,
    labelHeight: 46,
    gap: 3,
    sheetMargin: 8,
    fontScale: 0.95,
    roundDecimals: false,
    stretchLabels: true
  },
  {
    id: 'medium_21',
    name: 'Mediano Estándar (A4 - 21 por hoja, 3x7)',
    columns: 3,
    labelHeight: 38,
    gap: 3,
    sheetMargin: 6,
    fontScale: 0.8,
    roundDecimals: true,
    stretchLabels: true
  },
  {
    id: 'small_40',
    name: 'Chico (A4 - 40 por hoja, 4x10)',
    columns: 4,
    labelHeight: 27,
    gap: 2,
    sheetMargin: 5,
    fontScale: 0.65,
    roundDecimals: true,
    stretchLabels: true
  },
  {
    id: 'roll_80',
    name: 'Rollo Térmico Continuo (80mm)',
    columns: 1,
    labelHeight: 52,
    gap: 5,
    sheetMargin: 0,
    fontScale: 0.95,
    roundDecimals: false,
    stretchLabels: true
  },
  {
    id: 'custom',
    name: 'Personalizado...',
    columns: 2,
    labelHeight: 60,
    gap: 4,
    sheetMargin: 10,
    fontScale: 1.0,
    roundDecimals: false,
    stretchLabels: true
  }
]

// Current selected preset ID
const selectedPresetId = ref('large_8')

// Layout & Global settings
const layoutSettings = ref({
  columns: 2,
  labelHeight: 68,
  gap: 4,
  sheetMargin: 10,
  fontScale: 1.15,
  borderStyle: 'dashed',
  showLogo: true,
  showIvaDetail: true,
  showUnitDetail: true,
  roundDecimals: false,
  stretchLabels: true,
  defaultIva: 10.5
})

// Search state
const productSearch = ref('')
const searchDropdownOpen = ref(false)
const foundProducts = ref([])
const selectedCategory = ref('')

// Load database products
const { data: products } = await useFetch('/api/productos')

// Get unique categories list for bulk add dropdown
const categories = computed(() => {
  if (!products.value) return []
  const cats = products.value.map(p => p.category).filter(Boolean)
  return [...new Set(cats)].sort()
})

// Print queue list
const printQueue = ref([])

// Apply preset values to layoutSettings
function applySizePreset() {
  const preset = sizePresets.find(p => p.id === selectedPresetId.value)
  if (preset && preset.id !== 'custom') {
    layoutSettings.value.columns = preset.columns
    layoutSettings.value.labelHeight = preset.labelHeight
    layoutSettings.value.gap = preset.gap
    layoutSettings.value.sheetMargin = preset.sheetMargin
    layoutSettings.value.fontScale = preset.fontScale
    layoutSettings.value.roundDecimals = preset.roundDecimals
    layoutSettings.value.stretchLabels = preset.stretchLabels
    
    // Auto adjust browser zoom factor for optimal preview fit
    if (preset.id === 'small_40') {
      previewZoom.value = 0.5
    } else if (preset.id === 'roll_80') {
      previewZoom.value = 0.8
    } else {
      previewZoom.value = 0.6
    }
  }
}

// Set selector to custom when user edits values manually
function onTuningChange() {
  selectedPresetId.value = 'custom'
}

// Helper to auto extract weight and unit
function extractWeightAndUnit(prodName, prodWeight) {
  let divisor = 1
  let unit = 'kilogramo'
  
  const source = prodWeight || ''
  
  if (!source) {
    const xMatch = prodName.match(/X\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|u)?/i)
    if (xMatch) {
      const num = parseFloat(xMatch[1])
      const u = xMatch[2] ? xMatch[2].toLowerCase() : ''
      if (u === 'g') {
        divisor = num / 1000
      } else if (u === 'ml') {
        divisor = num / 1000
        unit = 'litro'
      } else if (u === 'l') {
        divisor = num
        unit = 'litro'
      } else if (u === 'u') {
        divisor = num
        unit = 'unidad'
      } else {
        divisor = num
      }
      return { divisor, unit }
    }
  }
  
  const cleanSource = source.toLowerCase().trim()
  const numMatch = cleanSource.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) {
    const num = parseFloat(numMatch[1])
    if (cleanSource.includes('g') && !cleanSource.includes('kg')) {
      divisor = num / 1000
    } else if (cleanSource.includes('ml')) {
      divisor = num / 1000
      unit = 'litro'
    } else if (cleanSource.includes('l')) {
      divisor = num
      unit = 'litro'
    } else if (cleanSource.includes('u') || cleanSource.includes('unid')) {
      divisor = num
      unit = 'unidad'
    } else {
      divisor = num
    }
  }
  
  return { divisor, unit }
}

// Search input handler
function onProductSearchInput() {
  const query = productSearch.value.toLowerCase().trim()
  if (!query) {
    foundProducts.value = []
    searchDropdownOpen.value = false
    return
  }

  if (!products.value) return

  foundProducts.value = products.value.filter(p => {
    return (
      p.active &&
      (p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)))
    )
  }).slice(0, 6)

  searchDropdownOpen.value = true
}

// Add a single product to queue
function addProductToQueue(prod) {
  productSearch.value = ''
  foundProducts.value = []
  searchDropdownOpen.value = false

  const parsedWeight = extractWeightAndUnit(prod.name, prod.weight)
  const queueId = Date.now().toString() + Math.random().toString(36).substr(2, 5)
  
  let labelName = prod.name
  if (prod.weight && !prod.name.toLowerCase().includes(prod.weight.toLowerCase())) {
    labelName = `${prod.name} ${prod.weight}`
  }

  printQueue.value.push({
    queueId,
    productId: prod.id,
    name: labelName,
    originalName: prod.name,
    originalWeight: prod.weight,
    price: Number(prod.price), 
    originalPrice: Number(prod.price),
    originalCashPrice: Number(prod.cashPrice),
    priceType: 'list',
    iva: layoutSettings.value.defaultIva,
    weightDivisor: parsedWeight.divisor,
    unit: parsedWeight.unit,
    copies: 1
  })
}

// Bulk add all products in a category
function addCategoryToQueue() {
  if (!selectedCategory.value || !products.value) return

  const filtered = products.value.filter(p => p.active && p.category === selectedCategory.value)
  
  filtered.forEach(prod => {
    const parsedWeight = extractWeightAndUnit(prod.name, prod.weight)
    const queueId = Date.now().toString() + Math.random().toString(36).substr(2, 5)
    
    let labelName = prod.name
    if (prod.weight && !prod.name.toLowerCase().includes(prod.weight.toLowerCase())) {
      labelName = `${prod.name} ${prod.weight}`
    }

    printQueue.value.push({
      queueId,
      productId: prod.id,
      name: labelName,
      originalName: prod.name,
      originalWeight: prod.weight,
      price: Number(prod.price),
      originalPrice: Number(prod.price),
      originalCashPrice: Number(prod.cashPrice),
      priceType: 'list',
      iva: layoutSettings.value.defaultIva,
      weightDivisor: parsedWeight.divisor,
      unit: parsedWeight.unit,
      copies: 1
    })
  })

  selectedCategory.value = ''
}

// Preset price selection (switch between list and cash price)
function setPricePreset(item, type) {
  item.priceType = type
  if (type === 'cash') {
    item.price = item.originalCashPrice
  } else {
    item.price = item.originalPrice
  }
}

// Queue management
function removeQueueItem(index) {
  printQueue.value.splice(index, 1)
}

// Clear queue
function clearQueue() {
  printQueue.value = []
}

// Flatten queue based on copies count
const flattenedQueue = computed(() => {
  const list = []
  printQueue.value.forEach(item => {
    const numCopies = Math.max(1, parseInt(item.copies) || 1)
    for (let c = 0; c < numCopies; c++) {
      list.push({
        ...item,
        copyIndex: c
      })
    }
  })
  return list
})

// Calculations helper
function calculatePriceWithoutIva(price, ivaRate) {
  const rate = parseFloat(ivaRate) || 0
  return price / (1 + (rate / 100))
}

// Price per unit helper
function calculatePricePerUnit(price, divisor) {
  const d = parseFloat(divisor) || 1
  return d > 0 ? price / d : price
}

// Number formatting functions
function formatNumber(val) {
  if (val === undefined || val === null || isNaN(val)) return '0,00'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Final price formatter
function formatFinalPrice(price) {
  if (price === undefined || price === null || isNaN(price)) return '0,00'
  const rounded = Number(price)
  
  if (layoutSettings.value.roundDecimals && rounded % 1 === 0) {
    return rounded.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  return rounded.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Window print trigger
function triggerPrint() {
  if (printQueue.value.length === 0) return
  try {
    localStorage.setItem('control_center_print_queue', JSON.stringify(printQueue.value))
    localStorage.setItem('control_center_print_layout', JSON.stringify(layoutSettings.value))
    window.open('/imprimir-etiquetas', '_blank')
  } catch (err) {
    console.error('Error saving print parameters', err)
    window.print() // Fallback
  }
}

// Apply initial preset settings on mount
applySizePreset()
</script>

<style scoped>
.prints-page {
  padding-bottom: 60px;
}

/* Header style styling */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.sub-heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.main-title {
  font-size: 2.25rem;
  font-weight: 800;
  font-family: var(--font-family-title);
  color: var(--text-primary);
  margin-top: 4px;
}

/* Tab Layout navigation */
.tabs-container {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 14px;
  margin-bottom: 30px;
  background-color: var(--white);
  border: 1px solid var(--border-color);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 10px;
  font-family: var(--font-family-sans);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-btn:hover:not(.disabled) {
  background-color: rgba(233, 215, 155, 0.25);
  color: var(--text-primary);
}

.tab-btn.active {
  background-color: var(--vanilla-custard);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.tab-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Top Layout Grid: 2/3 (Queue) and 1/3 (Settings) */
.top-layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
  align-items: start;
}

@media (max-width: 1100px) {
  .top-layout-grid {
    grid-template-columns: 1fr;
  }
}

.mb-6 {
  margin-bottom: 24px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.pt-4 {
  padding-top: 16px;
}

.border-t {
  border-top: 1px solid var(--border-color);
}

.flex {
  display: flex;
}

.flex-1 {
  flex: 1;
}

.gap-2 {
  gap: 8px;
}

.w-full {
  width: 100%;
}

.w-32 {
  width: 128px;
}

.ml-2 {
  margin-left: 8px;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

/* Search suggestions overlay */
.search-section {
  position: relative;
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
  padding: 12px 16px 12px 42px;
  border-radius: 12px;
  border: 1px solid var(--soft-fawn);
  background-color: var(--white);
  color: var(--text-primary);
  font-family: var(--font-family-sans);
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--amber-honey);
  box-shadow: 0 0 0 3px rgba(232, 174, 31, 0.15);
}

.search-results-overlay {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--soft-fawn);
  z-index: 100;
  margin-top: 6px;
  max-height: 280px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: rgba(233, 215, 155, 0.25);
}

.result-identity {
  display: flex;
  flex-direction: column;
}

.result-name {
  font-family: var(--font-family-title);
  color: var(--text-primary);
}

.result-meta {
  font-size: 0.8rem;
}

.price-type-tag {
  font-size: 0.65rem;
  font-weight: bold;
  background-color: var(--floral-white);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--text-secondary);
}

/* Panel descriptive copy text */
.panel-title {
  font-family: var(--font-family-title);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.panel-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.panel-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* Category Load Panel */
.filter-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-secondary);
}

.filter-label.mb-0 {
  margin-bottom: 0;
}

.select-sm {
  padding: 8px 12px;
  font-size: 0.9rem;
  border-radius: 8px;
}

.select-bold {
  font-weight: 700;
  border-color: var(--amber-honey);
  background-color: rgba(232, 174, 31, 0.05);
}

/* Dynamic Tuning Section */
.custom-tuning-section {
  background-color: var(--floral-white);
  border-radius: 10px;
  border: 1px dashed var(--soft-fawn);
}

.tuning-title {
  font-family: var(--font-family-title);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Card list layout instead of crowded table */
.queue-card {
  min-height: 350px;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.queue-items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 4px;
}

.queue-item-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background-color: var(--white);
  gap: 12px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.queue-item-card:hover {
  border-color: var(--soft-fawn);
  box-shadow: var(--shadow-sm);
}

.queue-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  border-bottom: 1px solid rgba(208, 180, 111, 0.15);
  padding-bottom: 10px;
}

.queue-item-title-section {
  flex-grow: 1;
}

.item-title-input {
  font-family: var(--font-family-title);
  font-weight: 700;
  font-size: 1.05rem;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--text-primary);
  width: 100%;
}

.item-meta-db {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 4px;
  padding-left: 4px;
}

.btn-delete-item {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-delete-item:hover {
  color: var(--color-danger);
  background-color: rgba(217, 83, 79, 0.1);
}

/* Bottom Controls Grid inside queue card */
.queue-item-controls {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr 1.3fr 1fr;
  gap: 14px;
  align-items: end;
}

@media (max-width: 768px) {
  .queue-item-controls {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .queue-item-controls {
    grid-template-columns: 1fr;
  }
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label-micro {
  font-size: 0.78rem;
  font-weight: 650;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Price Input Wrapper & Preset Buttons */
.price-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-num-input {
  font-weight: bold;
  padding: 8px 10px;
  font-size: 0.92rem;
}

.preset-toggle-buttons {
  display: flex;
  gap: 4px;
  width: 100%;
}

.preset-btn-micro {
  flex: 1;
  border: 1px solid var(--border-color);
  background-color: var(--white);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s ease;
  text-align: center;
}

.preset-btn-micro:hover {
  background-color: var(--floral-white);
  border-color: var(--soft-fawn);
}

.preset-btn-micro.active {
  background-color: var(--amber-honey);
  color: #1E1C18;
  border-color: var(--amber-honey);
}

/* IVA Dropdown sizing */
.select-iva-micro {
  padding: 8px 10px;
  font-size: 0.92rem;
}

/* Unit and Divisor calculator layout */
.unit-calc-micro {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-divisor-micro {
  flex: 1;
  padding: 8px 10px;
  font-size: 0.92rem;
  text-align: center;
}

.calc-divider {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--soft-fawn);
}

.select-unit-micro {
  flex: 1.2;
  padding: 8px 6px;
  font-size: 0.9rem;
}

/* Copies Stepper layout */
.copies-stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--soft-fawn);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--white);
}

.stepper-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  width: 32px;
  height: 36px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.stepper-btn:hover {
  background-color: var(--floral-white);
}

.stepper-input {
  flex: 1;
  border: none !important;
  box-shadow: none !important;
  text-align: center;
  padding: 6px 0;
  font-size: 0.95rem;
  font-weight: bold;
  height: 36px;
  width: 40px;
}

/* Scrollbar adjustment for queue list */
.queue-items-list::-webkit-scrollbar {
  width: 6px;
}
.queue-items-list::-webkit-scrollbar-thumb {
  background: var(--soft-fawn);
  border-radius: 3px;
}

/* Settings Card and Checkboxes */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.checkbox-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  font-weight: 550;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--amber-honey);
  cursor: pointer;
}

.print-btn-lg {
  padding: 14px 20px;
  font-size: 1.05rem;
  font-weight: 700;
  box-shadow: var(--shadow-honey);
}

.helper-text-center {
  display: block;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Live Preview Section Below */
.preview-section-wrapper {
  margin-top: 32px;
  border-top: 2px dashed var(--border-color);
  padding-top: 32px;
}

/* Live Preview Sheet Scaling Canvas */
.preview-zoom-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background-color: var(--white);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.preview-sheet {
  background-color: #3b3a36; /* Dark background to mimic print bench */
  padding: 40px 20px;
  border-radius: 16px;
  min-height: 500px;
  max-height: 950px;
  display: block;
  overflow: auto;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
}

/* Simulated A4 Paper Canvas */
.preview-page-canvas {
  background-color: white;
  width: 210mm;
  min-height: 297mm;
  padding: var(--print-margin, 10mm);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  box-sizing: border-box;
  margin: 0 auto;
  transition: transform 0.2s ease, width 0.2s ease, min-height 0.2s ease;
}

/* Continuous roll layout canvas */
.preview-page-canvas.roll {
  width: 80mm;
  min-height: 200mm;
  padding: 4mm;
}

/* Printable Labels layout classes inside preview */
.labels-print-container {
  display: grid;
  grid-template-columns: repeat(var(--print-cols, 2), 1fr);
  gap: var(--print-gap, 5px);
  width: 100%;
  box-sizing: border-box;
}

/* Label individual design */
.label-item {
  display: flex;
  background-color: #FEFDFE;
  padding: calc(10px * var(--font-scale, 1));
  box-sizing: border-box;
  gap: calc(12px * var(--font-scale, 1));
  align-items: stretch;
  overflow: hidden;
  height: var(--label-height, 60mm);
  width: 100%;
}

.stretch-labels .label-item {
  width: 100%;
}

/* Border choices */
.border-dashed {
  border: calc(2px * var(--font-scale, 1)) dashed #b89b53;
}

.border-solid {
  border: calc(2px * var(--font-scale, 1)) solid #1E1C18;
}

.border-none {
  border: calc(2px * var(--font-scale, 1)) solid transparent;
}

.label-col-left {
  flex: 1.1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-right: calc(2.5px * var(--font-scale, 1)) dashed rgba(208, 180, 111, 0.45);
  padding-right: calc(12px * var(--font-scale, 1));
  overflow: hidden;
}

.border-solid .label-col-left {
  border-right: calc(2px * var(--font-scale, 1)) dashed #1E1C18;
}

.border-none .label-col-left {
  border-right: calc(1.5px * var(--font-scale, 1)) solid var(--border-color);
}

.logo-wrapper {
  margin-bottom: calc(6px * var(--font-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.label-logo {
  max-height: min(calc(44px * var(--font-scale, 1)), calc(0.35 * var(--label-height, 60mm) * var(--font-scale, 1)));
  max-width: 100%;
  object-fit: contain;
}

.label-product-title {
  font-family: var(--font-family-title);
  font-size: calc(1.05rem * var(--font-scale, 1));
  font-weight: 800;
  color: #1e1c18;
  margin: 0;
  text-transform: uppercase;
  line-height: 1.2;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.label-col-right {
  flex: 1.35;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 2px;
  overflow: hidden;
}

.label-price-header {
  font-size: calc(0.68rem * var(--font-scale, 1));
  font-weight: 700;
  text-transform: uppercase;
  color: #5A564C;
  letter-spacing: 0.03em;
  margin-bottom: 1px;
}

.label-price-value {
  font-family: var(--font-family-title);
  font-size: calc(2.1rem * var(--font-scale, 1));
  font-weight: 850;
  color: #1e1c18;
  line-height: 1.0;
  margin-bottom: calc(6px * var(--font-scale, 1));
  white-space: nowrap;
}

.label-price-details {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: calc(3px * var(--font-scale, 1));
}

.label-price-details li {
  font-size: calc(0.7rem * var(--font-scale, 1));
  color: #5a564c;
  line-height: 1.25;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.label-price-details li strong {
  color: #1e1c18;
  font-weight: 700;
}

/* Watermark layout rules (applied when columns === 2) */
.label-item.layout-watermark {
  position: relative !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  align-items: stretch !important;
}

.label-item.layout-watermark .logo-wrapper {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 90% !important;
  height: 90% !important;
  margin: 0 !important;
  padding: 0 !important;
  opacity: 0.12 !important; /* soft watermark but clearly visible */
  z-index: 1 !important;
  pointer-events: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.label-item.layout-watermark .label-logo {
  max-height: 80% !important;
  max-width: 80% !important;
  object-fit: contain !important;
  filter: grayscale(100%) !important;
}

.label-item.layout-watermark .label-col-left {
  position: static !important; /* let logo absolute centering refer to label-item */
  overflow: visible !important; /* avoid clipping the logo */
  flex: none !important;
  width: 100% !important;
  border-right: none !important;
  border-bottom: none !important;
  padding-right: 0 !important;
  padding-bottom: calc(4px * var(--font-scale, 1)) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}

.label-item.layout-watermark .label-product-title {
  position: relative !important;
  z-index: 2 !important;
  font-size: calc(1.0rem * var(--font-scale, 1)) !important;
  text-align: center !important;
  width: 100% !important;
}

.label-item.layout-watermark .label-col-right {
  position: relative !important;
  z-index: 2 !important;
  flex: 1 !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  padding-left: 0 !important;
}

.label-item.layout-watermark .label-price-header {
  font-size: calc(0.6rem * var(--font-scale, 1)) !important;
  text-align: center !important;
  width: 100% !important;
}

.label-item.layout-watermark .label-price-value {
  font-size: calc(1.9rem * var(--font-scale, 1)) !important;
  margin-bottom: calc(2px * var(--font-scale, 1)) !important;
  text-align: center !important;
  width: 100% !important;
}

.label-item.layout-watermark .label-price-details {
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
}

.label-item.layout-watermark .label-price-details li {
  font-size: calc(0.65rem * var(--font-scale, 1)) !important;
  text-align: center !important;
}

/* NATIVE PRINT STYLES */
@media print {
  /* Hide every UI component on page */
  body * {
    visibility: hidden;
  }
  
  /* Completely hide layout elements like header and sidebar, and explicit no-print elements */
  header, aside, .mobile-header, .sidebar, .collapse-btn, .sidebar-footer, .no-print, .no-print * {
    display: none !important;
  }
  
  /* Make only the print-area element visible and position it */
  #print-area, #print-area * {
    visibility: visible;
  }
  
  /* Strip all borders, shadows, backgrounds, paddings, and margins from all print-area ancestors */
  html, body, .app-layout, .main-content, .content-wrapper, .preview-section-wrapper, .preview-container-box, .preview-sheet, .preview-page-canvas {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    height: auto !important;
    transform: none !important;
    position: static !important;
  }

  #print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background-color: white !important;
    box-shadow: none !important;
    border: none !important;
    display: grid !important;
  }
  
  .labels-print-container {
    display: grid !important;
    grid-template-columns: repeat(var(--print-cols, 2), 1fr) !important;
    gap: var(--print-gap, 5px) !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .label-item {
    background: white !important;
    page-break-inside: avoid;
    break-inside: avoid;
    height: var(--label-height, 60mm) !important;
    box-sizing: border-box !important;
  }
  
  /* Print black details for maximum contrast */
  .border-dashed {
    border: 2px dashed #000 !important;
  }
  
  .border-solid {
    border: 2px solid #000 !important;
  }
  
  .border-none {
    border: none !important;
  }
  
  .label-col-left {
    border-right-color: #000 !important;
  }
  
  .label-product-title, 
  .label-price-value, 
  .label-price-details li, 
  .label-price-details li strong,
  .label-price-header {
    color: #000 !important;
  }

  /* Set page format margins dynamically based on CSS variable */
  @page {
    size: A4 portrait;
    margin: var(--print-margin, 10mm);
  }
}
</style>
