import { defineEventHandler, readBody } from 'h3'
import { db } from '../utils/dbFallback'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return await db.getProducts()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    if (!body.name || !body.code) {
      throw new Error("Nombre y código SKU son requeridos")
    }
    return await db.createProduct(body)
  }

  if (method === 'PUT') {
    const body = await readBody(event)

    // Handle Bulk price adjustments
    if (body.bulkAction === 'adjust_prices') {
      const percentage = Number(body.percentage)
      const category = body.category // optional filter
      const target = body.target || 'both' // 'price', 'cashPrice', 'both'
      
      if (isNaN(percentage)) {
        throw new Error("El porcentaje debe ser un número válido")
      }

      const multiplier = 1 + (percentage / 100)
      
      // Try actual DB bulk update if connected
      const isConnected = await db.isPrismaConnected()
      if (isConnected) {
        try {
          const products = await prisma.product.findMany({
            where: category ? { category } : {}
          })

          const updates = products.map(async (prod) => {
            const data: any = {}
            if (target === 'price' || target === 'both') {
              data.price = Number(prod.price) * multiplier
            }
            if (target === 'cashPrice' || target === 'both') {
              data.cashPrice = Number(prod.cashPrice) * multiplier
            }
            return prisma.product.update({
              where: { id: prod.id },
              data
            })
          })
          await Promise.all(updates)
          return { success: true, count: products.length }
        } catch (err) {
          console.error("Prisma bulk update failed, falling back:", err)
        }
      }

      // In-memory bulk update
      const products = await db.getProducts()
      let updatedCount = 0

      products.forEach((prod: any) => {
        if (!category || prod.category === category) {
          if (target === 'price' || target === 'both') {
            prod.price = Number(prod.price) * multiplier
          }
          if (target === 'cashPrice' || target === 'both') {
            prod.cashPrice = Number(prod.cashPrice) * multiplier
          }
          prod.updatedAt = new Date()
          updatedCount++
        }
      })

      return { success: true, count: updatedCount }
    }

    // Handle single product update
    if (!body.id) {
      throw new Error("ID de producto requerido para modificación")
    }
    const { id, ...data } = body
    return await db.updateProduct(id, data)
  }
})
