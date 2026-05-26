<template>
  <div class="dashboard-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <span class="sub-heading">Resumen del Estado de la Empresa</span>
        <h1 class="main-title">Dulce Victoria</h1>
      </div>
      
      <!-- DB Connection Badge -->
      <div 
        class="connection-badge" 
        :class="data?.isNeonConnected ? 'connected' : 'simulation'"
      >
        <span class="dot"></span>
        <span>
          {{ data?.isNeonConnected ? 'Base de Datos Activa (NeonDB)' : 'Modo Simulación (En Memoria)' }}
        </span>
      </div>
    </div>

    <!-- DB Helper Alert for User -->
    <div v-if="!data?.isNeonConnected" class="helper-banner glass">
      <div class="helper-content">
        <span class="helper-icon">💡</span>
        <p class="helper-text">
          Estás en **Modo Simulación** porque no se ha detectado una base de datos Postgres configurada. 
          Para persistir tus datos en NeonDB permanentemente, simplemente configura tu cadena de conexión en el archivo 
          <code>.env</code> como: <code>DATABASE_URL="tu_cadena_neon"</code> y reinicia. ¡Todo lo que cargues ahora funciona perfectamente!
        </p>
      </div>
    </div>

    <!-- Quick Financial Metrics Cards (Bimonetario) -->
    <div class="metrics-grid">
      <!-- 1. Ventas -->
      <div class="premium-card metric-card">
        <div class="metric-header">
          <span class="metric-label">Ventas Totales</span>
          <div class="icon-wrapper bg-success-light text-success">
            <TrendingUpIcon :size="20" />
          </div>
        </div>
        <div class="metric-values">
          <div class="currency-row">
            <span class="currency-symbol">$</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.sales?.pesos) }}</span>
            <span class="currency-tag">ARS</span>
          </div>
          <div class="currency-row usd">
            <span class="currency-symbol">u$s</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.sales?.usd) }}</span>
            <span class="currency-tag">USD</span>
          </div>
        </div>
        <div class="metric-footer">
          <span class="text-success">↑ Actividad acumulada</span>
        </div>
      </div>

      <!-- 2. Cuentas Corrientes (Por Cobrar) -->
      <div class="premium-card metric-card Highlighted">
        <div class="metric-header">
          <span class="metric-label">Deuda Clientes (A Cobrar)</span>
          <div class="icon-wrapper bg-honey-light text-honey">
            <UsersIcon :size="20" />
          </div>
        </div>
        <div class="metric-values">
          <div class="currency-row">
            <span class="currency-symbol">$</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.receivables?.pesos) }}</span>
            <span class="currency-tag">ARS</span>
          </div>
          <div class="currency-row usd">
            <span class="currency-symbol">u$s</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.receivables?.usd) }}</span>
            <span class="currency-tag">USD</span>
          </div>
        </div>
        <div class="metric-footer">
          <span class="text-honey">Saldo deudor en cuenta corriente</span>
        </div>
      </div>

      <!-- 3. Compras (Stock) -->
      <div class="premium-card metric-card">
        <div class="metric-header">
          <span class="metric-label">Compras Realizadas</span>
          <div class="icon-wrapper bg-muted-light text-secondary">
            <TruckIcon :size="20" />
          </div>
        </div>
        <div class="metric-values">
          <div class="currency-row">
            <span class="currency-symbol">$</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.purchases?.pesos) }}</span>
            <span class="currency-tag">ARS</span>
          </div>
          <div class="currency-row usd">
            <span class="currency-symbol">u$s</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.purchases?.usd) }}</span>
            <span class="currency-tag">USD</span>
          </div>
        </div>
        <div class="metric-footer">
          <span class="text-muted">Inversión en stock de productos</span>
        </div>
      </div>

      <!-- 4. Gastos Detallados -->
      <div class="premium-card metric-card">
        <div class="metric-header">
          <span class="metric-label">Gastos Operativos</span>
          <div class="icon-wrapper bg-danger-light text-danger">
            <CreditCardIcon :size="20" />
          </div>
        </div>
        <div class="metric-values">
          <div class="currency-row">
            <span class="currency-symbol">$</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.expenses?.pesos) }}</span>
            <span class="currency-tag">ARS</span>
          </div>
          <div class="currency-row usd">
            <span class="currency-symbol">u$s</span>
            <span class="currency-value">{{ formatNumber(data?.totals?.expenses?.usd) }}</span>
            <span class="currency-tag">USD</span>
          </div>
        </div>
        <div class="metric-footer">
          <span class="text-danger">Egresos corrientes cargados</span>
        </div>
      </div>
    </div>

    <!-- Quick Action Buttons Row -->
    <div class="actions-panel glass">
      <h3 class="panel-title">Acciones Rápidas</h3>
      <div class="actions-grid">
        <NuxtLink to="/ventas" class="btn btn-primary action-btn">
          <ShoppingCartIcon :size="18" />
          Nueva Venta (Facturar)
        </NuxtLink>
        <NuxtLink to="/clientes" class="btn btn-success action-btn">
          <UsersIcon :size="18" />
          Registrar Cobro / Recibo
        </NuxtLink>
        <NuxtLink to="/gastos" class="btn btn-secondary action-btn">
          <CreditCardIcon :size="18" />
          Cargar Nuevo Gasto
        </NuxtLink>
        <NuxtLink to="/compras" class="btn btn-secondary action-btn">
          <TruckIcon :size="18" />
          Ingresar Compra (Stock)
        </NuxtLink>
      </div>
    </div>

    <!-- Graph and Alerts Grid -->
    <div class="content-grid">
      <!-- 1. Beautiful Responsive SVG Chart -->
      <div class="premium-card chart-card">
        <div class="card-header">
          <h2 class="card-title">Ingresos vs Egresos (Últimos 7 Días)</h2>
          <span class="card-subtitle">Cálculo consolidado en Pesos (USD pesificados a $1000)</span>
        </div>
        
        <div class="chart-container">
          <div class="chart-legend">
            <div class="legend-item"><span class="legend-dot bg-success"></span> Ventas</div>
            <div class="legend-item"><span class="legend-dot bg-danger"></span> Egresos (Compras + Gastos)</div>
          </div>

          <div class="svg-wrapper">
            <svg viewBox="0 0 500 220" width="100%" height="100%" class="svg-chart">
              <!-- Y Axis Lines -->
              <line x1="40" y1="20" x2="480" y2="20" class="chart-grid-line" />
              <line x1="40" y1="70" x2="480" y2="70" class="chart-grid-line" />
              <line x1="40" y1="120" x2="480" y2="120" class="chart-grid-line" />
              <line x1="40" y1="170" x2="480" y2="170" class="chart-grid-line" />
              <line x1="40" y1="190" x2="480" y2="190" class="chart-axis-line" />

              <!-- Left Y-Labels (Estimated based on max values) -->
              <text x="32" y="24" class="chart-text y-label">$250k</text>
              <text x="32" y="74" class="chart-text y-label">$150k</text>
              <text x="32" y="124" class="chart-text y-label">$50k</text>
              <text x="32" y="174" class="chart-text y-label">$0</text>

              <!-- Lines plotting data -->
              <path 
                v-if="svgPaths.ventas"
                :d="svgPaths.ventas" 
                fill="none" 
                stroke="var(--sage-green)" 
                stroke-width="3" 
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path 
                v-if="svgPaths.egresos"
                :d="svgPaths.egresos" 
                fill="none" 
                stroke="var(--color-danger)" 
                stroke-width="3" 
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Plotting dots for hover points -->
              <g v-for="(pt, idx) in chartPoints" :key="`pt-${idx}`">
                <!-- Ventas Dot -->
                <circle 
                  :cx="pt.x" 
                  :cy="pt.yVentas" 
                  r="5" 
                  fill="var(--white)" 
                  stroke="var(--sage-green)" 
                  stroke-width="2" 
                />
                <!-- Egresos Dot -->
                <circle 
                  :cx="pt.x" 
                  :cy="pt.yEgresos" 
                  r="5" 
                  fill="var(--white)" 
                  stroke="var(--color-danger)" 
                  stroke-width="2" 
                />
              </g>

              <!-- X-Axis Labels -->
              <text 
                v-for="(pt, idx) in chartPoints" 
                :key="`lbl-${idx}`"
                :x="pt.x" 
                y="210" 
                class="chart-text x-label"
              >
                {{ pt.day }}
              </text>
            </svg>
          </div>
        </div>
      </div>

      <!-- 2. Inventory Alert Monitor -->
      <div class="premium-card alerts-card">
        <div class="card-header">
          <h2 class="card-title">Stock Crítico / Bajo</h2>
          <span class="card-subtitle">Productos activos con menos de 5 unidades en stock</span>
        </div>

        <div class="alerts-container">
          <div v-if="!data?.lowStockItems || data.lowStockItems.length === 0" class="no-alerts">
            <span class="no-alerts-icon">👍</span>
            <p>¡Todo en orden! No hay productos con stock crítico en este momento.</p>
          </div>

          <div v-else class="alerts-list">
            <div 
              v-for="item in data.lowStockItems" 
              :key="item.id" 
              class="alert-item"
            >
              <div class="alert-info">
                <span class="alert-name">{{ item.name }}</span>
                <span class="alert-details">
                  {{ item.brand ? item.brand : 'Sin Marca' }} · {{ item.weight ? item.weight : '' }}
                </span>
              </div>
              <div class="alert-badge-container">
                <span class="badge" :class="item.stock === 0 ? 'badge-danger' : 'badge-warning'">
                  {{ item.stock }} {{ item.stock === 1 ? 'unidad' : 'unidades' }}
                </span>
              </div>
            </div>
            
            <NuxtLink to="/productos" class="view-all-link">
              Ver inventario completo →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFetch } from '#app'
