import { defineEventHandler, readBody } from 'h3'
import { db } from '../utils/dbFallback'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return await db.getClients()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    if (!body.name) {
      throw new Error("El nombre del cliente es requerido")
    }
    return await db.createClient(body)
  }
})
