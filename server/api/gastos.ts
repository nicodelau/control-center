import { defineEventHandler, readBody } from 'h3'
import { db } from '../utils/dbFallback'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return await db.getExpenses()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    // body expected: { category, amount, currency, description, paymentMethod }
    if (!body.category || !body.amount || !body.description || !body.paymentMethod) {
      throw new Error("Datos de gasto incompletos")
    }

    return await db.createExpense(body)
  }

  if (method === 'DELETE') {
    const body = await readBody(event)
    if (!body.id) {
      throw new Error("ID de gasto requerido")
    }
    return await db.deleteExpense(body.id)
  }
})
