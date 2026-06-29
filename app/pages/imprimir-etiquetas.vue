<template>
  <div class="print-page-wrapper" :style="cssVars">
    <div id="print-area" class="labels-print-container" :class="{ 'stretch-labels': layoutSettings.stretchLabels }">
      <div 
        v-for="item in flattenedQueue" 
        :key="item.queueId + '-' + item.copyIndex"
        class="label-item" 
        :class="[
          'border-' + layoutSettings.borderStyle,
          { 'no-logo': !layoutSettings.showLogo }
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
    </div>
  </div>
</template>

<script setup>
import logoUrl from '~/assets/dulce victoria.jpeg'
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: false
})

const printQueue = ref([])
const layoutSettings = ref({
  columns: 2,
  labelHeight: 60,
  gap: 5,
  sheetMargin: 10,
  fontScale: 1.0,
  stretchLabels: true,
  borderStyle: 'dashed',
  showLogo: true,
  showIvaDetail: true,
  showUnitDetail: true,
  roundDecimals: false
})

onMounted(() => {
  try {
    const queueData = localStorage.getItem('control_center_print_queue')
    const layoutData = localStorage.getItem('control_center_print_layout')
    
    if (queueData) {
      printQueue.value = JSON.parse(queueData)
    }
    if (layoutData) {
      layoutSettings.value = JSON.parse(layoutData)
    }
    
    // Auto trigger print dialog after page renders
    setTimeout(() => {
      window.print()
    }, 600)
  } catch (err) {
    console.error('Failed to load print parameters', err)
  }
})

const cssVars = computed(() => {
  return {
    '--print-margin': (layoutSettings.value.sheetMargin || 10) + 'mm',
    '--print-cols': layoutSettings.value.columns || 2,
    '--print-gap': (layoutSettings.value.gap || 5) + 'mm',
    '--label-height': (layoutSettings.value.labelHeight || 60) + 'mm',
    '--font-scale': layoutSettings.value.fontScale || 1.0
  }
})

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

function calculatePriceWithoutIva(price, ivaRate) {
  const rate = parseFloat(ivaRate) || 0
  return price / (1 + (rate / 100))
}

function calculatePricePerUnit(price, divisor) {
  const d = parseFloat(divisor) || 1
  return d > 0 ? price / d : price
}

function formatNumber(val) {
  if (val === undefined || val === null || isNaN(val)) return '0,00'
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

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
</script>

<style scoped>
/* Base print layout overrides */
.print-page-wrapper {
  background: #ffffff !important;
  color: #000000 !important;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.labels-print-container {
  display: grid;
  grid-template-columns: repeat(var(--print-cols, 2), 1fr);
  gap: var(--print-gap, 5px);
  width: 100%;
  box-sizing: border-box;
}

/* Label item container */
.label-item {
  display: flex;
  background-color: #ffffff !important;
  padding: 10px;
  box-sizing: border-box;
  gap: 12px;
  align-items: stretch;
  overflow: hidden;
  height: var(--label-height, 60mm);
  width: 100%;
}

.stretch-labels .label-item {
  width: 100%;
}

/* Border styles */
.border-dashed {
  border: 2px dashed #000000 !important;
}

.border-solid {
  border: 2px solid #000000 !important;
}

.border-none {
  border: 2px solid transparent !important;
}

.label-col-left {
  flex: 1.1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-right: 2.5px dashed #000000 !important;
  padding-right: 12px;
  overflow: hidden;
}

.border-solid .label-col-left {
  border-right: 2px dashed #000000 !important;
}

.border-none .label-col-left {
  border-right: 1.5px solid transparent !important;
}

.logo-wrapper {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.label-logo {
  max-height: calc(44px * var(--font-scale, 1));
  max-width: 100%;
  object-fit: contain;
}

.label-product-title {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: calc(1.05rem * var(--font-scale, 1));
  font-weight: 800;
  color: #000000 !important;
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
  font-family: system-ui, -apple-system, sans-serif;
  font-size: calc(0.68rem * var(--font-scale, 1));
  font-weight: 700;
  text-transform: uppercase;
  color: #000000 !important;
  letter-spacing: 0.03em;
  margin-bottom: 1px;
}

.label-price-value {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: calc(2.1rem * var(--font-scale, 1));
  font-weight: 850;
  color: #000000 !important;
  line-height: 1.0;
  margin-bottom: 6px;
  white-space: nowrap;
}

.label-price-details {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.label-price-details li {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: calc(0.7rem * var(--font-scale, 1));
  color: #000000 !important;
  line-height: 1.25;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.label-price-details li strong {
  color: #000000 !important;
  font-weight: 700;
}

@media print {
  body {
    background-color: #ffffff !important;
    background: #ffffff !important;
  }
  
  .print-page-wrapper {
    background-color: #ffffff !important;
    background: #ffffff !important;
  }

  .label-item {
    background: #ffffff !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  @page {
    size: A4 portrait;
    margin: var(--print-margin, 10mm);
  }
}
</style>
