import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { db } from '../../utils/dbFallback'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error("ID de cliente requerido")

  const method = event.node.req.method

  if (method === 'GET') {
    const client = await db.getClient(id)
    if (!client) {
      throw new Error("Cliente no encontrado")
    }
    return client
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    return await db.updateClient(id, body)
  }

  if (method === 'POST') {
    // This POST handles registering payments or manual adjustments to the current account
    const body = await readBody(event)
    // body expected: { type: 'PAYMENT' | 'ADJUSTMENT', amount: number, currency: 'PESOS' | 'USD', description: string }
    
    if (!body.type || !body.amount || !body.currency) {
      throw new Error("Datos de transacción incompletos (requiere type, amount, currency)")
    }

    const type = body.type // 'PAYMENT' or 'ADJUSTMENT'
    const currency = body.currency // 'PESOS' or 'USD'
    let amount = Number(body.amount)

    // For payments, since they REDUCE the client's debt, they must be registered as a NEGATIVE transaction.
    // If the user inputs a positive payment amount (e.g. 5000), we store it as -5000 in the ledger.
    if (type === 'PAYMENT') {
      if (amount > 0) amount = -amount
    }

    const tx = await db.addTransaction({
      clientId: id,
      type: type,
      currency: currency,
      amount: amount,
      description: body.description || (type === 'PAYMENT' ? 'Cobro recibido' : 'Ajuste manual de cuenta')
    })

    return tx
  }
})
