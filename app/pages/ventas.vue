<template>
  <div class="sales-billing-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <span class="sub-heading">Facturación</span>
        <h1 class="main-title">Nueva Venta (POS)</h1>
      </div>
    </div>

    <!-- POS Main Grid -->
    <div class="pos-grid">
      
      <!-- Left column: Shopping Cart and Product Selector -->
      <div class="cart-column">
        <!-- 1. Product Search & Quick add -->
        <div class="premium-card search-card">
          <h3 class="panel-title">Buscar Productos</h3>
          <div class="search-controls">
            <div class="search-box">
              <SearchIcon :size="18" class="search-icon" />
              <input 
                type="text" 
                v-model="productSearch" 
                placeholder="Escribe SKU, nombre o marca..." 
                class="search-input"
                @input="onProductSearchInput"
              />
            </div>
            
            <!-- Floating results panel -->
            <div class="search-results-overlay glass" v-if="searchDropdownOpen && foundProducts.length > 0">
              <div 
                v-for="prod in foundProducts" 
                :key="prod.id"
                class="search-result-item"
                :class="{ 'out-of-stock': prod.stock <= 0 }"
                @click="addToCart(prod)"
              >
                <div class="result-identity">
                  <span class="result-name">{{ prod.name }}</span>
                  <span class="result-meta">
                    {{ prod.brand ? prod.brand : 'Sin Marca' }} · {{ prod.weight ? prod.weight : '' }} · SKU: {{ prod.code }}
                  </span>
                </div>
                <div class="result-pricing-stock">
                  <span class="result-stock">Stock: {{ prod.stock }}</span>
                  <span class="result-price text-success">${{ formatNumber(currency === 'PESOS' ? (priceType === 'lista' ? prod.price : prod.cashPrice) : (priceType === 'lista' ? prod.price : prod.cashPrice) / 1000) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Cart Items List -->
        <div class="premium-card cart-items-card">
          <div class="cart-header-row">
            <h3 class="panel-title">Detalle del Carrito</h3>
            <button 
              class="clear-cart-btn text-danger" 
              @click="clearCart"
              :disabled="cart.length === 0"
            >
              Vaciar Carrito
            </button>
          </div>

          <div class="cart-items-wrapper">
            <div v-if="cart.length === 0" class="empty-cart-state">
              <span class="empty-cart-icon">🛒</span>
              <p>El carrito de compras está vacío.</p>
              <span class="empty-cart-sub">Busca y selecciona productos arriba para comenzar a vender.</span>
            </div>

            <div v-else class="cart-list">
              <div 
                v-for="(item, index) in cart" 
                :key="item.product.id" 
                class="cart-item"
              >
                <div class="cart-item-info">
                  <span class="name">{{ item.product.name }}</span>
                  <span class="sub">
                    {{ item.product.brand ? item.product.brand : 'Sin Marca' }} · {{ item.product.weight ? item.product.weight : '' }}
                  </span>
                  <span class="price-type-indicator">
                    Precio {{ priceType === 'lista' ? 'Lista' : 'Efectivo' }}
                  </span>
                </div>

                <div class="cart-item-controls">
                  <!-- Price input for custom specials -->
                  <div class="price-control">
                    <label class="price-lbl">Precio U.:</label>
                    <div class="price-input-wrapper-inner">
                      <span class="price-symbol-inner">$</span>
                      <input 
                        type="number" 
                        v-model.number="item.price" 
                        min="0.01" 
                        step="0.01"
                        class="price-edit-input font-mono"
                      />
                    </div>
                  </div>

                  <!-- Quantity selector -->
                  <div class="qty-control">
                    <button class="qty-btn" @click="decrementQty(index)">-</button>
                    <input 
                      type="number" 
                      v-model.number="item.quantity" 
                      min="1" 
                      :max="item.product.stock"
                      class="qty-input font-mono"
                      @change="validateItemQty(index)"
                    />
                    <button class="qty-btn" @click="incrementQty(index)">+</button>
                  </div>

                  <!-- Subtotal -->
                  <div class="subtotal-display font-mono font-bold">
                    ${{ formatNumber(item.price * item.quantity) }}
                  </div>

                  <!-- Delete button -->
                  <button class="delete-item-btn" @click="removeFromCart(index)">
                    <TrashIcon :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: Customer, checkout configuration, and summary -->
      <div class="checkout-column">
        <!-- 1. Customer Select -->
        <div class="premium-card customer-card">
          <h3 class="panel-title">Cliente & Cuenta</h3>
          
          <div class="form-group">
            <label for="c-select">Seleccionar Cliente:</label>
            <select id="c-select" v-model="selectedClientId" class="premium-input select-cust" @change="onClientChange">
              <option value="CONSUMIDOR_FINAL">Consumidor Final (Venta Rápida)</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.name }} {{ c.taxId ? `(CUIT: ${c.taxId})` : '' }}
              </option>
            </select>
          </div>

          <!-- Customer details & Balance alert -->
          <div 
            v-if="activeClient && activeClient.id !== 'CONSUMIDOR_FINAL'" 
            class="client-summary-box glass"
          >
            <p class="summary-row">
              <span class="label">Balance Pesos:</span>
              <span class="val font-mono" :class="activeClient.balancePesos > 0 ? 'text-danger' : 'text-success'">
                ${{ formatNumber(activeClient.balancePesos) }} ARS
              </span>
            </p>
            <p class="summary-row">
              <span class="label">Balance Dólares:</span>
              <span class="val font-mono" :class="activeClient.balanceUsd > 0 ? 'text-danger' : 'text-success'">
                u$s{{ formatNumber(activeClient.balanceUsd) }} USD
              </span>
            </p>
            <p class="summary-note">El cliente compra bajo cuenta corriente.</p>
          </div>
        </div>

        <!-- 2. Billing & Price Settings -->
        <div class="premium-card config-card">
          <h3 class="panel-title">Configuración de Cobro</h3>

          <!-- Currency selection -->
          <div class="form-group radio-group">
            <label>Divisa de Cobro:</label>
            <div class="radio-buttons">
              <label class="radio-label" :class="{ 'selected': currency === 'PESOS' }">
                <input type="radio" value="PESOS" v-model="currency" @change="onSettingsChange" />
                Pesos ($)
              </label>
              <label class="radio-label" :class="{ 'selected': currency === 'USD' }">
                <input type="radio" value="USD" v-model="currency" @change="onSettingsChange" />
                Dólares (u$s)
              </label>
            </div>
          </div>

          <!-- Pricing tier selection -->
          <div class="form-group radio-group">
            <label>Tipo de Precio Aplicado:</label>
            <div class="radio-buttons">
              <label class="radio-label" :class="{ 'selected': priceType === 'lista' }">
                <input type="radio" value="lista" v-model="priceType" @change="onSettingsChange" />
                Lista
              </label>
              <label class="radio-label" :class="{ 'selected': priceType === 'efectivo' }">
                <input type="radio" value="efectivo" v-model="priceType" @change="onSettingsChange" />
                Efectivo (-10%)
              </label>
            </div>
          </div>

          <!-- Payment method selection -->
          <div class="form-group">
            <label for="pay-method">Método de Pago:</label>
            <select id="pay-method" v-model="paymentMethod" class="premium-input select-pay">
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia Bancaria</option>
              <option value="CARD">Tarjeta Débito/Crédito</option>
              <option 
                value="CUENTA_CORRIENTE" 
                :disabled="!selectedClientId || selectedClientId === 'CONSUMIDOR_FINAL'"
              >
                Cuenta Corriente (A Cuenta)
              </option>
            </select>
            <span 
              v-if="selectedClientId === 'CONSUMIDOR_FINAL'" 
              class="validation-helper text-danger"
            >
              Selecciona un cliente para habilitar "Cuenta Corriente".
            </span>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="sale-notes">Notas / Observaciones:</label>
            <input 
              id="sale-notes" 
              type="text" 
              v-model="notes" 
              placeholder="Ej: Retira mañana..." 
              class="premium-input"
            />
          </div>
        </div>

        <!-- 3. Totals and Check Out Button -->
        <div class="premium-card summary-card">
          <div class="totals-panel">
            <div class="total-row subtotal">
              <span>Subtotal:</span>
              <span class="font-mono">${{ formatNumber(cartSubtotal) }}</span>
            </div>
            
            <div class="total-row total-pay font-bold">
              <span>Importe a Pagar:</span>
              <span class="font-mono text-success">
                {{ currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(cartSubtotal) }}
                <span class="currency-label">{{ currency }}</span>
              </span>
            </div>
          </div>

          <button 
            class="btn btn-success checkout-btn" 
            @click="submitSale" 
            :disabled="cart.length === 0 || submitting"
          >
            <CheckCircleIcon :size="20" />
            {{ submitting ? 'Procesando Venta...' : 'Confirmar y Cobrar' }}
          </button>
        </div>
      </div>

    </div>

    <!-- Billing Success Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="isSuccessModalOpen" @click.self="closeSuccessModal">
        <div class="modal-box success-modal premium-card animate-fade-in text-center">
          <div class="success-icon-container">
            <CheckIcon :size="48" class="success-icon" />
          </div>
          <h2 class="modal-title">¡Venta Registrada con Éxito!</h2>
          <p class="modal-desc">
            La transacción se ha asentado en el sistema correctamente.
          </p>
  
          <div class="receipt-summary glass font-mono">
            <div class="receipt-row">
              <span>Comprobante:</span>
              <strong>#{{ lastCreatedSale?.invoiceNumber }}</strong>
            </div>
            <div class="receipt-row">
              <span>Cliente:</span>
              <span>{{ activeClient?.name || 'Consumidor Final' }}</span>
            </div>
            <div class="receipt-row">
              <span>Método:</span>
              <span>{{ paymentMethod === 'CUENTA_CORRIENTE' ? 'A Cuenta Corriente' : paymentMethod }}</span>
            </div>
            <div class="receipt-row total">
              <span>Total Cobrado:</span>
              <strong class="text-success">{{ currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(lastCreatedSale?.totalAmount) }} {{ currency }}</strong>
            </div>
          </div>
  
          <div class="modal-actions">
            <button class="btn btn-primary" @click="closeSuccessModal">
              Cerrar e Iniciar Nueva Venta
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

