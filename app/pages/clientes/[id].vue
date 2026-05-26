<template>
  <div class="client-detail-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/clientes" class="back-link">
        ← Volver a Clientes
      </NuxtLink>
    </div>

    <!-- Header Section -->
    <div class="page-header" v-if="client">
      <div>
        <span class="sub-heading">Ficha de Cuenta Corriente</span>
        <h1 class="main-title">{{ client.name }}</h1>
        <p class="tax-id-lbl" v-if="client.taxId">CUIT/CUIL: <strong>{{ client.taxId }}</strong></p>
      </div>

      <!-- Action buttons -->
      <div class="header-actions">
        <button class="btn btn-success" @click="openPaymentModal">
          <DollarIcon :size="18" />
          Registrar Cobro / Pago
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="pending" class="loading-state text-center text-muted">
      Cargando información del cliente...
    </div>

    <div v-else class="error-state text-center text-muted">
      Cliente no encontrado o error al cargar datos.
    </div>

    <!-- Main Content Panels -->
    <div class="main-grid" v-if="client">
      
      <!-- Left side: Client info card and Balance summary cards -->
      <div class="info-sidebar">
        <!-- 1. Profile Details Card -->
        <div class="premium-card profile-card">
          <h3 class="panel-title">Datos de Contacto</h3>
          
          <div class="profile-details">
            <div class="detail-item">
              <span class="lbl">Teléfono:</span>
              <span class="val">{{ client.phone ? client.phone : 'Sin Teléfono' }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Correo Electrónico:</span>
              <span class="val email">{{ client.email ? client.email : 'Sin Correo' }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Dirección:</span>
              <span class="val">{{ client.address ? client.address : 'Sin Dirección' }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Fecha Alta:</span>
              <span class="val">{{ formatDateShort(client.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Balance Summary Cards (Bimonetario) -->
        <div class="premium-card balance-card pesos">
          <span class="card-tag">Pesos</span>
          <span class="card-lbl">Saldo Deudor Acumulado</span>
          <div class="balance-value font-mono" :class="client.balancePesos > 0 ? 'text-danger' : 'text-success'">
            ${{ formatNumber(client.balancePesos) }} <span class="currency-tag">ARS</span>
          </div>
          <p class="balance-helper">
            {{ client.balancePesos > 0 ? 'El cliente adeuda este importe.' : 'Cuenta al día o a favor.' }}
          </p>
        </div>

        <div class="premium-card balance-card usd">
          <span class="card-tag usd">Dólares</span>
          <span class="card-lbl">Saldo Deudor Acumulado</span>
          <div class="balance-value font-mono" :class="client.balanceUsd > 0 ? 'text-danger' : 'text-success'">
            u$s{{ formatNumber(client.balanceUsd) }} <span class="currency-tag">USD</span>
          </div>
          <p class="balance-helper">
            {{ client.balanceUsd > 0 ? 'El cliente adeuda este importe en USD.' : 'Cuenta al día o a favor.' }}
          </p>
        </div>
      </div>

      <!-- Right side: Ledger History (Libro Diario) -->
      <div class="premium-card ledger-panel">
        <h3 class="panel-title">Libro Diario de Cuenta Corriente</h3>
        <span class="panel-sub">Historial cronológico de movimientos financieros</span>

        <div class="ledger-table-wrapper">
          <table class="premium-table ledger-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto / Detalle</th>
                <th class="text-center">Tipo</th>
                <th class="text-right text-danger">Debe (Venta)</th>
                <th class="text-right text-success">Haber (Cobro)</th>
                <th class="text-right">Saldo Resultante</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!client.transactions || client.transactions.length === 0">
                <td colspan="6" class="text-center text-muted py-8">
                  No se registran movimientos en la cuenta corriente de este cliente.
                </td>
              </tr>
              <tr v-for="tx in client.transactions" :key="tx.id">
                <td class="date-cell">{{ formatDate(tx.date) }}</td>
                <td>
                  <span class="desc font-bold">{{ tx.description }}</span>
                </td>
                <td class="text-center">
                  <span class="badge" :class="getTxTypeClass(tx.type)">
                    {{ getTxTypeLabel(tx.type) }}
                  </span>
                </td>
                
                <!-- DEBE (Increases debt - Sale to credit) -->
                <td class="text-right font-mono text-danger font-bold">
                  <span v-if="Number(tx.amount) > 0">
                    {{ tx.currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(tx.amount) }}
                  </span>
                  <span v-else>-</span>
                </td>

                <!-- HABER (Reduces debt - Payments) -->
                <td class="text-right font-mono text-success font-bold">
                  <span v-if="Number(tx.amount) < 0">
                    {{ tx.currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(Math.abs(tx.amount)) }}
                  </span>
                  <span v-else>-</span>
                </td>

                <!-- Accumulative Balance resulting -->
                <td class="text-right font-mono font-bold">
                  {{ tx.currency === 'PESOS' ? '$' : 'u$s' }}{{ formatNumber(tx.balanceAfter) }}
                  <span class="currency-tag">{{ tx.currency }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Register Payment Modal -->
    <div class="modal-overlay" v-if="isPaymentModalOpen" @click.self="closePaymentModal">
      <div class="modal-box premium-card animate-fade-in">
        <div class="modal-header">
          <h2 class="modal-title">Registrar Cobro de Cuenta Corriente</h2>
          <button class="modal-close-btn" @click="closePaymentModal">
            <XIcon :size="20" />
          </button>
        </div>

        <form @submit.prevent="submitPayment" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="p-type">Tipo de Operación *</label>
              <select id="p-type" v-model="paymentForm.type" required class="premium-input select-bold">
                <option value="PAYMENT">Cobro de Cuenta (Pago Recibido)</option>
                <option value="ADJUSTMENT">Ajuste de Cuenta (Corrección)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="p-amount">Monto Recibido *</label>
              <input 
                id="p-amount" 
                type="number" 
                v-model.number="paymentForm.amount" 
                step="0.01" 
                min="0.01" 
                required 
                class="premium-input font-mono"
                placeholder="Ej: 15000"
              />
            </div>
            
            <div class="form-group">
              <label for="p-curr">Moneda *</label>
              <select id="p-curr" v-model="paymentForm.currency" required class="premium-input">
                <option value="PESOS">Pesos ($)</option>
                <option value="USD">Dólares (u$s)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="p-method">Método de Cobro *</label>
            <select id="p-method" v-model="paymentForm.paymentMethod" required class="premium-input">
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia Bancaria</option>
              <option value="CARD">Tarjeta de Débito</option>
            </select>
          </div>

          <div class="form-group">
            <label for="p-desc">Descripción / Concepto *</label>
            <input 
              id="p-desc" 
              type="text" 
              v-model="paymentForm.description" 
              required 
              placeholder="Ej: Entrega de efectivo - Recibo #R-001"
              class="premium-input"
            />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closePaymentModal">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Registrar Cobro' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useFetch } from '#app'
import { 
  DollarSign as DollarIcon, 
  X as XIcon 
} from 'lucide-vue-next'

const route = useRoute()
const clientId = route.params.id

// Fetch client details
const { data: client, pending, refresh } = await useFetch(`/api/clientes/${clientId}`)

// Modal State
const isPaymentModalOpen = ref(false)
const submitting = ref(false)

const paymentForm = ref({
  type: 'PAYMENT',
  amount: null,
  currency: 'PESOS',
  paymentMethod: 'CASH',
  description: ''
})

// Formatters
function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
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

function formatDateShort(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// CC ledger type helpers
function getTxTypeLabel(type) {
  if (type === 'SALE') return 'Venta'
  if (type === 'PAYMENT') return 'Cobro'
  return 'Ajuste'
}

function getTxTypeClass(type) {
  if (type === 'SALE') return 'badge-danger'
  if (type === 'PAYMENT') return 'badge-success'
  return 'badge-info'
}

// Modal Handlers
function openPaymentModal() {
  paymentForm.value = {
    type: 'PAYMENT',
    amount: null,
    currency: 'PESOS',
    paymentMethod: 'CASH',
    description: ''
  }
  isPaymentModalOpen.value = true
}

function closePaymentModal() {
  isPaymentModalOpen.value = false
}

// Register Payment Submit
async function submitPayment() {
  submitting.value = true
  
  try {
    await $fetch(`/api/clientes/${clientId}`, {
      method: 'POST',
      body: paymentForm.value
    })
    
    await refresh()
    closePaymentModal()
  } catch (err) {
    alert("Error al registrar transacción: " + err.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.client-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Breadcrumb nav */
.breadcrumb {
  margin-bottom: -10px;
}

.back-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 700;
  transition: color 0.15s ease;
}

.back-link:hover {
  color: #b08110;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
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

.tax-id-lbl {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Grid layout */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 992px) {
  .main-grid {
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

.info-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Profile details */
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.detail-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-item .lbl {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.detail-item .val {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-item .val.email {
  word-break: break-all;
}

/* Balance Card (Bimonetario) */
.balance-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.balance-card.pesos {
  background-color: var(--white);
  border-left: 5px solid var(--border-focus);
}

.balance-card.usd {
  background-color: var(--white);
  border-left: 5px solid var(--sage-green);
}

.card-tag {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #b08110;
  background-color: rgba(232, 174, 31, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.card-tag.usd {
  color: var(--sage-green);
  background-color: rgba(105, 147, 97, 0.12);
}

.card-lbl {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-top: 4px;
}

.balance-value {
  font-size: 2.1rem;
  font-weight: 800;
  font-family: var(--font-family-title);
  line-height: 1;
}

.currency-tag {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 700;
  margin-left: 2px;
}

.balance-helper {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 4px;
  font-style: italic;
}

/* Ledger panel */
.ledger-panel {
  align-self: stretch;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.ledger-table-wrapper {
  flex-grow: 1;
  overflow-x: auto;
}

.ledger-table {
  font-size: 0.88rem;
}

.date-cell {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-mono { font-family: monospace, Courier, monospace; }
.font-bold { font-weight: 700; }
.text-danger { color: var(--color-danger); }
.text-success { color: var(--sage-green); }

/* Modal overlay forms */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(30, 28, 24, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  padding: 16px;
}

.modal-box {
  width: 100%;
  max-width: 500px;
  background-color: var(--white);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  padding: 0 !important;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--floral-white);
}

.modal-title {
  font-size: 1.25rem;
  font-family: var(--font-family-title);
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}

.modal-close-btn:hover {
  color: var(--text-primary);
}

.modal-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row > .form-group {
  flex: 1;
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

.select-bold {
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}
</style>
