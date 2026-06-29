<template>
  <div class="clients-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <span class="sub-heading">Administración de Cartera</span>
        <h1 class="main-title">Clientes & Cuentas Corrientes</h1>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <PlusIcon :size="18" />
        Nuevo Cliente
      </button>
    </div>

    <!-- Filters Panel -->
    <div class="filters-panel glass">
      <div class="search-box">
        <SearchIcon :size="18" class="search-icon" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Buscar por nombre, correo o CUIT..." 
          class="search-input"
        />
      </div>

      <div class="stats-badge bg-fawn">
        <span>Clientes Activos: <strong>{{ filteredClients.length }}</strong></span>
      </div>
    </div>

    <!-- Clients Table -->
    <div class="premium-table-container">
      <table class="premium-table">
        <thead>
          <tr>
            <th @click="sortBy('name')" class="sortable-header">
              Nombre / Razón Social
              <span v-if="sortKey === 'name'">{{ sortAsc ? '▲' : '▼' }}</span>
              <span v-else class="sort-placeholder">↕</span>
            </th>
            <th @click="sortBy('email')" class="sortable-header">
              Contacto
              <span v-if="sortKey === 'email'">{{ sortAsc ? '▲' : '▼' }}</span>
              <span v-else class="sort-placeholder">↕</span>
            </th>
            <th @click="sortBy('taxId')" class="sortable-header">
              CUIT / CUIL
              <span v-if="sortKey === 'taxId'">{{ sortAsc ? '▲' : '▼' }}</span>
              <span v-else class="sort-placeholder">↕</span>
            </th>
            <th @click="sortBy('balancePesos')" class="sortable-header text-right text-success">
              Saldo Pesos ($)
              <span v-if="sortKey === 'balancePesos'">{{ sortAsc ? '▲' : '▼' }}</span>
              <span v-else class="sort-placeholder">↕</span>
            </th>
            <th @click="sortBy('balanceUsd')" class="sortable-header text-right text-honey">
              Saldo Dólares (u$s)
              <span v-if="sortKey === 'balanceUsd'">{{ sortAsc ? '▲' : '▼' }}</span>
              <span v-else class="sort-placeholder">↕</span>
            </th>
            <th @click="sortBy('active')" class="sortable-header text-center">
              Estado CC
              <span v-if="sortKey === 'active'">{{ sortAsc ? '▲' : '▼' }}</span>
              <span v-else class="sort-placeholder">↕</span>
            </th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredClients.length === 0">
            <td colspan="7" class="text-center text-muted py-8">
              No se encontraron clientes.
            </td>
          </tr>
          <tr v-for="cust in filteredClients" :key="cust.id">
            <td>
              <div class="cust-identity">
                <NuxtLink :to="`/clientes/${cust.id}`" class="cust-name-link">
                  {{ cust.name }}
                </NuxtLink>
                <span class="cust-address text-muted">{{ cust.address ? cust.address : 'Sin Dirección' }}</span>
              </div>
            </td>
            <td>
              <div class="cust-contact">
                <span class="phone font-bold">{{ cust.phone ? cust.phone : '-' }}</span>
                <span class="email text-muted">{{ cust.email ? cust.email : '' }}</span>
              </div>
            </td>
            <td class="font-mono">{{ cust.taxId ? cust.taxId : '-' }}</td>
            <td class="text-right font-mono font-bold" :class="cust.balancePesos > 0 ? 'text-danger' : 'text-success'">
              ${{ formatNumber(cust.balancePesos) }} ARS
            </td>
            <td class="text-right font-mono font-bold" :class="cust.balanceUsd > 0 ? 'text-danger' : 'text-success'">
              u$s{{ formatNumber(cust.balanceUsd) }} USD
            </td>
            <td class="text-center">
              <span 
                class="badge" 
                :class="(cust.balancePesos > 0 || cust.balanceUsd > 0) ? 'badge-warning' : 'badge-success'"
              >
                {{ (cust.balancePesos > 0 || cust.balanceUsd > 0) ? 'Con Deuda' : 'Al Día' }}
              </span>
            </td>
            <td class="text-center">
              <div class="actions-cell">
                <NuxtLink :to="`/clientes/${cust.id}`" class="action-view-btn" title="Ver Cuenta Corriente">
                  <BookOpenIcon :size="16" />
                </NuxtLink>
                <button class="action-edit-btn" @click="openEditModal(cust)" title="Editar Perfil">
                  <EditIcon :size="16" />
                </button>
                <button class="action-delete-btn" @click="deleteClient(cust.id)" title="Eliminar Cliente">
                  <TrashIcon :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Client Modal Form (Create / Edit) -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="isModalOpen" @click.self="closeModal">
        <div class="modal-box premium-card animate-fade-in">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ isEditing ? 'Editar Ficha de Cliente' : 'Cargar Nuevo Cliente' }}
          </h2>
          <button class="modal-close-btn" @click="closeModal">
            <XIcon :size="20" />
          </button>
        </div>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-group">
            <label for="c-name">Nombre / Razón Social *</label>
            <input 
              id="c-name" 
              type="text" 
              v-model="form.name" 
              required 
              placeholder="Ej: Distribuidora Oeste S.A."
              class="premium-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="c-tax">CUIT / CUIL / Identificación Tributaria</label>
              <input 
                id="c-tax" 
                type="text" 
                v-model="form.taxId" 
                placeholder="Ej: 30-76543210-9"
                class="premium-input font-mono"
              />
            </div>
            <div class="form-group">
              <label for="c-phone">Teléfono / Celular</label>
              <input 
                id="c-phone" 
                type="text" 
                v-model="form.phone" 
                placeholder="Ej: +54 9 11 3422-9900"
                class="premium-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="c-email">Correo Electrónico</label>
            <input 
              id="c-email" 
              type="email" 
              v-model="form.email" 
              placeholder="Ej: administracion@empresa.com"
              class="premium-input"
            />
          </div>

          <div class="form-group">
            <label for="c-address">Dirección Física / Entrega</label>
            <input 
              id="c-address" 
              type="text" 
              v-model="form.address" 
              placeholder="Ej: Av. Rivadavia 4500, CABA"
              class="premium-input"
            />
          </div>

          <div class="form-group checkbox-group" v-if="isEditing">
            <input 
              id="c-active" 
              type="checkbox" 
              v-model="form.active" 
              class="premium-checkbox"
            />
            <label for="c-active" class="checkbox-label">Cliente activo (Habilitar ventas y CC)</label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : (isEditing ? 'Guardar Ficha' : 'Crear Cliente') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFetch } from '#app'