// Fetch raw data
const { data: clients, refresh: refreshClients } = await useFetch('/api/clientes')
const { data: products } = await useFetch('/api/productos')

// State
const productSearch = ref('')
const searchDropdownOpen = ref(false)
const foundProducts = ref([])

const cart = ref([]) // items: { product, quantity, price }
const selectedClientId = ref('CONSUMIDOR_FINAL')
const currency = ref('PESOS')
const priceType = ref('lista') // 'lista' or 'efectivo'
const paymentMethod = ref('CASH')
const notes = ref('')

const submitting = ref(false)
const isSuccessModalOpen = ref(false)
const lastCreatedSale = ref(null)

// Computed active client details
const activeClient = computed(() => {
  if (selectedClientId.value === 'CONSUMIDOR_FINAL') {
    return { id: 'CONSUMIDOR_FINAL', name: 'Consumidor Final', balancePesos: 0, balanceUsd: 0 }
  }
  if (!clients.value) return null
  return clients.value.find(c => c.id === selectedClientId.value)
})

// Search event handler
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
  }).slice(0, 5) // limit 5 suggestions

  searchDropdownOpen.value = true
}

// Add item to cart
function addToCart(prod) {
  // Clear search field
  productSearch.value = ''
  foundProducts.value = []
  searchDropdownOpen.value = false

  // Check if product has stock
  if (prod.stock <= 0) {
    alert("¡Producto sin stock disponible!")
    return
  }

  // Check if item is already in cart
  const index = cart.value.findIndex(item => item.product.id === prod.id)
  
  // Calculate selected price based on currency and price tier
  const price = getPriceForSetting(prod)

  if (index !== -1) {
    if (cart.value[index].quantity < prod.stock) {
      cart.value[index].quantity++
    } else {
      alert("No puedes agregar más unidades que las disponibles en stock.")
    }
  } else {
    cart.value.push({
      product: prod,
      quantity: 1,
      price: price
    })
  }
}