import { computed } from 'vue'
import { 
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Truck as TruckIcon,
  CreditCard as CreditCardIcon,
  ShoppingCart as ShoppingCartIcon
} from 'lucide-vue-next'

// Fetch dashboard data
const { data, refresh } = await useFetch('/api/dashboard')

function formatNumber(val) {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// Coordinate Calculations for the beautiful SVG Chart
const chartPoints = computed(() => {
  if (!data.value || !data.value.chartData) return []
  
  const chartData = data.value.chartData
  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.ventas, d.egresos)), 
    50000 // Set a minimum ceiling of $50k to scale nicely
  )

  const width = 440 // width between x=40 and x=480
  const steps = chartData.length - 1
  const xStep = width / steps

  return chartData.map((d, index) => {
    const x = 40 + (index * xStep)
    
    // Scale y coordinates: 0 matches y=190, maxVal matches y=20
    const scale = (val) => 190 - ((val / maxVal) * 170)
    
    return {
      day: d.day,
      x: Math.round(x),
      yVentas: Math.round(scale(d.ventas)),
      yEgresos: Math.round(scale(d.egresos)),
      ventas: d.ventas,
      egresos: d.egresos
    }
  })
})

const svgPaths = computed(() => {
  const pts = chartPoints.value
  if (pts.length === 0) return { ventas: '', egresos: '' }

  let pathVentas = `M ${pts[0].x} ${pts[0].yVentas}`
  let pathEgresos = `M ${pts[0].x} ${pts[0].yEgresos}`

  for (let i = 1; i < pts.length; i++) {
    pathVentas += ` L ${pts[i].x} ${pts[i].yVentas}`
    pathEgresos += ` L ${pts[i].x} ${pts[i].yEgresos}`
  }

  return {
    ventas: pathVentas,
    egresos: pathEgresos
  }
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header section */
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

.connection-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  border: 1px solid transparent;
}

.connection-badge.connected {
  background-color: rgba(105, 147, 97, 0.15);
  color: var(--sage-green);
  border-color: rgba(105, 147, 97, 0.3);
}

.connection-badge.connected .dot {
  background-color: var(--sage-green);
}

.connection-badge.simulation {
  background-color: rgba(232, 174, 31, 0.15);
  color: #a6790d;
  border-color: rgba(232, 174, 31, 0.3);
}

.connection-badge.simulation .dot {
  background-color: var(--amber-honey);
  animation: pulse 2s infinite;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}

/* Helper Banner */
.helper-banner {
  padding: 16px 20px;
  border-radius: 12px;
  background-color: rgba(233, 215, 155, 0.1);
  border: 1px solid rgba(208, 180, 111, 0.3);
}

.helper-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.helper-icon {
  font-size: 1.25rem;
}

.helper-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.helper-text code {
  background-color: var(--white);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid var(--soft-fawn);
}

/* Metrics Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-card.Highlighted {
  border-color: var(--soft-fawn);
  background-color: var(--white);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-success-light { background-color: rgba(105, 147, 97, 0.15); }
.bg-honey-light { background-color: rgba(232, 174, 31, 0.15); }
.bg-danger-light { background-color: rgba(217, 83, 79, 0.15); }
.bg-muted-light { background-color: rgba(90, 86, 76, 0.1); }
.text-honey { color: #b08110; }

.metric-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 4px 0;
}

.currency-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--text-primary);
}

.currency-symbol {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.currency-value {
  font-size: 1.8rem;
  font-weight: 800;
  font-family: var(--font-family-title);
  line-height: 1;
}

.currency-tag {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-left: 2px;
}

.currency-row.usd {
  border-top: 1px dashed rgba(208, 180, 111, 0.15);
  padding-top: 4px;
}

.currency-row.usd .currency-value {
  font-size: 1.3rem;
  font-weight: 700;
}

.metric-footer {
  font-size: 0.78rem;
  font-weight: 600;
  margin-top: auto;
}

/* Quick Actions Panel */
.actions-panel {
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  background: var(--white);
  border: 1px solid var(--border-color);
}

.panel-title {
  font-size: 1.05rem;
  font-family: var(--font-family-title);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.action-btn {
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 20px;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-family-title);
}

.card-subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* Chart Styles */
.chart-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 16px;
}

