import { defineEventHandler } from 'h3'
import { db } from '../utils/dbFallback'

export default defineEventHandler(async (event) => {
  const sales = await db.getSales()
  const purchases = await db.getPurchases()
  const expenses = await db.getExpenses()
  const products = await db.getProducts()
  const clients = await db.getClients()

  // Calculate Totals
  let totalSalesPesos = 0
  let totalSalesUsd = 0
  sales.forEach((s: any) => {
    if (s.currency === 'USD') totalSalesUsd += Number(s.totalAmount)
    else totalSalesPesos += Number(s.totalAmount)
  })

  let totalPurchasesPesos = 0
  let totalPurchasesUsd = 0
  purchases.forEach((p: any) => {
    if (p.currency === 'USD') totalPurchasesUsd += Number(p.totalAmount)
    else totalPurchasesPesos += Number(p.totalAmount)
  })

  let totalExpensesPesos = 0
  let totalExpensesUsd = 0
  expenses.forEach((e: any) => {
    if (e.currency === 'USD') totalExpensesUsd += Number(e.amount)
    else totalExpensesPesos += Number(e.amount)
  })

  // Total Client Outstanding Balance (Deuda total de clientes)
  let outstandingPesos = 0
  let outstandingUsd = 0
  clients.forEach((c: any) => {
    outstandingPesos += Number(c.balancePesos || 0)
    outstandingUsd += Number(c.balanceUsd || 0)
  })

  // Low stock products alert (less than 5 units)
  const lowStockProducts = products.filter((p: any) => p.active && p.stock < 5)

  // Top products (mocked based on actual products or real ones)
  const topProducts = products
    .filter((p: any) => p.active)
    .slice(0, 3)
    .map((p: any) => ({
      name: p.name + (p.brand ? ` ${p.brand}` : ''),
      category: p.category,
      stock: p.stock
    }))

  // Charts: Generate last 7 days of activity
  const chartData = []
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const dayLabel = days[d.getDay()]

    let salesVal = 0
    let expensesVal = 0 // expenses + purchases

    // Filter sales on this day (approximate match, converting USD to pesos roughly at $1000 for chart visualization)
    sales.forEach((s: any) => {
      const sDate = new Date(s.date)
      if (sDate.toDateString() === dateStr) {
        const amt = Number(s.totalAmount)
        salesVal += s.currency === 'USD' ? amt * 1000 : amt
      }
    })

    // Filter purchases on this day
    purchases.forEach((p: any) => {
      const pDate = new Date(p.date)
      if (pDate.toDateString() === dateStr) {
        const amt = Number(p.totalAmount)
        expensesVal += p.currency === 'USD' ? amt * 1000 : amt
      }
    })

    // Filter expenses on this day
    expenses.forEach((e: any) => {
      const eDate = new Date(e.date)
      if (eDate.toDateString() === dateStr) {
        const amt = Number(e.amount)
        expensesVal += e.currency === 'USD' ? amt * 1000 : amt
      }
    })

    chartData.push({
      day: dayLabel,
      ventas: salesVal,
      egresos: expensesVal
    })
  }

  // NeonDB Connection Status Indicator
  const isNeonConnected = await db.isPrismaConnected()

  return {
    totals: {
      sales: { pesos: totalSalesPesos, usd: totalSalesUsd },
      purchases: { pesos: totalPurchasesPesos, usd: totalPurchasesUsd },
      expenses: { pesos: totalExpensesPesos, usd: totalExpensesUsd },
      receivables: { pesos: outstandingPesos, usd: outstandingUsd }
    },
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.slice(0, 5),
    topProducts,
    chartData,
    isNeonConnected
  }
})
