<template>
  <div class="purchases-stock-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <span class="sub-heading">Abastecimiento</span>
        <h1 class="main-title">Ingreso de Compra (Stock)</h1>
      </div>
    </div>

    <div class="pos-grid">
      <!-- Left side: Selected products to restock -->
      <div class="cart-column">
        <!-- 1. Search products -->
        <div class="premium-card search-card">
          <h3 class="panel-title">Buscar Producto a Reabastecer</h3>
          <div class="search-controls">
            <div class="search-box">
              <SearchIcon :size="18" class="search-icon" />
              <input 
                type="text" 
                v-model="productSearch" 
                placeholder="Busca por nombre, SKU o marca..." 
                class="search-input"
                @input="onSearchInput"
              />
            </div>

            <!-- Dropdown suggestions -->
            <div class="search-results-overlay glass" v-if="searchOpen && foundProducts.length > 0">
              <div 
                v-for="prod in foundProducts" 
                :key="prod.id"
                class="search-result-item"
                @click="addProductToRestock(prod)"
              >
                <div class="result-identity">
                  <span class="result-name">{{ prod.name }}</span>
                  <span class="result-meta">
                    {{ prod.brand ? prod.brand : 'Sin Marca' }} · {{ prod.weight ? prod.weight : '' }}
                  </span>
                </div>
                <div class="result-pricing-stock">
                  <span class="result-stock text-muted">Stock actual: {{ prod.stock }}</span>
                  <span class="result-price text-secondary">Costo actual: ${{ formatNumber(prod.cost) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Restock Items List -->
        <div class="premium-card cart-items-card">
          <div class="cart-header-row">
            <h3 class="panel-title">Mercadería a Ingresar</h3>
            <button 
              class="clear-cart-btn text-danger" 
              @click="clearList"
              :disabled="itemsList.length === 0"
            >
              Limpiar Lista
            </button>
          </div>

          <div class="cart-items-wrapper">
            <div v-if="itemsList.length === 0" class="empty-cart-state">
              <span class="empty-cart-icon">📦</span>
              <p>No has seleccionado productos.</p>
              <span class="empty-cart-sub">Escribe en la barra de búsqueda superior para agregar ítems al stock.</span>
            </div>

            <div v-else class="cart-list">
              <div 
                v-for="(item, index) in itemsList" 
                :key="item.product.id" 
                class="cart-item"
              >
                <div class="cart-item-info">
                  <span class="name">{{ item.product.name }}</span>
                  <span class="sub">
                    {{ item.product.brand ? item.product.brand : 'Sin Marca' }} · {{ item.product.weight ? item.product.weight : '' }}
                  </span>
                  <span class="stock-info">Stock actual: <strong>{{ item.product.stock }}</strong></span>
                </div>

                <div class="cart-item-controls">
                  <!-- Restock qty -->
                  <div class="input-control">
                    <label class="input-lbl">Cantidad:</label>
                    <input 
                      type="number" 
                      v-model.number="item.quantity" 
                      min="1" 
                      class="qty-field font-mono"
                      @change="validateQty(index)"
                    />
                  </div>

                  <!-- Purchase cost price (updating actual product cost) -->
                  <div class="input-control">
                    <label class="input-lbl">Costo Unitario ($):</label>
                    <input 
                      type="number" 
                      v-model.number="item.costPrice" 
                      min="0.01" 
                      step="0.01"
                      class="cost-field font-mono"
                    />
                  </div>

                  <!-- Subtotal -->
                  <div class="subtotal-display font-mono font-bold">
                    ${{ formatNumber(item.costPrice * item.quantity) }}
                  </div>

                  <!-- Delete -->
                  <button class="delete-item-btn" @click="removeFromList(index)">
                    <TrashIcon :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Vendor details and checkout -->
      <div class="checkout-column">
        <div class="premium-card config-card">
          <h3 class="panel-title">Datos del Proveedor</h3>

          <!-- Supplier name -->
          <div class="form-group">
            <label for="supplier-name">Nombre del Proveedor / Razón Social:</label>
            <input 
              id="supplier-name" 
              type="text" 
              v-model="supplierName" 
              placeholder="Ej: Distribuidora Arcor" 
              class="premium-input font-bold"
            />
          </div>

          <!-- Currency selection -->
          <div class="form-group radio-group">
            <label>Divisa de Pago:</label>
            <div class="radio-buttons">
              <label class="radio-label" :class="{ 'selected': currency === 'PESOS' }">
                <input type="radio" value="PESOS" v-model="currency" />
                Pesos ($)
              </label>
              <label class="radio-label" :class="{ 'selected': currency === 'USD' }">
                <input type="radio" value="USD" v-model="currency" />
                Dólares (u$s)
              </label>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="purchase-notes">Notas / Observaciones:</label>
            <input 
              id="purchase-notes" 
              type="text" 
              v-model="notes" 
              placeholder="Ej: Factura A Nro. 0002..." 
              class="premium-input"
            />
          </div>
        </div>

        <!-- Totals & Checkout -->
        <div class="premium-card summary-card">
          <div class="totals-panel">
            <div class="total-row total-pay font-bold">
              <span>Total Compra:</span>
              <span class="font-mono text-danger">
                {{ currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(listTotal) }}
                <span class="currency-label">{{ currency }}</span>
              </span>
            </div>
          </div>

          <button 
            class="btn btn-danger checkout-btn" 
            @click="submitPurchase" 
            :disabled="itemsList.length === 0 || submitting"
          >
            <CheckCircleIcon :size="20" />
            {{ submitting ? 'Registrando Compra...' : 'Ingresar Mercadería' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="isSuccessModalOpen" @click.self="closeSuccessModal">
        <div class="modal-box success-modal premium-card animate-fade-in text-center">
          <div class="success-icon-container">
            <CheckIcon :size="48" class="success-icon" />
          </div>
          <h2 class="modal-title">¡Compra de Stock Registrada!</h2>
          <p class="modal-desc">
            El stock e información de costo de los productos se actualizaron de inmediato.
          </p>
  
          <div class="receipt-summary glass font-mono">
            <div class="receipt-row">
              <span>Proveedor:</span>
              <strong>{{ supplierName || 'Proveedor General' }}</strong>
            </div>
            <div class="receipt-row">
              <span>Productos Cargados:</span>
              <span>{{ itemsListCount }} ítems</span>
            </div>
            <div class="receipt-row total">
              <span>Total Pagado:</span>
              <strong class="text-danger">{{ currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(lastPurchaseTotal) }} {{ currency }}</strong>
            </div>
          </div>
  
          <div class="modal-actions">
            <button class="btn btn-primary" @click="closeSuccessModal">
              Cerrar y Cargar Otra Compra
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFetch } from '#app'
import { 
  Search as SearchIcon, 
  Trash as TrashIcon, 
  Check as CheckIcon, 
  CheckCircle as CheckCircleIcon 
} from 'lucide-vue-next'

const { data: products, refresh: refreshProducts } = await useFetch('/api/productos')

// State
const productSearch = ref('')
const searchOpen = ref(false)
const foundProducts = ref([])

const itemsList = ref([]) // items: { product, quantity, costPrice }
const supplierName = ref('')
const currency = ref('PESOS')
const notes = ref('')

const submitting = ref(false)
const isSuccessModalOpen = ref(false)
const lastPurchaseTotal = ref(0)
const itemsListCount = ref(0)

// Search handler
function onSearchInput() {
  const query = productSearch.value.toLowerCase().trim()
  if (!query) {
    foundProducts.value = []
    searchOpen.value = false
    return
  }

  if (!products.value) return

  foundProducts.value = products.value.filter(p => {
    return (
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query))
    )
  }).slice(0, 5)

  searchOpen.value = true
}

// Add to restocking list
function addProductToRestock(prod) {
  productSearch.value = ''
  foundProducts.value = []
  searchOpen.value = false

  const index = itemsList.value.findIndex(item => item.product.id === prod.id)
  
  if (index !== -1) {
    itemsList.value[index].quantity++
  } else {
    itemsList.value.push({
      product: prod,
      quantity: 1,
      costPrice: Number(prod.cost)
    })
  }
}

// Qty math
function validateQty(idx) {
  const item = itemsList.value[idx]
  if (item.quantity < 1 || isNaN(item.quantity)) {
    item.quantity = 1
  }
}

const listTotal = computed(() => {
  return itemsList.value.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
})

function removeFromList(idx) {
  itemsList.value.splice(idx, 1)
}

function clearList() {
  itemsList.value = []
}

function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Checkout Submit
async function submitPurchase() {
  if (itemsList.value.length === 0) return
  submitting.value = true

  const purchaseBody = {
    supplierName: supplierName.value,
    totalAmount: listTotal.value,
    currency: currency.value,
    notes: notes.value,
    items: itemsList.value.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      costPrice: item.costPrice
    }))
  }

  try {
    const res = await $fetch('/api/compras', {
      method: 'POST',
      body: purchaseBody
    })

    if (res) {
      lastPurchaseTotal.value = Number(purchaseBody.totalAmount)
      itemsListCount.value = itemsList.value.length
      isSuccessModalOpen.value = true
      clearList()
      supplierName.value = ''
      notes.value = ''
      await refreshProducts() // reload stock values in state
    }
  } catch (err) {
    alert("Error al cargar la compra: " + err.message)
  } finally {
    submitting.value = false
  }
}

