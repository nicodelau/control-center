import { defineEventHandler, readBody } from 'h3'
import { db } from '../utils/dbFallback'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return await db.getSales()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    // body expected: { clientId, totalAmount, currency, paymentMethod, notes, items: [ { productId, quantity, price, cost } ] }
    if (!body.items || body.items.length === 0 || !body.totalAmount || !body.paymentMethod) {
      throw new Error("Datos de venta incompletos")
    }

    const sale = await db.createSale(body)
    return sale
  }
})
