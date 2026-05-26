<template>
  <div class="app-layout">
    <!-- Mobile Header/Navbar -->
    <header class="mobile-header glass">
      <button class="mobile-menu-btn" @click="toggleSidebar">
        <MenuIcon v-if="!isSidebarOpen" :size="24" />
        <XIcon v-else :size="24" />
      </button>
      <h1 class="mobile-logo">Control Center</h1>
      <div class="quick-currency-pill">
        <span class="currency-indicator text-success">$</span>
      </div>
    </header>

    <!-- Sidebar (Collapsible) -->
    <aside 
      class="sidebar glass" 
      :class="{ 
        'collapsed': isCollapsed, 
        'mobile-open': isSidebarOpen 
      }"
    >
      <!-- Logo Section -->
      <div class="sidebar-logo-container">
        <div class="logo-circle">
          <TrendingUpIcon :size="22" class="logo-icon" />
        </div>
        <span class="logo-text" v-if="!isCollapsed">Control Center</span>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <NuxtLink 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path" 
          class="nav-item"
          :class="{ 'active': activeRoute === item.path }"
          @click="closeMobileSidebar"
        >
          <component :is="item.icon" :size="20" class="nav-icon" />
          <span class="nav-label" v-if="!isCollapsed">{{ item.name }}</span>
          <span class="nav-tooltip" v-if="isCollapsed">{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- Collapse Toggle Button (Desktop Only) -->
      <button class="collapse-btn" @click="toggleCollapse" v-if="!isMobile">
        <ChevronLeftIcon v-if="!isCollapsed" :size="16" />
        <ChevronRightIcon v-else :size="16" />
      </button>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer" v-if="!isCollapsed">
        <p class="footer-title">Empresa Activa</p>
        <p class="footer-sub">Dulce Victoria</p>
      </div>
    </aside>

    <!-- Sidebar Mobile Overlay -->
    <div 
      class="mobile-overlay" 
      v-if="isSidebarOpen" 
      @click="closeMobileSidebar"
    ></div>

    <!-- Main Content Area -->
    <main class="main-content" :class="{ 'sidebar-collapsed-padding': isCollapsed }">
      <div class="content-wrapper animate-fade-in">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from '#app'
import { 
  LayoutDashboard as LayoutDashboardIcon,
  Users as UsersIcon,
  ShoppingBag as ShoppingBagIcon,
  Tags as TagsIcon,
  ShoppingCart as ShoppingCartIcon,
  Truck as TruckIcon,
  CreditCard as CreditCardIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  X as XIcon,
  TrendingUp as TrendingUpIcon
} from 'lucide-vue-next'

const route = useRoute()
const isCollapsed = ref(false)
const isSidebarOpen = ref(false)
const isMobile = ref(false)

// Active route detection
const activeRoute = computed(() => {
  if (route.path === '/') return '/'
  // Match subpages like /clientes/123 to /clientes
  const firstSegment = route.path.split('/')[1]
  return firstSegment ? `/${firstSegment}` : '/'
})

const navItems = [
  { name: 'Inicio', path: '/', icon: LayoutDashboardIcon },
  { name: 'Clientes & Cuentas', path: '/clientes', icon: UsersIcon },
  { name: 'Productos', path: '/productos', icon: ShoppingBagIcon },
  { name: 'Lista de Precios', path: '/lista-precios', icon: TagsIcon },
  { name: 'Nueva Venta (POS)', path: '/ventas', icon: ShoppingCartIcon },
  { name: 'Compras (Stock)', path: '/compras', icon: TruckIcon },
  { name: 'Gastos', path: '/gastos', icon: CreditCardIcon }
]

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function closeMobileSidebar() {
  isSidebarOpen.value = false
}

// Handle responsive checks on mount/resize
function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768
    if (isMobile.value) {
      isCollapsed.value = false
    }
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--floral-white);
}

/* Mobile Header */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  border-bottom: 1px solid var(--border-color);
}

.mobile-menu-btn {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.mobile-logo {
  font-size: 1.25rem;
  font-family: var(--font-family-title);
  font-weight: 700;
  color: var(--text-primary);
}

.quick-currency-pill {
  background-color: rgba(105, 147, 97, 0.15);
  border: 1px solid rgba(105, 147, 97, 0.3);
  border-radius: 999px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* Sidebar Styling */
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 90;
  border-right: 1px solid var(--border-color);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--white);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  padding: 24px 12px;
}

.sidebar-logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  padding: 0 8px;
}

.logo-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: var(--amber-honey);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(232, 174, 31, 0.25);
  flex-shrink: 0;
}

.logo-icon {
  color: #1E1C18;
}

.logo-text {
  font-family: var(--font-family-title);
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--text-primary);
  white-space: nowrap;
}

/* Navigation */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 550;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  background-color: rgba(233, 215, 155, 0.2); /* light vanilla custard */
  color: var(--text-primary);
}

.nav-item.active {
  background-color: var(--vanilla-custard);
  color: var(--text-primary);
  border-left: 4px solid var(--amber-honey);
  font-weight: 700;
}

.nav-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.05);
}

.nav-label {
  white-space: nowrap;
}

/* Sidebar Tooltip for Collapsed state */
.nav-tooltip {
  position: absolute;
  left: 80px;
  background-color: var(--text-primary);
  color: var(--white);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform: translateX(-8px);
  white-space: nowrap;
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.nav-item:hover .nav-tooltip {
  opacity: 1;
  transform: translateX(0);
}

/* Collapse button */
.collapse-btn {
  position: absolute;
  bottom: 120px;
  right: -14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--white);
  border: 1px solid var(--soft-fawn);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  color: var(--text-secondary);
  z-index: 10;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  color: var(--text-primary);
  border-color: var(--amber-honey);
  background-color: var(--floral-white);
  transform: scale(1.1);
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px 8px 0;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.footer-sub {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

/* Content Container */
.main-content {
  flex-grow: 1;
  padding: 40px;
  padding-left: calc(var(--sidebar-width) + 40px);
  min-height: 100vh;
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.main-content.sidebar-collapsed-padding {
  padding-left: calc(var(--sidebar-collapsed-width) + 40px);
}

.content-wrapper {
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* Responsive / Mobile Media Queries */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }
  
  .sidebar {
    transform: translateX(-100%);
    width: 260px !important; /* Force width */
    box-shadow: none;
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }
  
  .sidebar-logo-container {
    margin-bottom: 24px;
  }
  
  .main-content, .main-content.sidebar-collapsed-padding {
    padding: 96px 16px 40px;
  }
  
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(30, 28, 24, 0.4);
    z-index: 80;
    backdrop-filter: blur(4px);
  }
}
</style>
