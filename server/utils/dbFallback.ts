import { prisma } from './prisma'

// Global in-memory storage for development fallback
const globalRef = global as any
if (!globalRef.mockDb) {
  globalRef.mockDb = {
    clients: [
      {
        id: 'c1',
        name: 'Almacén Don Julio',
        email: 'donjulio@gmail.com',
        phone: '11 3456-7890',
        address: 'Av. Rivadavia 4500, CABA',
        taxId: '30-54321098-9',
        active: true,
        balancePesos: 154000.0,
        balanceUsd: 120.0,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'c2',
        name: 'Fiambrería El Trébol',
        email: 'trebol@hotmail.com',
        phone: '11 9876-5432',
        address: 'Gaspar Campos 4055, San Miguel',
        taxId: '27-98765432-1',
        active: true,
        balancePesos: 48900.0,
        balanceUsd: 0.0,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'c3',
        name: 'Supermercado Aconcagua',
        email: 'aconcagua@info.com',
        phone: '3442 45-8912',
        address: 'Belgrano 1200, Mendoza',
        taxId: '30-12345678-9',
        active: true,
        balancePesos: 0.0,
        balanceUsd: 450.0,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'c4',
        name: 'Nicolás Pérez (Consumidor Final)',
        email: 'nicolas@perez.com',
        phone: '11 6543-2109',
        address: 'Palermo, CABA',
        taxId: '20-38491823-2',
        active: true,
        balancePesos: 0.0,
        balanceUsd: 0.0,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ],
    products: [
      {
        id: 'p1',
        code: '7790123456789',
        name: 'Azúcar granulada',
        brand: 'Sweet Rial',
        weight: '5kg',
        description: 'Azúcar blanca refinada de alta pureza.',
        cost: 15000.0,
        price: 25740.0,
        cashPrice: 23400.0,
        stock: 45,
        category: 'Azúcares',
        active: true,
        createdAt: new Date()
      },
      {
        id: 'p2',
        code: '7790123456790',
        name: 'Azúcar impalpable',
        brand: 'Sweet Rial',
        weight: '10kg',
        description: 'Azúcar glass fina ideal para repostería.',
        cost: 11000.0,
        price: 18920.0,
        cashPrice: 17200.0,
        stock: 12,
        category: 'Azúcares',
        active: true,
        createdAt: new Date()
      },
      {
        id: 'p3',
        code: '7790891234567',
        name: 'Harina 000',
        brand: 'Cañuelas',
        weight: '1kg',
        description: 'Harina de trigo común para panificación.',
        cost: 450.0,
        price: 780.0,
        cashPrice: 700.0,
        stock: 120,
        category: 'Harinas',
        active: true,
        createdAt: new Date()
      },
      {
        id: 'p4',
        code: '7790891234588',
        name: 'Dulce de Leche Repostero',
        brand: 'La Serenísima',
        weight: '400g',
        description: 'Dulce de leche repostero de consistencia firme.',
        cost: 950.0,
        price: 1650.0,
        cashPrice: 1500.0,
        stock: 3, // Low stock!
        category: 'Lácteos y Dulces',
        active: true,
        createdAt: new Date()
      },
      {
        id: 'p5',
        code: '7790891234599',
        name: 'Aceite de Girasol',
        brand: 'Natura',
        weight: '1.5L',
        description: 'Aceite comestible puro de girasol.',
        cost: 1200.0,
        price: 2100.0,
        cashPrice: 1900.0,
        stock: 65,
        category: 'Aceites',
        active: true,
        createdAt: new Date()
      }
    ],
    transactions: [
      {
        id: 't1',
        clientId: 'c1',
        type: 'SALE',
        currency: 'PESOS',
        amount: 257400.0,
        balanceAfter: 257400.0,
        description: 'Venta #V-1001 a cuenta corriente',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: 't2',
        clientId: 'c1',
        type: 'PAYMENT',
        currency: 'PESOS',
        amount: -103400.0,
        balanceAfter: 154000.0,
        description: 'Cobro de Cuenta Corriente - Recibo #R-001',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 't3',
        clientId: 'c1',
        type: 'SALE',
        currency: 'USD',
        amount: 120.0,
        balanceAfter: 120.0,
        description: 'Venta #V-1002 en Dólares a cuenta corriente',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        id: 't4',
        clientId: 'c2',
        type: 'SALE',
        currency: 'PESOS',
        amount: 48900.0,
        balanceAfter: 48900.0,
        description: 'Venta #V-1003 a cuenta corriente',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 't5',
        clientId: 'c3',
        type: 'SALE',
        currency: 'USD',
        amount: 450.0,
        balanceAfter: 450.0,
        description: 'Venta #V-1004 a cuenta corriente en USD',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ],
    sales: [
      {
        id: 's1',
        invoiceNumber: 'V-1001',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        clientId: 'c1',
        totalAmount: 257400.0,
        currency: 'PESOS',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'Entrega en sucursal'
      },
      {
        id: 's2',
        invoiceNumber: 'V-1002',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        clientId: 'c1',
        totalAmount: 120.0,
        currency: 'USD',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'Pactado en USD'
      },
      {
        id: 's3',
        invoiceNumber: 'V-1003',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        clientId: 'c2',
        totalAmount: 48900.0,
        currency: 'PESOS',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: ''
      },
      {
        id: 's4',
        invoiceNumber: 'V-1004',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        clientId: 'c3',
        totalAmount: 450.0,
        currency: 'USD',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'Cliente premium'
      },
      {
        id: 's5',
        invoiceNumber: 'V-1005',
        date: new Date(),
        clientId: 'c4',
        totalAmount: 42120.0,
        currency: 'PESOS',
        paymentMethod: 'CASH',
        notes: 'Pago en mano'
      }
    ],
    purchases: [
      {
        id: 'pu1',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        supplierName: 'Distribuidora Arcor',
        totalAmount: 320000.0,
        currency: 'PESOS',
        notes: 'Compra de mercadería general'
      },
      {
        id: 'pu2',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        supplierName: 'Sweet Rial Central',
        totalAmount: 150.0,
        currency: 'USD',
        notes: 'Importación de azúcar'
      }
    ],
    expenses: [
      {
        id: 'e1',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        category: 'Alquiler',
        amount: 180000.0,
        currency: 'PESOS',
        description: 'Alquiler del local comercial Mayo',
        paymentMethod: 'TRANSFER'
      },
      {
        id: 'e2',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        category: 'Servicios',
        amount: 24500.0,
        currency: 'PESOS',
        description: 'Factura Luz Edesur',
        paymentMethod: 'TRANSFER'
      },
      {
        id: 'e3',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        category: 'Sueldos',
        amount: 320000.0,
        currency: 'PESOS',
        description: 'Sueldo encargado de depósito',
        paymentMethod: 'TRANSFER'
      },
      {
        id: 'e4',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        category: 'Impuestos',
        amount: 8900.0,
        currency: 'PESOS',
        description: 'Monotributo AFIP',
        paymentMethod: 'CARD'
      },
      {
        id: 'e5',
        date: new Date(),
        category: 'Varios',
        amount: 50.0,
        currency: 'USD',
        description: 'Bolsas compostables importadas',
        paymentMethod: 'CASH'
      }
    ]
  }
}

const mockDb = globalRef.mockDb

// Central DB Helper that performs actual database operations or falls back safely
export const db = {
  // Test connection or check if Database is active
  async isPrismaConnected() {
    try {
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost:5432")) {
        return false
      }
      // Quick light query to verify connection
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  },

  // --- CLIENTS ---
  async getClients() {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.client.findMany({
          orderBy: { name: 'asc' }
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    return mockDb.clients
  },

  async getClient(id: string) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.client.findUnique({
          where: { id },
          include: { transactions: { orderBy: { date: 'desc' } } }
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    const client = mockDb.clients.find((c: any) => c.id === id)
    if (client) {
      return {
        ...client,
        transactions: mockDb.transactions
          .filter((t: any) => t.clientId === id)
          .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
      }
    }
    return null
  },

  async createClient(data: any) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.client.create({ data })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    const newClient = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      taxId: data.taxId || null,
      active: true,
      balancePesos: 0.0,
      balanceUsd: 0.0,
      createdAt: new Date()
    }
    mockDb.clients.push(newClient)
    return newClient
  },

  async updateClient(id: string, data: any) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.client.update({
          where: { id },
          data
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    const index = mockDb.clients.findIndex((c: any) => c.id === id)
    if (index !== -1) {
      mockDb.clients[index] = { ...mockDb.clients[index], ...data }
      return mockDb.clients[index]
    }
    return null
  },

  // --- CLIENT TRANSACTIONS (Cuenta Corriente Ledger) ---
  async addTransaction(data: any) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.$transaction(async (tx) => {
          const client = await tx.client.findUnique({ where: { id: data.clientId } })
          if (!client) throw new Error("Client not found")

          const amount = Number(data.amount)
          let currentBalance = 0
          
          if (data.currency === 'USD') {
            currentBalance = Number(client.balanceUsd) + amount
            await tx.client.update({
              where: { id: data.clientId },
              data: { balanceUsd: currentBalance }
            })
          } else {
            currentBalance = Number(client.balancePesos) + amount
            await tx.client.update({
              where: { id: data.clientId },
              data: { balancePesos: currentBalance }
            })
          }

          return await tx.clientTransaction.create({
            data: {
              clientId: data.clientId,
              type: data.type,
              currency: data.currency || 'PESOS',
              amount: amount,
              balanceAfter: currentBalance,
              description: data.description,
              referenceId: data.referenceId || null
            }
          })
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    
    // In-memory fallback
    const clientIndex = mockDb.clients.findIndex((c: any) => c.id === data.clientId)
    if (clientIndex === -1) return null

    const client = mockDb.clients[clientIndex]
    const amountVal = Number(data.amount)
    let balAfter = 0

    if (data.currency === 'USD') {
      client.balanceUsd = Number(client.balanceUsd) + amountVal
      balAfter = client.balanceUsd
    } else {
      client.balancePesos = Number(client.balancePesos) + amountVal
      balAfter = client.balancePesos
    }

    const newTx = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      clientId: data.clientId,
      type: data.type,
      currency: data.currency || 'PESOS',
      amount: amountVal,
      balanceAfter: balAfter,
      description: data.description,
      date: new Date(),
      referenceId: data.referenceId || null
    }

    mockDb.transactions.push(newTx)
    return newTx
  },

  // --- PRODUCTS ---
  async getProducts() {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.product.findMany({
          orderBy: { name: 'asc' }
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    return mockDb.products
  },

  async createProduct(data: any) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.product.create({ data })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    const newProduct = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      code: data.code,
      name: data.name,
      brand: data.brand || null,
      weight: data.weight || null,
      description: data.description || null,
      cost: Number(data.cost || 0),
      price: Number(data.price || 0),
      cashPrice: Number(data.cashPrice || 0),
      stock: Number(data.stock || 0),
      category: data.category || 'General',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockDb.products.push(newProduct)
    return newProduct
  },

  async updateProduct(id: string, data: any) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.product.update({
          where: { id },
          data
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    const index = mockDb.products.findIndex((p: any) => p.id === id)
    if (index !== -1) {
      mockDb.products[index] = { 
        ...mockDb.products[index], 
        ...data,
        updatedAt: new Date()
      }
      return mockDb.products[index]
    }
    return null
  },

  // --- SALES (Ventas) ---
  async getSales() {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.sale.findMany({
          orderBy: { date: 'desc' },
          include: { client: true }
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    return mockDb.sales.map((s: any) => ({
      ...s,
      client: mockDb.clients.find((c: any) => c.id === s.clientId) || null
    })).sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
  },

  async createSale(data: any) {
    // data has { clientId, totalAmount, currency, paymentMethod, notes, items: [ { productId, quantity, price, cost } ] }
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.$transaction(async (tx) => {
          // 1. Create Sale
          const sale = await tx.sale.create({
            data: {
              invoiceNumber: 'V-' + (1000 + (await tx.sale.count()) + 1),
              clientId: data.clientId || null,
              totalAmount: Number(data.totalAmount),
              currency: data.currency || 'PESOS',
              paymentMethod: data.paymentMethod,
              notes: data.notes || '',
              items: {
                create: data.items.map((item: any) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: Number(item.price),
                  cost: Number(item.cost)
                }))
              }
            }
          })

          // 2. Reduce Stock for each item
          for (const item of data.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            })
          }

          // 3. If Payment is Cuenta Corriente, generate debit transaction
          if (data.paymentMethod === 'CUENTA_CORRIENTE' && data.clientId) {
            const client = await tx.client.findUnique({ where: { id: data.clientId } })
            if (client) {
              const amount = Number(data.totalAmount)
              let currentBalance = 0
              if (data.currency === 'USD') {
                currentBalance = Number(client.balanceUsd) + amount
                await tx.client.update({
                  where: { id: data.clientId },
                  data: { balanceUsd: currentBalance }
                })
              } else {
                currentBalance = Number(client.balancePesos) + amount
                await tx.client.update({
                  where: { id: data.clientId },
                  data: { balancePesos: currentBalance }
                })
              }

              await tx.clientTransaction.create({
                data: {
                  clientId: data.clientId,
                  type: 'SALE',
                  currency: data.currency || 'PESOS',
                  amount: amount,
                  balanceAfter: currentBalance,
                  description: `Venta #${sale.invoiceNumber} a cuenta corriente`,
                  referenceId: sale.id
                }
              })
            }
          }

          return sale
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }

    // In-memory fallback
    const invoiceNum = 'V-' + (1000 + mockDb.sales.length + 1)
    const newSale = {
      id: 's_' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: invoiceNum,
      date: new Date(),
      clientId: data.clientId || null,
      totalAmount: Number(data.totalAmount),
      currency: data.currency || 'PESOS',
      paymentMethod: data.paymentMethod,
      notes: data.notes || ''
    }

    mockDb.sales.push(newSale)

    // Reduce stock
    for (const item of data.items) {
      const prod = mockDb.products.find((p: any) => p.id === item.productId)
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity)
      }
    }

    // CC Debit
    if (data.paymentMethod === 'CUENTA_CORRIENTE' && data.clientId) {
      const clientIndex = mockDb.clients.findIndex((c: any) => c.id === data.clientId)
      if (clientIndex !== -1) {
        const client = mockDb.clients[clientIndex]
        const amount = Number(data.totalAmount)
        let balAfter = 0

        if (data.currency === 'USD') {
          client.balanceUsd = Number(client.balanceUsd) + amount
          balAfter = client.balanceUsd
        } else {
          client.balancePesos = Number(client.balancePesos) + amount
          balAfter = client.balancePesos
        }

        mockDb.transactions.push({
          id: 'tx_' + Math.random().toString(36).substring(2, 9),
          clientId: data.clientId,
          type: 'SALE',
          currency: data.currency || 'PESOS',
          amount: amount,
          balanceAfter: balAfter,
          description: `Venta #${invoiceNum} a cuenta corriente`,
          date: new Date(),
          referenceId: newSale.id
        })
      }
    }

    return newSale
  },

  // --- PURCHASES (Compras/Stock) ---
  async getPurchases() {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.purchase.findMany({
          orderBy: { date: 'desc' }
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    return mockDb.purchases.sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
  },

  async createPurchase(data: any) {
    // data: { supplierName, totalAmount, currency, notes, items: [ { productId, quantity, costPrice } ] }
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.$transaction(async (tx) => {
          const purchase = await tx.purchase.create({
            data: {
              supplierName: data.supplierName || 'Proveedor General',
              totalAmount: Number(data.totalAmount),
              currency: data.currency || 'PESOS',
              notes: data.notes || '',
              items: {
                create: data.items.map((item: any) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  costPrice: Number(item.costPrice)
                }))
              }
            }
          })

          // Adjust Stock and Cost price for each product
          for (const item of data.items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } })
            if (product) {
              const currentStock = product.stock
              const newStock = currentStock + item.quantity
              const newCost = Number(item.costPrice) // Ponderated or last cost. Let's update with last cost!
              
              // Standard behavior: update stock and set the new cost!
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: newStock,
                  cost: newCost
                }
              })
            }
          }

          return purchase
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }

    // In-memory fallback
    const newPurchase = {
      id: 'pu_' + Math.random().toString(36).substring(2, 9),
      date: new Date(),
      supplierName: data.supplierName || 'Proveedor General',
      totalAmount: Number(data.totalAmount),
      currency: data.currency || 'PESOS',
      notes: data.notes || ''
    }

    mockDb.purchases.push(newPurchase)

    for (const item of data.items) {
      const prod = mockDb.products.find((p: any) => p.id === item.productId)
      if (prod) {
        prod.stock += item.quantity
        prod.cost = Number(item.costPrice)
      }
    }

    return newPurchase
  },

  // --- EXPENSES (Gastos) ---
  async getExpenses() {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.expense.findMany({
          orderBy: { date: 'desc' }
        })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    return mockDb.expenses.sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
  },

  async createExpense(data: any) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.expense.create({ data })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    const newExpense = {
      id: 'e_' + Math.random().toString(36).substring(2, 9),
      date: new Date(),
      category: data.category,
      amount: Number(data.amount),
      currency: data.currency || 'PESOS',
      description: data.description,
      paymentMethod: data.paymentMethod
    }
    mockDb.expenses.push(newExpense)
    return newExpense
  },

  async deleteExpense(id: string) {
    if (await this.isPrismaConnected()) {
      try {
        return await prisma.expense.delete({ where: { id } })
      } catch (err) {
        console.error("Prisma error, falling back:", err)
      }
    }
    const index = mockDb.expenses.findIndex((e: any) => e.id === id)
    if (index !== -1) {
      const deleted = mockDb.expenses[index]
      mockDb.expenses.splice(index, 1)
      return deleted
    }
    return null
  }
}