// Compute dynamic price for a product
function getPriceForSetting(prod) {
  // If priceType is 'lista' use 'price'. If 'efectivo' use 'cashPrice'
  let price = priceType.value === 'lista' ? Number(prod.price) : Number(prod.cashPrice)

  // If currency is USD, we pesify/convert USD rough estimate.
  // Standard: if products pricing is stored in Pesos (default), we divide by a mock exchange rate of $1000 for USD!
  if (currency.value === 'USD') {
    price = price / 1000
  }
  
  return price
}

// Update prices inside cart when global settings (currency or priceType) change
function onSettingsChange() {
  cart.value.forEach(item => {
    item.price = getPriceForSetting(item.product)
  })

  // Validate payment method if CC is selected but client is invalid
  if (paymentMethod.value === 'CUENTA_CORRIENTE' && selectedClientId.value === 'CONSUMIDOR_FINAL') {
    paymentMethod.value = 'CASH'
  }
}

// Customer change handler
function onClientChange() {
  if (selectedClientId.value === 'CONSUMIDOR_FINAL' && paymentMethod.value === 'CUENTA_CORRIENTE') {
    paymentMethod.value = 'CASH'
  }
}

// Cart math
const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

// Cart item actions
function incrementQty(idx) {
  const item = cart.value[idx]
  if (item.quantity < item.product.stock) {
    item.quantity++
  }
}

function decrementQty(idx) {
  const item = cart.value[idx]
  if (item.quantity > 1) {
    item.quantity--
  }
}