import { 
  Plus as PlusIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  X as XIcon, 
  BookOpen as BookOpenIcon,
  Trash as TrashIcon
} from 'lucide-vue-next'

const { data: clients, refresh } = await useFetch('/api/clientes')

// State
const searchQuery = ref('')
const isModalOpen = ref(false)
const isEditing = ref(false)
const submitting = ref(false)

const form = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  taxId: '',
  active: true
})

// Filtered clients list
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

// Filtered clients list
const filteredClients = computed(() => {
  if (!clients.value) return []
  const filtered = clients.value.filter(c => {
    const query = searchQuery.value.trim()
    const matchesSearch = !query ||
      fuzzyMatch(c.name, query) ||
      fuzzyMatch(c.email, query) ||
      fuzzyMatch(c.phone, query) ||
      fuzzyMatch(c.address, query) ||
      fuzzyMatch(c.taxId, query) ||
      fuzzyMatch(c.balancePesos?.toString(), query) ||
      fuzzyMatch(c.balanceUsd?.toString(), query) ||
      fuzzyMatch(c.active ? 'activo' : 'inactivo', query)
      
    return matchesSearch
  })

  // Sort
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

function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Modal actions
function openCreateModal() {
  isEditing.value = false
  form.value = {
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    active: true
  }
  isModalOpen.value = true
}

function openEditModal(cust) {
  isEditing.value = true
  form.value = {
    id: cust.id,
    name: cust.name,
    email: cust.email || '',
    phone: cust.phone || '',
    address: cust.address || '',
    taxId: cust.taxId || '',
    active: cust.active
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

// Submit
async function submitForm() {
  submitting.value = true
  try {
    const url = isEditing.value ? `/api/clientes/${form.value.id}` : '/api/clientes'
    const method = isEditing.value ? 'PUT' : 'POST'
    
    await $fetch(url, {
      method,
      body: form.value
    })
    
    await refresh()
    closeModal()
  } catch (err) {
    alert("Error al guardar cliente: " + err.message)
  } finally {
    submitting.value = false
  }
}

async function deleteClient(id) {
  if (!confirm("¿Está seguro que desea eliminar este cliente?")) return
  
  try {
    await $fetch(`/api/clientes/${id}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (err) {
    alert("Error al eliminar el cliente: " + err.message)
  }
}
</script>

<style scoped>
.clients-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* Filters */
.filters-panel {
  display: flex;
  padding: 16px 20px;
  border-radius: 14px;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: var(--shadow-sm);
}

.search-box {
  position: relative;
  flex-grow: 1;
  max-width: 400px;
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
  padding: 10px 16px 10px 42px;
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

.stats-badge {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.bg-fawn {
  background-color: rgba(208, 180, 111, 0.15);
  border: 1px solid rgba(208, 180, 111, 0.3);
}

/* Table identity cells */
.cust-identity {
  display: flex;
  flex-direction: column;
}

.cust-name-link {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 1rem;
  text-decoration: none;
}

.cust-name-link:hover {
  color: #b08110;
  text-decoration: underline;
}

.cust-address {
  font-size: 0.75rem;
  font-weight: 550;
  margin-top: 2px;
}

.cust-contact {
  display: flex;
  flex-direction: column;
}

.cust-contact .phone {
  font-size: 0.88rem;
  color: var(--text-primary);
}

.cust-contact .email {
  font-size: 0.75rem;
  font-weight: 550;
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-mono { font-family: monospace, Courier, monospace; }
.font-bold { font-weight: 700; }
.text-danger { color: var(--color-danger); }
.text-success { color: var(--sage-green); }
.text-honey { color: #b88b0f; }

.actions-cell {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.action-view-btn, .action-edit-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-view-btn:hover {
  background-color: rgba(105, 147, 97, 0.15);
  color: var(--sage-green);
}

.action-edit-btn:hover {
  background-color: var(--vanilla-custard);
  color: var(--text-primary);
}

.action-delete-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.action-delete-btn:hover {
  background-color: rgba(217, 83, 79, 0.15);
  color: var(--color-danger);
}

/* Modal form overlay */
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
  max-width: 550px;
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

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
}

.premium-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--amber-honey);
  cursor: pointer;
}

.checkbox-label {
  cursor: pointer;
  user-select: none;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
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