.chart-legend {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.bg-success { background-color: var(--sage-green); }
.bg-danger { background-color: var(--color-danger); }

.svg-wrapper {
  position: relative;
  flex-grow: 1;
  height: 220px;
  padding: 8px 0;
}

.svg-chart {
  display: block;
}

.chart-grid-line {
  stroke: rgba(208, 180, 111, 0.15);
  stroke-dasharray: 4,4;
}

.chart-axis-line {
  stroke: var(--soft-fawn);
  stroke-width: 1.5;
}

.chart-text {
  font-family: var(--font-family-sans);
  font-size: 8px;
  fill: var(--text-muted);
  font-weight: 600;
}

.chart-text.y-label {
  text-anchor: end;
}

.chart-text.x-label {
  text-anchor: middle;
}

/* Alerts Card */
.alerts-card {
  display: flex;
  flex-direction: column;
}

.alerts-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 30px 16px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.no-alerts-icon {
  font-size: 2.2rem;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background-color: var(--floral-white);
  border: 1px solid rgba(208, 180, 111, 0.15);
  transition: all 0.2s ease;
}

.alert-item:hover {
  background-color: var(--white);
  border-color: var(--soft-fawn);
}

.alert-info {
  display: flex;
  flex-direction: column;
}

.alert-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.alert-details {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 550;
}

.alert-badge-container {
  flex-shrink: 0;
}

.view-all-link {
  display: block;
  text-align: center;
  margin-top: 14px;
  color: #b38510;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s ease;
}

.view-all-link:hover {
  color: var(--amber-honey);
  text-decoration: underline;
}
</style>
