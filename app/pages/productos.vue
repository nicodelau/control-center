<template>
  <div class="products-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <span class="sub-heading">Inventario Global</span>
        <h1 class="main-title">Productos</h1>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <PlusIcon :size="18" />
        Agregar Producto
      </button>
    </div>

    <!-- Filters Panel -->
    <div class="filters-panel glass">
      <div class="search-box">
        <SearchIcon :size="18" class="search-icon" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Buscar por código, nombre o marca..." 
          class="search-input"
        />
      </div>

      <div class="category-filter">
        <label for="cat-select" class="filter-label">Categoría:</label>
        <select id="cat-select" v-model="selectedCategory" class="filter-select">
          <option value="ALL">Todas las Categorías</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <!-- Quick stats in filter bar -->
      <div class="stats-badge bg-vanilla">
        <span>Productos Registrados: <strong>{{ filteredProducts.length }}</strong></span>
      </div>
    </div>

    <!-- Table -->
    <div class="premium-table-container">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Código / SKU</th>
            <th>Producto / Detalle</th>
            <th>Categoría</th>
            <th class="text-right">Costo</th>
            <th class="text-right">Precio Lista</th>
            <th class="text-right">Precio Efec</th>
            <th class="text-center">Stock</th>
            <th class="text-center">Estado</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="9" class="text-center text-muted py-8">
              No se encontraron productos que coincidan con la búsqueda.
            </td>
          </tr>
          <tr v-for="prod in filteredProducts" :key="prod.id">
            <td class="sku-cell font-mono">{{ prod.code }}</td>
            <td>
              <div class="prod-identity">
                <span class="prod-name">{{ prod.name }}</span>
                <span class="prod-meta">
                  {{ prod.brand ? prod.brand : 'Sin Marca' }} 
                  <span v-if="prod.weight">· {{ prod.weight }}</span>
                </span>
              </div>
            </td>
            <td>
              <span class="category-pill">{{ prod.category }}</span>
            </td>
            <td class="text-right font-mono">${{ formatNumber(prod.cost) }}</td>
            <td class="text-right font-mono text-primary font-bold">${{ formatNumber(prod.price) }}</td>
            <td class="text-right font-mono text-success font-bold">${{ formatNumber(prod.cashPrice) }}</td>
            <td class="text-center font-mono">
              <span 
                class="stock-badge"
                :class="prod.stock <= 0 ? 'out' : prod.stock < 5 ? 'low' : 'ok'"
              >
                {{ prod.stock }}
              </span>
            </td>
            <td class="text-center">
              <span class="badge" :class="prod.active ? 'badge-success' : 'badge-danger'">
                {{ prod.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-center">
              <div class="actions-cell">
                <button class="action-edit-btn" @click="openEditModal(prod)" title="Editar">
                  <EditIcon :size="16" />
                </button>
                <button class="action-delete-btn" @click="deleteProduct(prod.id)" title="Eliminar">
                  <TrashIcon :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Product Modal Form (Create / Edit) -->
    <div class="modal-overlay" v-if="isModalOpen" @click.self="closeModal">
      <div class="modal-box premium-card animate-fade-in">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ isEditing ? 'Modificar Producto' : 'Nuevo Producto' }}
          </h2>
          <button class="modal-close-btn" @click="closeModal">
            <XIcon :size="20" />
          </button>
        </div>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="p-code">Código SKU / Barra *</label>
              <input 
                id="p-code" 
                type="text" 
                v-model="form.code" 
                required 
                placeholder="Ej: 7790123456789"
                class="premium-input font-mono"
              />
            </div>
            <div class="form-group">
              <label for="p-name">Nombre del Producto *</label>
              <input 
                id="p-name" 
                type="text" 
                v-model="form.name" 
                required 
                placeholder="Ej: Azúcar refinada"
                class="premium-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="p-brand">Marca</label>
              <input 
                id="p-brand" 
                type="text" 
                v-model="form.brand" 
                placeholder="Ej: Sweet Rial"
                class="premium-input"
              />
            </div>
            <div class="form-group">
              <label for="p-weight">Contenido Neto / Peso</label>
              <input 
                id="p-weight" 
                type="text" 
                v-model="form.weight" 
                placeholder="Ej: 5kg, 900g, 1.5L"
                class="premium-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="p-cat">Categoría</label>
              <input 
                id="p-cat" 
                type="text" 
                v-model="form.category" 
                placeholder="Ej: Azúcares, Harinas"
                class="premium-input"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                <option v-for="cat in categories" :key="cat" :value="cat" />
              </datalist>
            </div>
            <div class="form-group">
              <label for="p-stock">Stock Inicial</label>
              <input 
                id="p-stock" 
                type="number" 
                v-model.number="form.stock" 
                min="0" 
                class="premium-input"
              />
            </div>
          </div>

          <div class="form-row pricing-row">
            <div class="form-group">
              <label for="p-cost">Costo ($)</label>
              <input 
                id="p-cost" 
                type="number" 
                v-model.number="form.cost" 
                step="0.01" 
                min="0" 
                class="premium-input font-mono"
              />
            </div>
            <div class="form-group focus-honey">
              <label for="p-price" class="text-honey-bold">Precio Lista ($)</label>
              <input 
                id="p-price" 
                type="number" 
                v-model.number="form.price" 
                step="0.01" 
                min="0" 
                class="premium-input font-mono price-input-lista"
              />
            </div>
            <div class="form-group focus-green">
              <label for="p-cash" class="text-success-bold">Precio Efectivo ($)</label>
              <input 
                id="p-cash" 
                type="number" 
                v-model.number="form.cashPrice" 
                step="0.01" 
                min="0" 
                class="premium-input font-mono price-input-efec"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="p-desc">Descripción (Opcional)</label>
            <textarea 
              id="p-desc" 
              v-model="form.description" 
              placeholder="Detalles sobre el producto..."
              class="premium-input text-area"
              rows="2"
            ></textarea>
          </div>

          <div class="form-group checkbox-group" v-if="isEditing">
            <input 
              id="p-active" 
              type="checkbox" 
              v-model="form.active" 
              class="premium-checkbox"
            />
            <label for="p-active" class="checkbox-label">Producto disponible para la venta</label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto') }}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  Trash as TrashIcon
} from 'lucide-vue-next'