function closeSuccessModal() {
  isSuccessModalOpen.value = false
}
</script>

<style scoped>
.purchases-stock-page {
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

/* Split grid */
.pos-grid {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 992px) {
  .pos-grid {
    grid-template-columns: 1fr;
  }
}

.panel-title {
  font-size: 1.15rem;
  font-family: var(--font-family-title);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

/* Left column restocking */
.cart-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-controls {
  position: relative;
  width: 100%;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 42px;
  border-radius: 8px;
  border: 1px solid var(--soft-fawn);
  background-color: var(--floral-white);
  color: var(--text-primary);
  outline: none;
  font-size: 0.95rem;
}

.search-input:focus {
  border-color: var(--amber-honey);
  background-color: var(--white);
  box-shadow: 0 0 0 3px rgba(232, 174, 31, 0.1);
}

/* Suggestions dropdown */
.search-results-overlay {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--soft-fawn);
  z-index: 10;
  margin-top: 6px;
  overflow: hidden;
  max-height: 250px;
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
  background-color: rgba(233, 215, 155, 0.2);
}

.result-identity {
  display: flex;
  flex-direction: column;
}

.result-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.result-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.result-pricing-stock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.result-stock {
  font-size: 0.75rem;
  font-weight: 600;
}

.result-price {
  font-weight: 700;
  font-size: 0.88rem;
}

/* Restock cart list */
.cart-items-card {
  min-height: 380px;
  display: flex;
  flex-direction: column;
}

.cart-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.clear-cart-btn {
  background: none;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.clear-cart-btn:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.clear-cart-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  text-decoration: none;
}

.cart-items-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.empty-cart-state {
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 16px;
}

.empty-cart-icon {
  font-size: 3rem;
  opacity: 0.7;
}

.empty-cart-state p {
  font-weight: 700;
  color: var(--text-secondary);
}

.empty-cart-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Items List details */
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background-color: var(--floral-white);
  border-radius: 12px;
  border: 1px solid rgba(208, 180, 111, 0.15);
  flex-wrap: wrap;
  gap: 16px;
}

