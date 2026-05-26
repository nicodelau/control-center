import { defineEventHandler, readBody } from 'h3'
import { db } from '../utils/dbFallback'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return await db.getPurchases()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    // body expected: { supplierName, totalAmount, currency, notes, items: [ { productId, quantity, costPrice } ] }
    if (!body.items || body.items.length === 0 || !body.totalAmount) {
      throw new Error("Datos de compra incompletos")
    }

    const purchase = await db.createPurchase(body)
    return purchase
  }
})