// Fetch products from server route
const { data: products, refresh } = await useFetch('/api/productos')

// State
const searchQuery = ref('')
const selectedCategory = ref('ALL')
const isModalOpen = ref(false)
const isEditing = ref(false)
const submitting = ref(false)

const form = ref({
  id: '',
  code: '',
  name: '',
  brand: '',
  weight: '',
  category: 'General',
  stock: 0,
  cost: 0,
  price: 0,
  cashPrice: 0,
  description: '',
  active: true
})

// Categories dynamic list from products
const categories = computed(() => {
  if (!products.value) return []
  const cats = products.value.map(p => p.category)
  return [...new Set(cats)].sort()
})

// Filtered products list
const filteredProducts = computed(() => {
  if (!products.value) return []
  
  return products.value.filter(p => {
    // 1. Search filter
    const query = searchQuery.value.toLowerCase().trim()
    const matchesSearch = 
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query))
      
    // 2. Category filter
    const matchesCategory = 
      selectedCategory.value === 'ALL' || 
      p.category === selectedCategory.value

    return matchesSearch && matchesCategory
  })
})

function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Modal Handlers
function openCreateModal() {
  isEditing.value = false
  form.value = {
    id: '',
    code: '',
    name: '',
    brand: '',
    weight: '',
    category: 'General',
    stock: 0,
    cost: 0,
    price: 0,
    cashPrice: 0,
    description: '',
    active: true
  }
  isModalOpen.value = true
}

function openEditModal(prod) {
  isEditing.value = true
  form.value = {
    id: prod.id,
    code: prod.code,
    name: prod.name,
    brand: prod.brand || '',
    weight: prod.weight || '',
    category: prod.category,
    stock: prod.stock,
    cost: Number(prod.cost),
    price: Number(prod.price),
    cashPrice: Number(prod.cashPrice),
    description: prod.description || '',
    active: prod.active
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

// Submit handler
async function submitForm() {
  submitting.value = true
  
  try {
    const url = '/api/productos'
    const method = isEditing.value ? 'PUT' : 'POST'
    
    await $fetch(url, {
      method,
      body: form.value
    })
    
    // Refresh and close
    await refresh()
    closeModal()
  } catch (err) {
    alert("Error al guardar el producto: " + err.message)
  } finally {
    submitting.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm("¿Está seguro que desea eliminar este producto?")) return
  
  try {
    await $fetch(`/api/productos?id=${id}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (err) {
    alert("Error al eliminar el producto: " + err.message)
  }
}
</script>

<style scoped>
.products-page {
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

.category-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.filter-select {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--soft-fawn);
  background-color: var(--white);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  border-color: var(--amber-honey);
}

.stats-badge {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.bg-vanilla {
  background-color: rgba(233, 215, 155, 0.2);
  border: 1px solid rgba(208, 180, 111, 0.3);
}

/* Custom Table Layout */
.sku-cell {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.prod-identity {
  display: flex;
  flex-direction: column;
}

.prod-name {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.prod-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 550;
  margin-top: 2px;
}

.category-pill {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--floral-white);
  border: 1px solid rgba(208, 180, 111, 0.15);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-mono { font-family: monospace, Courier, monospace; }
.font-bold { font-weight: 700; }

.stock-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
}

.stock-badge.ok {
  background-color: rgba(105, 147, 97, 0.15);
  color: var(--sage-green);
}

.stock-badge.low {
  background-color: rgba(232, 174, 31, 0.15);
  color: #c9930f;
}

.stock-badge.out {
  background-color: rgba(217, 83, 79, 0.15);
  color: var(--color-danger);
}

.actions-cell {
  display: flex;
  justify-content: center;
}

.action-edit-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
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

/* Modal Form Overlay */
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
  max-width: 600px;
  background-color: var(--white);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  padding: 0 !important; /* Handle structure locally */
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
  max-height: calc(90vh - 80px);
  overflow-y: auto;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-row > .form-group {
  flex: 1;
  min-width: 200px;
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

.text-honey-bold {
  color: #b88b0f !important;
}

.text-success-bold {
  color: var(--sage-green) !important;
}

.pricing-row .premium-input {
  border-width: 1.5px;
}

.price-input-lista {
  border-color: var(--soft-fawn);
}

.price-input-lista:focus {
  border-color: var(--amber-honey);
  box-shadow: 0 0 0 3px rgba(232, 174, 31, 0.15);
}

.price-input-efec {
  border-color: rgba(105, 147, 97, 0.4);
}

.price-input-efec:focus {
  border-color: var(--sage-green);
  box-shadow: 0 0 0 3px rgba(105, 147, 97, 0.15);
}

.text-area {
  resize: vertical;
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
</style>
