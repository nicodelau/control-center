// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Control Center - Gestión Empresarial Inteligente',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Dashboard premium para control de stock, lista de precios, ventas, compras, gastos y cuentas corrientes.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: 'dulce victoria.ico' }
      ]
    }
  }
})