function validateItemQty(idx) {
  const item = cart.value[idx]
  if (item.quantity < 1 || isNaN(item.quantity)) {
    item.quantity = 1
  }
  if (item.quantity > item.product.stock) {
    item.quantity = item.product.stock
    alert(`Ajustado a la cantidad máxima disponible (${item.product.stock}).`)
  }
}

function removeFromCart(idx) {
  cart.value.splice(idx, 1)
}

function clearCart() {
  cart.value = []
}

// Format numbers
function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Checkout Submit
async function submitSale() {
  if (cart.value.length === 0) return
  submitting.value = true

  const saleBody = {
    clientId: selectedClientId.value === 'CONSUMIDOR_FINAL' ? null : selectedClientId.value,
    totalAmount: cartSubtotal.value,
    currency: currency.value,
    paymentMethod: paymentMethod.value,
    notes: notes.value,
    items: cart.value.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.price,
      cost: currency.value === 'USD' ? Number(item.product.cost) / 1000 : Number(item.product.cost) // convert cost accordingly
    }))
  }

  try {
    const res = await $fetch('/api/ventas', {
      method: 'POST',
      body: saleBody
    })

    if (res) {
      lastCreatedSale.value = res
      isSuccessModalOpen.value = true
      clearCart()
      notes.value = ''
      await refreshClients() // refresh customer balances
    }
  } catch (err) {
    alert("Error al procesar la venta: " + err.message)
  } finally {
    submitting.value = false
  }
}

function closeSuccessModal() {
  isSuccessModalOpen.value = false
  lastCreatedSale.value = null
}
</script>

<style scoped>
.sales-billing-page {
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

/* POS Layout */
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

/* Left Column components */
.cart-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-controls {
  position: relative;
  width: 100%;
  z-index: 50;
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
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--amber-honey);
  background-color: var(--white);
  box-shadow: 0 0 0 3px rgba(232, 174, 31, 0.1);
}

/* Dropdown Overlay Results */
.search-results-overlay {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--soft-fawn);
  z-index: 100;
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

.search-result-item.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--floral-white);
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
  color: var(--text-secondary);
}

.result-price {
  font-weight: 700;
  font-size: 0.95rem;
}

/* Cart detailed panel */
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

/* Cart List */
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
  gap: 12px;
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

.price-type-indicator {
  align-self: flex-start;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b88b0f;
  margin-top: 4px;
  letter-spacing: 0.02em;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.price-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-lbl {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.price-input-wrapper-inner {
  position: relative;
  display: flex;
  align-items: center;
}

.price-symbol-inner {
  position: absolute;
  left: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
}

.price-edit-input {
  width: 95px;
  padding: 6px 10px 6px 18px;
  border-radius: 6px;
  border: 1px solid var(--soft-fawn);
  text-align: right;
  font-weight: 750;
  font-size: 0.88rem;
  outline: none;
  background-color: var(--white);
}

.price-edit-input:focus {
  border-color: var(--amber-honey);
  box-shadow: 0 0 0 2px rgba(232, 174, 31, 0.1);
}


.qty-control {
  display: inline-flex;
  align-items: center;
  background-color: var(--white);
  border: 1px solid var(--soft-fawn);
  border-radius: 8px;
  overflow: hidden;
}

.qty-btn {
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.qty-btn:hover {
  background-color: var(--floral-white);
}

.qty-input {
  width: 40px;
  border: none;
  border-left: 1px solid var(--soft-fawn);
  border-right: 1px solid var(--soft-fawn);
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 4px 0;
  outline: none;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.subtotal-display {
  font-size: 0.95rem;
  width: 85px;
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

/* Right Column Checkout Panel */
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

.select-cust {
  font-weight: 600;
}

.client-summary-box {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background-color: rgba(208, 180, 111, 0.1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.client-summary-box .summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 700;
}

.client-summary-box .summary-note {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 2px;
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
  border-color: var(--amber-honey);
  background-color: var(--vanilla-custard);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.select-pay {
  font-weight: 600;
}

.validation-helper {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 2px;
}

.text-danger {
  color: var(--color-danger);
}

/* Summary and Totals Panel */
.totals-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 2px dashed var(--border-color);
  padding-bottom: 16px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-row.subtotal {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.total-row.total-pay {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.total-pay .text-success {
  font-size: 1.45rem;
  font-family: var(--font-family-title);
  color: var(--sage-green);
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

/* Success Modal Details */
.success-modal {
  max-width: 440px !important;
  padding: 30px 24px !important;
}

.success-icon-container {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: rgba(105, 147, 97, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.success-icon {
  color: var(--sage-green);
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