.cart-item-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 150px;
}

.cart-item-info .name {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.92rem;
}

.cart-item-info .sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.stock-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.input-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-lbl {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.qty-field {
  width: 70px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--soft-fawn);
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
  outline: none;
}

.cost-field {
  width: 90px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--soft-fawn);
  text-align: right;
  font-weight: 700;
  font-size: 0.9rem;
  outline: none;
}

.qty-field:focus, .cost-field:focus {
  border-color: var(--amber-honey);
  background-color: var(--white);
}

.subtotal-display {
  font-size: 0.95rem;
  width: 90px;
  text-align: right;
  color: var(--text-primary);
}

.delete-item-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.delete-item-btn:hover {
  color: var(--color-danger);
  background-color: rgba(217, 83, 79, 0.1);
}

/* Right column checkout */
.checkout-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* Radio buttons styled grid */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.radio-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--soft-fawn);
  background-color: var(--white);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  transition: all 0.2s ease;
  user-select: none;
}

.radio-label input {
  display: none;
}

.radio-label.selected {
  border-color: var(--color-danger);
  background-color: rgba(217, 83, 79, 0.1);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

/* Totals panel */
.totals-panel {
  margin-bottom: 20px;
  padding-bottom: 4px;
}

.total-row.total-pay {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
}

.total-pay .text-danger {
  font-size: 1.45rem;
  font-family: var(--font-family-title);
  color: var(--color-danger);
}

.total-pay .currency-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 700;
  margin-left: 2px;
}

.checkout-btn {
  width: 100%;
  padding: 14px;
  font-size: 1.05rem;
  border-radius: 12px;
}

/* Success modal details */
.success-modal {
  max-width: 440px !important;
  padding: 30px 24px !important;
}

.success-icon-container {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: rgba(217, 83, 79, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.success-icon {
  color: var(--color-danger);
}

.modal-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.receipt-summary {
  background-color: var(--floral-white);
  border: 1px solid var(--soft-fawn);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  font-size: 0.85rem;
  margin-bottom: 24px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
}

.receipt-row.total {
  border-top: 1px dashed var(--soft-fawn);
  padding-top: 8px;
  font-size: 0.95rem;
}

.text-center { text-align: center; }
.modal-actions {
  display: flex;
  justify-content: center;
}
</style>
